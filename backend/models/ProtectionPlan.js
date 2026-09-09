const mongoose = require("mongoose");

const protectionActionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
  }
);


const protectionPlanSchema = new mongoose.Schema(
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

    breachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Breach",
      required: true,
    },

    protectionLevel: {
      type: String,
      enum: ["standard", "moderate", "high", "critical"],
      default: "standard",
    },

    totalActions: {
      type: Number,
      default: 0,
    },

    pendingActions: {
      type: Number,
      default: 0,
    },

    completedActions: {
      type: Number,
      default: 0,
    },

    actions: {
      type: [protectionActionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


module.exports =
  mongoose.models.ProtectionPlan ||
  mongoose.model(
    "ProtectionPlan",
    protectionPlanSchema
  );