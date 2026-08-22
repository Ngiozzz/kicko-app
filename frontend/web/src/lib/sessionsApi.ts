import { apiFetch } from '@kicko/shared';
import type { Venue } from './venuesApi';
import type { Payment } from './bookingsApi';

export type SessionPhase = 'joining' | 'paying' | 'awaiting_decision' | 'funded' | 'cancelled';
export type SessionSide = 'home' | 'away';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'removed';

export type MatchSession = {
  id: string;
  venue_id: string;
  organizer_id: string;
  start_at: string;
  end_at: string;
  total_cost: number;
  phase: SessionPhase;
  phase_deadline: string;
  resplit_active: boolean;
  cancellation_reason: string | null;
  home_invite_token: string;
  away_invite_token: string;
  home_roster_completed_at: string | null;
  away_roster_completed_at: string | null;
  created_at: string;
  updated_at: string;
  venue: Pick<Venue, 'id' | 'name' | 'location' | 'sport' | 'photos' | 'price_peak' | 'price_off_peak' | 'owner_id' | 'status'>;
  organizer: { name: string };
  // Only populated on the sessionsApi.mine() list view — a cheap headcount
  // for the card, not the full roster (that's getSession's job).
  accepted_count?: number;
};

export type SessionParticipant = {
  id: string;
  session_id: string;
  side: SessionSide;
  is_captain: boolean;
  status: ParticipantStatus;
  paid: boolean;
  paid_amount: number;
  joined_at: string;
  display_name: string | null;
  is_unclaimed: boolean;
  user: { id: string; name: string; email: string; phone: string | null } | null;
};

type RosterSide = SessionParticipant[] | { redacted: true; count: number };

export type SessionDetail = {
  session: MatchSession;
  caller_side: SessionSide;
  is_organizer: boolean;
  is_captain: boolean;
  my_participant: SessionParticipant | null;
  home: RosterSide;
  away: RosterSide;
  home_join_link: string | null;
  away_join_link: string | null;
  per_person_share: number;
  total_target: number;
  amount_paid_so_far: number;
};

export type JoinInfo = {
  session_id: string;
  venue: MatchSession['venue'];
  organizer_name: string;
  start_at: string;
  end_at: string;
  side: SessionSide;
  headcount: number;
  will_become_captain: boolean;
  phase: SessionPhase;
};

export function isRedacted(side: RosterSide): side is { redacted: true; count: number } {
  return !Array.isArray(side);
}

export const sessionsApi = {
  mine: () => apiFetch<{ sessions: MatchSession[] }>('/api/sessions/mine'),
  awaitingDecision: () => apiFetch<{ sessions: MatchSession[] }>('/api/sessions/awaiting-decision/mine'),
  awaitingCompletion: () => apiFetch<{ sessions: MatchSession[] }>('/api/sessions/awaiting-completion/mine'),
  get: (id: string) => apiFetch<SessionDetail>(`/api/sessions/${id}`),
  create: (input: { venue_id: string; start_at: string; end_at: string }) =>
    apiFetch<{ session: MatchSession }>('/api/sessions', { method: 'POST', body: JSON.stringify(input) }),
  invite: (id: string, input: { side: SessionSide; phone: string }) =>
    apiFetch<{ participant: SessionParticipant }>(`/api/sessions/${id}/invite`, { method: 'POST', body: JSON.stringify(input) }),
  respond: (id: string, accept: boolean) =>
    apiFetch<{ session: MatchSession }>(`/api/sessions/${id}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }),
  completeRoster: (id: string) => apiFetch<{ session: MatchSession }>(`/api/sessions/${id}/complete-roster`, { method: 'POST' }),
  resplit: (id: string) => apiFetch<{ session: MatchSession }>(`/api/sessions/${id}/resplit`, { method: 'POST' }),
  cancel: (id: string) => apiFetch<{ session: MatchSession }>(`/api/sessions/${id}/cancel`, { method: 'POST' }),
  topupOwed: (id: string) => apiFetch<{ owed: number; purpose: 'session_topup' | 'session_remainder' }>(`/api/sessions/${id}/topup-owed`),
  pay: (id: string, phoneNumber: string) =>
    apiFetch<{ payment: Payment }>(`/api/sessions/${id}/pay`, { method: 'POST', body: JSON.stringify({ phone_number: phoneNumber }) }),
  payTopup: (id: string, phoneNumber: string) =>
    apiFetch<{ payment: Payment }>(`/api/sessions/${id}/pay-topup`, { method: 'POST', body: JSON.stringify({ phone_number: phoneNumber }) }),
  removeParticipant: (id: string, participantId: string) =>
    apiFetch<{ session: MatchSession }>(`/api/sessions/${id}/participants/${participantId}`, { method: 'DELETE' }),
  joinInfo: (token: string) => apiFetch<JoinInfo>(`/api/sessions/join-info?token=${encodeURIComponent(token)}`),
  join: (input: { token: string; display_name?: string }) =>
    apiFetch<{ session: MatchSession; participant: SessionParticipant; claim_token?: string }>('/api/sessions/join', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  // Same /api/payments/:id/confirm endpoint bookingsApi's paymentsApi hits —
  // called separately here because confirming a session payment returns
  // { session, funded }, not { booking }, so it needs its own response type.
  confirmPayment: (paymentId: string) =>
    apiFetch<{ session: MatchSession; funded: boolean }>(`/api/payments/${paymentId}/confirm`, { method: 'POST' }),
  claim: (id: string, claimToken: string) =>
    apiFetch<{ participant: SessionParticipant }>(`/api/sessions/${id}/claim`, { method: 'POST', body: JSON.stringify({ claim_token: claimToken }) }),
};
