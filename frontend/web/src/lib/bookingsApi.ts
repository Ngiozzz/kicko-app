import { apiFetch } from '@kicko/shared';
import type { Venue } from './venuesApi';

export type BookingStatus = 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export type Booking = {
  id: string;
  venue_id: string;
  player_id: string;
  booking_type: 'individual' | 'session';
  session_id: string | null;
  start_at: string;
  end_at: string;
  subtotal: number;
  service_fee: number;
  total_amount: number;
  is_walk_in: boolean;
  status: BookingStatus;
  payment_status: PaymentStatus;
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

export type Payment = {
  id: string;
  booking_id: string | null;
  amount: number;
  phone_number: string;
  provider_reference: string | null;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
};

export const bookingsApi = {
  mine: () => apiFetch<{ bookings: Booking[] }>('/api/bookings/mine'),
  venue: () => apiFetch<{ bookings: Booking[] }>('/api/bookings/venue'),
  get: (id: string) => apiFetch<{ booking: Booking }>(`/api/bookings/${id}`),
  create: (input: { venue_id: string; start_at: string; end_at: string; phone_number: string }) =>
    apiFetch<{ booking: Booking; payment: Payment }>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  cancel: (id: string) => apiFetch<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { method: 'POST' }),
};

export const paymentsApi = {
  confirm: (id: string) => apiFetch<{ booking: Booking }>(`/api/payments/${id}/confirm`, { method: 'POST' }),
};
