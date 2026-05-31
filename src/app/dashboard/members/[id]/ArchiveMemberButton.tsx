'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface ArchiveMemberButtonProps {
  memberId: string;
  memberName: string;
}

export function ArchiveMemberButton({ memberId, memberName }: ArchiveMemberButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const router = useRouter();
  const toast = useToastNotifications();

  const handleArchive = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsArchiving(true);

    try {
      const response = await fetch(`/api/members/${memberId}/archive`, {
        method: 'PATCH',
      });

      if (response.ok) {
        toast.success(
          'Member Archived',
          `${memberName} has been removed from the active roster. Existing payments were kept.`
        );
        router.push('/dashboard/payments');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to archive member');
      }
    } catch (error) {
      console.error('Archive member failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Archive Failed', `Failed to archive member: ${errorMessage}`);
    } finally {
      setIsArchiving(false);
      setShowConfirm(false);
    }
  };

  const cancelArchive = () => {
    setShowConfirm(false);
  };

  if (!showConfirm) {
    return (
      <button
        onClick={handleArchive}
        disabled={isArchiving}
        className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
      >
        Archive Member
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-amber-800/50 border border-amber-700 rounded-lg p-3">
        <p className="text-amber-200 font-semibold text-sm">
          Archive <span className="font-bold">{memberName}</span>?
        </p>
        <p className="text-amber-300 text-xs mt-1">
          This removes the member from active tracking, but keeps their existing payment history.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleArchive}
          disabled={isArchiving}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
        >
          {isArchiving ? 'Archiving...' : 'Yes, Archive Member'}
        </button>
        <button
          onClick={cancelArchive}
          disabled={isArchiving}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}