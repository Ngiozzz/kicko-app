import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { computeServiceFee } from "../services/pricing.service.js";
import { getPlatformSettings } from "../services/settings.service.js";
import { initiateStkPush } from "../services/stk.service.js";
import { notify } from "../services/notifications.service.js";
import { sendTemplatedEmail } from "../services/email.service.js";

const VENUE_COLUMNS = "id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status";
const TOURNAMENT_SELECT = `*, venue:venues(${VENUE_COLUMNS})`;
const TOURNAMENT_TEAM_SELECT = "*, team:teams(id, name, sport, captain_id)";
// Two FKs into teams (home_team_id, away_team_id) — must name the one we mean.
const FIXTURE_SELECT =
  "*, home_team:teams!tournament_fixtures_home_team_id_fkey(id, name), away_team:teams!tournament_fixtures_away_team_id_fkey(id, name)";

async function getTournamentTeams(tournamentId: string) {
  return supabase.from("tournament_teams").select(TOURNAMENT_TEAM_SELECT).eq("tournament_id", tournamentId);
}

async function getFixtures(tournamentId: string) {
  return supabase.from("tournament_fixtures").select(FIXTURE_SELECT).eq("tournament_id", tournamentId).order("scheduled_at", { ascending: true, nullsFirst: false });
}

/** Owner creates a tournament at one of their own verified venues — starts in 'draft' until they flip it to 'open' for registration. */
export async function createTournament(req: Request, res: Response) {
  if (req.user!.role !== "owner") return res.status(403).json({ error: "Only venue owners can create tournaments." });

  const { venue_id, name, description, format, entry_fee, start_at, end_at, registration_deadline } = req.body;
  if (typeof venue_id !== "string" || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "venue_id and name are required." });
  }
  if (typeof entry_fee !== "number" || entry_fee < 0) return res.status(400).json({ error: "entry_fee must be a non-negative number." });
  if (typeof start_at !== "string" || typeof end_at !== "string" || new Date(end_at) <= new Date(start_at)) {
    return res.status(400).json({ error: "start_at and end_at must be a valid range." });
  }

  const { data: venue, error: venueError } = await supabase.from("venues").select("id, owner_id, status").eq("id", venue_id).maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load venue." });
  if (!venue || venue.status !== "verified") return res.status(404).json({ error: "Venue not found." });
  if (venue.owner_id !== req.user!.id) return res.status(403).json({ error: "You can only run tournaments at your own venues." });

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      venue_id,
      owner_id: req.user!.id,
      name: name.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      format: typeof format === "string" && format.trim() ? format.trim() : null,
      entry_fee,
      start_at: new Date(start_at).toISOString(),
      end_at: new Date(end_at).toISOString(),
      registration_deadline: typeof registration_deadline === "string" ? new Date(registration_deadline).toISOString() : null,
    })
    .select(TOURNAMENT_SELECT)
    .single();
  if (error) return res.status(500).json({ error: "Could not create tournament." });

  res.status(201).json({ tournament });
}

/** Owner's own tournaments, across all their venues. */
export async function listMyTournaments(req: Request, res: Response) {
  if (req.user!.role !== "owner") return res.status(403).json({ error: "Only venue owners can view this." });

  const { data, error } = await supabase.from("tournaments").select(TOURNAMENT_SELECT).eq("owner_id", req.user!.id).order("start_at", { ascending: false });
  if (error) return res.status(500).json({ error: "Could not load tournaments." });
  res.status(200).json({ tournaments: data });
}

/** Publicly browsable — every tournament currently open for registration, across every venue. */
export async function listOpenTournaments(req: Request, res: Response) {
  const { data, error } = await supabase.from("tournaments").select(TOURNAMENT_SELECT).eq("status", "open").order("start_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Could not load open tournaments." });
  res.status(200).json({ tournaments: data });
}

/** Tournament detail — public-ish (any logged-in user), same as a listing/event page rather than a private roster negotiation: registered teams and fixtures are meant to be seen by anyone deciding whether to enter. */
export async function getTournament(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select(TOURNAMENT_SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });

  const { data: teams, error: teamsError } = await getTournamentTeams(tournament.id);
  if (teamsError) return res.status(500).json({ error: "Could not load registered teams." });

  const { data: fixtures, error: fixturesError } = await getFixtures(tournament.id);
  if (fixturesError) return res.status(500).json({ error: "Could not load fixtures." });

  res.status(200).json({
    tournament,
    teams: teams ?? [],
    fixtures: fixtures ?? [],
    is_owner: tournament.owner_id === req.user!.id,
  });
}

/** Owner edits their own tournament — details or status (draft → open → in_progress → completed/cancelled). No enforced state machine here; the organizer is trusted to move it forward sensibly. */
export async function updateTournament(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });
  if (tournament.owner_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can edit this tournament." });

  const { name, description, format, entry_fee, start_at, end_at, registration_deadline, status } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "name can't be empty." });
    update.name = name.trim();
  }
  if (description !== undefined) update.description = typeof description === "string" && description.trim() ? description.trim() : null;
  if (format !== undefined) update.format = typeof format === "string" && format.trim() ? format.trim() : null;
  if (entry_fee !== undefined) {
    if (typeof entry_fee !== "number" || entry_fee < 0) return res.status(400).json({ error: "entry_fee must be a non-negative number." });
    update.entry_fee = entry_fee;
  }
  if (start_at !== undefined) update.start_at = new Date(start_at).toISOString();
  if (end_at !== undefined) update.end_at = new Date(end_at).toISOString();
  if (registration_deadline !== undefined) update.registration_deadline = registration_deadline ? new Date(registration_deadline).toISOString() : null;
  if (status !== undefined) {
    if (!["draft", "open", "in_progress", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid status." });
    update.status = status;
  }

  const { data: updated, error: updateError } = await supabase.from("tournaments").update(update).eq("id", tournament.id).select(TOURNAMENT_SELECT).single();
  if (updateError) return res.status(500).json({ error: "Could not update tournament." });
  res.status(200).json({ tournament: updated });
}

/** A team's captain registers it for an open tournament and pays the entry fee via STK push — one payment for the whole team, same shape as an individual booking, not split across the roster. */
export async function registerTeam(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });
  if (tournament.status !== "open") return res.status(400).json({ error: "This tournament isn't open for registration." });
  if (tournament.registration_deadline && new Date(tournament.registration_deadline) < new Date()) {
    return res.status(400).json({ error: "Registration for this tournament has closed." });
  }

  const { team_id, phone_number } = req.body;
  if (typeof team_id !== "string" || typeof phone_number !== "string" || !phone_number.trim()) {
    return res.status(400).json({ error: "team_id and phone_number are required." });
  }

  const { data: team, error: teamError } = await supabase.from("teams").select("id, name, captain_id").eq("id", team_id).maybeSingle();
  if (teamError) return res.status(500).json({ error: "Could not load team." });
  if (!team) return res.status(404).json({ error: "Team not found." });
  if (team.captain_id !== req.user!.id) return res.status(403).json({ error: "Only the team's captain can register it." });

  const { data: existing } = await supabase.from("tournament_teams").select("id, status").eq("tournament_id", tournament.id).eq("team_id", team_id).maybeSingle();
  if (existing && existing.status === "registered") return res.status(400).json({ error: "This team is already registered." });

  const settings = await getPlatformSettings();
  const subtotal = tournament.entry_fee;
  const serviceFee = computeServiceFee(subtotal, settings.service_fee_tiers);
  const totalAmount = +(subtotal + serviceFee).toFixed(2);

  const { data: registration, error: regError } = await supabase
    .from("tournament_teams")
    .upsert(
      { tournament_id: tournament.id, team_id, registered_by: req.user!.id, status: "registered", payment_status: "unpaid", subtotal, service_fee: serviceFee, total_amount: totalAmount },
      { onConflict: "tournament_id,team_id" }
    )
    .select(TOURNAMENT_TEAM_SELECT)
    .single();
  if (regError) return res.status(500).json({ error: "Could not register this team." });

  const stk = await initiateStkPush({ phoneNumber: phone_number, amount: totalAmount, accountReference: registration.id });
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      tournament_team_id: registration.id,
      payer_id: req.user!.id,
      purpose: "tournament_entry",
      amount: totalAmount,
      phone_number,
      provider_reference: stk.providerReference,
      status: "pending",
    })
    .select()
    .single();
  if (paymentError) return res.status(500).json({ error: "Could not start payment." });

  res.status(201).json({ registration, payment });
}

/** Called from payments.controller.ts#confirmPayment once a tournament_entry payment succeeds. */
export async function confirmTournamentEntry(tournamentTeamId: string) {
  const { data: registration, error } = await supabase
    .from("tournament_teams")
    .update({ payment_status: "paid" })
    .eq("id", tournamentTeamId)
    .select(`${TOURNAMENT_TEAM_SELECT}, tournament:tournaments(*, venue:venues(${VENUE_COLUMNS}))`)
    .single();
  if (error || !registration) return { registration: null };

  await supabase.from("payouts").insert({
    tournament_team_id: registration.id,
    venue_id: registration.tournament.venue_id,
    owner_id: registration.tournament.owner_id,
    amount: registration.subtotal,
    status: "pending",
  });

  const when = new Date(registration.tournament.start_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const { data: captain } = await supabase.from("users").select("name, email").eq("id", registration.team.captain_id).maybeSingle();
  await notify({
    userId: registration.team.captain_id,
    type: "tournament_entry_confirmed",
    title: "Tournament entry confirmed",
    body: `${registration.team.name} is in for ${registration.tournament.name} · ${when}`,
    link: `/player/tournaments/${registration.tournament.id}`,
  });
  if (captain?.email) {
    await sendTemplatedEmail("booking_confirmed", captain.email, {
      name: captain.name,
      venueName: `${registration.tournament.name} (${registration.tournament.venue.name})`,
      when,
      amount: registration.total_amount.toLocaleString(),
    });
  }

  return { registration };
}

/** Captain withdraws their team. Only self-serve while unpaid — a paid entry needs the organizer/admin for now, no automated refund path yet (see migration comment). */
export async function withdrawTeam(req: Request, res: Response) {
  const { team_id } = req.body;
  if (typeof team_id !== "string") return res.status(400).json({ error: "team_id is required." });

  const { data: registration, error } = await supabase
    .from("tournament_teams")
    .select("*, team:teams(captain_id)")
    .eq("tournament_id", req.params.id)
    .eq("team_id", team_id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load registration." });
  if (!registration) return res.status(404).json({ error: "This team isn't registered for this tournament." });
  if (registration.team.captain_id !== req.user!.id) return res.status(403).json({ error: "Only the team's captain can withdraw it." });
  if (registration.payment_status === "paid") {
    return res.status(400).json({ error: "This team's entry is already paid — contact the organizer to withdraw and arrange a refund." });
  }

  const { error: updateError } = await supabase.from("tournament_teams").update({ status: "withdrawn" }).eq("id", registration.id);
  if (updateError) return res.status(500).json({ error: "Could not withdraw this team." });
  res.status(200).json({ ok: true });
}

/** Organizer manually creates a fixture — both teams must already be registered (and paid) for this tournament. No auto-bracket generation. */
export async function createFixture(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });
  if (tournament.owner_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can add fixtures." });

  const { round_label, home_team_id, away_team_id, scheduled_at } = req.body;
  if (typeof home_team_id !== "string" || typeof away_team_id !== "string" || home_team_id === away_team_id) {
    return res.status(400).json({ error: "home_team_id and away_team_id are required and must differ." });
  }

  const { data: registeredTeams } = await supabase
    .from("tournament_teams")
    .select("team_id")
    .eq("tournament_id", tournament.id)
    .eq("status", "registered")
    .in("team_id", [home_team_id, away_team_id]);
  if ((registeredTeams ?? []).length !== 2) {
    return res.status(400).json({ error: "Both teams must be registered for this tournament first." });
  }

  const { data: fixture, error: fixtureError } = await supabase
    .from("tournament_fixtures")
    .insert({
      tournament_id: tournament.id,
      round_label: typeof round_label === "string" && round_label.trim() ? round_label.trim() : null,
      home_team_id,
      away_team_id,
      scheduled_at: typeof scheduled_at === "string" ? new Date(scheduled_at).toISOString() : null,
    })
    .select(FIXTURE_SELECT)
    .single();
  if (fixtureError) return res.status(500).json({ error: "Could not create fixture." });

  res.status(201).json({ fixture });
}

/** Organizer updates a fixture's schedule or records its result. Setting both scores auto-completes it and sets the winner (null winner_team_id on a genuine draw). */
export async function updateFixture(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select("owner_id").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });
  if (tournament.owner_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can edit fixtures." });

  const { data: fixture, error: fixtureError } = await supabase
    .from("tournament_fixtures")
    .select("*")
    .eq("id", req.params.fixtureId)
    .eq("tournament_id", req.params.id)
    .maybeSingle();
  if (fixtureError) return res.status(500).json({ error: "Could not load fixture." });
  if (!fixture) return res.status(404).json({ error: "Fixture not found." });

  const { round_label, scheduled_at, home_score, away_score, status } = req.body;
  const update: Record<string, unknown> = {};
  if (round_label !== undefined) update.round_label = typeof round_label === "string" && round_label.trim() ? round_label.trim() : null;
  if (scheduled_at !== undefined) update.scheduled_at = scheduled_at ? new Date(scheduled_at).toISOString() : null;
  if (status !== undefined) {
    if (!["scheduled", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "Invalid status." });
    update.status = status;
  }
  if (home_score !== undefined && away_score !== undefined) {
    if (typeof home_score !== "number" || typeof away_score !== "number") return res.status(400).json({ error: "Scores must be numbers." });
    update.home_score = home_score;
    update.away_score = away_score;
    update.status = "completed";
    update.winner_team_id = home_score === away_score ? null : home_score > away_score ? fixture.home_team_id : fixture.away_team_id;
  }

  const { data: updated, error: updateError } = await supabase.from("tournament_fixtures").update(update).eq("id", fixture.id).select(FIXTURE_SELECT).single();
  if (updateError) return res.status(500).json({ error: "Could not update fixture." });
  res.status(200).json({ fixture: updated });
}

/** Organizer removes a mis-entered fixture. */
export async function deleteFixture(req: Request, res: Response) {
  const { data: tournament, error } = await supabase.from("tournaments").select("owner_id").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load tournament." });
  if (!tournament) return res.status(404).json({ error: "Tournament not found." });
  if (tournament.owner_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can remove fixtures." });

  const { error: deleteError } = await supabase.from("tournament_fixtures").delete().eq("id", req.params.fixtureId).eq("tournament_id", req.params.id);
  if (deleteError) return res.status(500).json({ error: "Could not remove fixture." });
  res.status(200).json({ ok: true });
}
