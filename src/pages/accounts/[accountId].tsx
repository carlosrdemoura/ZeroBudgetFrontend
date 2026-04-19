import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { AccountTransactionList } from '@/components/transactions/AccountTransactionList';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AccountPage() {
  const router = useRouter();
  const accountId = router.query.accountId as string;
  const monthParam = typeof router.query.month === 'string' ? router.query.month : undefined;
  const month = monthParam && MONTH_RE.test(monthParam) ? monthParam : currentMonth();

  if (!accountId) return null;

  const handleMonthChange = (newMonth: string) => {
    router.replace(
      { pathname: '/accounts/[accountId]', query: { accountId, month: newMonth } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <AppLayout month={month} onMonthChange={handleMonthChange}>
      <AccountTransactionList accountId={accountId} month={month} />
    </AppLayout>
  );
}
