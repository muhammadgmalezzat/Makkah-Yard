import { useQuery } from "@tanstack/react-query";
import * as subscriptionService from "../services/subscriptionService";
import * as academyService from "../services/academyService";

/**
 * useClubDashboard Hook - Fetch club dashboard data
 */
export function useClubDashboard() {
  return useQuery({
    queryKey: ["club-dashboard"],
    queryFn: () => subscriptionService.getClubDashboard(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * useAcademyDashboard Hook - Fetch academy dashboard data
 */
export function useAcademyDashboard() {
  return useQuery({
    queryKey: ["academy-dashboard"],
    queryFn: () => academyService.getAcademyDashboard(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
