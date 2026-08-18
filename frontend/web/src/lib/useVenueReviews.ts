import { useCallback, useEffect, useState } from 'react';
import { reviewsApi, Review } from './reviewsApi';

// Shared "Load more"-paginated reviews state — used by the player explore
// detail page, the owner venue page, and the admin venue page. Reviews
// accumulate across pages (append, not replace) so "Load more" grows the
// visible list rather than paging through it, which stays sane even at
// hundreds/thousands of reviews since each fetch is capped server-side.
export function useVenueReviews(venueId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    (targetPage: number, append: boolean) => {
      if (!venueId) return;
      setLoading(true);
      reviewsApi
        .forVenue(venueId, targetPage)
        .then((data) => {
          setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
          setAverage(data.average);
          setCount(data.count);
          setEligibleBookingId(data.eligible_booking_id);
          setPage(data.page);
          setHasMore(data.hasMore);
          setLoaded(true);
        })
        .catch(() => setLoaded(true))
        .finally(() => setLoading(false));
    },
    [venueId]
  );

  useEffect(() => {
    setReviews([]);
    setPage(1);
    load(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId]);

  const loadMore = useCallback(() => load(page + 1, true), [load, page]);
  const refresh = useCallback(() => load(1, false), [load]);

  // Drops one review from the already-loaded list client-side (after a
  // delete) without a round trip — count/average are refreshed for real
  // afterward since the venue's own aggregate already updated server-side.
  const removeLocal = useCallback((reviewId: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setCount((prev) => Math.max(0, prev - 1));
  }, []);

  const replaceLocal = useCallback((review: Review) => {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
  }, []);

  return { reviews, average, count, eligibleBookingId, hasMore, loading, loaded, loadMore, refresh, removeLocal, replaceLocal };
}
