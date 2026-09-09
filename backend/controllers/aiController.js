const {
  createSecurityAlert,
} = require("../services/alertService");
const Breach = require("../models/Breach");

const MonitoredAccount = require("../models/MonitoredAccount");
const { calculateRiskScore } = require("../services/riskEngine");
const {
  analyzeSecurityRisk,
} = require("../services/aiSecurityService");

const analyzeBreachWithAI = async (req, res) => {
  try {
    const { breachId } = req.body;

    if (!breachId) {
      return res.status(400).json({
        success: false,
        message: "breachId is required",
      });
    }

    // 1. Find breach
    const breach = await Breach.findById(breachId);

    if (!breach) {
      return res.status(404).json({
        success: false,
        message: "Breach not found",
      });
    }

    // 2. Verify ownership
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

    // 3. Calculate risk
    const risk = calculateRiskScore(breach);

    // 4. Generate AI analysis
    const analysis = await analyzeSecurityRisk(
      breach,
      risk
    );

    // 5. Update account
    monitoredAccount.riskScore = risk.score;
    monitoredAccount.lastChecked = new Date();

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

    await monitoredAccount.save();
const alert = await createSecurityAlert({
  userId: req.user.userId,
  monitoredAccountId: monitoredAccount._id,
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
  message: `A ${risk.level} security risk was detected for your ${breach.breachName} breach. Risk score: ${risk.score}/100.`,
  riskScore: risk.score,
});
    res.status(200).json({
      success: true,
      message: "AI security analysis completed",
      risk: {
        score: risk.score,
        level: risk.level,
        severity: breach.severity,
      },
      analysis,
      alert,
      account: {
        id: monitoredAccount._id,
        status: monitoredAccount.status,
        riskScore: monitoredAccount.riskScore,
      },
    });
  } catch (error) {
    console.error(
      "AI Analysis Error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "AI analysis failed",
    });
  }
};

module.exports = {
  analyzeBreachWithAI,
};