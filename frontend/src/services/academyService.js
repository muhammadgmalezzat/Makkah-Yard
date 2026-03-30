/**
 * Academy Service - API calls for academy operations (sports, groups, subscriptions)
 * Used in: AcademyDashboard, SportsManagement, GroupsManagement, NewAcademySubscription,
 *          CoachList, ExpiringSubscriptions, ChildProfile
 */

import axios from "../api/axios";

/**
 * Get academy dashboard with statistics
 * Used in: AcademyDashboard
 * @returns {Promise} Dashboard data with KPIs, charts, groups table
 */
export const getAcademyDashboard = async () => {
  const response = await axios.get("/academy/dashboard");
  return response.data;
};

/**
 * Get all sports (optionally filtered by gender)
 * Used in: CoachList, ExpiringSubscriptions, NewAcademySubscription, GroupsManagement, SportsManagement, ChildProfile
 * @param {object} params - Optional params (gender)
 * @returns {Promise} Array of sports
 */
export const getSports = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString
    ? `/academy/sports?${queryString}`
    : "/academy/sports";
  const response = await axios.get(url);
  return response.data;
};

/**
 * Get sport details with groups
 * Used in: NewAcademySubscription, ChildProfile, CoachList
 * @param {string} sportId - Sport ID
 * @returns {Promise} Sport with groups array
 */
export const getSportDetails = async (sportId) => {
  const response = await axios.get(`/academy/sports/${sportId}`);
  return response.data;
};

/**
 * Create new sport
 * Used in: SportsManagement
 * @param {object} data - Sport data (name, nameEn, gender, minAge, maxAge)
 * @returns {Promise} Created sport
 */
export const createSport = async (data) => {
  const response = await axios.post("/academy/sports", data);
  return response.data;
};

/**
 * Get all groups (optionally filtered by sport)
 * Used in: GroupsManagement, NewAcademySubscription
 * @param {object} params - Optional params (sportId)
 * @returns {Promise} Array of groups
 */
export const getGroups = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString
    ? `/academy/groups?${queryString}`
    : "/academy/groups";
  const response = await axios.get(url);
  return response.data;
};

/**
 * Create new group
 * Used in: GroupsManagement
 * @param {object} data - Group data (sportId, name, schedule, maxCapacity)
 * @returns {Promise} Created group
 */
export const createGroup = async (data) => {
  const response = await axios.post("/academy/groups", data);
  return response.data;
};

/**
 * Update group details
 * Used in: GroupsManagement
 * @param {string} groupId - Group ID
 * @param {object} data - Update data (name, schedule, maxCapacity, isActive)
 * @returns {Promise} Updated group
 */
export const updateGroup = async (groupId, data) => {
  const response = await axios.put(`/academy/groups/${groupId}`, data);
  return response.data;
};

/**
 * Get active members today for coach list
 * Used in: CoachList
 * @param {object} params - Filter params (sportId, groupId, _t for cache busting)
 * @returns {Promise} Array of members with subscriptions
 */
export const getActiveTodayMembers = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(
    `/academy/subscriptions/active-today?${queryString}`,
  );
  return response.data;
};

/**
 * Get expiring subscriptions
 * Used in: ExpiringSubscriptions
 * @param {object} params - Filter params (days, sportId, gender, groupId)
 * @returns {Promise} Array of expiring subscriptions
 */
export const getExpiringAcademySubscriptions = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(
    `/academy/subscriptions/expiring?${queryString}`,
  );
  return response.data;
};

/**
 * Create academy subscription for child
 * Used in: NewAcademySubscription
 * @param {object} data - Subscription data (memberId, sportId, groupId, startDate, endDate, paymentMethod, pricePaid, etc)
 * @returns {Promise} Created subscription
 */
export const createAcademySubscription = async (data) => {
  const response = await axios.post("/academy/subscriptions", data);
  return response.data;
};

/**
 * Change child's sport (and optionally group)
 * Used in: ChildProfile
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Change data (newSportId, newGroupId)
 * @returns {Promise} Updated subscription
 */
export const changeSubscriptionSport = async (subscriptionId, data) => {
  const response = await axios.post(
    `/academy/subscriptions/${subscriptionId}/change-sport`,
    data,
  );
  return response.data;
};

/**
 * Change child's group (same sport)
 * Used in: ChildProfile
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Change data (newGroupId)
 * @returns {Promise} Updated subscription
 */
export const changeSubscriptionGroup = async (subscriptionId, data) => {
  const response = await axios.post(
    `/academy/subscriptions/${subscriptionId}/change-group`,
    data,
  );
  return response.data;
};

/**
 * Update academy subscription (dates, status, price)
 * Used in: ChildProfile
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Update data (startDate, endDate, status, pricePaid)
 * @returns {Promise} Updated subscription
 */
export const updateAcademySubscription = async (subscriptionId, data) => {
  const response = await axios.put(
    `/academy/subscriptions/${subscriptionId}`,
    data,
  );
  return response.data;
};

/**
 * Renew academy subscription
 * Used in: (can be used in future features)
 * @param {string} subscriptionId - Subscription ID
 * @param {object} data - Renewal data (newStartDate, paymentMethod, pricePaid, etc)
 * @returns {Promise} Renewed subscription
 */
export const renewAcademySubscription = async (subscriptionId, data) => {
  const response = await axios.post(
    `/academy/subscriptions/${subscriptionId}/renew`,
    data,
  );
  return response.data;
};
