/**
 * Package Service - API calls for package operations
 * Used in: NewSubscriptionPage, RenewSubscriptionPage, PackagesPage, AddSubMember, NewAcademySubscription
 */

import axios from "../api/axios";

/**
 * Get all packages with optional filters
 * Used in: NewSubscriptionPage, RenewSubscriptionPage, PackagesPage
 * @param {object} params - Optional filter params (category, isActive, sport, isFlexibleDuration)
 * @returns {Promise} Array of packages
 */
export const getPackages = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `/packages?${queryString}` : "/packages";
  const response = await axios.get(url);
  return response.data;
};

/**
 * Get packages by category
 * Used in: NewSubscriptionPage, AddSubMember
 * @param {string} category - Package category (individual, friends, family_essential, sub_adult, sub_child, academy_only)
 * @param {boolean} isActive - Optional filter for active packages only
 * @returns {Promise} Array of packages in category
 */
export const getPackagesByCategory = async (category, isActive = true) => {
  const params = {
    category,
    isActive: isActive.toString(),
  };
  return getPackages(params);
};

/**
 * Get flexible duration packages (for sub_child)
 * Used in: AddSubMember, NewAcademySubscription
 * @param {string} category - Package category
 * @returns {Promise} Array of flexible duration packages
 */
export const getFlexibleDurationPackages = async (category) => {
  const params = {
    category,
    isFlexibleDuration: "true",
    isActive: "true",
  };
  return getPackages(params);
};

/**
 * Get packages by sport and category
 * Used in: NewAcademySubscription
 * @param {string} category - Package category (academy_only, sub_child)
 * @param {string} sport - Sport name or ID
 * @param {object} additionalParams - Additional filters
 * @returns {Promise} Array of packages
 */
export const getAcademyPackages = async (
  category,
  sport,
  additionalParams = {},
) => {
  const params = {
    category,
    sport,
    isActive: "true",
    ...additionalParams,
  };
  return getPackages(params);
};

/**
 * Get monthly academy packages
 * Used in: NewAcademySubscription
 * @param {string} sport - Sport name or ID
 * @param {string} category - Category (academy_only or sub_child)
 * @returns {Promise} Array of monthly packages (flexible duration)
 */
export const getMonthlyAcademyPackages = async (sport, category) => {
  const params = {
    category,
    sport,
    isFlexibleDuration: "true",
    isActive: "true",
  };
  return getPackages(params);
};

/**
 * Get annual academy packages
 * Used in: NewAcademySubscription
 * @param {string} sport - Sport name or ID
 * @returns {Promise} Array of annual packages (fixed duration)
 */
export const getAnnualAcademyPackages = async (sport) => {
  const params = {
    category: "academy_only",
    sport,
    isFlexibleDuration: "false",
    isActive: "true",
  };
  return getPackages(params);
};

/**
 * Get single package details
 * Used in: (can be used for package detail pages)
 * @param {string} packageId - Package ID
 * @returns {Promise} Package data
 */
export const getPackage = async (packageId) => {
  const response = await axios.get(`/packages/${packageId}`);
  return response.data;
};

/**
 * Create new package (admin only)
 * @param {object} data - Package data
 * @returns {Promise} Created package
 */
export const createPackage = async (data) => {
  const response = await axios.post("/packages", data);
  return response.data;
};

/**
 * Update package (admin only)
 * @param {string} packageId - Package ID
 * @param {object} data - Update data
 * @returns {Promise} Updated package
 */
export const updatePackage = async (packageId, data) => {
  const response = await axios.put(`/packages/${packageId}`, data);
  return response.data;
};

/**
 * Delete package (admin only)
 * @param {string} packageId - Package ID
 * @returns {Promise} Delete result
 */
export const deletePackage = async (packageId) => {
  const response = await axios.delete(`/packages/${packageId}`);
  return response.data;
};
