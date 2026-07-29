/**
 * timeCalculationService.js
 * ============================================================================
 * THE core algorithm of the assignment: given a start date/time and a signed,
 * fractional "estimate in working days", compute the exact end date/time.
 *
 * This module is 100% framework-free — no Express, no Sequelize, no I/O.
 * It only deals in plain JS primitives (Date, number, string, array), which
 * is what makes it trivial to unit test in isolation (see
 * tests/unit/timeCalculationService.test.js) and reusable from anywhere:
 * the HTTP API today, a CLI script or a batch job tomorrow.
 *
 * ----------------------------------------------------------------------------
 * ALGORITHM OVERVIEW
 * ----------------------------------------------------------------------------
 * 1. Normalize   — truncate the start instant to the minute (seconds/ms are
 *                  always ignored, per spec).
 * 2. Snap        — if the start instant falls outside the working window
 *                  (weekend, holiday, before opening, after closing), move it
 *                  to the *nearest valid working instant in the direction the
 *                  estimate will travel* (forward for >= 0, backward for <0).
 *                  This is what makes a negative estimate the exact mirror
 *                  image of a positive one instead of a separate algorithm.
 * 3. Quantize    — convert the fractional-day estimate into a whole number of
 *                  minutes: |estimateDays| * workingMinutesPerDay, *floored*
 *                  (not rounded) to the minute. Flooring is what reproduces
 *                  the assignment's worked examples exactly — every one of
 *                  the 5 official test vectors was used to derive this rule.
 * 4. Walk        — consume those minutes in day-sized chunks: fill the room
 *                  left in the current working day, then jump the pointer to
 *                  the next (or previous) valid working day's open/close
 *                  instant, skipping weekends and holidays, and repeat until
 *                  no minutes remain.
 * 5. Return      — the resulting Date, truncated to the minute.
 * ============================================================================
 */

/** Thrown for malformed input (bad working hours, invalid date, etc). Kept
 * local to this module so the module has zero dependency on the rest of the
 * app's error hierarchy. */
class TimeCalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeCalculationError';
  }
}

/** Truncates seconds/milliseconds — the spec is explicit that seconds are ignored. */
function truncateToMinute(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  return d;
}

/** Parses 'HH:MM' or 'HH:MM:SS' into { hours, minutes }. */
function parseTimeOfDay(value, label) {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/.test(value)) {
    throw new TimeCalculationError(`${label} must be a valid 24-hour time string (HH:MM)`);
  }
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes };
}

function atTimeOfDay(date, timeOfDay) {
  const result = new Date(date);
  result.setHours(timeOfDay.hours, timeOfDay.minutes, 0, 0);
  return result;
}

function addCalendarDays(date, numberOfDays) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return result;
}

function isWeekend(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

/**
 * @param {Date} date
 * @param {Array<{month:number, day:number}>} recurringHolidays 1-indexed month
 * @param {Array<string|Date>} oneTimeHolidays 'YYYY-MM-DD' or Date
 */
function isHoliday(date, recurringHolidays, oneTimeHolidays) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const isRecurring = recurringHolidays.some((h) => Number(h.month) === month && Number(h.day) === day);
  if (isRecurring) return true;

  return oneTimeHolidays.some((raw) => {
    const holidayDate = raw instanceof Date ? raw : new Date(`${raw}T00:00:00`);
    return holidayDate.getFullYear() === date.getFullYear() && holidayDate.getMonth() === date.getMonth() && holidayDate.getDate() === date.getDate();
  });
}

function isWorkingDay(date, recurringHolidays, oneTimeHolidays) {
  return !isWeekend(date) && !isHoliday(date, recurringHolidays, oneTimeHolidays);
}

/**
 * Steps calendar-day by calendar-day (never partial) in `direction` until it
 * finds a working day. Used both to snap an out-of-window start and to jump
 * the walking pointer past a weekend/holiday.
 */
function findNextWorkingDay(date, direction, recurringHolidays, oneTimeHolidays) {
  let candidate = addCalendarDays(date, direction);
  while (!isWorkingDay(candidate, recurringHolidays, oneTimeHolidays)) {
    candidate = addCalendarDays(candidate, direction);
  }
  return candidate;
}

/**
 * Moves an arbitrary start instant onto the nearest valid working instant,
 * choosing the snap direction to match where the estimate will travel so the
 * walk in step 4 always begins from solid ground.
 *
 *   direction >= 0 (forward-moving estimate):
 *     - non-working day      -> next working day's opening time
 *     - before opening time  -> same day's opening time
 *     - after closing time   -> next working day's opening time
 *   direction < 0 (backward-moving estimate):
 *     - non-working day      -> previous working day's closing time
 *     - before opening time  -> previous working day's closing time
 *     - after closing time   -> same day's closing time
 *   otherwise (already inside a working day, opening <= t <= closing):
 *     - returned unchanged in either direction
 */
function snapToWorkingInstant(date, direction, openTime, closeTime, recurringHolidays, oneTimeHolidays) {
  const forward = direction >= 0;

  if (!isWorkingDay(date, recurringHolidays, oneTimeHolidays)) {
    return forward
      ? atTimeOfDay(findNextWorkingDay(date, 1, recurringHolidays, oneTimeHolidays), openTime)
      : atTimeOfDay(findNextWorkingDay(date, -1, recurringHolidays, oneTimeHolidays), closeTime);
  }

  const opensAt = atTimeOfDay(date, openTime);
  const closesAt = atTimeOfDay(date, closeTime);

  if (date < opensAt) {
    return forward ? opensAt : atTimeOfDay(findNextWorkingDay(date, -1, recurringHolidays, oneTimeHolidays), closeTime);
  }
  if (date > closesAt) {
    return forward ? atTimeOfDay(findNextWorkingDay(date, 1, recurringHolidays, oneTimeHolidays), openTime) : closesAt;
  }
  return date; // already within the working window
}

/**
 * The public entry point.
 *
 * @param {object} params
 * @param {Date|string} params.startDateTime
 * @param {number} params.estimateDays - signed, fractional working-day estimate
 * @param {string} params.workingStartTime - 'HH:MM' or 'HH:MM:SS'
 * @param {string} params.workingEndTime - 'HH:MM' or 'HH:MM:SS'
 * @param {Array<{month:number, day:number}>} [params.recurringHolidays]
 * @param {Array<string|Date>} [params.oneTimeHolidays]
 * @returns {Date} the calculated end date/time, truncated to the minute
 */
function calculateEndDateTime({
  startDateTime,
  estimateDays,
  workingStartTime,
  workingEndTime,
  recurringHolidays = [],
  oneTimeHolidays = [],
}) {
  const startDate = new Date(startDateTime);
  if (Number.isNaN(startDate.getTime())) {
    throw new TimeCalculationError('startDateTime must be a valid date');
  }
  if (typeof estimateDays !== 'number' || Number.isNaN(estimateDays)) {
    throw new TimeCalculationError('estimateDays must be a number');
  }

  const openTime = parseTimeOfDay(workingStartTime, 'workingStartTime');
  const closeTime = parseTimeOfDay(workingEndTime, 'workingEndTime');
  const workingMinutesPerDay = closeTime.hours * 60 + closeTime.minutes - (openTime.hours * 60 + openTime.minutes);
  if (workingMinutesPerDay <= 0) {
    throw new TimeCalculationError('workingStartTime must be earlier than workingEndTime');
  }

  const direction = estimateDays >= 0 ? 1 : -1;
  let pointer = snapToWorkingInstant(
    truncateToMinute(startDate),
    direction,
    openTime,
    closeTime,
    recurringHolidays,
    oneTimeHolidays
  );

  // The single point where fractional days become a whole number of minutes.
  // Flooring (not rounding) is intentional — verified against the
  // assignment's official worked examples.
  let remainingMinutes = Math.floor(Math.abs(estimateDays) * workingMinutesPerDay);

  while (remainingMinutes > 0) {
    if (direction > 0) {
      const closesAt = atTimeOfDay(pointer, closeTime);
      const roomInDayMinutes = Math.round((closesAt.getTime() - pointer.getTime()) / 60000);

      if (remainingMinutes <= roomInDayMinutes) {
        pointer = new Date(pointer.getTime() + remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= roomInDayMinutes;
        const nextDay = findNextWorkingDay(pointer, 1, recurringHolidays, oneTimeHolidays);
        pointer = atTimeOfDay(nextDay, openTime);
      }
    } else {
      const opensAt = atTimeOfDay(pointer, openTime);
      const roomInDayMinutes = Math.round((pointer.getTime() - opensAt.getTime()) / 60000);

      if (remainingMinutes <= roomInDayMinutes) {
        pointer = new Date(pointer.getTime() - remainingMinutes * 60000);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= roomInDayMinutes;
        const previousDay = findNextWorkingDay(pointer, -1, recurringHolidays, oneTimeHolidays);
        pointer = atTimeOfDay(previousDay, closeTime);
      }
    }
  }

  return truncateToMinute(pointer);
}

module.exports = {
  calculateEndDateTime,
  TimeCalculationError,
  // Exported for focused unit testing of internals — not part of the public
  // contract consumed by the rest of the app (only calculateEndDateTime is).
  __internal: {
    truncateToMinute,
    parseTimeOfDay,
    atTimeOfDay,
    addCalendarDays,
    isWeekend,
    isHoliday,
    isWorkingDay,
    findNextWorkingDay,
    snapToWorkingInstant,
  },
};
