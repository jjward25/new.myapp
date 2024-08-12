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
  return new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

export function getTomorrow() {
  return new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]; // Format as YYYY-MM-DD
}