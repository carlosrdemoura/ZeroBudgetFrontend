
import { useCallback, useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';

interface AuthState {
  token: string | null;
  email: string | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    token: null,
    email: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    setState({ token, email, isLoading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    localStorage.setItem('token', result.token);
    localStorage.setItem('email', result.email);
    setState({ token: result.token, email: result.email, isLoading: false });
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setState({ token: null, email: null, isLoading: false });
    window.location.href = '/login';
  }, []);

  return { ...state, login, logout };
}
