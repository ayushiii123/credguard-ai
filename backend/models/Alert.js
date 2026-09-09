const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    monitoredAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredAccount",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "security_breach",
        "high_risk",
        "critical_risk",
        "security_recommendation",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Alert ||
  mongoose.model("Alert", alertSchema);