const express = require("express");
const {
  createSubscription,
  renewSubscriptionCtrl,
  searchSubscriptions,
  getSubscriptionDetails,
  newAcademyOnlySubscription,
  addSubMemberHandler,
  getAccountProfile,
} = require("../controllers/subscriptionController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Create new subscription
router.post(
  "/",
  protect,
  allowRoles("reception", "supervisor", "admin", "owner"),
  createSubscription,
);

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

module.exports = router;
