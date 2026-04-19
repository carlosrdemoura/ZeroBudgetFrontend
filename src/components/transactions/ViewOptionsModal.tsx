import { useState } from 'react';

export type QuickFilter = 'this-month' | 'latest-3' | 'this-year' | 'last-year' | 'all-dates' | 'custom';

export interface DateRange {
  fromDate: string;
  toDate: string;
  label: QuickFilter;
}

interface Props {
  current: DateRange;
  onApply: (range: DateRange) => void;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function firstDay(y: number, m: number) {
  return `${y}-${pad(m)}-01`;
}

function lastDay(y: number, m: number) {
  return `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`;
}

function dateToMY(d: string): { m: number; y: number } {
  const [y, m] = d.split('-').map(Number);
  return { m, y };
}

function quickFilterRange(filter: QuickFilter): { fromDate: string; toDate: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  switch (filter) {
    case 'this-month':
      return { fromDate: firstDay(y, m), toDate: lastDay(y, m) };
    case 'latest-3': {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return {
        fromDate: firstDay(from.getFullYear(), from.getMonth() + 1),
        toDate: lastDay(y, m),
      };
    }
    case 'this-year':
      return { fromDate: `${y}-01-01`, toDate: `${y}-12-31` };
    case 'last-year':
      return { fromDate: `${y - 1}-01-01`, toDate: `${y - 1}-12-31` };
    case 'all-dates':
      return { fromDate: '2000-01-01', toDate: '2099-12-31' };
    default:
      return { fromDate: firstDay(y, m), toDate: lastDay(y, m) };
  }
}

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'this-month', label: 'This Month' },
  { id: 'latest-3', label: 'Latest 3 Months' },
  { id: 'this-year', label: 'This Year' },
  { id: 'last-year', label: 'Last Year' },
  { id: 'all-dates', label: 'All Dates' },
];

export function ViewOptionsModal({ current, onApply, onClose }: Props) {
  const [activeFilter, setActiveFilter] = useState<QuickFilter>(current.label);
  const [fromDate, setFromDate] = useState(current.fromDate);
  const [toDate, setToDate] = useState(current.toDate);

  const handleQuickFilter = (filter: QuickFilter) => {
    setActiveFilter(filter);
    if (filter !== 'custom') {
      const r = quickFilterRange(filter);
      setFromDate(r.fromDate);
      setToDate(r.toDate);
    }
  };

  const updateFromMY = (m: number, y: number) => {
    setFromDate(firstDay(y, m));
    setActiveFilter('custom');
  };

  const updateToMY = (m: number, y: number) => {
    setToDate(lastDay(y, m));
    setActiveFilter('custom');
  };

  const handleApply = () => {
    onApply({ fromDate, toDate, label: activeFilter });
  };

  const fromMY = dateToMY(fromDate);
  const toMY = dateToMY(toDate);

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box w-full sm:max-w-lg">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={onClose} type="button">✕</button>
        <h3 className="font-bold text-lg mb-4">View Options</h3>

        {/* Quick filter chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {QUICK_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleQuickFilter(id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeFilter === id
                  ? 'bg-primary text-primary-content border-primary'
                  : 'border-base-300 text-base-content/70 hover:border-primary/50 hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="h-px bg-base-200 mb-4" />

        {/* From / To date selectors */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-10 shrink-0 text-base-content/70">From:</span>
            <select
              className="select select-bordered select-sm flex-1"
              value={fromMY.m}
              onChange={(e) => updateFromMY(Number(e.target.value), fromMY.y)}
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              className="input input-bordered input-sm w-20 shrink-0"
              value={fromMY.y}
              onChange={(e) => updateFromMY(fromMY.m, Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium w-10 shrink-0 text-base-content/70">To:</span>
            <select
              className="select select-bordered select-sm flex-1"
              value={toMY.m}
              onChange={(e) => updateToMY(Number(e.target.value), toMY.y)}
            >
              {MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <input
              type="number"
              className="input input-bordered input-sm w-20 shrink-0"
              value={toMY.y}
              onChange={(e) => updateToMY(toMY.m, Number(e.target.value))}
            />
          </div>
        </div>

        <div className="modal-action mt-5">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleApply}>Apply</button>
        </div>
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export { quickFilterRange };
