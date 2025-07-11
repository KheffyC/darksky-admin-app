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
    <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 p-6 rounded-2xl shadow-xl border border-red-700/50">

        <h4 className="text-red-300 font-semibold mb-2">Reset Database</h4>
        <p className="text-red-200 text-sm mb-4">
          This will permanently delete ALL members and their associated payments from the database. 
          This action cannot be undone!
        </p>
        
        {!showConfirm ? (
          <button
            onClick={handleResetMembers}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
          >
            Delete All Members & Payments
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-800/50 border border-red-700 rounded-lg p-3">
              <p className="text-red-200 font-semibold text-sm">
                Are you absolutely sure? This will delete ALL member data and payments permanently!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetMembers}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={cancelReset}
                disabled={isDeleting}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
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
