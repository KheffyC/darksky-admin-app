import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { members, payments, paymentSchedules, settings } from '@/db/schema';
import { eq, and, desc, ne, sql } from 'drizzle-orm';
import { getViewingSeason } from '@/lib/current-season';
import Link from 'next/link';
import { AddPaymentForm } from './AddPaymentForm';
import { TuitionEditor } from './TuitionEditor';
import { PaymentGroupCard } from './PaymentGroupCard';
import { MemberInfoEditor } from './MemberInfoEditor';
import { ArchiveMemberButton } from './ArchiveMemberButton';
import { DeleteMemberButton } from './DeleteMemberButton';
import { EmailTemplateButton } from './EmailTemplateButton';
import { DiscordTemplateButton } from './DiscordTemplateButton';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params;
  
  const member = await db
    .select()
    .from(members)
    .where(eq(members.id, String(id)))
    .limit(1);

  if (member.length === 0) return notFound();

  const memberData = member[0];

  // The same person's records in other seasons, matched by email
  const [{ activeSeason }, otherSeasons, [seasonSettings]] = await Promise.all([
    getViewingSeason(),
    db
      .select({ id: members.id, season: members.season })
      .from(members)
      .where(and(
        sql`lower(${members.email}) = lower(${memberData.email})`,
        ne(members.id, memberData.id)
      ))
      .orderBy(desc(members.season)),
    db.select({ vetDiscount: settings.vetDiscount }).from(settings).where(eq(settings.season, memberData.season)).limit(1),
  ]);
  const isPastSeason = memberData.season !== activeSeason;
  // Seasons compare as text, which orders year-style names ("2026" < "2027")
  const isReturning =
    memberData.previousSeasons > 0 || otherSeasons.some((other) => other.season < memberData.season);

  const activePayments = await db
    .select({
      payment: payments,
      schedule: paymentSchedules
    })
    .from(payments)
    .leftJoin(paymentSchedules, eq(payments.scheduleId, paymentSchedules.id))
    .where(and(eq(payments.memberId, String(id)), eq(payments.isActive, true)))
    .orderBy(desc(payments.paymentDate));

  const totalPaid = activePayments.reduce((sum, p) => sum + p.payment.amountPaid, 0);
  const remaining = memberData.tuitionAmount - totalPaid;
  const paymentCount = activePayments.length;
  const averagePayment = paymentCount > 0 ? totalPaid / paymentCount : 0;
  const largestPayment = paymentCount > 0
    ? Math.max(...activePayments.map((p) => p.payment.amountPaid))
    : 0;
  const paymentProgress = memberData.tuitionAmount > 0
    ? Math.min((totalPaid / memberData.tuitionAmount) * 100, 100)
    : 0;
  const latePayments = activePayments.filter(({ payment, schedule }) => {
    if (!schedule?.dueDate) return false;
    return new Date(payment.paymentDate) > new Date(schedule.dueDate);
  }).length;
  const onTimeRate = paymentCount > 0
    ? Math.round(((paymentCount - latePayments) / paymentCount) * 100)
    : 100;
  const lastPaymentDate = paymentCount > 0 ? activePayments[0].payment.paymentDate : null;
  const paceStatus = paymentProgress >= 75
    ? 'Ahead of pace'
    : paymentProgress >= 40
      ? 'On pace'
      : 'Behind pace';
  const riskStatus = remaining <= 0
    ? 'Cleared'
    : onTimeRate >= 90
      ? 'Low risk'
      : onTimeRate >= 70
        ? 'Moderate risk'
        : 'Elevated risk';

  // Group payments by schedule
  const groupedPayments = activePayments.reduce((groups, { payment, schedule }) => {
    const scheduleKey = schedule?.id || 'unassigned';
    const scheduleName = schedule?.name || 'Unassigned Payments';
    
    if (!groups[scheduleKey]) {
      groups[scheduleKey] = {
        scheduleName,
        schedule,
        payments: []
      };
    }
    
    groups[scheduleKey].payments.push(payment);
    return groups;
  }, {} as Record<string, { scheduleName: string; schedule: any; payments: any[] }>);

  const paymentGroups = Object.values(groupedPayments);

  // Calculate age if birthday exists
  const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(memberData.birthday);

  return (
    <div className="py-8 sm:py-12">
      <div className="space-y-8">
        {isPastSeason && (
          <div className="rounded-xl border border-flag-line bg-flag-soft px-4 py-3 text-sm text-flag">
            <strong>Past season record.</strong> This is {memberData.firstName}&apos;s {memberData.season} record; the active season is {activeSeason}.
          </div>
        )}

        {/* Report Header */}
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Member Financial Report</p>
              <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">
                {memberData.firstName} {memberData.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line bg-wash px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                  Section {memberData.section || 'Unassigned'}
                </span>
                <span className="rounded-full border border-line bg-wash px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                  Season {memberData.season}
                </span>
                {age !== null && (
                  <span className="rounded-full border border-line bg-wash px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                    Age {age}
                  </span>
                )}
                {isReturning && (
                  <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                    Returning
                  </span>
                )}
                {!memberData.isActive && (
                  <span className="rounded-full border border-black bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Archived
                  </span>
                )}
                {age !== null && age >= 22 && (
                  <span className="rounded-full border border-flag-line bg-flag-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-flag">
                    Age Out
                  </span>
                )}
              </div>
              {otherSeasons.length > 0 && (
                <p className="mt-3 text-sm text-muted">
                  Other seasons:{' '}
                  {otherSeasons.map((other, i) => (
                    <span key={other.id}>
                      {i > 0 && ', '}
                      <Link href={`/dashboard/members/${other.id}`} className="font-medium text-ink hover:underline">
                        {other.season}
                      </Link>
                    </span>
                  ))}
                </p>
              )}
            </div>
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center gap-3 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:bg-wash sm:text-base"
            >
              ← Back to Member Ledger
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <div className="rounded-xl border border-line bg-wash p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Tuition</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink">${memberData.tuitionAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Collected</p>
              <p className="mt-1 font-mono text-lg font-bold text-paid">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Outstanding</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink">${remaining.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Completion</p>
              <p className="mt-1 text-lg font-bold text-ink">{Math.round(paymentProgress)}%</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Payments</p>
              <p className="mt-1 text-lg font-bold text-ink">{paymentCount}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Avg Payment</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink">${averagePayment.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Largest</p>
              <p className="mt-1 font-mono text-lg font-bold text-ink">${largestPayment.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">On-time Rate</p>
              <p className="mt-1 text-lg font-bold text-ink">{onTimeRate}%</p>
              {lastPaymentDate && (
                <p className="mt-1 text-[11px] text-muted">Last {new Date(lastPaymentDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-muted">
              <span>Collection Progress</span>
              <span>{Math.round(paymentProgress)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-canvas">
              <div
                className="h-3 rounded-full bg-paid-solid transition-all duration-500"
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className={`rounded-xl border p-4 ${latePayments > 0 ? 'border-flag-line bg-flag-soft' : 'border-line bg-wash'}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${latePayments > 0 ? 'text-flag' : 'text-muted'}`}>Delinquency Risk</p>
              <p className={`mt-1 text-lg font-bold ${latePayments > 0 ? 'text-flag' : 'text-ink'}`}>{riskStatus}</p>
              <p className="mt-1 text-sm text-muted">
                {latePayments} late payment{latePayments !== 1 ? 's' : ''} out of {paymentCount} total.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-wash p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Collection Trend</p>
              <p className="mt-1 text-lg font-bold text-ink">{paceStatus}</p>
              <p className="mt-1 text-sm text-muted">
                {paymentCount > 0
                  ? `${paymentCount} payments averaging $${averagePayment.toFixed(2)} each.`
                  : 'No payments yet. Add the first payment to establish trend data.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <EmailTemplateButton
            memberData={{
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              email: memberData.email,
              section: memberData.section || 'N/A',
              season: memberData.season,
              tuitionAmount: memberData.tuitionAmount,
            }}
            paymentGroups={paymentGroups}
            totalPaid={totalPaid}
            remaining={remaining}
          />

          <DiscordTemplateButton
            memberData={{
              firstName: memberData.firstName,
              lastName: memberData.lastName,
              section: memberData.section || 'N/A',
              season: memberData.season,
              tuitionAmount: memberData.tuitionAmount,
            }}
            paymentGroups={paymentGroups}
            totalPaid={totalPaid}
            remaining={remaining}
          />
        </div>

        {/* Member Information Editor */}
        <MemberInfoEditor
          memberId={memberData.id}
          currentInfo={{
            firstName: memberData.firstName,
            lastName: memberData.lastName,
            legalName: memberData.legalName,
            section: memberData.section,
            birthday: memberData.birthday,
            instrument: memberData.instrument,
            email: memberData.email,
            phone: memberData.phone,
            address: memberData.address,
            mailingAddress: memberData.mailingAddress,
            school: memberData.school,
            parentEmail: memberData.parentEmail,
            parentPhone: memberData.parentPhone,
            previousSeasons: memberData.previousSeasons,
          }}
          vetDiscount={seasonSettings?.vetDiscount ?? 0}
        />

        {/* Tuition Editor */}
        <TuitionEditor memberId={memberData.id} current={memberData.tuitionAmount} />

        {/* Payment History */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="border-b border-line p-4 sm:p-6">
            <h2 className="text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">Payment History</h2>
            {activePayments.length > 0 && (
              <p className="mt-1 text-sm text-muted">{activePayments.length} payment{activePayments.length !== 1 ? 's' : ''} recorded</p>
            )}
          </div>
          
          {activePayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wash">
                <div className="h-8 w-8 rounded-full bg-line"></div>
              </div>
              <p className="text-lg font-medium text-ink">No payments recorded yet</p>
              <p className="text-sm text-muted">Payments will appear here once added</p>
            </div>
          ) : (
            <div className="space-y-6 p-4 sm:p-6">
              {paymentGroups.map((group) => (
                <PaymentGroupCard
                  key={group.schedule?.id || 'unassigned'}
                  group={group}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Payment Form */}
        {memberData.isActive ? (
          <AddPaymentForm memberId={memberData.id} season={memberData.season} />
        ) : (
          <div className="mb-8 rounded-2xl border border-neutral-300 bg-neutral-100 p-6 sm:p-8">
            <h3 className="mb-2 text-xl font-bold tracking-[-0.03em] text-ink">Payments Locked</h3>
            <p className="text-sm text-muted">
              This member is archived, so no new payments can be added. Their existing payment history remains available above.
            </p>
          </div>
        )}

        {/* Delete Member Section */}
        <div className="mt-8 rounded-2xl border border-line bg-white p-6">
          <p className="mb-4 text-sm text-muted">
            {memberData.isActive
              ? "Archive this member to remove them from active tracking. Permanent delete is only available when there are no payments on record."
              : "This member is archived. Existing payments are preserved, and no new payments can be added."
            }
          </p>
          <div className="flex flex-col gap-3">
            {memberData.isActive && (
              <ArchiveMemberButton
                memberId={memberData.id}
                memberName={`${memberData.firstName} ${memberData.lastName}`}
              />
            )}
            <DeleteMemberButton 
              memberId={memberData.id}
              memberName={`${memberData.firstName} ${memberData.lastName}`}
              hasPayments={activePayments.length > 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}