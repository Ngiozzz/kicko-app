import { apiFetch } from '@kicko/shared';

export type TeamMemberRole = 'captain' | 'member';
export type TeamMemberStatus = 'invited' | 'accepted' | 'declined' | 'removed';

// A persistent roster players build once and reuse — unlike a session or
// split booking's per-occasion participant list. First real use is
// registering a squad for a tournament. Deliberately no shared wallet —
// see the migration comment for why that's a separate discussion.
export type Team = {
  id: string;
  name: string;
  sport: string | null;
  captain_id: string;
  created_at: string;
  updated_at: string;
  // Only present on teamsApi.mine()'s list view.
  my_role?: TeamMemberRole;
  my_status?: TeamMemberStatus;
};

export type TeamMember = {
  id: string;
  team_id: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joined_at: string;
  user: { id: string; name: string; email: string; phone: string | null };
};

export const teamsApi = {
  mine: () => apiFetch<{ teams: Team[] }>('/api/teams/mine'),
  create: (input: { name: string; sport?: string | null }) => apiFetch<{ team: Team }>('/api/teams', { method: 'POST', body: JSON.stringify(input) }),
  get: (id: string) => apiFetch<{ team: Team; members: TeamMember[]; my_membership: TeamMember; is_captain: boolean }>(`/api/teams/${id}`),
  update: (id: string, input: { name?: string; sport?: string | null }) =>
    apiFetch<{ team: Team }>(`/api/teams/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  invite: (id: string, phone: string) => apiFetch<{ member: TeamMember }>(`/api/teams/${id}/invite`, { method: 'POST', body: JSON.stringify({ phone }) }),
  respond: (id: string, accept: boolean) => apiFetch<{ member: TeamMember }>(`/api/teams/${id}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }),
  removeMember: (id: string, memberId: string) => apiFetch<{ ok: true }>(`/api/teams/${id}/members/${memberId}`, { method: 'DELETE' }),
};
