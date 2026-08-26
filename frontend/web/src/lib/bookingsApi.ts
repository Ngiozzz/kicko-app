import { apiFetch } from '@kicko/shared';
import type { Venue } from './venuesApi';

export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export type Booking = {
  id: string;
  venue_id: string;
  player_id: string;
  booking_type: 'individual' | 'session' | 'split';
  session_id: string | null;
  start_at: string;
  end_at: string;
  subtotal: number;
  service_fee: number;
  total_amount: number;
  is_walk_in: boolean;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_deadline: string | null;
  cancelled_at: string | null;
  refund_amount: number | null;
  refund_pct: number | null;
  created_at: string;
  venue: Pick<Venue, 'id' | 'name' | 'location' | 'sport' | 'photos' | 'price_peak' | 'price_off_peak' | 'owner_id' | 'status'>;
  player?: { id: string; name: string; email: string; phone: string | null };
  // Only populated on the owner/manager venue-scoped listing (bookingsApi.venue()).
  payouts?: { status: 'pending' | 'paid' | 'failed'; amount: number }[];
  refunds?: { status: 'pending' | 'approved' | 'denied' | 'completed'; amount: number; pct: number }[];
};

// A fixed, known 2/4-person group booking (tennis singles/doubles) — see
// bookingsApi.getSplit(). No sides/captain, unlike a match session: everyone
// named is visible to everyone else the moment the booking is created.
export type BookingParticipantStatus = 'invited' | 'accepted' | 'declined' | 'removed';
export type BookingParticipant = {
  id: string;
  booking_id: string;
  is_organizer: boolean;
  status: BookingParticipantStatus;
  share_amount: number;
  paid: boolean;
  paid_amount: number;
  user: { id: string; name: string; email: string; phone: string | null };
};

export type Payment = {
  id: string;
  booking_id: string | null;
  amount: number;
  phone_number: string;
  provider_reference: string | null;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
};

export type SplitFormat = 'singles' | 'doubles';

export const bookingsApi = {
  mine: () => apiFetch<{ bookings: Booking[] }>('/api/bookings/mine'),
  venue: () => apiFetch<{ bookings: Booking[] }>('/api/bookings/venue'),
  get: (id: string) =>
    apiFetch<{ booking: Booking; participants?: BookingParticipant[]; my_participant?: BookingParticipant | null; is_organizer?: boolean }>(`/api/bookings/${id}`),
  create: (input: { venue_id: string; start_at: string; end_at: string; phone_number: string }) =>
    apiFetch<{ booking: Booking; payment: Payment }>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  createSplit: (input: { venue_id: string; start_at: string; end_at: string; format: SplitFormat; partner_phones: string[] }) =>
    apiFetch<{ booking: Booking; participants: BookingParticipant[] }>('/api/bookings/split', { method: 'POST', body: JSON.stringify(input) }),
  cancel: (id: string) => apiFetch<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { method: 'POST' }),
  respond: (id: string, accept: boolean) => apiFetch<{ booking: Booking }>(`/api/bookings/${id}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }),
  paySplitShare: (id: string, phone_number: string) =>
    apiFetch<{ payment: Payment }>(`/api/bookings/${id}/pay`, { method: 'POST', body: JSON.stringify({ phone_number }) }),
};

export const paymentsApi = {
  confirm: (id: string) => apiFetch<{ booking: Booking }>(`/api/payments/${id}/confirm`, { method: 'POST' }),
  // Same endpoint as confirm() — a split_share payment's confirmation
  // response is { booking, funded }, not just { booking }, so it gets its
  // own response type rather than overloading confirm()'s.
  confirmSplitShare: (id: string) => apiFetch<{ booking: Booking; funded: boolean }>(`/api/payments/${id}/confirm`, { method: 'POST' }),
};
