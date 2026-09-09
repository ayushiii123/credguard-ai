
const express = require("express");

const {
  addMonitoredAccount,
  getMonitoredAccounts,
  deleteMonitoredAccount,
  checkMonitoredAccount,
} = require("../controllers/monitorController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Add monitored account
router.post("/", protect, addMonitoredAccount);

// Get monitored accounts
router.get("/", protect, getMonitoredAccounts);

// Delete monitored account
router.delete("/:id", protect, deleteMonitoredAccount);
router.post(
  "/:id/check",
  protect,
  checkMonitoredAccount
);
module.exports = router;

