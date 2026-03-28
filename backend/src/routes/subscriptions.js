const express = require("express");
const {
  createSubscription,
  renewSubscriptionCtrl,
  searchSubscriptions,
  getSubscriptionDetails,
  newAcademyOnlySubscription,
  addSubMemberHandler,
  getAccountProfile,
  updateSubscription,
  getMembersDirectory,
  deleteAccount,
  getClubDashboard,
} = require("../controllers/subscriptionController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Club dashboard (must be before :id routes)
router.get(
  "/club-dashboard",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  getClubDashboard,
);

// Create new subscription
router.post(
  "/",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  createSubscription,
);

// Update subscription
router.put("/:id", protect, allowRoles("admin", "owner"), updateSubscription);

// Create academy-only subscription
router.post(
  "/academy-only",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  newAcademyOnlySubscription,
);

// Add sub member to family account
router.post(
  "/add-sub-member",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  addSubMemberHandler,
);

// Get account profile
router.get(
  "/account-profile/:accountId",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  getAccountProfile,
);

// Search subscriptions
router.get(
  "/search",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  searchSubscriptions,
);

// Get members directory
router.get(
  "/members-directory",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  getMembersDirectory,
);

// Get subscription details
router.get(
  "/:id",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  getSubscriptionDetails,
);

// Renew subscription
router.post(
  "/:subscriptionId/renew",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  renewSubscriptionCtrl,
);

// Delete account and all related data
router.delete(
  "/accounts/:accountId",
  protect,
  allowRoles("admin", "owner"),
  deleteAccount,
);

module.exports = router;
