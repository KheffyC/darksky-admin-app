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
        className="cursor-not-allowed rounded-lg border border-[#d6dde5] bg-[#eef3f8] px-4 py-2 font-semibold text-[#788896]"
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
        className="rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
      >
        Delete Member
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-rose-400 bg-rose-100 p-3">
        <p className="text-sm font-semibold text-rose-900">
          Are you sure you want to permanently delete <span className="font-bold">{memberName}</span>?
        </p>
        <p className="mt-1 text-xs text-rose-900">
          This action cannot be undone and will remove all member data.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-rose-500 bg-rose-500 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-rose-600 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete Member'}
        </button>
        <button
          onClick={cancelDelete}
          disabled={isDeleting}
          className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
