// src/utils/date.tsx
const timeZone = 'America/New_York'; // EST time zone

export function getCurrentFormattedDate() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const parts = formatter.formatToParts(now);
  const formattedDate = parts.map(({ value }) => value).join('');
  return formattedDate;
}

export function getToday() {
  const today = new Date();
  // Convert to EST/EDT timezone
  const estToday = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const offset = estToday.getTimezoneOffset() * 60000; // Offset in milliseconds
  const adjustedToday = new Date(estToday.getTime() - offset);
  return adjustedToday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

export function getTomorrow() {
  const today = new Date();
  // Convert to EST/EDT timezone
  const estTomorrow = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  estTomorrow.setDate(estTomorrow.getDate() + 1);
  const offset = estTomorrow.getTimezoneOffset() * 60000; // Offset in milliseconds
  const adjustedTomorrow = new Date(estTomorrow.getTime() - offset);
  return adjustedTomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

export function getYesterday() {
  const today = new Date();
  // Convert to EST/EDT timezone
  const estYesterday = new Date(today.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  estYesterday.setDate(estYesterday.getDate() - 1); 
  const offset = estYesterday.getTimezoneOffset() * 60000; // Offset in milliseconds
  const adjustedYesterday = new Date(estYesterday.getTime() - offset);
  return adjustedYesterday.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}





