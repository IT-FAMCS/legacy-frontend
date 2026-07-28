/**
 * Backend sends naive UTC timestamps with no timezone marker (e.g.
 * "2026-07-20T11:56:35.135079", not "...Z" or "+00:00" — SQLAlchemy/SQLite
 * drop tzinfo on every round-trip through the DB, so there's no reliable
 * fix on the backend side short of rewriting every date column). Without an
 * explicit UTC marker, JS's `Date` constructor interprets a date-time string
 * as LOCAL time instead of UTC — every displayed timestamp silently comes
 * out shifted by the browser's UTC offset (3 hours early for Moscow).
 * Appending "Z" when it's missing makes JS parse it as UTC, which then
 * correctly converts to the viewer's local time on display.
 */
function parseApiDate(value: string): Date {
  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
}

export function formatDateTime(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;
  return parseApiDate(value).toLocaleString("ru-RU");
}

export function formatDate(value: string | null | undefined, fallback = "-"): string {
  if (!value) return fallback;
  return parseApiDate(value).toLocaleDateString("ru-RU");
}
