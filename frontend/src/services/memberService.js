/**
 * Member Service - API calls for member operations
 * Used in: AccountProfile, ChildProfile, NewAcademySubscription
 */

import axios from "../api/axios";

/**
 * Update member basic data
 * @param {string} memberId - Member ID
 * @param {object} data - Member data (fullName, phone, email, gender, nationalId, dateOfBirth)
 * @returns {Promise} Updated member data
 */
export const updateMember = async (memberId, data) => {
  const response = await axios.put(`/members/${memberId}`, data);
  return response.data;
};

/**
 * Get child profile with subscriptions and stats
 * Used in: ChildProfile
 * @param {string} memberId - Member ID
 * @returns {Promise} Child profile data with subscriptions
 */
export const getChildProfile = async (memberId) => {
  const response = await axios.get(`/academy/members/${memberId}/profile`);
  return response.data;
};

/**
 * Update academy member data
 * Used in: ChildProfile
 * @param {string} memberId - Member ID
 * @param {object} data - Member data (fullName, phone, gender, dateOfBirth, guardianName, guardianPhone, guardianRelation)
 * @returns {Promise} Updated member data
 */
export const updateAcademyMember = async (memberId, data) => {
  const response = await axios.put(`/academy/members/${memberId}`, data);
  return response.data;
};

/**
 * Create new academy member (child)
 * Used in: NewAcademySubscription
 * @param {object} data - Member data
 * @returns {Promise} Created member data
 */
export const createAcademyMember = async (data) => {
  const response = await axios.post("/academy/members", data);
  return response.data;
};
