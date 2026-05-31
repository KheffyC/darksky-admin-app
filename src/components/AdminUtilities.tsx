'use client';
import React, { useState } from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

export function AdminUtilities() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToastNotifications();

  const handleResetMembers = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/admin/reset-members', {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          'Data Deleted Successfully', 
          `Deleted ${result.deletedMembers} members and ${result.deletedPayments} payments`
        );
        // Refresh the page to update any member lists
        window.location.reload();
      } else {
        throw new Error(result.error || 'Failed to delete data');
      }
    } catch (error) {
      console.error('Delete operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error('Delete Failed', `Failed to delete data: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  return (
    <div className="rounded-2xl border border-rose-400 bg-rose-100 p-6">

        <h4 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-rose-900">Reset Database</h4>
        <p className="mb-4 text-sm text-rose-900">
          This will permanently delete ALL members and their associated payments from the database. 
          This action cannot be undone!
        </p>
        
        {!showConfirm ? (
          <button
            onClick={handleResetMembers}
            disabled={isDeleting}
            className="rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
          >
            Delete All Members & Payments
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-rose-500 bg-white p-3">
              <p className="text-sm font-semibold text-rose-900">
                Are you absolutely sure? This will delete ALL member data and payments permanently!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetMembers}
                disabled={isDeleting}
                className="rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={cancelReset}
                disabled={isDeleting}
                className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
    </div>
  );
}

export default AdminUtilities;
