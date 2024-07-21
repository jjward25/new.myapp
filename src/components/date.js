import { format } from 'date-fns';

export function getCurrentFormattedDate() {
  const now = new Date();
  return format(now, 'MMM dd yyyy - hh:mm a');
}
