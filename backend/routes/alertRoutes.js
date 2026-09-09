const express = require("express");

const {
  getAlerts,
  getUnreadAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
} = require("../controllers/alertController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAlerts);

router.get("/unread", protect, getUnreadAlerts);

router.patch(
  "/:id/read",
  protect,
  markAlertAsRead
);

router.patch(
  "/read-all",
  protect,
  markAllAlertsAsRead
);

module.exports = router;