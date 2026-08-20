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

// What /api/public/venues* actually returns — deliberately missing
// owner_id/payout_*/status, which the public backend endpoints never select
// (see backend/src/controllers/public.controller.ts). Kept as its own type
// instead of reusing Venue so the frontend can't accidentally assume a
// public venue has fields it doesn't.
export type PublicVenue = Omit<Venue, 'owner_id' | 'payout_type' | 'payout_number' | 'payout_account_ref' | 'status' | 'updated_at'>;

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

// Logged-out venue browsing (see backend/src/routes/public.routes.ts) — no
// Authorization header required; apiFetch already omits it when there's no
// Supabase session, so this needs no client-side auth handling of its own.
export const publicVenuesApi = {
  list: () => apiFetch<{ venues: PublicVenue[] }>('/api/public/venues'),
  get: (id: string) => apiFetch<{ venue: PublicVenue }>(`/api/public/venues/${id}`),
  availability: (id: string, date: string) =>
    apiFetch<{ booked: BookedSlot[] }>(`/api/public/venues/${id}/availability?date=${date}`),
  availabilityForDate: (date: string) =>
    apiFetch<{ booked: VenueBookedSlot[] }>(`/api/public/venues-availability?date=${date}`),
};
