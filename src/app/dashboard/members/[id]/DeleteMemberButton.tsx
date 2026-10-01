'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface DeleteMemberButtonProps {
  memberId: string;
  memberName: string;
  hasPayments: boolean;
}

export function DeleteMemberButton({ memberId, memberName, hasPayments }: DeleteMemberButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const toast = useToastNotifications();

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(
          'Member Deleted',
          `${memberName} has been permanently deleted.`
        );
        // Navigate back to members list after successful deletion
        router.push('/dashboard/payments');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Delete member failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Delete Failed', `Failed to delete member: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
  };

  if (hasPayments) {
    return (
      <button
        disabled
        className="cursor-not-allowed rounded-lg border border-line bg-canvas px-4 py-2 font-semibold text-muted"
        title="Cannot delete member with existing payments"
      >
        Delete Member (Disabled - Has Payments)
      </button>
    );
  }

  if (!showConfirm) {
    return (
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-lg border border-behind-solid bg-white px-4 py-2 font-semibold text-behind transition-colors duration-200 hover:bg-behind-solid hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
      >
        Delete Member
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-behind-line bg-behind-soft p-3">
        <p className="text-sm font-semibold text-behind">
          Are you sure you want to permanently delete <span className="font-bold">{memberName}</span>?
        </p>
        <p className="mt-1 text-xs text-behind">
          This action cannot be undone and will remove all member data.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-behind-solid bg-white px-4 py-2 font-semibold text-behind transition-colors duration-200 hover:bg-behind-solid hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete Member'}
        </button>
        <button
          onClick={cancelDelete}
          disabled={isDeleting}
          className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-ink transition-colors duration-200 hover:bg-wash disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
