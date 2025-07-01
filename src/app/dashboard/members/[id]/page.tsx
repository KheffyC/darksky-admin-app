import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import { AddPaymentForm } from './AddPaymentForm';
import { TuitionEditor } from './TuitionEditor';

interface Props {
  params: { id: string };
}

export default async function MemberProfilePage({ params }: Props) {
  const member = await prisma.member.findUnique({
    where: { id: String(params.id) },
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">
        {member.firstName} {member.lastName}
      </h1>
      <p className="text-gray-600">Section: {member.section}</p>

      <TuitionEditor memberId={member.id} current={member.tuitionAmount} />

      <p>Total Paid: ${totalPaid}</p>
      <p>Remaining: ${remaining}</p>

      <hr className="my-4" />

      <h2 className="text-xl font-semibold mb-2">💳 Payments</h2>
      <table className="min-w-full bg-white border rounded-md overflow-hidden text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Stripe ID</th>
            <th className="p-2 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {member.payments.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
              <td className="p-2">${p.amountPaid}</td>
              <td className="p-2 text-xs">{p.stripePaymentId || '—'}</td>
              <td className="p-2 text-xs">{p.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <AddPaymentForm memberId={member.id} />

      <div className="mt-6">
        <Link
          href="/dashboard/reconcile"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ↩ Return to Reconcile
        </Link>
      </div>
    </div>
  );
}