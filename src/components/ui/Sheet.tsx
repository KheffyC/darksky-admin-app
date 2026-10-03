'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

export const inputClass =
  'min-h-[48px] w-full rounded-xl border border-line-strong bg-white px-4 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10';
export const labelClass = 'block space-y-1.5';
export const labelTextClass = 'text-xs font-semibold uppercase tracking-[0.15em] text-muted';
export const primaryButtonClass =
  'min-h-[52px] w-full rounded-full border border-ink bg-ink text-base font-semibold text-white transition hover:bg-ink-hover disabled:opacity-50';

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted hover:text-ink">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
