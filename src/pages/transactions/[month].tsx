import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { TransactionList } from '@/components/transactions/TransactionList';

export default function TransactionsPage() {
  const { query } = useRouter();
  const month = query.month as string;

  if (!month) return null;

  return (
    <AppLayout month={month}>
      <TransactionList month={month} />
    </AppLayout>
  );
}
