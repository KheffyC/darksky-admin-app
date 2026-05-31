import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { members, payments, paymentSchedules } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
        {/* Report Header */}
        <div className="rounded-2xl border border-[#d6dde5] bg-white p-6 sm:p-8">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">Member Financial Report</p>
              <h1 className="mb-2 text-3xl font-bold tracking-[-0.03em] text-[#2C3E50] sm:text-4xl">
                {memberData.firstName} {memberData.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#d6dde5] bg-[#f7f9fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C3E50]">
                  Section {memberData.section || 'Unassigned'}
                </span>
                <span className="rounded-full border border-[#d6dde5] bg-[#f7f9fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C3E50]">
                  Season {memberData.season}
                </span>
                {age !== null && (
                  <span className="rounded-full border border-[#d6dde5] bg-[#f7f9fb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#2C3E50]">
                    Age {age}
                  </span>
                )}
                {!memberData.isActive && (
                  <span className="rounded-full border border-black bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Archived
                  </span>
                )}
                {age !== null && age >= 22 && (
                  <span className="rounded-full border border-amber-400 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                    Age Out
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/payments"
              className="inline-flex items-center gap-3 rounded-xl border border-[#d6dde5] bg-white px-6 py-3 text-sm font-semibold text-[#2C3E50] transition-all duration-200 hover:bg-[#f7f9fb] sm:text-base"
            >
              ← Back to Member Ledger
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            <div className="rounded-xl border border-[#d6dde5] bg-[#f7f9fb] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Tuition</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#0D47A1]">${memberData.tuitionAmount.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-800">Collected</p>
              <p className="mt-1 font-mono text-lg font-bold text-emerald-900">${totalPaid.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-rose-300 bg-rose-100 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-800">Outstanding</p>
              <p className="mt-1 font-mono text-lg font-bold text-rose-900">${remaining.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Completion</p>
              <p className="mt-1 text-lg font-bold text-[#2C3E50]">{Math.round(paymentProgress)}%</p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Payments</p>
              <p className="mt-1 text-lg font-bold text-[#2C3E50]">{paymentCount}</p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Avg Payment</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#2C3E50]">${averagePayment.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Largest</p>
              <p className="mt-1 font-mono text-lg font-bold text-[#2C3E50]">${largestPayment.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">On-time Rate</p>
              <p className="mt-1 text-lg font-bold text-[#2C3E50]">{onTimeRate}%</p>
              {lastPaymentDate && (
                <p className="mt-1 text-[11px] text-[#788896]">Last {new Date(lastPaymentDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-sm text-[#788896]">
              <span>Collection Progress</span>
              <span>{Math.round(paymentProgress)}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-[#e8edf3]">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${paymentProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-amber-300 bg-amber-100 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-900">Delinquency Risk</p>
              <p className="mt-1 text-lg font-bold text-amber-900">{riskStatus}</p>
              <p className="mt-1 text-sm text-amber-900">
                {latePayments} late payment{latePayments !== 1 ? 's' : ''} out of {paymentCount} total.
              </p>
            </div>
            <div className="rounded-xl border border-[#d6dde5] bg-[#f7f9fb] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#788896]">Collection Trend</p>
              <p className="mt-1 text-lg font-bold text-[#2C3E50]">{paceStatus}</p>
              <p className="mt-1 text-sm text-[#788896]">
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
          }}
        />

        {/* Tuition Editor */}
        <TuitionEditor memberId={memberData.id} current={memberData.tuitionAmount} />

        {/* Payment History */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-[#d6dde5] bg-white">
          <div className="border-b border-[#d6dde5] p-4 sm:p-6">
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#2C3E50] sm:text-2xl">Payment History</h2>
            {activePayments.length > 0 && (
              <p className="mt-1 text-sm text-[#788896]">{activePayments.length} payment{activePayments.length !== 1 ? 's' : ''} recorded</p>
            )}
          </div>
          
          {activePayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f9fb]">
                <div className="h-8 w-8 rounded-full bg-[#d6dde5]"></div>
              </div>
              <p className="text-lg font-medium text-[#2C3E50]">No payments recorded yet</p>
              <p className="text-sm text-[#788896]">Payments will appear here once added</p>
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
          <AddPaymentForm memberId={memberData.id} />
        ) : (
          <div className="mb-8 rounded-2xl border border-slate-300 bg-slate-100 p-6 sm:p-8">
            <h3 className="mb-2 text-xl font-bold tracking-[-0.03em] text-[#2C3E50]">Payments Locked</h3>
            <p className="text-sm text-[#788896]">
              This member is archived, so no new payments can be added. Their existing payment history remains available above.
            </p>
          </div>
        )}

        {/* Delete Member Section */}
        <div className="mt-8 rounded-2xl border border-rose-400 bg-rose-100 p-6">
          <p className="mb-4 text-sm text-rose-900">
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