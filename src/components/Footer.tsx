import Link from 'next/link';

export function Footer() {
  return (
    <footer className="print:hidden border-t border-white/8 bg-black px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Dark Sky Finance Admin</p>
            <p className="text-sm text-slate-300">Operational dashboard for tuition revenue, collections, and member payment health.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:border-white/20 hover:text-white">
              Overview
            </Link>
            <Link href="/dashboard/payments" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:border-white/20 hover:text-white">
              Payments
            </Link>
            <Link href="/dashboard/ledger" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:border-white/20 hover:text-white">
              Ledger
            </Link>
            <Link href="/dashboard/settings" className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-200 transition hover:border-white/20 hover:text-white">
              Settings
            </Link>
          </div>
        </div>

        <div className="mt-5 border-t border-white/8 pt-4 text-xs text-slate-400">
          <p>(c) {new Date().getFullYear()} Dark Sky Percussion. Finance operations workspace.</p>
        </div>
      </div>
    </footer>
  );
}
