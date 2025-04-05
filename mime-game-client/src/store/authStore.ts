import { create } from 'zustand';
import { User, AuthResponse } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  login: (response: AuthResponse) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  login: (response) => {
    document.cookie = `mime-museum-token=${response.access_token}; path=/; max-age=86400; SameSite=Strict`;
    set({ user: response.user, isAuthenticated: true });
  },
  logout: () => {
    document.cookie = 'mime-museum-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    set({ user: null, isAuthenticated: false, error: null });
  },
  initialize: async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('mime-museum-token='))
        ?.split('=')[1];

      if (!token) {
        set({ isLoading: false });
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const user = await response.json();
          set({ user, isAuthenticated: true });
        } else {
          // 토큰이 유효하지 않은 경우 쿠키 삭제
          document.cookie = 'mime-museum-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        document.cookie = 'mime-museum-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      set({ isLoading: false });
    }
  }
})); 