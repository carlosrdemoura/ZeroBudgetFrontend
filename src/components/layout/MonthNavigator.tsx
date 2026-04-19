interface Props {
  month: string; // "YYYY-MM"
  onChange: (newMonth: string) => void;
}

function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDisplay(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function MonthNavigator({ month, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-circle"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Previous month"
      >
        ‹
      </button>
      <span className="font-semibold text-sm whitespace-nowrap" style={{ minWidth: 0, textAlign: 'center' }}>
        <span className="hidden sm:inline">{formatDisplay(month)}</span>
        <span className="sm:hidden">{formatDisplay(month).replace(/\s\d{4}$/, '')}</span>
      </span>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-circle"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Next month"
      >
        ›
      </button>
    </div>
  );
}
