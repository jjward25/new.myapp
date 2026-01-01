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
 * Get week bounds (Monday to Sunday) in EST timezone
 * Returns { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', startDate: Date, endDate: Date }
 */
export function getWeekBoundsEST(date = new Date()) {
  // Convert to EST
  const estString = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const estDate = new Date(estString);
  
  const day = estDate.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? 6 : day - 1; // Monday = 0 offset
  
  // Calculate Monday (start of week)
  const monday = new Date(estDate);
  monday.setDate(estDate.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  
  // Calculate Sunday (end of week)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    start: formatDateEST(monday),
    end: formatDateEST(sunday),
    startDate: monday,
    endDate: sunday
  };
}

/**
 * Get week start (Monday) in EST as YYYY-MM-DD string
 */
export function getWeekStartEST(date = new Date()) {
  return getWeekBoundsEST(date).start;
}

/**
 * Get remaining days in the week (including today) based on EST
 * Sunday = 1 day remaining, Saturday = 2, ..., Monday = 7
 */
export function getRemainingDaysEST() {
  const day = getDayOfWeekEST();
  return day === 0 ? 1 : 8 - day;
}


