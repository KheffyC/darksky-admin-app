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
        router.push('/dashboard/members');
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
        className="bg-gray-600 text-gray-400 px-4 py-2 rounded-lg font-semibold cursor-not-allowed opacity-50"
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
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
      >
        Delete Member
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-800/50 border border-red-700 rounded-lg p-3">
        <p className="text-red-200 font-semibold text-sm">
          Are you sure you want to permanently delete <span className="font-bold">{memberName}</span>?
        </p>
        <p className="text-red-300 text-xs mt-1">
          This action cannot be undone and will remove all member data.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete Member'}
        </button>
        <button
          onClick={cancelDelete}
          disabled={isDeleting}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
