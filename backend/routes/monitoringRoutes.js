const express = require("express");
const router = express.Router();

const {
  runMonitoringCycle,
} = require("../services/monitoringService");

const authMiddleware = require("../middleware/authMiddleware");

/*
  POST /api/monitoring/run

  Runs automatic monitoring for the
  logged-in user's monitored accounts.
*/

router.post(
  "/run",
  authMiddleware,
  async (req, res) => {
    try {
      const result =
        await runMonitoringCycle(
          req.user.userid
        );

      return res.status(200).json(result);

    } catch (error) {
      console.error(
        "Monitoring Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Monitoring cycle failed",
        error:
          error.message,
      });
    }
  }
);

module.exports = router;