/*
  ============================================
  CREDGUARD AI - MONITORING SERVICE
  ============================================

  Purpose:
  - Check monitored accounts
  - Simulate external breach detection
  - Avoid duplicate breach creation
  - Create new breach records
  - Run Risk Engine
  - Run Attack Impact Analysis
  - Run Threat Intelligence
  - Create Security Alert
  - Update monitored account status

  NOTE:
  This version uses MOCK breach data because
  HIBP API requires an active subscription.

  Later HIBP can be connected without changing
  the complete security-analysis pipeline.
*/

const MonitoredAccount = require("../models/MonitoredAccount");
const Breach = require("../models/Breach");

const {
  calculateRiskScore,
} = require("./riskEngine");

const {
  calculateAttackImpact,
} = require("./attackImpactService");

const {
  analyzeThreatIntelligence,
} = require("./threatIntelligenceService");

const {
  createSecurityAlert,
} = require("./alertService");

const {
  createAuditLog,
} = require("./auditService");


/* =====================================================
   MOCK BREACH DATABASE
===================================================== */

const getMockBreaches = (account) => {
  /*
    Currently this simulates what an external breach
    provider such as HIBP could return.
  */

  if (!account || !account.value) {
    return [];
  }

  return [
    {
      source: "CredGuard Monitoring Demo",

      breachName:
        "Automatic Credential Exposure Detection",

      breachDate:
        new Date(),

      dataExposed: [
        "email_addresses",
        "usernames",
        "passwords",
        "phone_numbers",
      ],

      severity: "critical",

      description:
        "Simulated breach detected automatically by CredGuard monitoring service.",
    },
  ];
};


/* =====================================================
   CHECK ONE MONITORED ACCOUNT
===================================================== */

const checkMonitoredAccount = async (
  account
) => {
  if (!account) {
    throw new Error(
      "Monitored account is required"
    );
  }

  console.log(
    "🔍 Checking monitored account:",
    account.value
  );


  /* =====================================================
     GET EXTERNAL / MOCK BREACHES
  ===================================================== */

  const detectedBreaches =
    getMockBreaches(account);


  console.log(
    `🔎 ${detectedBreaches.length} possible breach(s) found`
  );


  const results = [];


  /* =====================================================
     PROCESS EACH BREACH
  ===================================================== */

  for (
    const breachData of detectedBreaches
  ) {

    /* ===================================================
       DUPLICATE CHECK
    =================================================== */

    const existingBreach =
      await Breach.findOne({
        monitoredAccountId:
          account._id,

        breachName:
          breachData.breachName,

        source:
          breachData.source,
      });


    if (existingBreach) {

      console.log(
        "ℹ️ Breach already exists:",
        existingBreach._id
      );

      results.push({
        created: false,

        duplicate: true,

        breach:
          existingBreach,
      });

      continue;
    }


    /* ===================================================
       CREATE BREACH
    =================================================== */

    const breach =
      await Breach.create({

        monitoredAccountId:
          account._id,

        source:
          breachData.source,

        breachName:
          breachData.breachName,

        breachDate:
          breachData.breachDate,

        dataExposed:
          breachData.dataExposed,

        severity:
          breachData.severity,

        description:
          breachData.description,
      });


    console.log(
      "🚨 Automatic breach created:",
      breach._id
    );


    /* ===================================================
       RISK ENGINE
    =================================================== */

    const risk =
      calculateRiskScore(
        breach
      );


    console.log(
      "🧠 Automatic risk result:",
      risk
    );


    /* ===================================================
       ATTACK IMPACT
    =================================================== */

    let attackImpact = null;

    try {

      attackImpact =
        calculateAttackImpact(
          breach
        );

    } catch (error) {

      console.error(
        "⚠️ Attack Impact Error:",
        error.message
      );

      attackImpact = {
        available: false,

        error:
          "Attack impact analysis unavailable",
      };
    }


    /* ===================================================
       THREAT INTELLIGENCE
    =================================================== */

    let threatIntelligence =
      null;

    try {

      threatIntelligence =
        analyzeThreatIntelligence(
          breach
        );

    } catch (error) {

      console.error(
        "⚠️ Threat Intelligence Error:",
        error.message
      );

      threatIntelligence = {
        available: false,

        error:
          "Threat intelligence analysis unavailable",
      };
    }


    /* ===================================================
       UPDATE ACCOUNT RISK
    =================================================== */

    account.riskScore =
      Math.max(
        account.riskScore || 0,

        risk.score
      );


    /* ===================================================
       UPDATE ACCOUNT STATUS
    =================================================== */

    if (
      risk.level === "critical" ||
      risk.level === "high"
    ) {

      account.status =
        "breached";

    } else if (
      risk.level === "medium"
    ) {

      account.status =
        "at_risk";

    } else {

      account.status =
        "safe";
    }


    account.lastChecked =
      new Date();


    await account.save();


    /* ===================================================
       SECURITY ALERT
    =================================================== */

    let alertType =
      "security_breach";


    if (
      risk.level === "critical"
    ) {

      alertType =
        "critical_risk";

    } else if (
      risk.level === "high"
    ) {

      alertType =
        "high_risk";
    }


    let alertResult = {
      created: false,
      alert: null,
    };


    try {

      alertResult =
        await createSecurityAlert({

          userId:
            account.userId,

          monitoredAccountId:
            account._id,

          type:
            alertType,

          severity:
            risk.level,

          title:
            risk.level === "critical"
              ? "Critical Security Breach Detected"
              : risk.level === "high"
              ? "High Risk Security Breach"
              : "Security Breach Detected",

          message:
            `A ${risk.level} risk breach was automatically detected for your ${account.type} account. Risk score: ${risk.score}/100.`,

          riskScore:
            risk.score,
        });

    } catch (alertError) {

      console.error(
        "⚠️ Security Alert Error:",
        alertError.message
      );
    }


    /* ===================================================
       AUDIT LOG
    =================================================== */

    try {

      await createAuditLog({

        userId:
          account.userId,

        action:
          "AUTOMATIC_BREACH_DETECTED",

        category:
          "breach",

        description:
          `Automatic security breach detected for ${account.type} account`,

        metadata: {

          breachId:
            breach._id,

          monitoredAccountId:
            account._id,

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

          attackImpact:
            attackImpact,

          threatIntelligence:
            threatIntelligence,

          alertCreated:
            alertResult.created,

          dataExposed:
            breach.dataExposed,
        },
      });

    } catch (auditError) {

      console.error(
        "⚠️ Audit Log Error:",
        auditError.message
      );
    }


    /* ===================================================
       SAVE RESULT
    =================================================== */

    results.push({

      created: true,

      duplicate: false,

      breach,

      risk,

      attackImpact,

      threatIntelligence,

      accountStatus:
        account.status,

      alert: {

        created:
          alertResult.created,

        id:
          alertResult.alert?._id ||
          null,
      },
    });
  }


  /* =====================================================
     FINAL ACCOUNT CHECK
  ===================================================== */

  account.lastChecked =
    new Date();

  await account.save();


  return {

    account: {

      id:
        account._id,

      type:
        account.type,

      value:
        account.value,

      label:
        account.label,

      status:
        account.status,

      riskScore:
        account.riskScore,

      lastChecked:
        account.lastChecked,
    },

    breachesChecked:
      detectedBreaches.length,

    results,
  };
};


/* =====================================================
   CHECK ALL MONITORED ACCOUNTS
===================================================== */

const runMonitoringCycle =
  async (userId = null) => {

    const query = userId
      ? { userId }
      : {};


    const accounts =
      await MonitoredAccount.find(
        query
      );


    console.log(
      `🔄 Monitoring ${accounts.length} account(s)...`
    );


    const results = [];


    for (
      const account of accounts
    ) {

      try {

        const result =
          await checkMonitoredAccount(
            account
          );

        results.push(
          result
        );

      } catch (error) {

        console.error(
          `❌ Monitoring failed for ${account.value}:`,
          error.message
        );

        results.push({

          accountId:
            account._id,

          account:
            account.value,

          success: false,

          error:
            error.message,
        });
      }
    }


    return {

      success: true,

      accountsChecked:
        accounts.length,

      results,
    };
  };


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {

  checkMonitoredAccount,

  runMonitoringCycle,
};