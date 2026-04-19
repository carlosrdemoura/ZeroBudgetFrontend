import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { accountsApi } from '@/lib/api/accounts';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { AddAccountModal } from './AddAccountModal';
import { EditAccountModal } from './EditAccountModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AccountResult } from '@/types';

export const DRAWER_ID = 'app-sidebar';

interface Props {
  month: string;
  onMonthChange?: (newMonth: string) => void;
  children: React.ReactNode;
}

export function AppLayout({ month, onMonthChange, children }: Props) {
  const router = useRouter();
  const { token, isLoading, logout } = useAuth();
  const qc = useQueryClient();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountResult | null>(null);

  const createAccountMutation = useMutation({
    mutationFn: ({ name, initialBalance }: { name: string; initialBalance: number }) =>
      accountsApi.createAccount(name, initialBalance),
    onSuccess: (account) => {
      setShowAddAccount(false);
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['summary', month] });
      qc.invalidateQueries({ queryKey: ['balances', month] });
      if (account?.id) router.push(`/accounts/${account.id}`);
    },
  });

  useEffect(() => {
    if (!isLoading && !token) router.replace('/login');
  }, [isLoading, token, router]);

  if (isLoading) return <LoadingSpinner />;
  if (!token) return null;

  const handleDeleted = () => {
    setEditingAccount(null);
    qc.invalidateQueries({ queryKey: ['accounts'] });
    qc.invalidateQueries({ queryKey: ['summary', month] });
    qc.invalidateQueries({ queryKey: ['balances', month] });
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    router.push(`/budget/${currentMonth}`);
  };

  return (
    <div className="drawer lg:drawer-open min-h-screen">
      <input id={DRAWER_ID} type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col min-h-screen bg-base-200">
        <TopBar
          month={month}
          onMonthChange={onMonthChange ?? ((m) => router.push(`/budget/${m}`))}
          onLogout={logout}
          drawerId={DRAWER_ID}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Sidebar drawer */}
      <div className="drawer-side z-40">
        <label htmlFor={DRAWER_ID} aria-label="close sidebar" className="drawer-overlay" />
        <Sidebar
          month={month}
          drawerId={DRAWER_ID}
          onAddAccount={() => setShowAddAccount(true)}
          onEditAccount={(account) => setEditingAccount(account)}
        />
      </div>

      {/* Modals — rendered outside sidebar */}
      {showAddAccount && (
        <AddAccountModal
          onAdd={async (name, initialBalance) => {
            await createAccountMutation.mutateAsync({ name, initialBalance });
          }}
          onClose={() => setShowAddAccount(false)}
        />
      )}

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          month={month}
          onClose={() => setEditingAccount(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
