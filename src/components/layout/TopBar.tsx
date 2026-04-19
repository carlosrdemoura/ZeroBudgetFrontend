import { useQuery } from '@tanstack/react-query';
import { budgetApi } from '@/lib/api/budget';
import { MonthNavigator } from './MonthNavigator';

interface Props {
  month: string;
  onMonthChange: (newMonth: string) => void;
  onLogout: () => void;
  drawerId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function ReadyToAssignPill({ available }: { available: number | null }) {
  if (available === null) return null;

  if (available > 0) {
    return (
      <div className="flex items-center px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-success text-success-content min-w-0">
        <div className="text-center min-w-0">
          <div className="text-xs sm:text-sm font-bold tabular-nums leading-tight truncate">
            {formatCurrency(available)}
          </div>
          <div className="text-[10px] sm:text-xs font-medium opacity-80 leading-tight">Ready to Assign</div>
        </div>
      </div>
    );
  }

  if (available === 0) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-base-300 text-base-content/60 min-w-0">
        <div className="text-center min-w-0">
          <div className="text-xs sm:text-sm font-bold tabular-nums leading-tight truncate">
            {formatCurrency(0)}
          </div>
          <div className="text-[10px] sm:text-xs font-medium leading-tight">All Money Assigned</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 shrink-0 hidden sm:block">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-error text-error-content min-w-0">
      <div className="text-center min-w-0">
        <div className="text-xs sm:text-sm font-bold tabular-nums leading-tight truncate">
          {formatCurrency(available)}
        </div>
        <div className="text-[10px] sm:text-xs font-medium opacity-80 leading-tight">Overdraft</div>
      </div>
    </div>
  );
}

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
  </svg>
);

export function TopBar({ month, onMonthChange, onLogout, drawerId }: Props) {
  const { data: summary } = useQuery({
    queryKey: ['summary', month],
    queryFn: () => budgetApi.getMonthSummary(month),
    staleTime: 30_000,
  });

  const available = summary?.availableToAssign ?? null;

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 px-2 sm:px-5 border-b border-base-200 bg-base-100"
      style={{ height: 56, zIndex: 30, flexShrink: 0 }}
    >
      {/* Left: hamburger (mobile) + month navigator */}
      <label
        htmlFor={drawerId}
        className="btn btn-ghost btn-sm btn-circle lg:hidden shrink-0"
        aria-label="Open menu"
      >
        <HamburgerIcon />
      </label>
      <div className="shrink-0">
        <MonthNavigator month={month} onChange={onMonthChange} />
      </div>

      {/* Center: Ready to Assign pill */}
      <div className="flex-1 flex justify-center min-w-0">
        <ReadyToAssignPill available={available} />
      </div>

      {/* Right: logout */}
      <button
        className="btn btn-ghost btn-sm text-base-content/60 font-medium shrink-0 px-2 sm:px-3"
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
}
