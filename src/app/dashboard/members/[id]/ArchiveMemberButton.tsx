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
        className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 font-semibold text-amber-900 transition-colors duration-200 hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
      >
        Archive Member
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-400 bg-amber-100 p-3">
        <p className="text-sm font-semibold text-amber-900">
          Archive <span className="font-bold">{memberName}</span>?
        </p>
        <p className="mt-1 text-xs text-amber-900">
          This removes the member from active tracking, but keeps their existing payment history.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleArchive}
          disabled={isArchiving}
          className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 font-semibold text-amber-900 transition-colors duration-200 hover:bg-amber-200 disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
        >
          {isArchiving ? 'Archiving...' : 'Yes, Archive Member'}
        </button>
        <button
          onClick={cancelArchive}
          disabled={isArchiving}
          className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}