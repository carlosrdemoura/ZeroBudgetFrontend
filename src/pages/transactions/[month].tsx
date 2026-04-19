import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { TransactionList } from '@/components/transactions/TransactionList';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function TransactionsPage() {
  const router = useRouter();
  const month = router.query.month as string | undefined;
  const isValid = !!month && MONTH_RE.test(month);

  useEffect(() => {
    if (router.isReady && month && !isValid) {
      router.replace(`/transactions/${currentMonth()}`);
    }
  }, [router, month, isValid]);

  if (!month || !isValid) return null;

  return (
    <AppLayout month={month}>
      <TransactionList month={month} />
    </AppLayout>
  );
}
