const mongoose = require("mongoose");

const monitoredAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["email", "username", "phone", "domain"],
      required: true,
    },

    value: {
      type: String,
      required: true,
      trim: true,
    },

    label: {
      type: String,
      trim: true,
      default: "My Account",
    },

    status: {
      type: String,
      enum: ["safe", "at_risk", "breached"],
      default: "safe",
    },

    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    lastChecked: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "MonitoredAccount",
  monitoredAccountSchema
);