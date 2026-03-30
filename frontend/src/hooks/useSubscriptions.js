import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as subscriptionService from "../services/subscriptionService";

/**
 * useSubscriptions Hook - Subscription operations
 */
export function useSubscriptions() {
  const queryClient = useQueryClient();

  // Get account profile with all subscriptions
  const useAccountProfile = (accountId) => {
    return useQuery({
      queryKey: ["account-profile", accountId],
      queryFn: () => subscriptionService.getAccountProfile(accountId),
      enabled: !!accountId,
    });
  };

  // Get single subscription
  const useSubscription = (subscriptionId) => {
    return useQuery({
      queryKey: ["subscription", subscriptionId],
      queryFn: () => subscriptionService.getSubscription(subscriptionId),
      enabled: !!subscriptionId,
    });
  };

  // Update subscription
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, data }) => {
      return subscriptionService.updateSubscription(subscriptionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  // Renew subscription
  const renewSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, data }) => {
      return subscriptionService.renewSubscription(subscriptionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  // Freeze/unfreeze subscription
  const freezeSubscriptionMutation = useMutation({
    mutationFn: async ({
      subscriptionId,
      isFrozen,
      freezeStart,
      freezeEnd,
    }) => {
      return subscriptionService.freezeSubscription(subscriptionId, {
        isFrozen,
        freezeStart,
        freezeEnd,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
  });

  // Search subscriptions
  const useSearch = (searchQuery) => {
    return useQuery({
      queryKey: ["search-subscriptions", searchQuery],
      queryFn: () => subscriptionService.searchSubscriptions(searchQuery),
      enabled: !!searchQuery,
    });
  };

  // Get members directory with filters
  const useMembersDirectory = (filters) => {
    return useQuery({
      queryKey: ["members-directory", filters],
      queryFn: () => subscriptionService.getMembersDirectory(filters),
      cacheTime: 0, // No cache (as in original)
    });
  };

  // Create subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (data) => {
      return subscriptionService.createSubscription(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      queryClient.invalidateQueries({ queryKey: ["members-directory"] });
    },
  });

  // Add sub-member
  const addSubMemberMutation = useMutation({
    mutationFn: async (data) => {
      return subscriptionService.addSubMember(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
    },
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId) => {
      return subscriptionService.deleteAccount(accountId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members-directory"] });
    },
  });

  return {
    useAccountProfile,
    useSubscription,
    updateSubscription: updateSubscriptionMutation.mutate,
    updateSubscriptionAsync: updateSubscriptionMutation.mutateAsync,
    isUpdating: updateSubscriptionMutation.isPending,
    renewSubscription: renewSubscriptionMutation.mutate,
    renewSubscriptionAsync: renewSubscriptionMutation.mutateAsync,
    isRenewing: renewSubscriptionMutation.isPending,
    freezeSubscription: freezeSubscriptionMutation.mutate,
    isFreezing: freezeSubscriptionMutation.isPending,
    useSearch,
    useMembersDirectory,
    createSubscription: createSubscriptionMutation.mutate,
    createSubscriptionAsync: createSubscriptionMutation.mutateAsync,
    isCreating: createSubscriptionMutation.isPending,
    addSubMember: addSubMemberMutation.mutate,
    isAddingSubMember: addSubMemberMutation.isPending,
    deleteAccount: deleteAccountMutation.mutate,
    isDeleting: deleteAccountMutation.isPending,
  };
}
