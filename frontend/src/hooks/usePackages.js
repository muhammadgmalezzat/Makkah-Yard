import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as packageService from "../services/packageService";

/**
 * useSubAdultPackages Hook - Fetch sub-adult packages
 */
export function useSubAdultPackages() {
  return useQuery({
    queryKey: ["packages", "sub_adult"],
    queryFn: () => packageService.getPackagesByCategory("sub_adult"),
  });
}

/**
 * useSubChildPackages Hook - Fetch sub-child packages
 */
export function useSubChildPackages() {
  return useQuery({
    queryKey: ["packages", "sub_child"],
    queryFn: () => packageService.getPackagesByCategory("sub_child"),
  });
}

/**
 * usePackages Hook - Package queries
 */
export function usePackages() {
  const queryClient = useQueryClient();

  // Get all packages
  const useAllPackages = () => {
    return useQuery({
      queryKey: ["packages"],
      queryFn: () => packageService.getPackages(),
    });
  };

  // Get packages by category
  const usePackagesByCategory = (category) => {
    return useQuery({
      queryKey: ["packages", category],
      queryFn: () => packageService.getPackagesByCategory(category),
      enabled: !!category,
    });
  };

  // Get flexible duration packages
  const useFlexibleDurationPackages = (category) => {
    return useQuery({
      queryKey: ["packages-flexible", category],
      queryFn: () => packageService.getFlexibleDurationPackages(category),
      enabled: !!category,
    });
  };

  // Get academy packages (by sport and category)
  const useAcademyPackages = (category, sport) => {
    return useQuery({
      queryKey: ["packages-academy", category, sport],
      queryFn: () => packageService.getAcademyPackages(category, sport),
      enabled: !!category && !!sport,
    });
  };

  // Get monthly academy packages
  const useMonthlyAcademyPackages = (sport, category) => {
    return useQuery({
      queryKey: ["packages-academy-monthly", sport, category],
      queryFn: () => packageService.getMonthlyAcademyPackages(sport, category),
      enabled: !!sport && !!category,
    });
  };

  // Get annual academy packages
  const useAnnualAcademyPackages = (sport) => {
    return useQuery({
      queryKey: ["packages-academy-annual", sport],
      queryFn: () => packageService.getAnnualAcademyPackages(sport),
      enabled: !!sport,
    });
  };

  return {
    useAllPackages,
    usePackagesByCategory,
    useFlexibleDurationPackages,
    useAcademyPackages,
    useMonthlyAcademyPackages,
    useAnnualAcademyPackages,
    // Invalidate on demand
    invalidatePackages: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
  };
}
