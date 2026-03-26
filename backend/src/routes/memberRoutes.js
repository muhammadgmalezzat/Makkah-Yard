const express = require("express");
const { updateMember } = require("../controllers/memberController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Update member
router.put("/:id", protect, allowRoles("admin", "owner"), updateMember);

module.exports = router;
