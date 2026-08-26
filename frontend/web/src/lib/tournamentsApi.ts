import { apiFetch } from '@kicko/shared';
import type { Venue } from './venuesApi';
import type { Payment } from './bookingsApi';

export type TournamentStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

// Team-based competitions at a venue — an owner creates one, captains
// register a Team (the persistent roster) and pay a flat entry fee, the
// organizer manually creates fixtures as the day unfolds. No auto-bracket
// generation — that's a scheduling product in its own right.
export type Tournament = {
  id: string;
  venue_id: string;
  owner_id: string;
  name: string;
  description: string | null;
  format: string | null;
  entry_fee: number;
  start_at: string;
  end_at: string;
  registration_deadline: string | null;
  status: TournamentStatus;
  created_at: string;
  updated_at: string;
  venue: Pick<Venue, 'id' | 'name' | 'location' | 'sport' | 'photos' | 'price_peak' | 'price_off_peak' | 'owner_id' | 'status'>;
};

export type TournamentTeamStatus = 'registered' | 'withdrawn';
export type TournamentPaymentStatus = 'unpaid' | 'paid' | 'refunded';

export type TournamentTeam = {
  id: string;
  tournament_id: string;
  team_id: string;
  registered_by: string;
  status: TournamentTeamStatus;
  payment_status: TournamentPaymentStatus;
  subtotal: number;
  service_fee: number;
  total_amount: number;
  created_at: string;
  team: { id: string; name: string; sport: string | null; captain_id: string };
};

export type FixtureStatus = 'scheduled' | 'completed' | 'cancelled';

export type Fixture = {
  id: string;
  tournament_id: string;
  round_label: string | null;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: string | null;
  status: FixtureStatus;
  created_at: string;
  updated_at: string;
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
};

export type TournamentInput = {
  venue_id: string;
  name: string;
  description?: string | null;
  format?: string | null;
  entry_fee: number;
  start_at: string;
  end_at: string;
  registration_deadline?: string | null;
};

export const tournamentsApi = {
  create: (input: TournamentInput) => apiFetch<{ tournament: Tournament }>('/api/tournaments', { method: 'POST', body: JSON.stringify(input) }),
  mine: () => apiFetch<{ tournaments: Tournament[] }>('/api/tournaments/mine'),
  open: () => apiFetch<{ tournaments: Tournament[] }>('/api/tournaments/open'),
  get: (id: string) =>
    apiFetch<{ tournament: Tournament; teams: TournamentTeam[]; fixtures: Fixture[]; is_owner: boolean }>(`/api/tournaments/${id}`),
  update: (id: string, input: Partial<TournamentInput> & { status?: TournamentStatus }) =>
    apiFetch<{ tournament: Tournament }>(`/api/tournaments/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  register: (id: string, input: { team_id: string; phone_number: string }) =>
    apiFetch<{ registration: TournamentTeam; payment: Payment }>(`/api/tournaments/${id}/register`, { method: 'POST', body: JSON.stringify(input) }),
  withdraw: (id: string, teamId: string) =>
    apiFetch<{ ok: true }>(`/api/tournaments/${id}/withdraw`, { method: 'POST', body: JSON.stringify({ team_id: teamId }) }),
  createFixture: (id: string, input: { round_label?: string; home_team_id: string; away_team_id: string; scheduled_at?: string }) =>
    apiFetch<{ fixture: Fixture }>(`/api/tournaments/${id}/fixtures`, { method: 'POST', body: JSON.stringify(input) }),
  updateFixture: (
    id: string,
    fixtureId: string,
    input: Partial<{ round_label: string; scheduled_at: string; home_score: number; away_score: number; status: FixtureStatus }>
  ) => apiFetch<{ fixture: Fixture }>(`/api/tournaments/${id}/fixtures/${fixtureId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteFixture: (id: string, fixtureId: string) => apiFetch<{ ok: true }>(`/api/tournaments/${id}/fixtures/${fixtureId}`, { method: 'DELETE' }),
  // Same /api/payments/:id/confirm endpoint bookingsApi's paymentsApi hits —
  // a tournament_entry payment's confirmation response is { registration },
  // not { booking }, so it gets its own response type.
  confirmEntryPayment: (paymentId: string) =>
    apiFetch<{ registration: TournamentTeam }>(`/api/payments/${paymentId}/confirm`, { method: 'POST' }),
};
