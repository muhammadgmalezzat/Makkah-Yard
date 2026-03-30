import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import * as authService from "../services/authService";

/**
 * useAuth Hook - Wraps authentication store and service
 * Provides auth state and methods
 */
export function useAuth() {
  const store = useAuthStore();

  // Wrap login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const result = await authService.login(credentials);
      return result;
    },
    onSuccess: (data) => {
      if (data.user && data.token) {
        store.setAuth(data.user, data.token);
      }
    },
  });

  // Wrap logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      store.logout();
    },
  });

  // Helper to check role
  const hasRole = (role) => {
    if (!store.user) return false;
    if (typeof role === "string") {
      return store.user.role === role;
    }
    if (Array.isArray(role)) {
      return role.includes(store.user.role);
    }
    return false;
  };

  return {
    user: store.user,
    token: store.token,
    isAuthenticated: !!store.user,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    hasRole,
    isLoading: loginMutation.isPending || logoutMutation.isPending,
  };
}
