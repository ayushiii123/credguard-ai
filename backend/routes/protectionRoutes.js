const express = require("express");

const router = express.Router();

const {
  getProtectionPlan,
  completeProtectionAction,
} = require("../controllers/protectionController");

const authMiddleware = require("../middleware/authMiddleware");

// Get protection plan
router.get(
  "/:breachId",
  authMiddleware,
  getProtectionPlan
);

// Complete protection action
router.patch(
  "/:breachId/action/:actionId",
  authMiddleware,
  completeProtectionAction
);

module.exports = router;