const Breach = require("../models/Breach");
const MonitoredAccount = require("../models/MonitoredAccount");
const { calculateRiskScore } = require("../services/riskEngine");


// ========================================
// CALCULATE RISK FOR ONE BREACH
// ========================================

const calculateRisk = async (req, res) => {
  try {
    const { breachId } = req.body;

    if (!breachId) {
      return res.status(400).json({
        success: false,
        message: "breachId is required",
      });
    }

    const breach = await Breach.findById(breachId);

    if (!breach) {
      return res.status(404).json({
        success: false,
        message: "Breach not found",
      });
    }

    const monitoredAccount = await MonitoredAccount.findOne({
      _id: breach.monitoredAccountId,
      userId: req.user.userId,
    });

    if (!monitoredAccount) {
      return res.status(404).json({
        success: false,
        message: "Monitored account not found",
      });
    }

    const risk = calculateRiskScore(breach);

    monitoredAccount.riskScore = risk.score;

    if (
      risk.level === "critical" ||
      risk.level === "high"
    ) {
      monitoredAccount.status = "breached";
    } else if (risk.level === "medium") {
      monitoredAccount.status = "at_risk";
    } else {
      monitoredAccount.status = "safe";
    }

    monitoredAccount.lastChecked = new Date();

    await monitoredAccount.save();

    res.status(200).json({
      success: true,
      message: "Risk calculated successfully",

      risk: {
        score: risk.score,
        level: risk.level,
        severity: risk.factors.find(
          (factor) => factor.type === "severity"
        )?.value || "low",
      },

      account: {
        id: monitoredAccount._id,
        status: monitoredAccount.status,
        riskScore: monitoredAccount.riskScore,
      },
    });

  } catch (error) {
    console.error(
      "Risk Calculation Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// OVERALL SECURITY RISK
// ========================================

const getOverallRisk = async (req, res) => {
  try {
    const userId = req.user.userId;

    const accounts = await MonitoredAccount.find({
      userId,
    });

    const accountIds = accounts.map(
      (account) => account._id
    );

    const breaches = await Breach.find({
      monitoredAccountId: {
        $in: accountIds,
      },
    }).sort({
      createdAt: -1,
    });

    let overallScore = 0;

    breaches.forEach((breach) => {
      const risk = calculateRiskScore(breach);

      if (risk.score > overallScore) {
        overallScore = risk.score;
      }
    });

    // Additional breach penalty
    if (breaches.length > 1) {
      overallScore += Math.min(
        (breaches.length - 1) * 5,
        20
      );
    }

    // Affected account penalty
    const affectedAccounts = accounts.filter(
      (account) =>
        account.status === "breached" ||
        account.status === "at_risk"
    );

    overallScore += Math.min(
      affectedAccounts.length * 5,
      15
    );

    overallScore = Math.min(
      Math.round(overallScore),
      100
    );

    let level;

    if (overallScore >= 75) {
      level = "critical";
    } else if (overallScore >= 50) {
      level = "high";
    } else if (overallScore >= 26) {
      level = "medium";
    } else {
      level = "low";
    }

    // Security health = inverse of risk
    const securityHealth = 100 - overallScore;

    let healthStatus;

    if (securityHealth >= 80) {
      healthStatus = "excellent";
    } else if (securityHealth >= 60) {
      healthStatus = "good";
    } else if (securityHealth >= 40) {
      healthStatus = "needs_attention";
    } else {
      healthStatus = "critical";
    }

    res.status(200).json({
      success: true,

      risk: {
        score: overallScore,
        level,
      },

      securityHealth: {
        score: securityHealth,
        status: healthStatus,
      },

      statistics: {
        monitoredAccounts: accounts.length,

        affectedAccounts:
          affectedAccounts.length,

        totalBreaches:
          breaches.length,

        criticalBreaches:
          breaches.filter(
            (breach) =>
              breach.severity === "critical"
          ).length,

        highBreaches:
          breaches.filter(
            (breach) =>
              breach.severity === "high"
          ).length,
      },
    });

  } catch (error) {
    console.error(
      "Overall Risk Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to calculate overall security risk",
    });
  }
};


module.exports = {
  calculateRisk,
  getOverallRisk,
};