// Barrel export for services
export * as memberService from "./memberService";
export * as subscriptionService from "./subscriptionService";
export * as academyService from "./academyService";
export * as packageService from "./packageService";
export * as messagingService from "./messagingService";
export * as authService from "./authService";

// Direct exports for convenience
export {
  updateMember,
  getChildProfile,
  updateAcademyMember,
  createAcademyMember,
} from "./memberService";

export {
  getAccountProfile,
  getSubscription,
  updateSubscription,
  renewSubscription,
  searchSubscriptions,
  getMembersDirectory,
  createSubscription,
  addSubMember,
  getClubDashboard,
  deleteAccount,
  freezeSubscription,
  getExpiringSubscriptions,
} from "./subscriptionService";

export {
  getAcademyDashboard,
  getSports,
  getSportDetails,
  createSport,
  getGroups,
  createGroup,
  updateGroup,
  getActiveTodayMembers,
  getExpiringAcademySubscriptions,
  createAcademySubscription,
  changeSubscriptionSport,
  changeSubscriptionGroup,
  updateAcademySubscription,
  renewAcademySubscription,
} from "./academyService";

export {
  getPackages,
  getPackagesByCategory,
  getFlexibleDurationPackages,
  getAcademyPackages,
  getMonthlyAcademyPackages,
  getAnnualAcademyPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
} from "./packageService";

export {
  getMessagingStats,
  getDailyReport,
  sendMessage,
  sendTestMessage,
  sendBulkMessage,
  getMessageTemplates,
  createMessageTemplate,
  saveMessagingConfig,
  getMessageHistory,
} from "./messagingService";

export {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verify2FA,
} from "./authService";
