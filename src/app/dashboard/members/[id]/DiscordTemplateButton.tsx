'use client';

import React, { useState } from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';
import { formatDisplayDate } from '@/lib/format-date';

interface PaymentGroup {
  scheduleName: string;
  schedule: any;
  payments: any[];
}

interface DiscordTemplateButtonProps {
  memberData: {
    firstName: string;
    lastName: string;
    section: string;
    season: string;
    tuitionAmount: number;
  };
  paymentGroups: PaymentGroup[];
  totalPaid: number;
  remaining: number;
}

export function DiscordTemplateButton({
  memberData,
  paymentGroups,
  totalPaid,
  remaining,
}: DiscordTemplateButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const toast = useToastNotifications();

  const generateDiscordContent = () => {
    const firstName = memberData.firstName.split(' ')[0];
    const progressPercent = memberData.tuitionAmount > 0
      ? Math.round((totalPaid / memberData.tuitionAmount) * 100)
      : 0;
    const recentPayments = paymentGroups
      .flatMap((group) =>
        group.payments.map((payment) => ({
          amountPaid: payment.amountPaid,
          paymentDate: payment.paymentDate,
        }))
      )
      .sort((left, right) => new Date(right.paymentDate).getTime() - new Date(left.paymentDate).getTime())
      .slice(0, 2);

    const recentPaymentText = recentPayments.length > 0
      ? `Recent payments: ${recentPayments
          .map((payment) => `$${payment.amountPaid.toFixed(2)} on ${formatDisplayDate(payment.paymentDate, { year: 'numeric' })}`)
          .join('; ')}.`
      : 'No payments have been recorded yet.';

    if (remaining <= 0) {
      return [
        `Hi ${firstName},`,
        '',
        `Quick Dark Sky tuition update for ${memberData.season}: you're paid in full.`,
        `Tuition: $${memberData.tuitionAmount.toFixed(2)} | Paid: $${totalPaid.toFixed(2)} | Progress: ${progressPercent}%`,
        recentPaymentText,
        '',
        'Thank you for staying current.',
        '- Emily',
      ].join('\n');
    }

    return [
      `Hi ${firstName},`,
      '',
      `Quick Dark Sky tuition update for ${memberData.season}.`,
      `Tuition: $${memberData.tuitionAmount.toFixed(2)}`,
      `Paid so far: $${totalPaid.toFixed(2)} (${progressPercent}%)`,
      `Remaining balance: $${remaining.toFixed(2)}`,
      recentPaymentText,
      '',
      `Can you send the remaining $${remaining.toFixed(2)} when you can? If you need to work out timing, message me and we can sort it out.`,
      '',
      '- Emily',
    ].join('\n');
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(generateDiscordContent());
      toast.success('Discord DM Copied', 'Discord payment reminder template has been copied to your clipboard.');
    } catch {
      toast.error('Copy Failed', 'Unable to copy to clipboard. Please try again.');
    }
  };

  const discordContent = generateDiscordContent();

  return (
    <div className="rounded-2xl border border-[#d6dde5] bg-white p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-[#2C3E50]">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.369A19.791 19.791 0 0015.885 3c-.191.328-.403.769-.554 1.116a18.27 18.27 0 00-5.326 0A11.78 11.78 0 009.451 3a19.736 19.736 0 00-4.433 1.369C2.218 8.56 1.453 12.647 1.77 16.68a19.914 19.914 0 005.993 3.03c.48-.648.908-1.334 1.283-2.053a12.955 12.955 0 01-2.021-.976c.17-.123.336-.252.497-.385a14.098 14.098 0 0012.956 0c.163.133.329.262.497.385-.645.378-1.322.706-2.023.976.375.719.803 1.405 1.283 2.053a19.88 19.88 0 005.995-3.03c.372-4.674-.635-8.724-3.913-12.311zM9.349 14.954c-1.18 0-2.15-1.085-2.15-2.419 0-1.333.95-2.418 2.15-2.418 1.21 0 2.17 1.095 2.15 2.418 0 1.334-.95 2.419-2.15 2.419zm5.303 0c-1.18 0-2.15-1.085-2.15-2.419 0-1.333.95-2.418 2.15-2.418 1.21 0 2.17 1.095 2.15 2.418 0 1.334-.94 2.419-2.15 2.419z" />
            </svg>
            Discord DM Template
          </h3>
          <p className="text-sm text-[#788896]">
            Copy a short direct-message version focused on the current balance and recent payment activity
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setShowPreview((current) => !current)}
            className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 text-sm font-medium text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb]"
          >
            {showPreview ? 'Hide Preview' : 'Preview DM'}
          </button>
          <button
            onClick={handleCopyTemplate}
            className="rounded-lg border border-[#0D47A1] bg-[#0D47A1] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1565c0]"
          >
            Copy Discord DM
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="rounded-lg border border-[#d6dde5] bg-[#f7f9fb] p-4">
          <h4 className="mb-3 font-medium text-[#2C3E50]">Discord DM Preview:</h4>
          <div className="max-h-96 overflow-y-auto rounded border bg-white p-4 text-sm text-gray-900">
            <pre className="whitespace-pre-wrap font-sans">{discordContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}