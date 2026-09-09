const mongoose = require("mongoose");

const breachSchema = new mongoose.Schema(
  {
    monitoredAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MonitoredAccount",
      required: true,
      index: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
    },

    breachName: {
      type: String,
      required: true,
      trim: true,
    },

    breachDate: {
      type: Date,
      default: null,
    },

    dataExposed: [
      {
        type: String,
        trim: true,
      },
    ],

    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    detectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Breach", breachSchema);