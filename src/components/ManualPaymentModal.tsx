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
    'w-full rounded-xl border border-[#d6dde5] bg-white px-4 py-3 text-[#2C3E50] placeholder:text-[#788896] focus:border-[#f38d68] focus:outline-none focus:ring-2 focus:ring-[#f38d68]';

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
        <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-[#d6dde5] bg-white p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 border-b border-[#d6dde5] pb-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#788896]">Manual Payment Entry</p>
              <Dialog.Title className="text-2xl font-bold tracking-[-0.03em] text-[#2C3E50]">
                {form.id ? 'Edit Manual Payment' : 'Add Manual Payment'}
              </Dialog.Title>
              <p className="mt-2 text-sm text-[#788896]">
                Record an offline payment with clear payment details and internal notes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d6dde5] bg-white px-3 py-2 text-sm font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb]"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Amount Paid</label>
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Payment Date</label>
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Customer Name</label>
              <input
                name="customerName"
                placeholder="Enter customer name..."
                value={form.customerName || ''}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Payment Method</label>
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
                className="border-[#d6dde5] bg-white text-[#2C3E50] focus:border-[#f38d68] focus:ring-[#f38d68]"
                contentClassName="border-[#d6dde5] bg-white"
                itemClassName="text-[#2C3E50] hover:bg-[#f7f9fb] focus:bg-[#f7f9fb] data-[highlighted]:bg-[#f7f9fb]"
                iconClassName="text-[#788896]"
              />
            </div>
            {form.paymentMethod === 'card' && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Card Last 4 Digits</label>
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">Notes</label>
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
            <div className="mt-6 rounded-xl border border-rose-400 bg-rose-100 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
                  !
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-rose-900">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-lg font-bold leading-none text-rose-700 transition-colors duration-200 hover:text-rose-900"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4 border-t border-[#d6dde5] pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d6dde5] bg-white px-6 py-3 font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl border border-[#f38d68] bg-[#f38d68] px-6 py-3 font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f] disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}