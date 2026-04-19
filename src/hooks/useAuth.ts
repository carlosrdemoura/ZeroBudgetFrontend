import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  token: string | null;
  email: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const qc = useQueryClient();
  const [state, setState] = useState<AuthState>({
    token: null,
    email: null,
    isLoading: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    setState({ token, email, isLoading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', result.token);
      localStorage.setItem('email', result.email);
    }
    qc.clear();
    setState({ token: result.token, email: result.email, isLoading: false });
    return result;
  }, [qc]);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
    }
    qc.clear();
    setState({ token: null, email: null, isLoading: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, [qc]);

  return { ...state, login, logout };
}
