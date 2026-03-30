import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as academyService from "../services/academyService";

/**
 * useAcademy Hook - Academy sports, groups, and subscriptions
 */
export function useAcademy() {
  const queryClient = useQueryClient();

  // Get academy dashboard
  const useAcademyDashboard = () => {
    return useQuery({
      queryKey: ["academy-dashboard"],
      queryFn: () => academyService.getAcademyDashboard(),
    });
  };

  // Get sports list (optionally filtered by gender)
  const useSports = (gender) => {
    return useQuery({
      queryKey: ["sports", gender],
      queryFn: () => academyService.getSports(gender ? { gender } : {}),
      enabled: gender === undefined || !!gender,
    });
  };

  // Get groups for a sport
  const useGroups = (sportId) => {
    return useQuery({
      queryKey: ["groups", sportId],
      queryFn: () => academyService.getSportDetails(sportId),
      enabled: !!sportId,
      select: (data) => data.groups || [],
    });
  };

  // Get active members today
  const useActiveTodayMembers = (filters) => {
    return useQuery({
      queryKey: ["activeTodayMembers", filters],
      queryFn: () => {
        const params = {
          sportId: filters.sportId,
          ...(filters.groupId && { groupId: filters.groupId }),
          _t: Date.now(), // Cache-busting
        };
        return academyService.getActiveTodayMembers(params);
      },
      enabled: !!filters.sportId,
    });
  };

  // Get expiring subscriptions
  const useExpiringSubscriptions = (params) => {
    return useQuery({
      queryKey: ["academy-expiring", params],
      queryFn: () => academyService.getExpiringAcademySubscriptions(params),
    });
  };

  // Create sport
  const createSportMutation = useMutation({
    mutationFn: async (data) => {
      return academyService.createSport(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports"] });
    },
  });

  // Create group
  const createGroupMutation = useMutation({
    mutationFn: async (data) => {
      return academyService.createGroup(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["academy-dashboard"] });
    },
  });

  // Update group
  const updateGroupMutation = useMutation({
    mutationFn: async ({ groupId, data }) => {
      return academyService.updateGroup(groupId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["academy-dashboard"] });
    },
  });

  // Create academy subscription
  const createAcademySubscriptionMutation = useMutation({
    mutationFn: async (data) => {
      return academyService.createAcademySubscription(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["activeTodayMembers"] });
    },
  });

  // Change sport
  const changeSportMutation = useMutation({
    mutationFn: async ({ subscriptionId, newSportId, newGroupId }) => {
      return academyService.changeSubscriptionSport(subscriptionId, {
        newSportId,
        newGroupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profile"] });
      queryClient.invalidateQueries({ queryKey: ["activeTodayMembers"] });
    },
  });

  // Change group
  const changeGroupMutation = useMutation({
    mutationFn: async ({ subscriptionId, newGroupId }) => {
      return academyService.changeSubscriptionGroup(subscriptionId, {
        newGroupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profile"] });
      queryClient.invalidateQueries({ queryKey: ["activeTodayMembers"] });
    },
  });

  // Update academy subscription
  const updateAcademySubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, data }) => {
      return academyService.updateAcademySubscription(subscriptionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profile"] });
      queryClient.invalidateQueries({ queryKey: ["academy-dashboard"] });
    },
  });

  return {
    useAcademyDashboard,
    useSports,
    useGroups,
    useActiveTodayMembers,
    useExpiringSubscriptions,
    createSport: createSportMutation.mutate,
    isCreatingSport: createSportMutation.isPending,
    createGroup: createGroupMutation.mutate,
    isCreatingGroup: createGroupMutation.isPending,
    updateGroup: updateGroupMutation.mutate,
    isUpdatingGroup: updateGroupMutation.isPending,
    createAcademySubscription: createAcademySubscriptionMutation.mutate,
    isCreatingAcademySubscription: createAcademySubscriptionMutation.isPending,
    changeSport: changeSportMutation.mutate,
    isChangingSport: changeSportMutation.isPending,
    changeGroup: changeGroupMutation.mutate,
    isChangingGroup: changeGroupMutation.isPending,
    updateAcademySubscription: updateAcademySubscriptionMutation.mutate,
    isUpdatingAcademySubscription: updateAcademySubscriptionMutation.isPending,
  };
}
