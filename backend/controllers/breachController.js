const mongoose = require("mongoose");
const ProtectionPlan = require("../models/ProtectionPlan");
const Breach = require("../models/Breach");
const MonitoredAccount = require("../models/MonitoredAccount");
const {
  generateProtectionPlan,
} = require("../services/protectionService");
const { calculateRiskScore } = require("../services/riskEngine");
const {
  calculateAttackImpact,
} = require("../services/attackImpactService");

const {
  analyzeThreatIntelligence,
} = require("../services/threatIntelligenceService");

const { createSecurityAlert } = require("../services/alertService");

const { createAuditLog } = require("../services/auditService");

const {
  analyzeSecurityIncident,
} = require("../services/aiSecurityAnalysisService");

/* =====================================================
   ADD BREACH
===================================================== */

const addBreach = async (req, res) => {
  try {
    console.log("🔥 ADD BREACH CONTROLLER HIT");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const {
      monitoredAccountId,
      source,
      breachName,
      breachDate,
      dataExposed,
      severity,
      description,
    } = req.body;

    /* =====================================================
       VALIDATION
    ===================================================== */

    const missingFields = [];

    if (!monitoredAccountId) missingFields.push("Account");
    if (!source || !String(source).trim()) missingFields.push("Source");
    if (!breachName || !String(breachName).trim()) {
      missingFields.push("Breach name");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} ${missingFields.length === 1 ? "is" : "are"} required`,
        fields: missingFields,
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required",
      });
    }

    if (!mongoose.isValidObjectId(monitoredAccountId)) {
      return res.status(400).json({
        success: false,
        message: "Account is invalid",
        fields: ["Account"],
      });
    }

    /* =====================================================
       VERIFY ACCOUNT OWNERSHIP
    ===================================================== */

    const monitoredAccount = await MonitoredAccount.findOne({
      _id: monitoredAccountId,
      userId: req.user.userId,
    });

    if (!monitoredAccount) {
      return res.status(404).json({
        success: false,
        message: "Monitored account not found",
      });
    }

    /* =====================================================
       NORMALIZE EXPOSED DATA
    ===================================================== */

    const normalizedData = Array.isArray(dataExposed)
      ? dataExposed.map((item) =>
          String(item)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
        )
      : [];

    /* =====================================================
       DUPLICATE BREACH CHECK
    ===================================================== */

    const existingBreach = await Breach.findOne({
      monitoredAccountId: monitoredAccount._id,
      breachName: breachName.trim(),
      source: source.trim(),
    });

    if (existingBreach) {
      return res.status(409).json({
        success: false,
        message:
          "This breach has already been recorded for this account",
        breach: existingBreach,
      });
    }

    /* =====================================================
       CREATE BREACH
    ===================================================== */

    const breach = await Breach.create({
      monitoredAccountId: monitoredAccount._id,
      source: source.trim(),
      breachName: breachName.trim(),
      breachDate: breachDate || null,
      dataExposed: normalizedData,
      severity: severity || "low",
      description: description || "",
    });

    console.log("🚨 Breach created:", breach._id);

    /* =====================================================
       RISK ENGINE
    ===================================================== */

    const risk = calculateRiskScore(breach);

    console.log("🧠 Risk calculated:", risk);

    /* =====================================================
       ATTACK IMPACT ANALYSIS
    ===================================================== */

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

    /* =====================================================
       THREAT INTELLIGENCE
    ===================================================== */

    let threatIntelligence = null;

    try {
      threatIntelligence =
        analyzeThreatIntelligence(breach);

      console.log(
        "🕵️ Threat Intelligence:",
        threatIntelligence
      );
    } catch (threatError) {
      console.error(
        "⚠️ Threat Intelligence Error:",
        threatError.message
      );

      threatIntelligence = {
        available: false,
        error:
          "Threat intelligence analysis unavailable",
      };
    }

    /* =====================================================
       AI SECURITY ANALYSIS
    ===================================================== */

    let aiAnalysis = null;

    try {
      aiAnalysis =
        await analyzeSecurityIncident({
          breach,
          risk,
          attackImpact,
          threatIntelligence,
        });

      console.log(
        "🤖 AI Security Analysis:",
        aiAnalysis
      );
    } catch (aiError) {
      console.error(
        "⚠️ AI Security Analysis Error:",
        aiError.message
      );

      aiAnalysis = {
        available: false,
        error:
          "AI security analysis unavailable",
      };
    }
   /* =====================================================
   PROTECTION PLAN
===================================================== */

let protectionPlan = null;
console.log("before protection lan");
try {
  const generatedPlan = generateProtectionPlan({
    breach,
    risk,
    attackImpact,
    threatIntelligence,
  });

  console.log("🛡️ GENERATED PLAN:", generatedPlan);

  const savedPlan = await ProtectionPlan.create({
    userId: req.user.userId,
    monitoredAccountId: monitoredAccount._id,
    breachId: breach._id,
    protectionLevel: generatedPlan.protectionLevel,
    totalActions: generatedPlan.totalActions,
    pendingActions: generatedPlan.pendingActions,
    completedActions: generatedPlan.completedActions,
    actions: generatedPlan.actions,
  });

  console.log("✅ PROTECTION PLAN SAVED:", savedPlan._id);

  protectionPlan = {
    available: true,
    id: savedPlan._id,
    protectionLevel: savedPlan.protectionLevel,
    totalActions: savedPlan.totalActions,
    pendingActions: savedPlan.pendingActions,
    completedActions: savedPlan.completedActions,
    actions: savedPlan.actions,
    generatedAt: savedPlan.createdAt,
  };

} catch (protectionError) {

  console.error(
    "❌ PROTECTION PLAN SAVE ERROR:",
    protectionError
  );

  protectionPlan = {
    available: false,
    error: protectionError.message,
  };
}
    /* =====================================================
       UPDATE ACCOUNT RISK
    ===================================================== */

    monitoredAccount.riskScore = Math.max(
      monitoredAccount.riskScore || 0,
      risk.score
    );

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

    /* =====================================================
       SECURITY ALERT
    ===================================================== */

    let alertType = "security_breach";

    if (risk.level === "critical") {
      alertType = "critical_risk";
    } else if (risk.level === "high") {
      alertType = "high_risk";
    }

    const alertResult = await createSecurityAlert({
      userId: req.user.userId,

      monitoredAccountId:
        monitoredAccount._id,

      type: alertType,

      severity: risk.level,

      title:
        risk.level === "critical"
          ? "Critical Security Breach Detected"
          : risk.level === "high"
          ? "High Risk Security Breach"
          : "Security Breach Detected",

      message:
        `A ${risk.level} risk breach was detected for your ${monitoredAccount.type} account. Risk score: ${risk.score}/100.`,

      riskScore: risk.score,
    });

    /* =====================================================
       AUDIT LOG
    ===================================================== */

    await createAuditLog({
      userId: req.user.userId,

      action: "BREACH_DETECTED",

      category: "breach",

      description:
        `Security breach detected for ${monitoredAccount.type} account`,

      req,

      metadata: {
        breachId: breach._id,

        monitoredAccountId:
          monitoredAccount._id,

        breachName:
          breach.breachName,

        source:
          breach.source,

        severity:
          breach.severity,

        riskScore:
          risk.score,

        riskLevel:
          risk.level,

        alertCreated:
          alertResult.created,

        dataExposed:
          normalizedData,

        attackImpactAvailable:
          Boolean(
            attackImpact?.available !== false
          ),

        attackImpact,

        threatIntelligence,

        aiAnalysis,
      },
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Breach detected, analyzed and security response generated",

      breach,

      risk: {
        score: risk.score,

        level: risk.level,

        severity: breach.severity,

        factors: risk.factors || [],

        explanation:
          risk.explanation || "",

        recommendations:
          risk.recommendations || [],
      },

      attackImpact,

      threatIntelligence,

      aiAnalysis,
      protectionPlan,
      accountStatus:
        monitoredAccount.status,

      alert: {
        created:
          alertResult.created,

        id:
          alertResult.alert?._id ||
          null,
      },
    });

  } catch (error) {
    console.error(
      "❌ Breach Detection Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error while processing breach",
    });
  }
};


/* =====================================================
   GET ALL BREACHES
===================================================== */

const getBreaches = async (req, res) => {
  try {
    const accounts =
      await MonitoredAccount.find({
        userId: req.user.userId,
      }).select("_id");

    const accountIds = accounts.map(
      (account) => account._id
    );

    const breaches = await Breach.find({
      monitoredAccountId: {
        $in: accountIds,
      },
    })
      .populate(
        "monitoredAccountId",
        "type value label status riskScore"
      )
      .sort({
        detectedAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: breaches.length,
      breaches,
    });

  } catch (error) {
    console.error(
      "Get Breaches Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch breaches",
    });
  }
};


/* =====================================================
   GET SINGLE BREACH DETAILS
===================================================== */

const getBreachById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Breach ID is required",
      });
    }

    const accounts =
      await MonitoredAccount.find({
        userId: req.user.userId,
      }).select("_id");

    const accountIds = accounts.map(
      (account) => account._id
    );

    const breach =
      await Breach.findOne({
        _id: id,

        monitoredAccountId: {
          $in: accountIds,
        },
      }).populate(
        "monitoredAccountId",
        "type value label status riskScore lastChecked"
      );

    if (!breach) {
      return res.status(404).json({
        success: false,
        message: "Breach not found",
      });
    }

    /* =====================================================
       CURRENT RISK
    ===================================================== */

    const risk =
      calculateRiskScore(breach);

    /* =====================================================
       CURRENT ATTACK IMPACT
    ===================================================== */

    let attackImpact = null;

    try {
      attackImpact =
        calculateAttackImpact(breach);
    } catch (impactError) {
      console.error(
        "Attack Impact Details Error:",
        impactError.message
      );

      attackImpact = {
        available: false,
        error:
          "Attack impact analysis unavailable",
      };
    }

    /* =====================================================
       THREAT INTELLIGENCE
    ===================================================== */

    let threatIntelligence = null;

    try {
      threatIntelligence =
        analyzeThreatIntelligence(breach);
    } catch (error) {
      threatIntelligence = {
        available: false,
        error:
          "Threat intelligence analysis unavailable",
      };
    }

    return res.status(200).json({
      success: true,

      breach,

      risk: {
        score: risk.score,

        level: risk.level,

        factors: risk.factors || [],

        explanation:
          risk.explanation || "",

        recommendations:
          risk.recommendations || [],
      },

      attackImpact,

      threatIntelligence,

      exposure: {
        total:
          breach.dataExposed?.length || 0,

        data:
          breach.dataExposed || [],
      },

      timeline: {
        breachDate:
          breach.breachDate,

        detectedAt:
          breach.detectedAt,

        createdAt:
          breach.createdAt,

        updatedAt:
          breach.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Get Breach Details Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch breach details",
    });
  }
};


/* =====================================================
   GET BREACHES FOR ONE MONITORED ACCOUNT
===================================================== */

const getAccountBreaches = async (
  req,
  res
) => {
  try {
    const { accountId } = req.params;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message:
          "Account ID is required",
      });
    }

    /* =====================================================
       VERIFY ACCOUNT OWNERSHIP
    ===================================================== */

    const account =
      await MonitoredAccount.findOne({
        _id: accountId,

        userId:
          req.user.userId,
      });

    if (!account) {
      return res.status(404).json({
        success: false,
        message:
          "Monitored account not found",
      });
    }

    const breaches =
      await Breach.find({
        monitoredAccountId:
          account._id,
      }).sort({
        detectedAt: -1,
      });

    /* =====================================================
       RISK SUMMARY
    ===================================================== */

    let highestRisk = 0;
    let highestLevel = "low";

    breaches.forEach((breach) => {
      const risk =
        calculateRiskScore(breach);

      if (risk.score > highestRisk) {
        highestRisk = risk.score;
        highestLevel = risk.level;
      }
    });

    return res.status(200).json({
      success: true,

      account: {
        id: account._id,

        type: account.type,

        value: account.value,

        label: account.label,

        status: account.status,

        riskScore: account.riskScore,

        lastChecked:
          account.lastChecked,
      },

      count:
        breaches.length,

      risk: {
        score:
          highestRisk,

        level:
          highestLevel,
      },

      breaches,
    });

  } catch (error) {
    console.error(
      "Get Account Breaches Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch account breaches",
    });
  }
};


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {
  addBreach,
  getBreaches,
  getBreachById,
  getAccountBreaches,
};