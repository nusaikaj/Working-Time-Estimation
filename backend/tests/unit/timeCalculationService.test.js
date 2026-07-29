/**
 * Extensive unit tests for the heart of the assignment:
 * services/timeCalculationService.js
 *
 * All dates/times are asserted by LOCAL wall-clock components (year, month,
 * date, hours, minutes) rather than ISO/UTC strings. The service parses
 * 'YYYY-MM-DDTHH:MM:SS' (no timezone suffix) as local time and this suite
 * reads results back the same way, so these assertions are timezone-agnostic
 * — they pass identically no matter what timezone the test runner's machine
 * is set to.
 */
const { calculateEndDateTime, TimeCalculationError, __internal } = require('../../src/services/timeCalculationService');

const DEFAULT_HOURS = { workingStartTime: '08:00', workingEndTime: '16:00' };
const RECURRING = [{ month: 5, day: 17 }]; // 17 May every year
const ONE_TIME = ['2004-05-27']; // 27 May 2004

/** Builds a local Date without any timezone ambiguity. */
function local(y, m, d, h = 0, mi = 0) {
  return new Date(y, m - 1, d, h, mi, 0, 0);
}

/** Asserts a Date matches the given local wall-clock components exactly, and that seconds are always zeroed. */
function expectLocalDateTime(actual, y, m, d, h, mi) {
  expect(actual.getFullYear()).toBe(y);
  expect(actual.getMonth()).toBe(m - 1);
  expect(actual.getDate()).toBe(d);
  expect(actual.getHours()).toBe(h);
  expect(actual.getMinutes()).toBe(mi);
  expect(actual.getSeconds()).toBe(0);
  expect(actual.getMilliseconds()).toBe(0);
}

function run(startDateTime, estimateDays, overrides = {}) {
  return calculateEndDateTime({
    startDateTime,
    estimateDays,
    workingStartTime: overrides.workingStartTime || DEFAULT_HOURS.workingStartTime,
    workingEndTime: overrides.workingEndTime || DEFAULT_HOURS.workingEndTime,
    recurringHolidays: overrides.recurringHolidays !== undefined ? overrides.recurringHolidays : RECURRING,
    oneTimeHolidays: overrides.oneTimeHolidays !== undefined ? overrides.oneTimeHolidays : ONE_TIME,
  });
}

describe('timeCalculationService — official assignment worked examples', () => {
  // These 5 vectors are given verbatim in the assignment brief and are the
  // ground truth the whole algorithm was derived against.
  test.each([
    ['2004-05-24T18:05:00', -5.5, [2004, 5, 14, 12, 0]],
    ['2004-05-24T19:03:00', 44.723656, [2004, 7, 27, 13, 47]],
    ['2004-05-24T18:03:00', -6.7470217, [2004, 5, 13, 10, 2]],
    ['2004-05-24T08:03:00', 12.782709, [2004, 6, 10, 14, 18]],
    ['2004-05-24T07:03:00', 8.276628, [2004, 6, 4, 10, 12]],
  ])('start=%s estimate=%p -> %p', (start, estimate, expected) => {
    const result = run(start, estimate);
    expectLocalDateTime(result, ...expected);
  });
});

describe('timeCalculationService — weekends', () => {
  test('start on a Saturday, positive estimate snaps forward to Monday opening time', () => {
    // 22 May 2004 = Saturday, 24 May 2004 = Monday
    const result = run('2004-05-22T10:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 24, 16, 0);
  });

  test('start on a Sunday, negative estimate snaps backward to Friday closing time', () => {
    // 23 May 2004 = Sunday, 21 May 2004 = Friday
    const result = run('2004-05-23T10:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 21, 8, 0);
  });

  test('an estimate that spans a weekend skips Saturday and Sunday entirely', () => {
    // Friday 21 May 08:00 + 1.5 days should land Monday 24 May, not Sat/Sun
    const result = run('2004-05-21T08:00:00', 1.5);
    expectLocalDateTime(result, 2004, 5, 24, 12, 0);
  });
});

describe('timeCalculationService — recurring holidays', () => {
  test('start on a recurring holiday, positive estimate snaps forward past it', () => {
    // 17 May 2004 = Monday, a recurring holiday; next working day is Tuesday 18 May
    const result = run('2004-05-17T10:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 18, 16, 0);
  });

  test('start on a recurring holiday, negative estimate snaps backward past it', () => {
    const result = run('2004-05-17T10:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 14, 8, 0);
  });

  test('recurring holiday repeats every year — 17 May of the following year is also skipped', () => {
    const result = run('2005-05-17T10:00:00', 1, { oneTimeHolidays: [] });
    expectLocalDateTime(result, 2005, 5, 18, 16, 0);
  });
});

describe('timeCalculationService — one-time holidays', () => {
  test('start on a one-time holiday, positive estimate snaps forward (also skips the following weekend)', () => {
    // 27 May 2004 = Thursday holiday; 28 May = Friday; then weekend; 2 days lands Monday 31 May
    const result = run('2004-05-27T10:00:00', 2);
    expectLocalDateTime(result, 2004, 5, 31, 16, 0);
  });

  test('start on a one-time holiday, negative estimate snaps backward', () => {
    const result = run('2004-05-27T10:00:00', -2);
    expectLocalDateTime(result, 2004, 5, 25, 8, 0);
  });

  test('a one-time holiday only applies to its exact calendar date, not future years', () => {
    const result = run('2005-05-27T10:00:00', 0, { recurringHolidays: [] });
    // 27 May 2005 is a Friday and a normal working day -> unchanged
    expectLocalDateTime(result, 2005, 5, 27, 10, 0);
  });
});

describe('timeCalculationService — holiday in the middle of a span', () => {
  test('an estimate that would cross a holiday skips it without counting it as worked time', () => {
    // Wed 26 May 08:00 + 3 days must skip Thu 27 (holiday) and the weekend,
    // consuming Wed 26, Fri 28, Mon 31 -> ends Mon 31 May 16:00
    const result = run('2004-05-26T08:00:00', 3);
    expectLocalDateTime(result, 2004, 5, 31, 16, 0);
  });

  test('multiple consecutive non-working days (recurring holiday + weekend) are all skipped together', () => {
    // Fri 14 May 08:00 + 3 days must skip Sat/Sun and the Mon 17 May holiday,
    // consuming Fri 14, Tue 18, Wed 19 -> ends Wed 19 May 16:00
    const result = run('2004-05-14T08:00:00', 3);
    expectLocalDateTime(result, 2004, 5, 19, 16, 0);
  });
});

describe('timeCalculationService — zero estimate', () => {
  test('zero estimate mid-working-day returns the exact same instant, unchanged', () => {
    const result = run('2004-05-24T10:00:00', 0);
    expectLocalDateTime(result, 2004, 5, 24, 10, 0);
  });

  test('zero estimate before opening time snaps forward to opening time the same day', () => {
    const result = run('2004-05-24T05:00:00', 0);
    expectLocalDateTime(result, 2004, 5, 24, 8, 0);
  });

  test('zero estimate after closing time snaps forward to next working day opening time', () => {
    const result = run('2004-05-24T18:00:00', 0);
    expectLocalDateTime(result, 2004, 5, 25, 8, 0);
  });

  test('zero estimate on a weekend snaps forward to the following Monday opening time', () => {
    const result = run('2004-05-22T10:00:00', 0);
    expectLocalDateTime(result, 2004, 5, 24, 8, 0);
  });

  test('zero estimate on a holiday snaps forward to the next working day opening time', () => {
    const result = run('2004-05-17T10:00:00', 0);
    expectLocalDateTime(result, 2004, 5, 18, 8, 0);
  });
});

describe('timeCalculationService — outside working hours', () => {
  test('start before opening time, positive estimate begins counting from opening time same day', () => {
    const result = run('2004-05-24T05:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 24, 16, 0);
  });

  test('start before opening time, negative estimate snaps back to previous working day closing time', () => {
    const result = run('2004-05-24T05:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 21, 8, 0);
  });

  test('start after closing time, positive estimate begins counting from next working day opening time', () => {
    const result = run('2004-05-24T20:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 25, 16, 0);
  });

  test('start after closing time, negative estimate begins counting from same day closing time', () => {
    const result = run('2004-05-24T20:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 24, 8, 0);
  });

  test('start exactly at opening time is treated as already valid (forward)', () => {
    const result = run('2004-05-24T08:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 24, 16, 0);
  });

  test('start exactly at opening time is treated as already valid (backward, consumes the whole current day)', () => {
    const result = run('2004-05-24T08:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 21, 8, 0);
  });

  test('start exactly at closing time is treated as already valid (forward rolls to next day)', () => {
    const result = run('2004-05-24T16:00:00', 1);
    expectLocalDateTime(result, 2004, 5, 25, 16, 0);
  });

  test('start exactly at closing time is treated as already valid (backward, consumes the whole current day)', () => {
    const result = run('2004-05-24T16:00:00', -1);
    expectLocalDateTime(result, 2004, 5, 24, 8, 0);
  });
});

describe('timeCalculationService — calendar boundaries', () => {
  test('crosses a leap-year day (29 Feb 2004) without special-casing needed', () => {
    // Fri 27 Feb 2004 10:00 + 1 day must skip Sat 28 Feb and Sun 29 Feb (leap day)
    const result = run('2004-02-27T10:00:00', 1, { recurringHolidays: [], oneTimeHolidays: [] });
    expectLocalDateTime(result, 2004, 3, 1, 10, 0);
  });

  test('crosses a month-end boundary', () => {
    const result = run('2004-05-31T15:00:00', 1, { recurringHolidays: [], oneTimeHolidays: [] });
    expectLocalDateTime(result, 2004, 6, 1, 15, 0);
  });

  test('crosses a year-end boundary', () => {
    const result = run('2004-12-31T15:30:00', 1, { recurringHolidays: [], oneTimeHolidays: [] });
    expectLocalDateTime(result, 2005, 1, 3, 15, 30);
  });
});

describe('timeCalculationService — magnitude extremes', () => {
  test('a large multi-month estimate resolves correctly', () => {
    const result = run('2004-01-01T08:00:00', 200);
    expectLocalDateTime(result, 2004, 10, 8, 16, 0);
  });

  test('a large negative estimate resolves correctly', () => {
    const result = run('2004-12-31T08:00:00', -200);
    expectLocalDateTime(result, 2004, 3, 24, 8, 0);
  });

  test('a very small positive estimate (0.01 day) resolves to a few minutes', () => {
    const result = run('2004-05-24T10:00:00', 0.01);
    expectLocalDateTime(result, 2004, 5, 24, 10, 4);
  });

  test('an estimate smaller than one minute floors to zero minutes and returns the snapped start', () => {
    const result = run('2004-05-24T10:00:00', 0.001);
    expectLocalDateTime(result, 2004, 5, 24, 10, 0);
  });

  test('a small negative estimate that stays within the same working day', () => {
    const result = run('2004-05-24T10:00:00', -0.25);
    expectLocalDateTime(result, 2004, 5, 24, 8, 0);
  });
});

describe('timeCalculationService — minute precision (seconds ignored)', () => {
  test('seconds on the start instant are always truncated', () => {
    const result = run('2004-05-24T10:00:45', 0);
    expectLocalDateTime(result, 2004, 5, 24, 10, 0);
  });

  test('seconds are truncated before the walk begins, not just on the final result', () => {
    const result = run('2004-05-24T10:00:59', 1.5);
    expectLocalDateTime(result, 2004, 5, 25, 14, 0);
  });
});

describe('timeCalculationService — configurable working hours', () => {
  test('a non-default working window (09:30–17:45) is respected', () => {
    const result = calculateEndDateTime({
      startDateTime: '2004-05-24T09:30:00',
      estimateDays: 2.5,
      workingStartTime: '09:30',
      workingEndTime: '17:45',
      recurringHolidays: [],
      oneTimeHolidays: [],
    });
    expectLocalDateTime(result, 2004, 5, 26, 13, 37);
  });

  test('accepts HH:MM:SS as well as HH:MM for working hours', () => {
    const result = calculateEndDateTime({
      startDateTime: '2004-05-24T10:00:00',
      estimateDays: 0,
      workingStartTime: '08:00:00',
      workingEndTime: '16:00:00',
      recurringHolidays: [],
      oneTimeHolidays: [],
    });
    expectLocalDateTime(result, 2004, 5, 24, 10, 0);
  });
});

describe('timeCalculationService — input validation', () => {
  test('throws TimeCalculationError for an invalid startDateTime', () => {
    expect(() => run('not-a-real-date', 1)).toThrow(TimeCalculationError);
  });

  test('throws TimeCalculationError when estimateDays is not a number', () => {
    expect(() => run('2004-05-24T10:00:00', 'five')).toThrow(TimeCalculationError);
  });

  test('throws TimeCalculationError when estimateDays is NaN', () => {
    expect(() => run('2004-05-24T10:00:00', NaN)).toThrow(TimeCalculationError);
  });

  test('throws TimeCalculationError for a malformed workingStartTime', () => {
    expect(() => run('2004-05-24T10:00:00', 1, { workingStartTime: '25:99' })).toThrow(TimeCalculationError);
  });

  test('throws TimeCalculationError for a malformed workingEndTime', () => {
    expect(() => run('2004-05-24T10:00:00', 1, { workingEndTime: 'not-a-time' })).toThrow(TimeCalculationError);
  });

  test('throws TimeCalculationError when workingStartTime is not before workingEndTime', () => {
    expect(() => run('2004-05-24T10:00:00', 1, { workingStartTime: '16:00', workingEndTime: '08:00' })).toThrow(
      TimeCalculationError
    );
  });

  test('throws TimeCalculationError when workingStartTime equals workingEndTime', () => {
    expect(() => run('2004-05-24T10:00:00', 1, { workingStartTime: '08:00', workingEndTime: '08:00' })).toThrow(
      TimeCalculationError
    );
  });

  test('defaults holidays to empty arrays when omitted', () => {
    const result = calculateEndDateTime({
      startDateTime: '2004-05-24T10:00:00',
      estimateDays: 0,
      workingStartTime: '08:00',
      workingEndTime: '16:00',
    });
    expectLocalDateTime(result, 2004, 5, 24, 10, 0);
  });
});

describe('timeCalculationService — internal helpers', () => {
  const { isWeekend, isHoliday, isWorkingDay, findNextWorkingDay, snapToWorkingInstant, parseTimeOfDay, truncateToMinute, addCalendarDays } =
    __internal;

  test('isWeekend identifies Saturday and Sunday only', () => {
    expect(isWeekend(local(2004, 5, 22))).toBe(true); // Saturday
    expect(isWeekend(local(2004, 5, 23))).toBe(true); // Sunday
    expect(isWeekend(local(2004, 5, 24))).toBe(false); // Monday
  });

  test('isHoliday matches recurring holidays by month/day regardless of year', () => {
    expect(isHoliday(local(2004, 5, 17), RECURRING, [])).toBe(true);
    expect(isHoliday(local(2010, 5, 17), RECURRING, [])).toBe(true);
    expect(isHoliday(local(2004, 5, 18), RECURRING, [])).toBe(false);
  });

  test('isHoliday matches one-time holidays on the exact date only', () => {
    expect(isHoliday(local(2004, 5, 27), [], ONE_TIME)).toBe(true);
    expect(isHoliday(local(2005, 5, 27), [], ONE_TIME)).toBe(false);
  });

  test('isHoliday accepts one-time holidays given as Date instances too', () => {
    expect(isHoliday(local(2004, 5, 27), [], [local(2004, 5, 27)])).toBe(true);
  });

  test('isWorkingDay is false for weekends and holidays, true otherwise', () => {
    expect(isWorkingDay(local(2004, 5, 24), RECURRING, ONE_TIME)).toBe(true);
    expect(isWorkingDay(local(2004, 5, 22), RECURRING, ONE_TIME)).toBe(false);
    expect(isWorkingDay(local(2004, 5, 17), RECURRING, ONE_TIME)).toBe(false);
    expect(isWorkingDay(local(2004, 5, 27), RECURRING, ONE_TIME)).toBe(false);
  });

  test('findNextWorkingDay steps forward over multiple consecutive non-working days', () => {
    const next = findNextWorkingDay(local(2004, 5, 14), 1, RECURRING, ONE_TIME); // Fri 14 -> skip weekend + Mon 17 holiday -> Tue 18
    expect(next.getDate()).toBe(18);
    expect(next.getMonth()).toBe(4);
  });

  test('findNextWorkingDay steps backward over multiple consecutive non-working days', () => {
    const prev = findNextWorkingDay(local(2004, 5, 18), -1, RECURRING, ONE_TIME); // Tue 18 -> skip Mon 17 holiday + weekend -> Fri 14
    expect(prev.getDate()).toBe(14);
    expect(prev.getMonth()).toBe(4);
  });

  test('snapToWorkingInstant returns the same instant when already inside the working window', () => {
    const instant = local(2004, 5, 24, 10, 0);
    const snapped = snapToWorkingInstant(instant, 1, { hours: 8, minutes: 0 }, { hours: 16, minutes: 0 }, RECURRING, ONE_TIME);
    expect(snapped.getTime()).toBe(instant.getTime());
  });

  test('parseTimeOfDay parses HH:MM and HH:MM:SS', () => {
    expect(parseTimeOfDay('08:00', 'x')).toEqual({ hours: 8, minutes: 0 });
    expect(parseTimeOfDay('16:30:00', 'x')).toEqual({ hours: 16, minutes: 30 });
  });

  test('parseTimeOfDay throws for malformed input', () => {
    expect(() => parseTimeOfDay('99:99', 'x')).toThrow(TimeCalculationError);
    expect(() => parseTimeOfDay(null, 'x')).toThrow(TimeCalculationError);
  });

  test('truncateToMinute zeroes seconds and milliseconds', () => {
    const truncated = truncateToMinute(local(2004, 5, 24, 10, 15));
    truncated.setSeconds(45, 500); // simulate a dirty input then re-truncate
    const clean = truncateToMinute(truncated);
    expect(clean.getSeconds()).toBe(0);
    expect(clean.getMilliseconds()).toBe(0);
  });

  test('addCalendarDays advances/retreats by whole calendar days', () => {
    expect(addCalendarDays(local(2004, 5, 24), 1).getDate()).toBe(25);
    expect(addCalendarDays(local(2004, 5, 24), -1).getDate()).toBe(23);
  });
});

describe('timeCalculationService — reusability across multiple independent calls', () => {
  test('the same function produces independent, non-interfering results for different inputs (no shared mutable state)', () => {
    const a = run('2004-05-24T08:00:00', 1);
    const b = run('2004-05-24T08:00:00', -1);
    expectLocalDateTime(a, 2004, 5, 24, 16, 0);
    expectLocalDateTime(b, 2004, 5, 21, 8, 0);
    // Calling again with the same args as `a` must be perfectly repeatable.
    const aAgain = run('2004-05-24T08:00:00', 1);
    expect(aAgain.getTime()).toBe(a.getTime());
  });
});
