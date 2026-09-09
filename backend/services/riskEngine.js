/*
  ============================================
  CREDGUARD AI - EXPLAINABLE RISK ENGINE
  ============================================
*/

const calculateRiskScore = (breach) => {
  let score = 0;
  const factors = [];

  const dataExposed = Array.isArray(breach?.dataExposed)
    ? [...new Set(
        breach.dataExposed.map((item) =>
          String(item).toLowerCase().trim()
        )
      )]
    : [];

  const requestedSeverity = String(
    breach?.severity || "low"
  ).toLowerCase();

  const severity = [
    "low",
    "medium",
    "high",
    "critical",
  ].includes(requestedSeverity)
    ? requestedSeverity
    : "low";

  /*
    ============================================
    1. SEVERITY
    ============================================
  */

  const severityPoints = {
    critical: 35,
    high: 25,
    medium: 15,
    low: 5,
  };

  const severityScore =
    severityPoints[severity] ?? 5;

  score += severityScore;

  factors.push({
    type: "severity",
    label: "Breach Severity",
    value: severity,
    impact: severityScore,
    description: `${severity} severity breach detected.`,
  });

  /*
    ============================================
    2. EXPOSED DATA
    ============================================
  */

  const dataRules = [
    {
      keywords: ["password", "passwords", "credential", "credentials"],
      label: "Passwords / Credentials Exposed",
      impact: 30,
      action: "Immediately reset the affected password.",
      description:
        "Password exposure can enable unauthorized account access and credential stuffing.",
    },
    {
      keywords: ["phone", "phone number", "phone numbers", "mobile"],
      label: "Phone Information Exposed",
      impact: 10,
      action:
        "Monitor unexpected calls, SMS messages and SIM-related activity.",
      description:
        "Phone exposure increases phishing, smishing and SIM-swap risk.",
    },
    {
      keywords: ["username", "usernames"],
      label: "Username Exposed",
      impact: 5,
      action:
        "Monitor the affected identity for account-enumeration attempts.",
      description:
        "Usernames can help attackers identify valid accounts.",
    },
    {
      keywords: ["email", "emails", "email address", "email addresses"],
      label: "Email Address Exposed",
      impact: 10,
      action:
        "Enable MFA and monitor suspicious emails and login attempts.",
      description:
        "Email exposure increases phishing and credential-stuffing risk.",
    },
    {
      keywords: [
        "address",
        "physical_address",
        "physical_addresses",
        "street_address",
        "home_address",
      ],
      label: "Address Information Exposed",
      impact: 8,
      action:
        "Monitor identity-related and social-engineering activity.",
      description:
        "Address exposure creates additional privacy and targeting risk.",
    },
    {
      keywords: [
        "security question",
        "security questions",
      ],
      label: "Security Questions Exposed",
      impact: 15,
      action:
        "Update account recovery and security-question settings.",
      description:
        "Security-question exposure can weaken account recovery mechanisms.",
    },
    {
      keywords: [
        "date of birth",
        "dob",
        "date_of_birth",
      ],
      label: "Date of Birth Exposed",
      impact: 8,
      action:
        "Monitor for identity-verification and impersonation attempts.",
      description:
        "Identity information can contribute to impersonation attacks.",
    },
  ];

  const protectionActions = [];

  for (const rule of dataRules) {
    const matched = dataExposed.some((item) =>
      rule.keywords.some((keyword) =>
        item.includes(keyword)
      )
    );

    if (matched) {
      score += rule.impact;

      factors.push({
        type: "exposure",
        label: rule.label,
        value: "Exposed",
        impact: rule.impact,
        description: rule.description,
      });

      protectionActions.push(rule.action);
    }
  }

  /*
    ============================================
    3. MULTIPLE DATA TYPES
    ============================================
  */

  if (dataExposed.length >= 4) {
    score += 8;

    factors.push({
      type: "exposure_volume",
      label: "Multiple Data Categories",
      value: `${dataExposed.length} categories`,
      impact: 8,
      description:
        "Multiple exposed data categories increase the overall attack surface.",
    });
  } else if (dataExposed.length >= 2) {
    score += 4;

    factors.push({
      type: "exposure_volume",
      label: "Multiple Data Categories",
      value: `${dataExposed.length} categories`,
      impact: 4,
      description:
        "Multiple exposed data categories increase attack surface.",
    });
  }

  /*
    ============================================
    4. BREACH RECENCY
    ============================================
  */

  let breachAgeDays = null;

  if (breach?.breachDate) {
    const breachDate = new Date(breach.breachDate);

    if (!Number.isNaN(breachDate.getTime())) {
      breachAgeDays = Math.max(
        0,
        Math.floor(
          (Date.now() - breachDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

      if (breachAgeDays <= 90) {
        score += 12;

        factors.push({
          type: "recency",
          label: "Recent Breach",
          value: `${breachAgeDays} days ago`,
          impact: 12,
          description:
            "Recent breaches may represent an active security threat.",
        });
      } else if (breachAgeDays <= 365) {
        score += 6;

        factors.push({
          type: "recency",
          label: "Moderately Recent Breach",
          value: `${breachAgeDays} days ago`,
          impact: 6,
          description:
            "The breach remains relevant for security monitoring.",
        });
      }
    }
  }

  /*
    ============================================
    5. FINAL SCORE
    ============================================
  */

  const severityMinimum = {
    low: 0,
    medium: 26,
    high: 50,
    critical: 75,
  };

  score = Math.min(
    Math.max(
      Math.round(score),
      severityMinimum[severity]
    ),
    100
  );

  /*
    ============================================
    6. RISK LEVEL
    ============================================
  */

  let level = "low";

  if (score >= 75) {
    level = "critical";
  } else if (score >= 50) {
    level = "high";
  } else if (score >= 26) {
    level = "medium";
  }

  /*
    ============================================
    7. RESPONSE PRIORITY
    ============================================
  */

  let responsePriority = "MONITOR";

  if (level === "critical") {
    responsePriority = "IMMEDIATE";
  } else if (level === "high") {
    responsePriority = "URGENT";
  } else if (level === "medium") {
    responsePriority = "ACTION_REQUIRED";
  }

  /*
    ============================================
    8. EXPLANATION
    ============================================
  */

  let explanation = "";

  if (level === "critical") {
    explanation =
      "Critical risk detected. Multiple high-impact security indicators require immediate protective action.";
  } else if (level === "high") {
    explanation =
      "High security risk detected. Exposed information could significantly increase account compromise and targeted attack risk.";
  } else if (level === "medium") {
    explanation =
      "Moderate security risk detected. Security-relevant information was exposed and should be remediated and monitored.";
  } else {
    explanation =
      "Low security risk detected. Continue monitoring the affected account and maintain strong security controls.";
  }

  /*
    ============================================
    9. DEFAULT PROTECTION ACTIONS
    ============================================
  */

  if (
    dataExposed.some((item) =>
      item.includes("password") ||
      item.includes("credential")
    )
  ) {
    protectionActions.push(
      "Check for password reuse on other services."
    );

    protectionActions.push(
      "Revoke active sessions after password reset where supported."
    );
  }

  if (
    dataExposed.some((item) =>
      item.includes("email")
    )
  ) {
    protectionActions.push(
      "Enable multi-factor authentication."
    );
  }

  protectionActions.push(
    "Review recent login and account activity."
  );

  protectionActions.push(
    "Continue monitoring the affected identity for future breaches."
  );

  const uniqueProtectionActions = [
    ...new Set(protectionActions),
  ];

  /*
    ============================================
    10. CONTAINMENT ACTIONS
    ============================================
  */

  const containmentActions = [];

  if (level === "critical" || level === "high") {
    containmentActions.push(
      "Immediately secure the affected account."
    );

    containmentActions.push(
      "Review and revoke suspicious active sessions where supported."
    );

    containmentActions.push(
      "Enable multi-factor authentication."
    );
  }

  if (
    dataExposed.some((item) =>
      item.includes("password") ||
      item.includes("credential")
    )
  ) {
    containmentActions.push(
      "Force password reset workflow."
    );
  }

  if (
    dataExposed.some((item) =>
      item.includes("phone")
    )
  ) {
    containmentActions.push(
      "Increase monitoring for SIM-swap and phone-based attacks."
    );
  }

  /*
    ============================================
    11. PREDICTIVE RISK SIGNALS
    ============================================
  */

  const predictiveSignals = [];

  if (dataExposed.length >= 3) {
    predictiveSignals.push(
      "High exposure volume may increase future attack probability."
    );
  }

  if (
    dataExposed.some((item) =>
      item.includes("password") ||
      item.includes("credential")
    )
  ) {
    predictiveSignals.push(
      "Credential exposure creates elevated future account-compromise risk."
    );
  }

  if (
    breachAgeDays !== null &&
    breachAgeDays <= 90
  ) {
    predictiveSignals.push(
      "Recent breach activity indicates elevated near-term threat relevance."
    );
  }

  if (level === "critical") {
    predictiveSignals.push(
      "Critical risk requires continuous monitoring and immediate remediation."
    );
  }

  /*
    ============================================
    12. RISK TREND
    ============================================
  */

  let riskTrend = "stable";

  if (
    level === "critical" ||
    score >= 70
  ) {
    riskTrend = "increasing";
  } else if (score >= 40) {
    riskTrend = "elevated";
  }

  /*
    ============================================
    13. FINAL RESULT
    ============================================
  */

  return {
    score,
    level,

    responsePriority,

    riskTrend,

    factors,

    explanation,

    recommendations: uniqueProtectionActions,

    protectionActions: uniqueProtectionActions,

    containmentActions: [
      ...new Set(containmentActions),
    ],

    predictiveSignals: [
      ...new Set(predictiveSignals),
    ],

    exposureSummary: {
      totalCategories: dataExposed.length,
      categories: dataExposed,
    },

    breachContext: {
      severity,
      breachAgeDays,
      recent:
        breachAgeDays !== null &&
        breachAgeDays <= 90,
    },

    analyzedAt: new Date(),
  };
};

module.exports = {
  calculateRiskScore,
};