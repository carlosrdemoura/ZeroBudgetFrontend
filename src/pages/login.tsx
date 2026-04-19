import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoginForm } from '@/components/auth/LoginForm';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.replace(`/budget/${currentMonth()}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0f1c2e' }}>
      <LoginForm />
    </div>
  );
}
