import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { AddPaymentForm } from './AddPaymentForm';
import { TuitionEditor } from './TuitionEditor';

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
    .select()
    .from(payments)
    .where(and(eq(payments.memberId, String(id)), eq(payments.isActive, true)))
    .orderBy(payments.paymentDate);

  const totalPaid = activePayments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remaining = memberData.tuitionAmount - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {memberData.firstName} {memberData.lastName}
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 font-medium">Section: {memberData.section}</p>
            </div>
            <Link
              href="/dashboard/members"
              className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl border border-gray-400/30 text-sm sm:text-base"
            >
              ← Back to Members
            </Link>
          </div>
        </div>

        {/* Financial Overview - Single Clean Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-600 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Financial Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-700/50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Total Tuition</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">${memberData.tuitionAmount.toFixed(2)}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-700/50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Amount Paid</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-700/50 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Balance Due</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">${remaining.toFixed(2)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Payment Progress</span>
              <span>{Math.round((totalPaid / memberData.tuitionAmount) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totalPaid / memberData.tuitionAmount) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tuition Editor */}
        <TuitionEditor memberId={memberData.id} current={memberData.tuitionAmount} />

        {/* Payment History */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-600 overflow-hidden mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Payment History</h2>
            {activePayments.length > 0 && (
              <p className="text-gray-300 text-sm mt-1">{activePayments.length} payment{activePayments.length !== 1 ? 's' : ''} recorded</p>
            )}
          </div>
          
          {activePayments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
              </div>
              <p className="text-gray-300 text-lg font-medium">No payments recorded yet</p>
              <p className="text-gray-400 text-sm">Payments will appear here once added</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
                      <th className="p-4 text-left text-gray-200 font-bold">Date</th>
                      <th className="p-4 text-right text-gray-200 font-bold">Amount</th>
                      <th className="p-4 text-left text-gray-200 font-bold">Payment ID</th>
                      <th className="p-4 text-left text-gray-200 font-bold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePayments.map((p) => (
                      <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="p-4 text-gray-300 font-medium">{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td className="p-4 text-right text-green-400 font-bold">${p.amountPaid.toFixed(2)}</td>
                        <td className="p-4 text-gray-400 font-mono text-xs">{p.stripePaymentId || '—'}</td>
                        <td className="p-4 text-gray-300">{p.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {activePayments.map((p) => (
                  <div key={p.id} className="border-b border-gray-700 last:border-b-0 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="text-gray-300 font-medium">
                          {new Date(p.paymentDate).toLocaleDateString()}
                        </div>
                        {p.stripePaymentId && (
                          <div className="text-gray-400 font-mono text-xs mt-1">
                            ID: {p.stripePaymentId}
                          </div>
                        )}
                      </div>
                      <div className="text-green-400 font-bold text-lg">
                        ${p.amountPaid.toFixed(2)}
                      </div>
                    </div>
                    
                    {p.note && (
                      <div className="text-gray-300 text-sm bg-gray-700/30 p-3 rounded-lg">
                        <span className="text-gray-400">Note: </span>
                        {p.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Add Payment Form */}
        <AddPaymentForm memberId={memberData.id} />
      </div>
    </div>
  );
}