import { format, utcToZonedTime } from 'date-fns-tz';

const timeZone = 'America/New_York'; // EST time zone

export function getCurrentFormattedDate() {
  const now = new Date();
  const estDate = utcToZonedTime(now, timeZone);
  return format(estDate, 'MMM dd yyyy - hh:mm a');
}

export function getCurrentDate() {
  const now = new Date();
  const estDate = utcToZonedTime(now, timeZone);
  return format(estDate, 'yyyy-MM-dd');
}
