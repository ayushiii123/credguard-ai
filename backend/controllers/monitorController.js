const Breach = require("../models/Breach");
const MonitoredAccount = require("../models/MonitoredAccount");

const { calculateRiskScore } =
  require("../services/riskEngine");

const { createSecurityAlert } =
  require("../services/alertService");

const { checkEmailBreach } =
  require("../services/breachService");

const {
  createAuditLog,
} = require("../services/auditService");
const { calculateAttackImpact } =
  require("../services/attackImpactService");

const { analyzeThreatIntelligence } =
  require("../services/threatIntelligenceService");
/* =========================
   ADD MONITORED ACCOUNT
========================= */

const addMonitoredAccount = async (req, res) => {
  try {
    const { type, value, label } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        message: "Type and value are required",
      });
    }

    const allowedTypes = [
      "email",
      "username",
      "phone",
      "domain",
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid monitoring type",
      });
    }

    const monitoredAccount =
      await MonitoredAccount.create({
        userId: req.user.userId,
        type,
        value,
        label: label || "My Account",
      });

    /* =========================
       Audit Log
    ========================= */

    await createAuditLog({
      userId: req.user.userId,
      action: "ACCOUNT_MONITORED",
      category: "monitoring",
      description: `New ${type} account added for security monitoring`,
      req,
    });

    return res.status(201).json({
      success: true,
      message: "Account added for monitoring",
      account: monitoredAccount,
    });
  } catch (error) {
    console.error(
      "Add Monitor Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   GET MONITORED ACCOUNTS
========================= */

const getMonitoredAccounts = async (req, res) => {
  try {
    const accounts =
      await MonitoredAccount.find({
        userId: req.user.userId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: accounts.length,
      accounts,
    });
  } catch (error) {
    console.error(
      "Get Monitored Accounts Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch monitored accounts",
    });
  }
};

/* =========================
   CHECK MONITORED ACCOUNT
========================= */


const checkMonitoredAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    const account = await MonitoredAccount.findOne({
      _id: id,
      userId: req.user.userId,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Monitored account not found",
      });
    }

    if (account.type !== "email") {
      account.lastChecked = new Date();
      await account.save();

      return res.status(200).json({
        success: true,
        message: "Security check completed",
        account,
        scan: {
          supported: false,
          breached: false,
          message:
            "External breach scanning currently supports email accounts.",
        },
      });
    }

    // =========================
    // HIBP CHECK
    // =========================

    const result = await checkEmailBreach(account.value);

    account.lastChecked = new Date();

    // =========================
    // NO BREACH
    // =========================

    if (!result.breached) {
      account.status = "safe";
      account.riskScore = 0;

      await account.save();

      await createAuditLog({
        userId: req.user.userId,
        action: "ACCOUNT_CHECKED",
        category: "monitoring",
        description: `No known breach found for ${account.type} account`,
        req,
        metadata: {
          monitoredAccountId: account._id,
          breachFound: false,
        },
      });

      return res.status(200).json({
        success: true,
        message: "No known breach found",
        account,
        scan: {
          supported: true,
          breached: false,
          externalBreachScan: true,
          lastChecked: account.lastChecked,
        },
      });
    }

    // =========================
    // PROCESS BREACHES
    // =========================

    const createdBreaches = [];

    for (const hibpBreach of result.breaches) {
      const breachName =
        hibpBreach.Name || "Unknown Breach";

      const existingBreach = await Breach.findOne({
        monitoredAccountId: account._id,
        breachName,
        source: "Have I Been Pwned",
      });

      if (existingBreach) {
        continue;
      }

      const exposedData = (
        hibpBreach.DataClasses || []
      ).map((item) =>
        item.toLowerCase().replace(/\s+/g, "_")
      );

      const breach = await Breach.create({
        monitoredAccountId: account._id,
        source: "Have I Been Pwned",
        breachName,
        breachDate: hibpBreach.BreachDate
          ? new Date(hibpBreach.BreachDate)
          : null,
        dataExposed: exposedData,
        severity: "high",
        description:
          hibpBreach.Description ||
          `Credentials or personal information associated with this account appeared in the ${breachName} breach.`,
      });

      createdBreaches.push(breach);

      // =========================
      // RISK ENGINE
      // =========================

      const risk = calculateRiskScore(breach);

      account.riskScore = Math.max(
        account.riskScore || 0,
        risk.score
      );

      if (
        risk.level === "critical" ||
        risk.level === "high"
      ) {
        account.status = "breached";
      } else if (risk.level === "medium") {
        account.status = "at_risk";
      } else {
        account.status = "safe";
      }
// =========================
// ATTACK IMPACT ANALYSIS
// =========================

let attackImpact = null;

try {
  attackImpact = calculateAttackImpact(breach);

  console.log(
    "🎯 Attack Impact calculated:",
    attackImpact
  );
} catch (impactError) {
  console.error(
    "⚠️ Attack Impact Error:",
    impactError.message
  );

  attackImpact = {
    available: false,
    error: "Attack impact analysis unavailable",
  };
}
      // =========================
      // SECURITY ALERT
      // =========================

      await createSecurityAlert({
        userId: req.user.userId,
        monitoredAccountId: account._id,
        type:
          risk.level === "critical"
            ? "critical_risk"
            : risk.level === "high"
            ? "high_risk"
            : "security_breach",
        severity: risk.level,
        title:
          risk.level === "critical"
            ? "Critical Security Breach Detected"
            : risk.level === "high"
            ? "High Risk Security Breach"
            : "Security Breach Detected",
        message: `A ${risk.level} breach was detected for your ${account.type} account. Risk score: ${risk.score}/100.`,
        riskScore: risk.score,
      });

      // =========================
      // AUDIT LOG
      // =========================

      await createAuditLog({
        userId: req.user.userId,
        action: "BREACH_DETECTED",
        category: "breach",
        description:
          `External breach detected for ${account.type} account`,
        req,
        metadata: {
          monitoredAccountId: account._id,
          breachId: breach._id,
          breachName,
          source: "Have I Been Pwned",
          riskScore: risk.score,
          riskLevel: risk.level,
          dataExposed: exposedData,
        },
      });
    }

    await account.save();

    return res.status(200).json({
      success: true,
      message:
        createdBreaches.length > 0
          ? "Breach detected and security risk updated"
          : "Known breaches found, no new breach records created",
      account,
      scan: {
        supported: true,
        breached: true,
        externalBreachScan: true,
        totalBreachesFound: result.breaches.length,
        newBreaches: createdBreaches.length,
        lastChecked: account.lastChecked,
      },
    });

  } catch (error) {
    console.error(
      "❌ CHECK ACCOUNT ERROR:",
      error
    );

    console.error(
      "❌ MESSAGE:",
      error.message
    );

    console.error(
      "❌ STACK:",
      error.stack
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to check monitored account",
    });
  }
};


/* =========================
   DELETE MONITORED ACCOUNT
========================= */

const deleteMonitoredAccount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Account ID is required",
      });
    }

    const account =
      await MonitoredAccount.findOneAndDelete({
        _id: id,
        userId: req.user.userId,
      });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Monitored account not found",
      });
    }

    /* =========================
       Audit Log
    ========================= */

    await createAuditLog({
      userId: req.user.userId,
      action: "ACCOUNT_UNMONITORED",
      category: "monitoring",
      description: `Removed ${account.type} account from security monitoring`,
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Monitored account deleted successfully",
      account,
    });
  } catch (error) {
    console.error(
      "Delete Monitored Account Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete monitored account",
    });
  }
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  addMonitoredAccount,
  getMonitoredAccounts,
  deleteMonitoredAccount,
  checkMonitoredAccount,
};
