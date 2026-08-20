import { apiFetch } from '@kicko/shared';

export type Review = {
  id: string;
  booking_id: string;
  venue_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  flagged_at: string | null;
  flag_reason: string | null;
  player: { id: string; name: string } | null;
};

export type VenueReviews = {
  reviews: Review[];
  average: number;
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  // The caller's own past, played booking at this venue that's still
  // unreviewed — null if they have none, or already reviewed all of them.
  eligible_booking_id: string | null;
};

export const reviewsApi = {
  forVenue: (venueId: string, page = 1) => apiFetch<VenueReviews>(`/api/reviews/venue/${venueId}?page=${page}`),
  create: (venueId: string, input: { booking_id: string; rating: number; comment?: string }) =>
    apiFetch<{ review: Review }>(`/api/reviews/venue/${venueId}`, { method: 'POST', body: JSON.stringify(input) }),
  // Owner-only — flags a review on their own venue for admin attention.
  flag: (reviewId: string, reason?: string) => apiFetch<{ review: Review }>(`/api/reviews/${reviewId}/flag`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

// What /api/public/venues/:id/reviews actually returns — no booking_id,
// flagged_at, or flag_reason (moderation-internal, see
// backend/src/controllers/public.controller.ts's narrower PUBLIC_REVIEW_SELECT).
export type PublicReview = Pick<Review, 'id' | 'rating' | 'comment' | 'created_at' | 'player'>;

export type PublicVenueReviews = {
  reviews: PublicReview[];
  average: number;
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export const publicReviewsApi = {
  forVenue: (venueId: string, page = 1) => apiFetch<PublicVenueReviews>(`/api/public/venues/${venueId}/reviews?page=${page}`),
};
