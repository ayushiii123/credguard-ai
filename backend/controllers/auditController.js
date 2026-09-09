const AuditLog = require("../models/AuditLog");

/* =========================
   GET AUDIT LOGS
========================= */

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find({
      userId: req.user.userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(
      "Get Audit Logs Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch security activity",
    });
  }
};

module.exports = {
  getAuditLogs,
};