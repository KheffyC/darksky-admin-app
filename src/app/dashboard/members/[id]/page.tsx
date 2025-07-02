import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import { AddPaymentForm } from './AddPaymentForm';
import { TuitionEditor } from './TuitionEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: Props) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id: String(id) },
    include: {
      payments: {
        where: { isActive: true },
        orderBy: { paymentDate: 'asc' },
      },
    },
  });

  if (!member) return notFound();

  const totalPaid = member.payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const remaining = member.tuitionAmount - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-xl text-gray-300 font-medium">Section: {member.section}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-600">
            <h3 className="text-lg font-bold text-gray-200 mb-3">Total Paid</h3>
            <p className="text-3xl font-bold text-green-400">${totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-600">
            <h3 className="text-lg font-bold text-gray-200 mb-3">Remaining Balance</h3>
            <p className="text-3xl font-bold text-red-400">${remaining.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-600">
            <h3 className="text-lg font-bold text-gray-200 mb-3">Tuition Amount</h3>
            <p className="text-3xl font-bold text-blue-400">${member.tuitionAmount.toFixed(2)}</p>
          </div>
        </div>

        <TuitionEditor memberId={member.id} current={member.tuitionAmount} />

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl border border-gray-600 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600">
                  <th className="p-4 text-left text-gray-200 font-bold">Date</th>
                  <th className="p-4 text-left text-gray-200 font-bold">Amount</th>
                  <th className="p-4 text-left text-gray-200 font-bold">Payment ID</th>
                  <th className="p-4 text-left text-gray-200 font-bold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {member.payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="p-4 text-gray-300 font-medium">{new Date(p.paymentDate).toLocaleDateString()}</td>
                    <td className="p-4 text-green-400 font-bold">${p.amountPaid.toFixed(2)}</td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{p.stripePaymentId || '—'}</td>
                    <td className="p-4 text-gray-300">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AddPaymentForm memberId={member.id} />

        <div className="mt-8">
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold shadow-lg hover:shadow-xl border border-gray-400/30"
          >
            ← Back to Members
          </Link>
        </div>
      </div>
    </div>
  );
}