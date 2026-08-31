export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm" aria-hidden>
        F
      </div>
      {!compact && (
        <div className="leading-tight">
          <span className="block text-base font-bold tracking-tight">FinControl</span>
          <span className="block text-[11px] text-neutral-500 dark:text-neutral-400">Gestão financeira pessoal</span>
        </div>
      )}
    </div>
  );
}