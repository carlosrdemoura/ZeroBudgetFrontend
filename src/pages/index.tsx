import { useEffect } from 'react';
import { useRouter } from 'next/router';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    router.replace(token ? `/budget/${currentMonth()}` : '/login');
  }, [router]);

  return null;
}
