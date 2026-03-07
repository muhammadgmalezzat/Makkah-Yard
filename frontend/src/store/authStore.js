import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        // Store in localStorage directly as backup
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        set({ user, token });
      },

      loadFromStorage: () => {
        const token = localStorage.getItem("auth_token");
        const user = localStorage.getItem("auth_user");
        if (token && user) {
          set({ token, user: JSON.parse(user) });
          return true;
        }
        return false;
      },

      logout: () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
