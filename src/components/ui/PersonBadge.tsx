'use client';

import { useAuth } from '@/components/auth/PermissionGuard';
import type { Person } from '@/hooks/usePeople';

/** Initial in a circle: filled for you, outlined for anyone else. */
export function PersonBadge({ person, name }: { person?: Person; name?: string }) {
  const { user } = useAuth();
  const label = person?.firstName ?? name ?? '?';
  const isMe = person ? person.id === user?.id : false;

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
        isMe ? 'bg-ink text-white' : 'border-[1.5px] border-ink bg-white text-ink'
      }`}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  );
}
