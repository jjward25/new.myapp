// src/utils/dateUtils.js
// Shared date utilities with consistent EST (America/New_York) timezone handling

/**
 * Get today's date in EST timezone as YYYY-MM-DD string
 */
export function getTodayEST() {
  const now = new Date();
  return formatDateEST(now);
}

/**
 * Format any date in EST timezone as YYYY-MM-DD string
 */
export function formatDateEST(date) {
  const d = new Date(date);
  const options = { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' };
  // 'en-CA' locale returns YYYY-MM-DD format
  return d.toLocaleDateString('en-CA', options);
}

/**
 * Get current date/time in EST as a Date object
 * Note: The Date object itself is always UTC internally, but this gives you
 * a Date representing the current moment, useful for getDay() etc.
 */
export function getNowEST() {
  // Get EST time string and parse it back
  const now = new Date();
  const estString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(estString);
}

/**
 * Get the day of week in EST (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeekEST() {
  return getNowEST().getDay();
}

/**
 * Get week bounds (Sunday to Saturday) in EST timezone
 * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', startDate: Date, endDate: Date }
 */
export function getWeekBoundsEST(date = new Date()) {
  // Convert to EST
  const estString = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estDate = new Date(estString);

  const day = estDate.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Calculate Sunday (start of week)
  const sunday = new Date(estDate);
  sunday.setDate(estDate.getDate() - day);
  sunday.setHours(0, 0, 0, 0);

  // Calculate Saturday (end of week)
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return {
    start: formatDateEST(sunday),
    end: formatDateEST(saturday),
    startDate: sunday,
    endDate: saturday
  };
}

/**
 * Get week start (Sunday) in EST as YYYY-MM-DD string
 */
export function getWeekStartEST(date = new Date()) {
  return getWeekBoundsEST(date).start;
}

/**
 * Get remaining days in the week (including today) based on EST
 * Sunday = 7 days remaining, Saturday = 1
 */
export function getRemainingDaysEST() {
  const day = getDayOfWeekEST();
  return 7 - day;
}


