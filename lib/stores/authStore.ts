import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  gender?: string | null;
  dob?: string | null;
  preference?: string | null;
  profile_image_url?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }) => void;
  logout: () => void;
  checkTokenValidity: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: ({ user, tokens }) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      checkTokenValidity: () => {
        const state = get();
        // Check for basic presence here. True token expiry is handled by API route failures.
        return !!state.accessToken && !!state.user;
      },
    }),
    {
      name: "shivanya-auth-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);
