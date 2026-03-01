const express = require("express");
const {
  createSubscription,
  renewSubscriptionCtrl,
  searchSubscriptions,
  getSubscriptionDetails,
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
