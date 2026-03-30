/**
 * Auth Service - API calls for authentication operations
 * Used in: LoginPage, ProtectedRoute, useAuthStore
 */

import axios from "../api/axios";

/**
 * Login user with credentials
 * @param {object} credentials - Login data (email, password)
 * @returns {Promise} Login result { user, token }
 */
export const login = async (credentials) => {
  const response = await axios.post("/auth/login", credentials);
  return response.data;
};

/**
 * Logout current user
 * @returns {Promise} Logout result
 */
export const logout = async () => {
  const response = await axios.post("/auth/logout");
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise} Current user data
 */
export const getCurrentUser = async () => {
  const response = await axios.get("/auth/me");
  return response.data;
};

/**
 * Refresh authentication token
 * @returns {Promise} New token
 */
export const refreshToken = async () => {
  const response = await axios.post("/auth/refresh");
  return response.data;
};

/**
 * Change user password
 * @param {object} data - Password data (oldPassword, newPassword)
 * @returns {Promise} Result message
 */
export const changePassword = async (data) => {
  const response = await axios.post("/auth/change-password", data);
  return response.data;
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise} Reset link sent message
 */
export const requestPasswordReset = async (email) => {
  const response = await axios.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Reset password with token
 * @param {object} data - Reset data (token, newPassword)
 * @returns {Promise} Reset result
 */
export const resetPassword = async (data) => {
  const response = await axios.post("/auth/reset-password", data);
  return response.data;
};

/**
 * Verify two-factor authentication code
 * @param {string} code - 2FA code
 * @returns {Promise} Verification result
 */
export const verify2FA = async (code) => {
  const response = await axios.post("/auth/verify-2fa", { code });
  return response.data;
};
