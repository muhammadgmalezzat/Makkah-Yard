/**
 * Messaging Service - API calls for messaging operations
 * Used in: MessagingPage
 */

import axios from "../api/axios";

/**
 * Get messaging statistics (member counts, revenue, etc.)
 * Used in: MessagingPage
 * @returns {Promise} Stats data (activeGym, activeAcademy, totalActive, etc)
 */
export const getMessagingStats = async () => {
  const response = await axios.get("/messaging/stats");
  return response.data.data;
};

/**
 * Get daily report for a specific date
 * Used in: MessagingPage for daily management/accounting reports
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise} Daily report data (gym/academy counts, revenue, payments)
 */
export const getDailyReport = async (date) => {
  const response = await axios.get(`/messaging/daily-report?date=${date}`);
  return response.data.data;
};

/**
 * Send SMS or WhatsApp message
 * Used in: MessagingPage
 * @param {object} data - Message data (phone, email, message, channel: 'sms' | 'whatsapp' | 'email')
 * @returns {Promise} Send result { success: boolean, message: string }
 */
export const sendMessage = async (data) => {
  const response = await axios.post("/messaging/send", data);
  return response.data;
};

/**
 * Send test message to verify phone/connection
 * Used in: MessagingPage for testing
 * @param {object} data - Test data (phone, channel: 'sms' | 'whatsapp')
 * @returns {Promise} Test result { success: boolean, message: string }
 */
export const sendTestMessage = async (data) => {
  const response = await axios.post("/messaging/test", data);
  return response.data;
};

/**
 * Send bulk SMS/WhatsApp to multiple recipients
 * Used in: (future feature for broadcast messaging)
 * @param {object} data - Bulk message data (recipients: [], message, channel)
 * @returns {Promise} Bulk send result
 */
export const sendBulkMessage = async (data) => {
  const response = await axios.post("/messaging/bulk-send", data);
  return response.data;
};

/**
 * Get message templates for quick sending
 * Used in: MessagingPage (template selector)
 * @returns {Promise} Array of templates
 */
export const getMessageTemplates = async () => {
  const response = await axios.get("/messaging/templates");
  return response.data.data || [];
};

/**
 * Create custom message template
 * Used in: MessagingPage template management
 * @param {object} data - Template data (name, message, category)
 * @returns {Promise} Created template
 */
export const createMessageTemplate = async (data) => {
  const response = await axios.post("/messaging/templates", data);
  return response.data;
};

/**
 * Save message configuration (phone numbers, settings)
 * Used in: MessagingPage
 * @param {object} data - Config data (settings)
 * @returns {Promise} Updated config
 */
export const saveMessagingConfig = async (data) => {
  const response = await axios.post("/messaging/config", data);
  return response.data;
};

/**
 * Get messaging history/logs
 * Used in: (future message history page)
 * @param {object} params - Filter params (date, phone, status, limit, page)
 * @returns {Promise} Message logs with pagination
 */
export const getMessageHistory = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axios.get(`/messaging/history?${queryString}`);
  return response.data;
};
