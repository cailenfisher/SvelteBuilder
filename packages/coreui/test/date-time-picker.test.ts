import { describe, expect, it } from 'vitest';
import { toIsoDateTime, toLocalDateTime } from '../src/lib/DateTimePicker/date-time-picker.js';

/**
 * The picker's conversions name their timezone explicitly, so these hold whatever timezone the
 * machine running them is in. Before 2026-10-14 the picker read the typed time in the browser's
 * own timezone, and returned the wrong instant for anyone not in the picker's.
 */

describe('toLocalDateTime', () => {
  it('shows an instant as wall-clock time in the given timezone', () => {
    expect(toLocalDateTime('2026-10-07T09:30:00.000Z', 'UTC')).toBe('2026-10-07T09:30');
    expect(toLocalDateTime('2026-10-07T09:30:00.000Z', 'Asia/Tokyo')).toBe('2026-10-07T18:30');
    expect(toLocalDateTime('2026-10-07T09:30:00.000Z', 'America/New_York')).toBe('2026-10-07T05:30');
  });

  it('shows midnight as 00, never 24', () => {
    expect(toLocalDateTime('2026-10-07T00:00:00.000Z', 'UTC')).toBe('2026-10-07T00:00');
  });

  it('is empty for an empty or unparseable value', () => {
    expect(toLocalDateTime('', 'UTC')).toBe('');
    expect(toLocalDateTime('not a date', 'UTC')).toBe('');
  });
});

describe('toIsoDateTime', () => {
  it("reads the wall clock in the given timezone and carries that timezone's offset", () => {
    expect(toIsoDateTime('2026-10-07T18:30', 'Asia/Tokyo')).toBe('2026-10-07T18:30:00.000+09:00');
    expect(toIsoDateTime('2026-10-07T09:30', 'UTC')).toBe('2026-10-07T09:30:00.000+00:00');
    expect(toIsoDateTime('2026-11-14T05:45', 'Asia/Kathmandu')).toBe('2026-11-14T05:45:00.000+05:45');
  });

  it('follows daylight saving time', () => {
    expect(toIsoDateTime('2026-07-01T12:00', 'America/New_York')).toBe('2026-07-01T12:00:00.000-04:00');
    expect(toIsoDateTime('2026-01-15T12:00', 'America/New_York')).toBe('2026-01-15T12:00:00.000-05:00');
    // Hours after the spring transition, where a first guess at the offset is an hour out.
    expect(toIsoDateTime('2026-03-08T05:00', 'America/New_York')).toBe('2026-03-08T05:00:00.000-04:00');
  });

  it('moves a time the clocks skipped forward, and takes the earlier of a time that happens twice', () => {
    expect(toIsoDateTime('2026-03-08T02:30', 'America/New_York')).toBe('2026-03-08T03:30:00.000-04:00');
    expect(toIsoDateTime('2026-11-01T01:30', 'America/New_York')).toBe('2026-11-01T01:30:00.000-04:00');
  });

  it('round-trips through toLocalDateTime to the same instant', () => {
    for (const timezone of ['UTC', 'Asia/Tokyo', 'America/New_York', 'Europe/Paris']) {
      const iso = toIsoDateTime('2026-10-07T09:30', timezone);
      expect(iso).not.toBeNull();
      expect(toLocalDateTime(iso ?? '', timezone)).toBe('2026-10-07T09:30');
    }
  });

  it('is null for an empty or malformed value', () => {
    expect(toIsoDateTime('', 'UTC')).toBeNull();
    expect(toIsoDateTime('2026-10-07', 'UTC')).toBeNull();
  });
});
