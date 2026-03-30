import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as memberService from "../services/memberService";

/**
 * useMembers Hook - Member operations
 */
export function useMembers() {
  const queryClient = useQueryClient();

  // Update member
  const updateMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }) => {
      return memberService.updateMember(memberId, data);
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      queryClient.invalidateQueries({ queryKey: ["members-directory"] });
    },
  });

  // Get child profile
  const useChildProfile = (memberId) => {
    return useQuery({
      queryKey: ["child-profile", memberId],
      queryFn: () => memberService.getChildProfile(memberId),
      enabled: !!memberId,
    });
  };

  // Update academy member
  const updateAcademyMemberMutation = useMutation({
    mutationFn: async ({ memberId, data }) => {
      return memberService.updateAcademyMember(memberId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-profile"] });
    },
  });

  // Create academy member
  const createAcademyMemberMutation = useMutation({
    mutationFn: async (data) => {
      return memberService.createAcademyMember(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academy-members"] });
    },
  });

  return {
    updateMember: updateMemberMutation.mutate,
    updateMemberAsync: updateMemberMutation.mutateAsync,
    isUpdating: updateMemberMutation.isPending,
    updateError: updateMemberMutation.error,
    useChildProfile,
    updateAcademyMember: updateAcademyMemberMutation.mutate,
    isUpdatingAcademy: updateAcademyMemberMutation.isPending,
    createAcademyMember: createAcademyMemberMutation.mutate,
    createError: createAcademyMemberMutation.error,
  };
}
