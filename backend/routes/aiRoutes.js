const express = require("express");

const {
  analyzeBreachWithAI,
} = require("../controllers/aiController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/analyze", protect, analyzeBreachWithAI);

module.exports = router;