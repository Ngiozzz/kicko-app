import { apiFetch } from '@kicko/shared';

export type VenueStatus = 'pending' | 'verified' | 'suspended';
export type PayoutType = 'phone' | 'paybill' | 'till';

export type Venue = {
  id: string;
  owner_id: string;
  name: string;
  location: string;
  sport: string;
  price_peak: number;
  price_off_peak: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  status: VenueStatus;
  photos: string[];
  created_at: string;
  updated_at: string;
  // Denormalized on the venues row itself (see reviews.controller.ts) so
  // showing it on a list of venues never needs a per-venue reviews query.
  avg_rating: number;
  review_count: number;
  // Mobile-money only for now — see backend/src/services/b2c.service.ts.
  payout_type: PayoutType | null;
  payout_number: string | null;
  payout_account_ref: string | null;
};

export type VenueInput = {
  name: string;
  location: string;
  sport: string;
  price_peak: number;
  price_off_peak: number;
  opening_time: string;
  closing_time: string;
  amenities: string[];
  photos: string[];
  payout_type: PayoutType | null;
  payout_number: string | null;
  payout_account_ref: string | null;
};

export type VenueStats = { totalBookings: number; totalRevenue: number };

export const venuesApi = {
  list: () => apiFetch<{ venues: Venue[] }>('/api/venues'),
  get: (id: string) => apiFetch<{ venue: Venue; stats: VenueStats }>(`/api/venues/${id}`),
  create: (input: VenueInput) =>
    apiFetch<{ venue: Venue }>('/api/venues', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: VenueInput) =>
    apiFetch<{ venue: Venue }>(`/api/venues/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<null>(`/api/venues/${id}`, { method: 'DELETE' }),
};

export type BookedSlot = { start_at: string; end_at: string };
export type VenueBookedSlot = BookedSlot & { venue_id: string };

// Player-facing venue browsing — same Venue shape, scoped to status='verified'.
export const exploreApi = {
  list: () => apiFetch<{ venues: Venue[] }>('/api/venues/explore'),
  get: (id: string) => apiFetch<{ venue: Venue }>(`/api/venues/explore/${id}`),
  availability: (id: string, date: string) =>
    apiFetch<{ booked: BookedSlot[] }>(`/api/venues/explore/${id}/availability?date=${date}`),
  availabilityForDate: (date: string) =>
    apiFetch<{ booked: VenueBookedSlot[] }>(`/api/venues/explore-availability?date=${date}`),
};
