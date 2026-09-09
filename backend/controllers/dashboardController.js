const MonitoredAccount = require("../models/MonitoredAccount");
const Breach = require("../models/Breach");
const Alert = require("../models/alert");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // =========================
    // MONITORED ACCOUNTS
    // =========================

    const accounts = await MonitoredAccount.find({
      userId,
    }).sort({ createdAt: -1 });

    // =========================
    // BREACHES
    // =========================

    const accountIds = accounts.map(
      (account) => account._id
    );

    const breaches = await Breach.find({
      monitoredAccountId: {
        $in: accountIds,
      },
    }).sort({
      detectedAt: -1,
    });

    // =========================
    // ALERTS
    // =========================

    const alerts = await Alert.find({
      userId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(10);

    // =========================
    // UNREAD ALERTS
    // =========================

    const unreadAlerts = await Alert.countDocuments({
      userId,
      isRead: false,
    });

    // =========================
    // BREACH COUNTS
    // =========================

    const criticalBreaches = breaches.filter(
      (breach) =>
        breach.severity === "critical"
    ).length;

    const highBreaches = breaches.filter(
      (breach) =>
        breach.severity === "high"
    ).length;

    const mediumBreaches = breaches.filter(
      (breach) =>
        breach.severity === "medium"
    ).length;

    const lowBreaches = breaches.filter(
      (breach) =>
        breach.severity === "low"
    ).length;

    // =========================
    // RISK SCORE
    // =========================

    let highestRiskScore = 0;

    for (const account of accounts) {
      if (
        account.riskScore >
        highestRiskScore
      ) {
        highestRiskScore =
          account.riskScore;
      }
    }

    // =========================
    // OVERALL STATUS
    // =========================

    let overallStatus = "safe";

    if (highestRiskScore >= 80) {
      overallStatus = "critical";
    } else if (highestRiskScore >= 50) {
      overallStatus = "high";
    } else if (highestRiskScore >= 25) {
      overallStatus = "at_risk";
    }

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,

      overview: {
        totalMonitoredAccounts:
          accounts.length,

        totalBreaches:
          breaches.length,

        criticalBreaches,

        highBreaches,

        mediumBreaches,

        lowBreaches,

        unreadAlerts,

        highestRiskScore,

        overallStatus,
      },

      accounts,

      recentBreaches:
        breaches.slice(0, 5),

      recentAlerts: alerts,
    });
  } catch (error) {
    console.error(
      "Dashboard Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch dashboard data",
    });
  }
};

module.exports = {
  getDashboard,
};