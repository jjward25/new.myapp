import { format } from 'date-fns';

export function getCurrentFormattedDate() {
  const now = new Date();
  return format(now, 'MMM dd yyyy - hh:mm a');
}

export function getCurrentDate() {
  const now = new Date();
  return format(now, 'yyyy-MM-dd');
}
