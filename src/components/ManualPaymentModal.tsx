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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {form.id ? 'Edit Manual Payment' : 'New Manual Payment'}
          </Dialog.Title>

          <div className="space-y-3">
            <input
              name="amountPaid"
              placeholder="Amount Paid"
              type="number"
              value={form.amountPaid || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              name="paymentDate"
              type="date"
              value={form.paymentDate || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              name="customerName"
              placeholder="Customer Name"
              value={form.customerName || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <select
              name="paymentMethod"
              value={form.paymentMethod || 'card'}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="donation">Donation</option>
              <option value="gift">Gift</option>
            </select>
            {form.paymentMethod === 'card' && (
              <input
                name="cardLast4"
                placeholder="Card Last 4"
                value={form.cardLast4 || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                maxLength={4}
                pattern="[0-9]{4}"
                title="Please enter the last 4 digits of the card"
              />
            )}
            <textarea
              name="notes"
              placeholder="Notes"
              value={form.notes || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Error message display */}
          {error && (
            <div 
              className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-md"
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
                  <span className="text-red-500 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors duration-200"
                  >
                    <span className="sr-only">Dismiss</span>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}