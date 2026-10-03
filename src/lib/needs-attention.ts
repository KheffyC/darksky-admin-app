import { and, asc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { events, members, paymentSchedules, payments, projects, reimbursements, tasks, users } from '@/db/schema';

export const ORG_TIME_ZONE = 'America/Los_Angeles';

/** Today's date and weekday in Pacific time, regardless of where the server runs. */
export function pacificToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ORG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: get('weekday'), // 'Mon', 'Tue', …
    hour: Number(get('hour')),
  };
}

/** YYYY-MM-DD plus or minus whole days. */
export function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export type NeedsAttention = {
  today: string;
  season: string;
  missedPayments: {
    // The most recent schedule whose due date has passed
    latestSchedule: { id: string; name: string; dueDate: string };
    members: { id: string; name: string; section: string | null; paid: number; expected: number; shortBy: number }[];
  } | null;
  upcoming: { id: string; type: string; title: string; date: string; startTime: string | null; location: string | null }[];
  tasks: {
    id: string;
    title: string;
    dueDate: string;
    overdue: boolean;
    projectName: string;
    ownerId: string | null;
    ownerName: string | null;
  }[];
  reimbursements: { total: number; count: number; byPerson: { userId: string; name: string; total: number }[] };
  count: number;
};

const LOOKAHEAD_DAYS = 6; // today plus the next six days

/**
 * Everything the two of you should look at today for one season:
 * members behind on past-due payments, shows and deadlines this week,
 * tasks due this week or overdue, and reimbursements still owed.
 */
export async function getNeedsAttention(season: string, today = pacificToday().date): Promise<NeedsAttention> {
  const weekEnd = addDays(today, LOOKAHEAD_DAYS);

  const [missedPayments, upcoming, taskRows, owedRows] = await Promise.all([
    getMissedPayments(season, today),
    db
      .select({
        id: events.id,
        type: events.type,
        title: events.title,
        date: events.date,
        startTime: events.startTime,
        location: events.location,
      })
      .from(events)
      .where(and(eq(events.season, season), inArray(events.type, ['show', 'deadline']), gte(events.date, today), lte(events.date, weekEnd)))
      .orderBy(asc(events.date), asc(events.startTime)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        projectName: projects.name,
        ownerId: tasks.ownerId,
        ownerName: users.firstName,
      })
      .from(tasks)
      .innerJoin(projects, eq(projects.id, tasks.projectId))
      .leftJoin(users, eq(users.id, tasks.ownerId))
      .where(and(eq(projects.season, season), eq(projects.status, 'active'), isNull(tasks.completedAt), lte(tasks.dueDate, weekEnd)))
      .orderBy(asc(tasks.dueDate)),
    db
      .select({ userId: reimbursements.paidBy, name: users.firstName, amount: reimbursements.amount })
      .from(reimbursements)
      .innerJoin(users, eq(users.id, reimbursements.paidBy))
      .where(and(eq(reimbursements.season, season), eq(reimbursements.status, 'owed'))),
  ]);

  const byPerson = new Map<string, { userId: string; name: string; total: number }>();
  for (const row of owedRows) {
    const entry = byPerson.get(row.userId) ?? { userId: row.userId, name: row.name, total: 0 };
    entry.total += Number(row.amount);
    byPerson.set(row.userId, entry);
  }
  const reimbursementSummary = {
    total: owedRows.reduce((sum, row) => sum + Number(row.amount), 0),
    count: owedRows.length,
    byPerson: [...byPerson.values()],
  };

  const taskList = taskRows.map((task) => ({ ...task, dueDate: task.dueDate!, overdue: task.dueDate! < today }));

  return {
    today,
    season,
    missedPayments,
    upcoming,
    tasks: taskList,
    reimbursements: reimbursementSummary,
    count:
      (missedPayments?.members.length ? 1 : 0) + upcoming.length + taskList.length + (reimbursementSummary.count ? 1 : 0),
  };
}

/**
 * A member is behind when what they've paid is less than the total of every
 * active schedule already past due, capped at their own tuition (so discounted
 * members aren't flagged once they've paid their full amount).
 */
async function getMissedPayments(season: string, today: string): Promise<NeedsAttention['missedPayments']> {
  const pastDue = await db
    .select({ id: paymentSchedules.id, name: paymentSchedules.name, dueDate: paymentSchedules.dueDate, amount: paymentSchedules.amount })
    .from(paymentSchedules)
    .where(and(eq(paymentSchedules.season, season), eq(paymentSchedules.isActive, true)))
    .orderBy(asc(paymentSchedules.dueDate))
    .then((rows) => rows.filter((row) => row.dueDate < today));

  if (pastDue.length === 0) return null;
  const expectedSoFar = pastDue.reduce((sum, schedule) => sum + Number(schedule.amount), 0);
  const latest = pastDue[pastDue.length - 1];

  const memberRows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      section: members.section,
      tuition: members.tuitionAmount,
    })
    .from(members)
    .where(and(eq(members.season, season), eq(members.isActive, true)));

  const paidRows = memberRows.length
    ? await db
        .select({ memberId: payments.memberId, amount: payments.amountPaid })
        .from(payments)
        .where(and(eq(payments.isActive, true), inArray(payments.memberId, memberRows.map((member) => member.id))))
    : [];
  const paidByMember = new Map<string, number>();
  for (const row of paidRows) paidByMember.set(row.memberId, (paidByMember.get(row.memberId) ?? 0) + row.amount);

  const behind = memberRows
    .map((member) => {
      const paid = paidByMember.get(member.id) ?? 0;
      const expected = Math.min(expectedSoFar, member.tuition);
      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        section: member.section,
        paid,
        expected,
        // Round to cents so floating-point leftovers don't flag someone who is paid up
        shortBy: Math.round((expected - paid) * 100) / 100,
      };
    })
    .filter((member) => member.shortBy > 0)
    .sort((a, b) => b.shortBy - a.shortBy);

  return {
    latestSchedule: { id: latest.id, name: latest.name, dueDate: latest.dueDate },
    members: behind,
  };
}
