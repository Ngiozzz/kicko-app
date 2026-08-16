import { apiFetch } from '@kicko/shared';

export type AdminUser = {
  id: string;
  role: 'player' | 'owner' | 'manager' | 'admin';
  name: string;
  email: string;
  phone: string | null;
  suspended: boolean;
  owner_id: string | null;
  created_at: string;
};

export type AdminVenue = {
  id: string;
  owner_id: string;
  owner: { id: string; name: string; email: string; phone?: string } | null;
  name: string;
  location: string;
  sport: string;
  price_peak: number;
  price_off_peak: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  photos: string[];
  status: 'pending' | 'verified' | 'suspended';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminStats = {
  totalUsers: number;
  usersByRole: { player: number; owner: number; manager: number; admin: number };
  totalVenues: number;
  venuesByStatus: { pending: number; verified: number; suspended: number };
};

export type AdminInput = { name: string; email: string; password: string; phone?: string };

export const adminApi = {
  stats: () => apiFetch<AdminStats>('/api/admin/stats'),
  listUsers: (role?: string) => apiFetch<{ users: AdminUser[] }>(`/api/admin/users${role ? `?role=${role}` : ''}`),
  setUserSuspended: (id: string, suspended: boolean) =>
    apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),
  createAdmin: (input: AdminInput) => apiFetch<{ user: AdminUser }>('/api/admin/admins', { method: 'POST', body: JSON.stringify(input) }),
  deleteAdmin: (id: string) => apiFetch<null>(`/api/admin/admins/${id}`, { method: 'DELETE' }),
  listVenues: (status?: string) => apiFetch<{ venues: AdminVenue[] }>(`/api/admin/venues${status ? `?status=${status}` : ''}`),
  getVenue: (id: string) => apiFetch<{ venue: AdminVenue }>(`/api/admin/venues/${id}`),
  setVenueStatus: (id: string, status: 'verified' | 'suspended', rejection_reason?: string) =>
    apiFetch<{ venue: AdminVenue }>(`/api/admin/venues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason }),
    }),
};
