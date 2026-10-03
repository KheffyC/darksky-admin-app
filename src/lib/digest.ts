import { addDays, type NeedsAttention } from '@/lib/needs-attention';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function shortDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function weekday(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}

/**
 * Missed payments ride along in the push only on the Monday after a due date
 * (the Home page shows them every day until they're paid).
 */
export function isMissedPaymentMonday(attention: NeedsAttention, weekdayName: string) {
  const due = attention.missedPayments?.latestSchedule.dueDate;
  return weekdayName === 'Mon' && !!due && due >= addDays(attention.today, -7) && due < attention.today;
}

/** The push text for a day, or null when nothing needs attention (no push on quiet days). */
export function buildDigest(attention: NeedsAttention, includeMissedPayments: boolean) {
  const parts: string[] = [];

  const behind = attention.missedPayments?.members ?? [];
  if (includeMissedPayments && behind.length > 0) {
    const schedule = attention.missedPayments!.latestSchedule;
    parts.push(`${behind.length} member${behind.length === 1 ? '' : 's'} behind on ${schedule.name} (due ${shortDate(schedule.dueDate)})`);
  }

  for (const event of attention.upcoming) {
    const when = event.date === attention.today ? 'today' : event.date === addDays(attention.today, 1) ? 'tomorrow' : weekday(event.date);
    parts.push(event.type === 'show' ? `Show ${when}${event.location ? ` at ${event.location}` : ''}` : `${event.title} ${when}`);
  }

  const overdue = attention.tasks.filter((task) => task.overdue).length;
  const dueSoon = attention.tasks.length - overdue;
  if (overdue > 0) parts.push(`${overdue} overdue task${overdue === 1 ? '' : 's'}`);
  if (dueSoon > 0) parts.push(`${dueSoon} task${dueSoon === 1 ? '' : 's'} due this week`);

  if (attention.reimbursements.count > 0) {
    parts.push(`${currency.format(attention.reimbursements.total)} to reimburse`);
  }

  if (parts.length === 0) return null;
  return {
    title: `${parts.length} thing${parts.length === 1 ? '' : 's'} need${parts.length === 1 ? 's' : ''} attention`,
    body: parts.join(' · '),
  };
}
