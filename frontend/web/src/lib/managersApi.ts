import { apiFetch } from '@kicko/shared';

export type Manager = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  suspended: boolean;
  venue_id: string;
  venue: { id: string; name: string } | null;
  created_at: string;
};

export type CreateManagerInput = { name: string; phone: string; password: string; email?: string; venue_id: string };

export const managersApi = {
  list: () => apiFetch<{ managers: Manager[] }>('/api/managers'),
  create: (input: CreateManagerInput) => apiFetch<{ manager: Manager }>('/api/managers', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<null>(`/api/managers/${id}`, { method: 'DELETE' }),
};
