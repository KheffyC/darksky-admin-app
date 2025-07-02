'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { submitManualPayment } from '@/lib/manual-payment';

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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-gray-600">
          <Dialog.Title className="text-2xl font-bold text-white mb-6">
            {form.id ? 'Edit Manual Payment' : 'Add Manual Payment'}
          </Dialog.Title>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Amount Paid</label>
              <input
                name="amountPaid"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={form.amountPaid || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Payment Date</label>
              <input
                name="paymentDate"
                type="date"
                value={form.paymentDate || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Customer Name</label>
              <input
                name="customerName"
                placeholder="Enter customer name..."
                value={form.customerName || ''}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Payment Method</label>
              <select
                name="paymentMethod"
                value={form.paymentMethod || 'card'}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                required
              >
                <option value="card">Credit/Debit Card</option>
                <option value="cash">Cash</option>
                <option value="donation">Donation</option>
                <option value="gift">Gift</option>
              </select>
            </div>
            {form.paymentMethod === 'card' && (
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">Card Last 4 Digits</label>
                <input
                  name="cardLast4"
                  placeholder="1234"
                  value={form.cardLast4 || ''}
                  onChange={handleChange}
                  className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  title="Please enter the last 4 digits of the card"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-200 mb-2">Notes</label>
              <textarea
                name="notes"
                placeholder="Optional payment notes..."
                value={form.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
              />
            </div>
          </div>

          {/* Error message display */}
          {error && (
            <div 
              className="mt-6 p-4 bg-red-900/60 border border-red-500/50 rounded-xl shadow-lg"
              style={{
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-red-100 font-bold">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-300 hover:text-red-200 transition-colors duration-200 font-bold"
                  >
                    <span className="sr-only">Dismiss</span>
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold shadow-lg border border-gray-400/30"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/30"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}