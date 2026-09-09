const express = require("express");

const {
  addBreach,
  getBreaches,
} = require("../controllers/breachController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addBreach);

router.get("/", protect, getBreaches);

module.exports = router;