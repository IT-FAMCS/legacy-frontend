import { useMemo, useState } from "react";

const STEPS = [3, 10, Infinity] as const;

/** Progressive "show more" for a list already fully loaded client-side:
 * starts at 3 items, then 10, then all — matching how the activity/history
 * lists are used (small lists most of the time, no need for real
 * server-side pagination). */
export function usePagedList<T>(items: T[]) {
  const [stepIndex, setStepIndex] = useState(0);
  const visibleCount = STEPS[stepIndex];
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = stepIndex < STEPS.length - 1 && items.length > visibleCount;
  const nextStepLabel = stepIndex === 0 ? "10" : "все";

  const showMore = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));

  return { visibleItems, hasMore, nextStepLabel, showMore };
}
