'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { submitManualPayment } from '@/lib/manual-payment';
import CustomSelect from '@/components/CustomSelect';

type ManualPaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Optional callback when payment is successfully saved
  initialData?: {
    id?: string;
    amountPaid?: string;
    paymentDate?: string;
    customerName?: string;
    paymentMethod?: string;
    cardLast4?: string;
    notes?: string;
    // stripePaymentId removed from manual payment form - will be null for manual payments
  };
};

export default function ManualPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = {},
}: ManualPaymentModalProps) {
  // Ensure initialData is always an object, not null/undefined/array
  const safeInitialData = initialData && typeof initialData === 'object' && !Array.isArray(initialData) 
    ? initialData 
    : {};
  
  const [form, setForm] = useState(safeInitialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClassName =
    'w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    const newSafeData = initialData && typeof initialData === 'object' && !Array.isArray(initialData) 
      ? initialData 
      : {};
    setForm(newSafeData);
    setError(null); // Clear error when modal opens/closes
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear cardLast4 when payment method changes away from card
    if (name === 'paymentMethod' && value !== 'card') {
      setForm({ ...form, [name]: value, cardLast4: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    
    try {
      await submitManualPayment(form, form.id ? 'PUT' : 'POST');
      onSuccess?.(); // Call onSuccess callback if provided
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to submit manual payment. Please check your information and try again.');
      
      // Auto-clear error after 8 seconds
      setTimeout(() => {
        setError(null);
      }, 8000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/55" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Manual Payment Entry</p>
              <Dialog.Title className="text-2xl font-bold tracking-[-0.03em] text-ink">
                {form.id ? 'Edit Manual Payment' : 'Add Manual Payment'}
              </Dialog.Title>
              <p className="mt-2 text-sm text-muted">
                Record an offline payment with clear payment details and internal notes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-wash"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Amount Paid</label>
              <input
                name="amountPaid"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={form.amountPaid || ''}
                onChange={handleChange}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Payment Date</label>
              <input
                name="paymentDate"
                type="date"
                value={form.paymentDate || ''}
                onChange={handleChange}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Customer Name</label>
              <input
                name="customerName"
                placeholder="Enter customer name..."
                value={form.customerName || ''}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Payment Method</label>
              <CustomSelect
                value={form.paymentMethod || 'card'}
                onValueChange={(value) => {
                  // Clear cardLast4 when payment method changes away from card
                  if (value !== 'card') {
                    setForm(prev => ({ ...prev, paymentMethod: value, cardLast4: '' }));
                  } else {
                    setForm(prev => ({ ...prev, paymentMethod: value }));
                  }
                }}
                options={[
                  { value: 'card', label: 'Credit/Debit Card' },
                  { value: 'cash', label: 'Cash' },
                  { value: 'donation', label: 'Donation' },
                  { value: 'gift', label: 'Gift' },
                ]}
                placeholder="Select payment method..."
                className="border-line bg-white text-ink focus:border-ink focus:ring-ink/10"
                contentClassName="border-line bg-white"
                itemClassName="text-ink hover:bg-wash focus:bg-wash data-[highlighted]:bg-wash"
                iconClassName="text-muted"
              />
            </div>
            {form.paymentMethod === 'card' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink">Card Last 4 Digits</label>
                <input
                  name="cardLast4"
                  placeholder="1234"
                  value={form.cardLast4 || ''}
                  onChange={handleChange}
                  className={inputClassName}
                  maxLength={4}
                  pattern="[0-9]{4}"
                  title="Please enter the last 4 digits of the card"
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">Notes</label>
              <textarea
                name="notes"
                placeholder="Optional payment notes..."
                value={form.notes || ''}
                onChange={handleChange}
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-behind-line bg-behind-soft p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-behind-solid text-sm font-bold text-white">
                  !
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-behind">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-lg font-bold leading-none text-behind transition-colors duration-200 hover:text-ink"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t border-line pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-6 py-3 font-semibold text-ink transition-colors duration-200 hover:bg-wash"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl border border-ink bg-ink px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}