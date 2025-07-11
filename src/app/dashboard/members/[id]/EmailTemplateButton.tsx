'use client';
import React, { useState } from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface PaymentGroup {
  scheduleName: string;
  schedule: any;
  payments: any[];
}

interface EmailTemplateButtonProps {
  memberData: {
    firstName: string;
    lastName: string;
    email: string;
    section: string;
    season: string;
    tuitionAmount: number;
  };
  paymentGroups: PaymentGroup[];
  totalPaid: number;
  remaining: number;
}

export function EmailTemplateButton({
  memberData,
  paymentGroups,
  totalPaid,
  remaining,
}: EmailTemplateButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const toast = useToastNotifications();

  const generateEmailContent = () => {
    const memberName = `${memberData.firstName} ${memberData.lastName}`;
    const paymentStatus = remaining > 0 ? 'Outstanding Balance' : 'Paid in Full';
    const progressPercent = Math.round((totalPaid / memberData.tuitionAmount) * 100);

    // Generate payment history HTML
    const paymentHistoryHtml = paymentGroups.length > 0 
      ? paymentGroups.map(group => {
          const groupTotal = group.payments.reduce((sum, p) => sum + p.amountPaid, 0);
          const paymentsHtml = group.payments
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .map(payment => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">$${payment.amountPaid.toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.paymentMethod || 'Card'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.note || '--'}</td>
              </tr>
            `).join('');

          return `
            <h4 style="color: #333; margin: 20px 0 10px 0;">${group.scheduleName} (Total: $${groupTotal.toFixed(2)})</h4>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Method</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Notes</th>
                </tr>
              </thead>
              <tbody>
                ${paymentsHtml}
              </tbody>
            </table>
          `;
        }).join('')
      : '<p style="color: #666; font-style: italic;">No payments have been recorded yet.</p>';

    const nextStepsSection = remaining > 0 
      ? `
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">⚠️ Outstanding Balance: $${remaining.toFixed(2)}</h3>
          <p style="color: #856404; margin: 0;">Please submit your remaining payment at your earliest convenience. If you have any questions about payment options or need to set up a payment plan, please contact us.</p>
        </div>
      `
      : `
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #155724; margin: 0 0 10px 0;">✅ Payment Complete</h3>
          <p style="color: #155724; margin: 0;">Thank you! Your tuition has been paid in full. We appreciate your prompt payment.</p>
        </div>
      `;

    return `
Hi ${memberData.firstName},

I hope this email finds you well. Please find below a comprehensive summary of your payment status for the ${memberData.season} season.

=== PAYMENT SUMMARY ===

Member: ${memberName}
Section: ${memberData.section}
Season: ${memberData.season}

Total Tuition: $${memberData.tuitionAmount.toFixed(2)}
Amount Paid: $${totalPaid.toFixed(2)}
Outstanding Balance: $${remaining.toFixed(2)}
Payment Progress: ${progressPercent}%

${nextStepsSection.replace(/<[^>]*>/g, '')}

=== PAYMENT HISTORY ===

${paymentGroups.length > 0 
  ? paymentGroups.map(group => {
      const groupTotal = group.payments.reduce((sum, p) => sum + p.amountPaid, 0);
      return `
${group.scheduleName} (Total: $${groupTotal.toFixed(2)})
${group.payments
  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  .map(payment => `  • ${new Date(payment.paymentDate).toLocaleDateString()} - $${payment.amountPaid.toFixed(2)} (${payment.paymentMethod || 'Card'})${payment.note ? ` - ${payment.note}` : ''}`)
  .join('\n')}
      `.trim();
    }).join('\n\n')
  : 'No payments have been recorded yet.'
}

=== CONTACT INFORMATION ===

If you have any questions about your payment status or need assistance, please don't hesitate to reach out:

• Email: emily.figueroa@darkskypercussion.org
• Phone: 559-837-0807
• Office Hours: Anytime

Thank you for your continued participation in our program.

Best regards,
Emily Figueroa
Dark Sky Percussion
Director of Operations
    `.trim();
  };

  const handleSendEmail = () => {
    const emailContent = generateEmailContent();
    const subject = encodeURIComponent(`Payment Summary - ${memberData.firstName} ${memberData.lastName} - ${memberData.season}`);
    const body = encodeURIComponent(emailContent);
    const mailtoLink = `mailto:${memberData.email}?subject=${subject}&body=${body}`;
    
    window.open(mailtoLink);
    toast.success('Email Opened', 'Your default email client should now open with the payment summary.');
  };

  const handleCopyTemplate = async () => {
    try {
      const emailContent = generateEmailContent();
      await navigator.clipboard.writeText(emailContent);
      toast.success('Template Copied', 'Email template has been copied to your clipboard.');
    } catch (error) {
      toast.error('Copy Failed', 'Unable to copy to clipboard. Please try again.');
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const emailContent = generateEmailContent();

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 p-6 rounded-2xl shadow-xl border border-blue-700/50 mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div>
          <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Email Payment Summary
          </h3>
          <p className="text-blue-200 text-sm">
            Generate a professional payment summary email for this member
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={togglePreview}
            className="bg-blue-600/50 hover:bg-blue-600/70 text-blue-200 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm border border-blue-500/30"
          >
            {showPreview ? 'Hide Preview' : 'Preview Email'}
          </button>
          <button
            onClick={handleCopyTemplate}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm"
          >
            Copy Template
          </button>
          <button
            onClick={handleSendEmail}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg"
          >
            Open Email Client
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 mt-4">
          <h4 className="text-white font-medium mb-3">Email Preview:</h4>
          <div className="bg-white text-gray-900 p-4 rounded border text-sm max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans">{emailContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
