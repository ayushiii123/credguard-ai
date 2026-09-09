const express = require("express");

const {
  calculateRisk,
  getOverallRisk,
} = require("../controllers/riskController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/calculate",
  protect,
  calculateRisk
);

router.get(
  "/overall",
  protect,
  getOverallRisk
);

module.exports = router;