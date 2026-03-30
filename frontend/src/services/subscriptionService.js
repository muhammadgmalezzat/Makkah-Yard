/**
 * Subscription Service - API calls for subscription operations
 * Used in: AccountProfile, SearchSubscriptionsPage, NewSubscriptionPage, RenewSubscriptionPage,
 *          AddSubMember, ClubDashboard, NewAcademySubscription
 */

import axios from "../api/axios";

/**
 * Get account profile with all member subscriptions
 * Used in: AccountProfile
 * @param {string} accountId - Account ID
 * @returns {Promise} Account profile with members, subscriptions, payments, stats
 */
export const getAccountProfile = async (accountId) => {
  const response = await axios.get(
    `/subscriptions/account-profile/${accountId}`,
  );
  return response.data.data;
};

/**
 * Get single subscription details
 * Used in: RenewSubscriptionPage, AddSubMember
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise} Subscription data
 */
export const getSubscription = async (subscriptionId) => {
  const response = await axios.get(`/subscriptions/${subscriptionId}`);
  return response.data;
};

/**
 * Update subscription (dates, status, price)
 * Used in: AccountProfile, RenewSubscriptionPage, ChildProfile
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Update data (startDate, endDate, status, pricePaid)
 * @returns {Promise} Updated subscription
 */
export const updateSubscription = async (subscriptionId, data) => {
  const response = await axios.put(`/subscriptions/${subscriptionId}`, data);
  return response.data;
};

/**
 * Renew subscription with new package
 * Used in: RenewSubscriptionPage
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Renewal data (packageId, startDate, paymentMethod, paymentDate)
 * @returns {Promise} Renewed subscription
 */
export const renewSubscription = async (subscriptionId, data) => {
  const response = await axios.post(
    `/subscriptions/${subscriptionId}/renew`,
    data,
  );
  return response.data;
};

/**
 * Search members/subscriptions by query
 * Used in: SearchSubscriptionsPage, AddSubMember, NewAcademySubscription
 * @param {string} searchQuery - Search query (name, phone, email)
 * @returns {Promise} Array of search results
 */
export const searchSubscriptions = async (searchQuery) => {
  const response = await axios.get(
    `/subscriptions/search?q=${encodeURIComponent(searchQuery)}`,
  );
  return response.data.data || [];
};

/**
 * Get members directory with filters and pagination
 * Used in: SearchSubscriptionsPage
 * @param {object} params - Filter params (packageType, q, startDate, endDate, activeOnly, gender, page, limit)
 * @returns {Promise} Members directory with pagination
 */
export const getMembersDirectory = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(
    `/subscriptions/members-directory?${queryString}`,
  );
  return response.data;
};

/**
 * Create new subscription
 * Used in: NewSubscriptionPage
 * @param {object} data - Subscription data (accountType, packageId, memberData, primaryData, partnerData, startDate, paymentMethod, paymentDate)
 * @returns {Promise} Created subscription
 */
export const createSubscription = async (data) => {
  const response = await axios.post("/subscriptions", data);
  return response.data;
};

/**
 * Add sub-member to family account
 * Used in: AddSubMember
 * @param {object} data - Sub-member data (accountId, memberData, packageId, months, startDate, paymentMethod, calculatedPrice)
 * @returns {Promise} Created sub-member subscription
 */
export const addSubMember = async (data) => {
  const response = await axios.post("/subscriptions/add-sub-member", data);
  return response.data;
};

/**
 * Get club dashboard statistics
 * Used in: ClubDashboard
 * @returns {Promise} Dashboard data with KPIs, charts, tables
 */
export const getClubDashboard = async () => {
  const response = await axios.get("/subscriptions/club-dashboard");
  return response.data.data;
};

/**
 * Delete account and all related data
 * Used in: SearchSubscriptionsPage
 * @param {string} accountId - Account ID to delete
 * @returns {Promise} Delete result
 */
export const deleteAccount = async (accountId) => {
  const response = await axios.delete(`/subscriptions/accounts/${accountId}`);
  return response.data;
};

/**
 * Freeze subscription (suspend temporarily)
 * Used in: AccountProfile (via updateSubscription with isFrozen and dates)
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Freeze data (isFrozen, freezeStart, freezeEnd)
 * @returns {Promise} Updated subscription
 */
export const freezeSubscription = async (subscriptionId, data) => {
  return updateSubscription(subscriptionId, data);
};

/**
 * Get subscriptions expiring in date range
 * Used in: ClubDashboard (internal data)
 * @param {object} params - Filter params (days, status)
 * @returns {Promise} Array of expiring subscriptions
 */
export const getExpiringSubscriptions = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(`/subscriptions/expiring?${queryString}`);
  return response.data;
};
