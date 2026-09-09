/*
  ============================================
  CREDGUARD AI - PROTECTION SERVICE
  ============================================

  Purpose:
  - Convert security findings into protective actions
  - Prioritize actions according to risk
  - Track what should be protected after a breach

  NOTE:
  This service does NOT directly change passwords,
  revoke sessions or lock external accounts.
  It generates safe, actionable protection steps.
*/

const generateProtectionPlan = ({
  breach,
  risk,
  attackImpact,
  threatIntelligence,
}) => {
  if (!breach) {
    throw new Error("Breach data is required");
  }

  const dataExposed = Array.isArray(breach.dataExposed)
    ? breach.dataExposed.map((item) =>
        String(item).toLowerCase().trim()
      )
    : [];

  const riskScore = Number(risk?.score || 0);
  const riskLevel = String(
    risk?.level || "low"
  ).toLowerCase();

  const actions = [];

  const has = (...keywords) =>
    dataExposed.some((item) =>
      keywords.some((keyword) =>
        item.includes(keyword)
      )
    );

  const addAction = ({
    type,
    priority,
    title,
    description,
    reason,
  }) => {
    if (
      !actions.some(
        (action) => action.type === type
      )
    ) {
      actions.push({
        type,
        priority,
        status: "pending",
        title,
        description,
        reason,
      });
    }
  };


  /* ============================================
     1. PASSWORD PROTECTION
  ============================================ */

  if (has("password")) {
    addAction({
      type: "password_reset",
      priority: "critical",
      title: "Reset Exposed Password",
      description:
        "Immediately change the exposed password and avoid reusing it on other services.",
      reason:
        "Password credentials were exposed in the breach.",
    });

    addAction({
      type: "session_revocation",
      priority: "high",
      title: "Review Active Sessions",
      description:
        "Review and revoke suspicious or unnecessary active sessions after changing the password.",
      reason:
        "Previously active sessions may remain valid after credential exposure.",
    });
  }


  /* ============================================
     2. MFA PROTECTION
  ============================================ */

  if (
    has("password", "email", "username") ||
    riskScore >= 60
  ) {
    addAction({
      type: "enable_mfa",
      priority: "high",
      title: "Enable Multi-Factor Authentication",
      description:
        "Enable MFA on the affected account to add an additional authentication layer.",
      reason:
        "Additional authentication protection reduces the impact of compromised credentials.",
    });
  }


  /* ============================================
     3. EMAIL PROTECTION
  ============================================ */

  if (has("email")) {
    addAction({
      type: "phishing_protection",
      priority: "high",
      title: "Activate Phishing Protection",
      description:
        "Monitor suspicious emails, links and login requests targeting the exposed email address.",
      reason:
        "Email exposure increases the likelihood of targeted phishing attacks.",
    });
  }


  /* ============================================
     4. PHONE PROTECTION
  ============================================ */

  if (has("phone", "mobile")) {
    addAction({
      type: "phone_protection",
      priority: "high",
      title: "Protect Phone Account",
      description:
        "Review SIM and carrier security settings and monitor unexpected SIM-related activity.",
      reason:
        "Phone information can be used for social engineering and SIM-swap attempts.",
    });
  }


  /* ============================================
     5. IDENTITY PROTECTION
  ============================================ */

  if (
    has(
      "address",
      "date_of_birth",
      "date of birth",
      "dob"
    )
  ) {
    addAction({
      type: "identity_protection",
      priority: "medium",
      title: "Increase Identity Monitoring",
      description:
        "Monitor for suspicious identity-verification requests and unusual account activity.",
      reason:
        "Identity attributes were exposed and may support impersonation attempts.",
    });
  }


  /* ============================================
     6. ACCOUNT RECOVERY PROTECTION
  ============================================ */

  if (has("security")) {
    addAction({
      type: "recovery_protection",
      priority: "high",
      title: "Secure Account Recovery",
      description:
        "Review and update recovery methods and security questions.",
      reason:
        "Security or recovery information may have been exposed.",
    });
  }


  /* ============================================
     7. CRITICAL RISK RESPONSE
  ============================================ */

  if (riskLevel === "critical") {
    addAction({
      type: "critical_response",
      priority: "critical",
      title: "Activate Critical Incident Response",
      description:
        "Immediately review authentication activity, active sessions and account security controls.",
      reason:
        "The calculated security risk is critical.",
    });
  }


  /* ============================================
     8. HIGH RISK RESPONSE
  ============================================ */

  if (riskLevel === "high") {
    addAction({
      type: "high_risk_monitoring",
      priority: "high",
      title: "Increase Security Monitoring",
      description:
        "Increase monitoring frequency and review suspicious account activity.",
      reason:
        "The calculated security risk is high.",
    });
  }


  /* ============================================
     9. THREAT INTELLIGENCE RESPONSE
  ============================================ */

  if (
    threatIntelligence?.threatLevel ===
    "critical"
  ) {
    addAction({
      type: "threat_response",
      priority: "critical",
      title: "Prioritize Threat Investigation",
      description:
        "Investigate the identified high-impact threat patterns and monitor for related activity.",
      reason:
        "Threat intelligence identified critical attack patterns.",
    });
  }


  /* ============================================
     10. ATTACK IMPACT RESPONSE
  ============================================ */

  if (
    Number(
      attackImpact?.impactScore || 0
    ) >= 80
  ) {
    addAction({
      type: "impact_response",
      priority: "critical",
      title: "Activate High-Impact Protection",
      description:
        "Apply all applicable account protection measures and closely monitor the affected identity.",
      reason:
        "Attack impact assessment indicates a critical potential impact.",
    });
  }


  /* ============================================
     11. ALWAYS-ON MONITORING
  ============================================ */

  addAction({
    type: "continuous_monitoring",
    priority:
      riskScore >= 60 ? "high" : "medium",
    title: "Continue Breach Monitoring",
    description:
      "Continue monitoring the affected identity for new breaches and suspicious activity.",
    reason:
      "Security risk can change as new threat information becomes available.",
  });


  /* ============================================
     12. PRIORITY ORDER
  ============================================ */

  const priorityOrder = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  actions.sort(
    (a, b) =>
      priorityOrder[a.priority] -
      priorityOrder[b.priority]
  );


  /* ============================================
     13. PROTECTION LEVEL
  ============================================ */

  let protectionLevel = "standard";

  if (
    riskLevel === "critical" ||
    actions.some(
      (action) =>
        action.priority === "critical"
    )
  ) {
    protectionLevel = "critical";
  } else if (
    riskLevel === "high"
  ) {
    protectionLevel = "high";
  } else if (
    riskLevel === "medium"
  ) {
    protectionLevel = "moderate";
  }


  /* ============================================
     FINAL RESULT
  ============================================ */

  return {
    available: true,

    protectionLevel,

    totalActions:
      actions.length,

    pendingActions:
      actions.filter(
        (action) =>
          action.status === "pending"
      ).length,

    completedActions:
      actions.filter(
        (action) =>
          action.status === "completed"
      ).length,

    actions,

    generatedAt: new Date(),
  };
};


module.exports = {
  generateProtectionPlan,
};