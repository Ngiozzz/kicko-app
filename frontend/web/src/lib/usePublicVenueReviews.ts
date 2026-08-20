import { useCallback, useEffect, useState } from 'react';
import { publicReviewsApi, PublicReview } from './reviewsApi';

// Same "Load more"-paginated shape as useVenueReviews.ts, trimmed for the
// logged-out public venue page — no eligibleBookingId/removeLocal/
// replaceLocal, since those only matter for a signed-in player reviewing or
// an owner/admin moderating.
export function usePublicVenueReviews(venueId: string | undefined) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(
    (targetPage: number, append: boolean) => {
      if (!venueId) return;
      setLoading(true);
      publicReviewsApi
        .forVenue(venueId, targetPage)
        .then((data) => {
          setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
          setAverage(data.average);
          setCount(data.count);
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

  return { reviews, average, count, hasMore, loading, loaded, loadMore };
}
