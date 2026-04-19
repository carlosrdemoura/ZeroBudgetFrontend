import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { useIsLg } from '@/hooks/useMediaQuery';
import type { AccountResult } from '@/types';

interface Props {
  month: string;
  drawerId: string;
  onAddAccount: () => void;
  onEditAccount: (account: AccountResult) => void;
}

const BudgetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <path d="M2 10h20"/>
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

function formatBalance(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function Sidebar({ month, drawerId, onAddAccount, onEditAccount }: Props) {
  const { asPath } = useRouter();
  const isLg = useIsLg();
  const [collapsedPref, setCollapsedPref] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('sidebar-collapsed') === 'true',
  );
  const collapsed = isLg && collapsedPref;

  const { data: accounts = [] } = useQuery<AccountResult[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAccounts,
    staleTime: 30_000,
  });

  const toggleCollapsed = () => {
    const next = !collapsedPref;
    setCollapsedPref(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const closeDrawer = () => {
    const el = document.getElementById(drawerId) as HTMLInputElement | null;
    if (el) el.checked = false;
  };

  const navItemBase = `flex items-center rounded-lg text-sm font-medium transition-all duration-150 hover:!text-white hover:!bg-white/8`;

  return (
    <div
      className="sidebar-shell flex flex-col min-h-screen overflow-hidden w-72 lg:w-auto"
      style={isLg ? { width: collapsed ? 60 : 220, transition: 'width 0.2s ease-in-out', flexShrink: 0 } : { flexShrink: 0 }}
    >
      {/* Logo */}
      <div
        className="flex items-center border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', minHeight: 56, padding: collapsed ? '0 14px' : '0 16px', gap: 10 }}
      >
        <img src="/logo.svg" alt="ZeroBudget" width={32} height={32} style={{ flexShrink: 0, borderRadius: 8 }} />
        {!collapsed && (
          <span className="text-white font-bold text-sm tracking-tight whitespace-nowrap" style={{ overflow: 'hidden' }}>
            ZeroBudget
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
        {/* Plan */}
        {(() => {
          const href = `/budget/${month}`;
          const isActive = asPath === href;
          return (
            <Link
              href={href}
              onClick={closeDrawer}
              title={collapsed ? 'Plan' : undefined}
              style={isActive
                ? { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,1)' }
                : { color: 'rgba(255,255,255,0.55)' }}
              className={`${navItemBase} ${collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'}`}
            >
              <BudgetIcon />
              {!collapsed && 'Plan'}
            </Link>
          );
        })()}

        {/* Accounts section */}
        <div className="mt-1">
          {collapsed ? (
            <div className="mt-2 mb-1 border-t mx-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
          ) : (
            <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Accounts
            </div>
          )}

          {accounts.map((account) => {
            const href = `/accounts/${account.id}`;
            const isActive = asPath.startsWith('/accounts/') && asPath.includes(account.id);
            const activeStyle = isActive
              ? { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,1)' }
              : { color: 'rgba(255,255,255,0.55)' };

            if (collapsed) {
              return (
                <button
                  key={account.id}
                  onClick={() => onEditAccount(account)}
                  title={account.name}
                  style={activeStyle}
                  className={`${navItemBase} w-full justify-center py-2.5 opacity-70 hover:opacity-100`}
                >
                  <PencilIcon />
                </button>
              );
            }

            return (
              <div
                key={account.id}
                style={activeStyle}
                className={`${navItemBase} overflow-hidden`}
              >
                {/* Pencil — opens edit modal */}
                <button
                  onClick={() => onEditAccount(account)}
                  title="Edit account"
                  className="flex items-center justify-center shrink-0 py-2.5 pl-3 pr-2 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <PencilIcon />
                </button>

                {/* Account name + balance — navigates to account */}
                <Link
                  href={href}
                  onClick={closeDrawer}
                  className="flex-1 flex items-center gap-2 min-w-0 py-2.5 pr-3 text-sm font-medium"
                >
                  <span className="flex-1 truncate">{account.name}</span>
                  <span
                    className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums"
                    style={
                      account.balance < 0
                        ? { backgroundColor: 'rgba(239, 68, 68, 0.18)', color: 'rgb(252, 165, 165)' }
                        : { backgroundColor: 'rgba(34, 197, 94, 0.18)', color: 'rgb(134, 239, 172)' }
                    }
                  >
                    {formatBalance(account.balance)}
                  </span>
                </Link>
              </div>
            );
          })}

          {/* Add Account — always visible */}
          <button
            onClick={onAddAccount}
            title={collapsed ? 'Add Account' : undefined}
            className={`${navItemBase} w-full mt-0.5 ${collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'}`}
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M5 12h14M12 5v14"/>
            </svg>
            {!collapsed && <span>Add Account</span>}
          </button>
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-3 hidden lg:block">
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center w-full rounded-lg py-2 text-xs font-medium transition-colors duration-150 hover:!bg-white/8 ${collapsed ? 'justify-center' : 'gap-2 px-3'}`}
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {collapsed ? <ChevronRight /> : <><ChevronLeft /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );
}
