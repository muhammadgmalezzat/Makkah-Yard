const express = require("express");
const {
  getPackages,
  createPackage,
  updatePackage,
} = require("../controllers/packageController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", getPackages);
router.post("/", protect, allowRoles("admin", "owner"), createPackage);
router.put("/:id", protect, allowRoles("admin", "owner"), updatePackage);

module.exports = router;
