import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { ErrorAlert } from '@/components/ui/ErrorAlert';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push(`/budget/${currentMonth()}`);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { title?: string } } })?.response?.data?.title ??
        (err instanceof Error ? err.message : 'An error occurred.');
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Brand header */}
      <div className="text-center mb-8">
        <img
          src="/logo.svg"
          alt="ZeroBudget"
          width={52}
          height={52}
          className="inline-block mb-4"
          style={{ borderRadius: 14, boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.5)' }}
        />
        <h1 className="text-2xl font-bold tracking-tight text-white">ZeroBudget</h1>
      </div>

      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body gap-5">
          <h2 className="text-base font-semibold text-center text-base-content/70">
            Sign in to your account
          </h2>

          {error && <ErrorAlert error={error} />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="form-control">
              <div className="label pb-1.5">
                <span className="label-text font-medium text-sm">Email</span>
              </div>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="form-control">
              <div className="label pb-1.5">
                <span className="label-text font-medium text-sm">Password</span>
              </div>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={1}
              />
            </label>

            <button type="submit" className="btn btn-primary w-full mt-1" disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
