const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "authentication",
        "breach",
        "monitoring",
        "ai",
        "alert",
        "security",
      ],
      default: "security",
    },

    description: {
      type: String,
      required: true,
    },

    ipAddress: {
      type: String,
      default: "unknown",
    },

    userAgent: {
      type: String,
      default: "unknown",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: ()=>({}),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

