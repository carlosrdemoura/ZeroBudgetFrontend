import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { BudgetTable } from '@/components/budget/BudgetTable';

export default function BudgetPage() {
  const { query } = useRouter();
  const month = query.month as string;

  if (!month) return null;

  return (
    <AppLayout month={month}>
      <BudgetTable month={month} />
    </AppLayout>
  );
}
