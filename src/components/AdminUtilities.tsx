'use client';
import React, { useEffect, useState } from 'react';
import { useToastNotifications } from '@/hooks/useToastNotifications';

export function AdminUtilities() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [season, setSeason] = useState<string | null>(null);
  const toast = useToastNotifications();

  useEffect(() => {
    fetch('/api/view-season')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSeason(data?.viewing || null))
      .catch(() => setSeason(null));
  }, []);

  const handleResetMembers = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/reset-members?season=${encodeURIComponent(season ?? '')}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          'Data Deleted Successfully', 
          `Deleted ${result.deletedMembers} ${result.season} members and ${result.deletedPayments} payments`
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
    <div className="rounded-2xl border border-line bg-white p-6">

        <h4 className="mb-2 text-lg font-semibold tracking-[-0.03em] text-ink">Reset Season</h4>
        <p className="mb-4 text-sm text-muted">
          This will permanently delete all <strong>{season ?? '…'}</strong> members and their payments.
          Other seasons are not affected. This action cannot be undone!
        </p>
        
        {!showConfirm ? (
          <button
            onClick={handleResetMembers}
            disabled={isDeleting || !season}
            className="rounded-lg border border-behind-solid bg-white px-4 py-2 font-semibold text-behind transition-colors duration-200 hover:bg-behind-solid hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
          >
            Delete {season ?? ''} Members & Payments
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-behind-line bg-white p-3">
              <p className="text-sm font-semibold text-behind">
                Are you absolutely sure? This will permanently delete every {season} member and their payments!
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleResetMembers}
                disabled={isDeleting}
                className="rounded-lg border border-behind-solid bg-white px-4 py-2 font-semibold text-behind transition-colors duration-200 hover:bg-behind-solid hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
              >
                {isDeleting ? 'Deleting...' : `Yes, Delete ${season}`}
              </button>
              <button
                onClick={cancelReset}
                disabled={isDeleting}
                className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-black transition-colors duration-200 hover:bg-wash disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
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
