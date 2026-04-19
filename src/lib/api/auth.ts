import { client } from './client';
import type { LoginResult } from '@/types';

export const authApi = {
  login: (email: string, password: string) =>
    client.post<LoginResult>('/api/auth/login', { email, password }).then((r) => r.data),
};
