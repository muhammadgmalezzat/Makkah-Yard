const axios = require("axios");

class MessagingService {
  constructor() {
    this.apiKey = process.env.TAQNYAT_API_KEY;
    this.sender = process.env.TAQNYAT_SENDER;
    this.baseURL = "https://api.taqnyat.sa/v1";
  }

  /**
   * Send SMS via Taqnyat
   * @param {string} phone - Recipient phone number (with country code)
   * @param {string} message - Message text
   * @returns {Promise} API response
   */
  async sendSMS(phone, message) {
    try {
      if (!this.apiKey || !this.sender) {
        throw new Error("Taqnyat API key or sender not configured");
      }

      if (!phone || !message) {
        throw new Error("Phone and message are required");
      }

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          recipients: [phone],
          body: message,
          sender: this.sender,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data,
        channel: "sms",
      };
    } catch (error) {
      console.error(
        "SMS sending error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        channel: "sms",
      };
    }
  }

  /**
   * Send WhatsApp via Taqnyat
   * @param {string} phone - Recipient phone number (with country code)
   * @param {string} message - Message text
   * @returns {Promise} API response
   */
  async sendWhatsApp(phone, message) {
    try {
      if (!this.apiKey || !this.sender) {
        throw new Error("Taqnyat API key or sender not configured");
      }

      if (!phone || !message) {
        throw new Error("Phone and message are required");
      }

      // Taqnyat uses the same endpoint for WhatsApp
      // The channel type is determined by the sender configuration
      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          recipients: [phone],
          body: message,
          sender: this.sender,
          channel: "whatsapp", // WhatsApp channel
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data,
        channel: "whatsapp",
      };
    } catch (error) {
      console.error(
        "WhatsApp sending error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        channel: "whatsapp",
      };
    }
  }

  /**
   * Send Email (if supported by Taqnyat account)
   * Note: Basic support - Taqnyat may not support email natively
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {string} message - Email body
   * @returns {Promise} API response
   */
  async sendEmail(email, subject, message) {
    try {
      // Note: Taqnyat primarily handles SMS/WhatsApp
      // Email support depends on account configuration
      if (!email || !subject || !message) {
        throw new Error("Email, subject, and message are required");
      }

      // This is a placeholder - Taqnyat may not support email
      // You might need to use a separate email service like nodemailer
      return {
        success: false,
        error:
          "Email support not available via Taqnyat. Use alternative email service.",
        channel: "email",
      };
    } catch (error) {
      console.error("Email sending error:", error.message);
      return {
        success: false,
        error: error.message,
        channel: "email",
      };
    }
  }

  /**
   * Send test message (Arabic)
   * @param {string} phone - Recipient phone number
   * @param {string} channel - 'sms' or 'whatsapp'
   * @returns {Promise} API response
   */
  async sendTestMessage(phone, channel = "sms") {
    const testMessage = "رسالة تجريبية من نادي مكة الرياضي";

    if (channel === "whatsapp") {
      return this.sendWhatsApp(phone, testMessage);
    } else {
      return this.sendSMS(phone, testMessage);
    }
  }
}

module.exports = new MessagingService();
