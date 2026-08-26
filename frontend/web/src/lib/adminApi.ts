import { apiFetch } from '@kicko/shared';
import { Review } from './reviewsApi';
import { Booking } from './bookingsApi';

export type AdminUser = {
  id: string;
  role: 'player' | 'owner' | 'manager' | 'admin';
  name: string;
  email: string;
  phone: string | null;
  suspended: boolean;
  owner_id: string | null;
  sport: string | null;
  position: string | null;
  avatar_url: string | null;
  // Only populated for role='owner' — how many venues they own.
  venue_count: number | null;
  created_at: string;
};

export type AdminUserBooking = {
  id: string;
  venue: { name: string } | null;
  start_at: string;
  total_amount: number;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
  booking_type: 'individual' | 'session' | 'split';
};

export type AdminUserActivity = {
  // Players
  recentBookings?: AdminUserBooking[];
  totalBookings?: number;
  totalSpent?: number;
  sessionsOrganized?: number;
  // Owners
  venues?: { id: string; name: string; location: string; sport: string; status: string; price_peak: number }[];
  // Managers
  managedBy?: { id: string; name: string; email: string; phone: string | null } | null;
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
  deviceBreakdown: { mobile: number; tablet: number; desktop: number; other: number };
};

export type AdminInput = { name: string; email: string; password: string; phone?: string };

export type LogLevel = 'info' | 'warn' | 'error';

export type ServerLog = {
  id: string;
  level: LogLevel;
  message: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  detail?: string;
  timestamp: string;
};

export type PaymentsOverview = { totalCollected: number; paidOut: number; refunded: number; needsAttention: number };

export type AdminSession = {
  id: string;
  phase: 'joining' | 'paying' | 'awaiting_decision' | 'funded' | 'cancelled';
  cancellation_reason: string | null;
  start_at: string;
  created_at: string;
  venue: { id: string; name: string } | null;
  organizer: { id: string; name: string } | null;
  filled: number;
  capacity: number;
};

export const adminApi = {
  stats: () => apiFetch<AdminStats>('/api/admin/stats'),
  listUsers: (role?: string) => apiFetch<{ users: AdminUser[] }>(`/api/admin/users${role ? `?role=${role}` : ''}`),
  getUser: (id: string) => apiFetch<{ user: AdminUser; activity: AdminUserActivity }>(`/api/admin/users/${id}`),
  setUserSuspended: (id: string, suspended: boolean) =>
    apiFetch<{ user: AdminUser }>(`/api/admin/users/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ suspended }) }),
  createAdmin: (input: AdminInput) => apiFetch<{ user: AdminUser }>('/api/admin/admins', { method: 'POST', body: JSON.stringify(input) }),
  deleteAdmin: (id: string) => apiFetch<null>(`/api/admin/admins/${id}`, { method: 'DELETE' }),
  listVenues: (status?: string) => apiFetch<{ venues: AdminVenue[] }>(`/api/admin/venues${status ? `?status=${status}` : ''}`),
  getVenue: (id: string) => apiFetch<{ venue: AdminVenue }>(`/api/admin/venues/${id}`),
  setVenueStatus: (id: string, status: 'verified' | 'suspended' | 'pending', rejection_reason?: string) =>
    apiFetch<{ venue: AdminVenue }>(`/api/admin/venues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason }),
    }),
  deleteVenue: (id: string) => apiFetch<null>(`/api/admin/venues/${id}`, { method: 'DELETE' }),
  deleteReview: (id: string) => apiFetch<null>(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  dismissReviewFlag: (id: string) => apiFetch<{ review: Review }>(`/api/admin/reviews/${id}/dismiss-flag`, { method: 'PATCH' }),
  listLogs: (level?: LogLevel) => apiFetch<{ logs: ServerLog[] }>(`/api/admin/logs${level ? `?level=${level}` : ''}`),
  paymentsOverview: () => apiFetch<PaymentsOverview>('/api/admin/payments/overview'),
  listTransactions: () => apiFetch<{ bookings: Booking[] }>('/api/admin/payments/transactions'),
  listSessions: () => apiFetch<{ sessions: AdminSession[] }>('/api/admin/payments/sessions'),
};
