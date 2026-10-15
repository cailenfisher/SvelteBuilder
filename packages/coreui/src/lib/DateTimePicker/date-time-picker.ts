/**
 * Conversions between an instant and the wall-clock time a `datetime-local` input shows, in an
 * IANA timezone rather than the browser's own. Both go through `Intl.DateTimeFormat` with an
 * explicit `timeZone`, so the result is the same whatever timezone the browser is in.
 */

type WallClock = { year: number; month: number; day: number; hour: number; minute: number };

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

function wallClockAt(instant: number, timezone: string): WallClock {
  // hourCycle h23, not hour12: false, which some engines render as "24" at midnight.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
    hour: part('hour'),
    minute: part('minute'),
  };
}

/** The timezone's offset from UTC at an instant, in minutes: -240 for New York in summer. */
function offsetAt(instant: number, timezone: string): number {
  const clock = wallClockAt(instant, timezone);
  const asUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  // Seconds are not part of the wall clock, so compare against the instant's whole minute.
  return Math.round((asUtc - Math.floor(instant / 60_000) * 60_000) / 60_000);
}

const formatWallClock = (clock: WallClock) =>
  `${pad(clock.year, 4)}-${pad(clock.month)}-${pad(clock.day)}T${pad(clock.hour)}:${pad(clock.minute)}`;

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absolute = Math.abs(minutes);
  return `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`;
}

/**
 * An ISO 8601 instant as the `YYYY-MM-DDTHH:mm` a `datetime-local` input shows in `timezone`.
 * Empty for an empty or unparseable value.
 */
export function toLocalDateTime(iso: string, timezone: string): string {
  const instant = Date.parse(iso);
  if (Number.isNaN(instant)) return '';
  return formatWallClock(wallClockAt(instant, timezone));
}

/**
 * A `datetime-local` input's `YYYY-MM-DDTHH:mm`, read as wall-clock time in `timezone`, as an
 * ISO 8601 string carrying that timezone's offset: `2026-07-01T12:00:00.000-04:00`. Null for an
 * empty or malformed value.
 *
 * A time that does not exist there, because the clocks skipped it, moves forward by the length
 * of the skip; a time that happens twice takes the earlier. That is `Temporal`'s default
 * ("compatible") disambiguation, and what calendar applications do.
 */
export function toIsoDateTime(localDateTime: string, timezone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Guess with the offset at the wall clock read as UTC, then correct once: the guess is off
  // only when a transition falls between the two.
  const firstOffset = offsetAt(asUtc, timezone);
  const first = asUtc - firstOffset * 60_000;
  const secondOffset = offsetAt(first, timezone);
  let instant = first;
  if (secondOffset !== firstOffset) {
    const second = asUtc - secondOffset * 60_000;
    // When the corrected instant keeps its own offset, the time exists. When it does not, the
    // time is in a gap, and the first guess is the time after it.
    if (offsetAt(second, timezone) === secondOffset) instant = second;
  }

  return `${formatWallClock(wallClockAt(instant, timezone))}:00.000${formatOffset(offsetAt(instant, timezone))}`;
}
