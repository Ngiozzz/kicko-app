import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { notify } from "../services/notifications.service.js";
import { sendSms } from "../services/sms.service.js";

const TEAM_SELECT = "*";
// Two FKs into users (user_id, invited_by) — must name the one we mean,
// same disambiguation session_participants/booking_participants need.
const TEAM_MEMBER_SELECT = "*, user:users!team_members_user_id_fkey(id, name, email, phone)";

function shapeMember(row: any) {
  return {
    id: row.id,
    team_id: row.team_id,
    role: row.role,
    status: row.status,
    joined_at: row.joined_at,
    user: row.user,
  };
}

async function getTeamMembers(teamId: string) {
  return supabase.from("team_members").select(TEAM_MEMBER_SELECT).eq("team_id", teamId);
}

/** Creates a team — the caller becomes captain immediately, same pattern as starting a match session. */
export async function createTeam(req: Request, res: Response) {
  if (req.user!.role !== "player") return res.status(403).json({ error: "Only players can create teams." });

  const { name, sport } = req.body;
  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "name is required." });

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: name.trim(), sport: typeof sport === "string" && sport.trim() ? sport.trim() : null, captain_id: req.user!.id })
    .select(TEAM_SELECT)
    .single();
  if (teamError) return res.status(500).json({ error: "Could not create team." });

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: req.user!.id, role: "captain", status: "accepted", responded_at: new Date().toISOString() });
  if (memberError) {
    await supabase.from("teams").delete().eq("id", team.id);
    return res.status(500).json({ error: "Team created, but you couldn't be added as captain." });
  }

  res.status(201).json({ team });
}

/** Lists every team the caller is an active (accepted or still-pending-invite) member of. */
export async function listMyTeams(req: Request, res: Response) {
  const { data: memberRows, error } = await supabase
    .from("team_members")
    .select("team_id, role, status")
    .eq("user_id", req.user!.id)
    .in("status", ["accepted", "invited"]);
  if (error) return res.status(500).json({ error: "Could not load your teams." });

  const teamIds = (memberRows ?? []).map((m) => m.team_id);
  if (teamIds.length === 0) return res.status(200).json({ teams: [] });

  const { data: teams, error: teamsError } = await supabase.from("teams").select(TEAM_SELECT).in("id", teamIds).order("created_at", { ascending: false });
  if (teamsError) return res.status(500).json({ error: "Could not load your teams." });

  const byId = new Map((memberRows ?? []).map((m) => [m.team_id, m]));
  res.status(200).json({
    teams: (teams ?? []).map((t) => ({ ...t, my_role: byId.get(t.id)?.role, my_status: byId.get(t.id)?.status })),
  });
}

/** Team detail — roster visible to any active member, invited or accepted. No blind-roster rule like match_sessions has: a team is a persistent group you're already in, not two sides recruiting against each other. */
export async function getTeam(req: Request, res: Response) {
  const { data: team, error } = await supabase.from("teams").select(TEAM_SELECT).eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load team." });
  if (!team) return res.status(404).json({ error: "Team not found." });

  const { data: myMembership } = await supabase.from("team_members").select("*").eq("team_id", team.id).eq("user_id", req.user!.id).maybeSingle();
  if (!myMembership || myMembership.status === "removed" || myMembership.status === "declined") {
    return res.status(403).json({ error: "You don't have access to this team." });
  }

  const { data: members, error: membersError } = await getTeamMembers(team.id);
  if (membersError) return res.status(500).json({ error: "Could not load roster." });

  res.status(200).json({
    team,
    members: (members ?? []).filter((m) => m.status !== "removed").map(shapeMember),
    my_membership: shapeMember(myMembership),
    is_captain: myMembership.role === "captain",
  });
}

/** Captain renames the team or updates its sport. */
export async function updateTeam(req: Request, res: Response) {
  const { data: team, error } = await supabase.from("teams").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load team." });
  if (!team) return res.status(404).json({ error: "Team not found." });
  if (team.captain_id !== req.user!.id) return res.status(403).json({ error: "Only the captain can edit this team." });

  const { name, sport } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "name can't be empty." });
    update.name = name.trim();
  }
  if (sport !== undefined) update.sport = typeof sport === "string" && sport.trim() ? sport.trim() : null;

  const { data: updated, error: updateError } = await supabase.from("teams").update(update).eq("id", team.id).select(TEAM_SELECT).single();
  if (updateError) return res.status(500).json({ error: "Could not update team." });
  res.status(200).json({ team: updated });
}

/** Captain invites a known Kicko player onto the roster by phone number — same "must already have an account" rule split bookings use, no anonymous placeholders. */
export async function inviteTeamMember(req: Request, res: Response) {
  const { data: team, error } = await supabase.from("teams").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load team." });
  if (!team) return res.status(404).json({ error: "Team not found." });
  if (team.captain_id !== req.user!.id) return res.status(403).json({ error: "Only the captain can invite players." });

  const { phone } = req.body;
  if (typeof phone !== "string" || !phone.trim()) return res.status(400).json({ error: "phone is required." });

  const { data: invitee, error: inviteeError } = await supabase.from("users").select("id, name, phone").eq("phone", phone.trim()).eq("role", "player").maybeSingle();
  if (inviteeError) return res.status(500).json({ error: "Could not look up that player." });
  if (!invitee) return res.status(404).json({ error: "No Kicko player found with that phone number." });

  const { data: existing } = await supabase.from("team_members").select("*").eq("team_id", team.id).eq("user_id", invitee.id).maybeSingle();
  if (existing && existing.status !== "declined" && existing.status !== "removed") {
    return res.status(400).json({ error: "That player is already on this team." });
  }

  const { data: member, error: upsertError } = await supabase
    .from("team_members")
    .upsert(
      { team_id: team.id, user_id: invitee.id, role: "member", status: "invited", invited_by: req.user!.id, responded_at: null },
      { onConflict: "team_id,user_id" }
    )
    .select(TEAM_MEMBER_SELECT)
    .single();
  if (upsertError) return res.status(500).json({ error: "Could not send invite." });

  await notify({
    userId: invitee.id,
    type: "team_invite",
    title: `${req.user!.name} invited you to join ${team.name}`,
    body: team.sport ? `Team · ${team.sport}` : "Team",
    link: `/player/teams/${team.id}`,
  });
  if (invitee.phone) {
    await sendSms({ to: invitee.phone, message: `Kicko: ${req.user!.name} invited you to join their team "${team.name}". Open Kicko to accept.` });
  }

  res.status(201).json({ member: shapeMember(member) });
}

/** Caller accepts/declines their own pending invite. */
export async function respondToTeamInvite(req: Request, res: Response) {
  const { accept } = req.body;
  if (typeof accept !== "boolean") return res.status(400).json({ error: "accept must be true or false." });

  const { data: member, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", req.params.id)
    .eq("user_id", req.user!.id)
    .eq("status", "invited")
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load your invite." });
  if (!member) return res.status(404).json({ error: "You don't have a pending invite to this team." });

  const { data: updated, error: updateError } = await supabase
    .from("team_members")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", member.id)
    .select(TEAM_MEMBER_SELECT)
    .single();
  if (updateError) return res.status(500).json({ error: "Could not update your invite." });

  res.status(200).json({ member: shapeMember(updated) });
}

/** Captain removes anyone else; any member removes themself (leaves). The captain can't be removed or leave — no captaincy-transfer flow exists yet, so that seat is fixed for now. */
export async function removeTeamMember(req: Request, res: Response) {
  const { data: team, error } = await supabase.from("teams").select("*").eq("id", req.params.id).maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load team." });
  if (!team) return res.status(404).json({ error: "Team not found." });

  const { data: target, error: targetError } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", req.params.memberId)
    .eq("team_id", team.id)
    .maybeSingle();
  if (targetError) return res.status(500).json({ error: "Could not load that member." });
  if (!target) return res.status(404).json({ error: "Member not found." });

  const isSelf = target.user_id === req.user!.id;
  const isCaptain = team.captain_id === req.user!.id;
  if (!isSelf && !isCaptain) return res.status(403).json({ error: "Only the captain can remove another player." });
  if (target.role === "captain") return res.status(400).json({ error: "The captain can't be removed from their own team." });

  const { error: updateError } = await supabase.from("team_members").update({ status: "removed" }).eq("id", target.id);
  if (updateError) return res.status(500).json({ error: "Could not remove that player." });

  res.status(200).json({ ok: true });
}
