'use client';

import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import CustomSelect from '@/components/CustomSelect';

type AddMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddMemberModal({
  isOpen,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    section: '',
    season: '2024-2025',
    tuitionAmount: '3000',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create member');
      }

      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        section: '',
        season: '2024-2025',
        tuitionAmount: '1000',
      });

      // Close modal and trigger refresh
      onClose();
      if (onSuccess) onSuccess();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create member');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      section: '',
      season: '2024-2025',
      tuitionAmount: '1000',
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-2xl shadow-2xl border border-gray-600">
          <Dialog.Title className="text-2xl font-bold text-white mb-6">
            Add New Member
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter first name..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter last name..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="Enter email address..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Section
                </label>
                <CustomSelect
                  value={form.section}
                  onValueChange={(value) => setForm(prev => ({ ...prev, section: value }))}
                  options={[
                    { value: 'Soprano', label: 'Soprano' },
                    { value: 'Alto', label: 'Alto' },
                    { value: 'Tenor', label: 'Tenor' },
                    { value: 'Bass', label: 'Bass' },
                  ]}
                  placeholder="Select section..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Season *
                </label>
                <CustomSelect
                  value={form.season}
                  onValueChange={(value) => setForm(prev => ({ ...prev, season: value }))}
                  options={[
                    { value: '2024-2025', label: '2024-2025' },
                    { value: '2025-2026', label: '2025-2026' },
                    { value: '2023-2024', label: '2023-2024' },
                  ]}
                  placeholder="Select season..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-200 mb-2">
                  Tuition Amount
                </label>
                <input
                  type="number"
                  name="tuitionAmount"
                  value={form.tuitionAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 px-4 py-3 rounded-xl text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  placeholder="1000.00"
                />
              </div>
            </div>

            {/* Error message display */}
            {error && (
              <div className="p-4 bg-red-900/60 border border-red-500/50 rounded-xl shadow-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-red-100 font-bold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-bold shadow-lg border border-gray-400/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/30"
              >
                {loading ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
