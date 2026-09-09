/*
  ============================================
  CREDGUARD AI - THREAT INTELLIGENCE SERVICE
  ============================================
*/

const analyzeThreatIntelligence = (breach) => {
  if (!breach) {
    throw new Error("Breach data is required");
  }

  const dataExposed = Array.isArray(breach.dataExposed)
    ? breach.dataExposed.map((item) =>
        String(item).toLowerCase().trim()
      )
    : [];

  const severity = String(
    breach.severity || "low"
  ).toLowerCase();

  const threats = [];
  const indicators = [];
  const defensiveActions = [];

  const has = (...keywords) =>
    dataExposed.some((item) =>
      keywords.some((keyword) =>
        item.includes(keyword)
      )
    );

  /*
    ============================================
    1. CREDENTIAL COMPROMISE
  ============================================
  */

  if (has("password")) {
    threats.push({
      type: "credential_attack",
      name: "Credential-Based Attack",
      likelihood: "high",
      description:
        "Exposed passwords may enable unauthorized access and credential-stuffing attacks.",
    });

    indicators.push({
      type: "credential_exposure",
      value: "password",
      significance: "critical",
    });

    defensiveActions.push(
      "Immediately change the affected password.",
      "Reset the same password anywhere it was reused.",
      "Invalidate active sessions after password reset."
    );
  }

  /*
    ============================================
    2. PHISHING
  ============================================
  */

  if (has("email")) {
    threats.push({
      type: "phishing",
      name: "Targeted Phishing",
      likelihood: "high",
      description:
        "Exposed email addresses can be used for targeted phishing and credential theft.",
    });

    indicators.push({
      type: "email_exposure",
      value: "email_address",
      significance: "high",
    });

    defensiveActions.push(
      "Monitor suspicious emails and phishing attempts."
    );
  }

  /*
    ============================================
    3. PHONE / SIM SWAP
  ============================================
  */

  if (has("phone", "mobile")) {
    threats.push({
      type: "social_engineering",
      name: "Phone-Based Social Engineering",
      likelihood: "high",
      description:
        "Exposed phone information may increase the risk of social engineering and SIM-swap attacks.",
    });

    indicators.push({
      type: "phone_exposure",
      value: "phone_number",
      significance: "high",
    });

    defensiveActions.push(
      "Monitor unexpected calls, SMS messages and SIM-related activity.",
      "Contact the mobile provider if suspicious SIM activity occurs."
    );
  }

  /*
    ============================================
    4. USERNAME / ACCOUNT ENUMERATION
  ============================================
  */

  if (has("username")) {
    threats.push({
      type: "account_enumeration",
      name: "Account Enumeration",
      likelihood: "medium",
      description:
        "Exposed usernames can help attackers identify valid accounts.",
    });

    indicators.push({
      type: "username_exposure",
      value: "username",
      significance: "medium",
    });
  }

  /*
    ============================================
    5. IDENTITY PROFILING
  ============================================
  */

  if (
    has(
      "address",
      "physical_address",
      "street_address",
      "home_address",
      "date_of_birth",
      "date of birth",
      "dob"
    )
  ) {
    threats.push({
      type: "identity_profiling",
      name: "Identity Profiling",
      likelihood: "medium",
      description:
        "Exposed identity attributes may help attackers build a detailed victim profile.",
    });

    indicators.push({
      type: "identity_data_exposure",
      value: "identity_attributes",
      significance: "medium",
    });

    defensiveActions.push(
      "Review account recovery and identity verification settings."
    );
  }

  /*
    ============================================
    6. SECURITY QUESTION / RECOVERY ATTACK
  ============================================
  */

  if (
    has(
      "security question",
      "security questions",
      "recovery",
      "recovery information"
    )
  ) {
    threats.push({
      type: "account_recovery_attack",
      name: "Account Recovery Abuse",
      likelihood: "high",
      description:
        "Exposed recovery information may allow attackers to target account recovery mechanisms.",
    });

    indicators.push({
      type: "recovery_information_exposure",
      value: "security_information",
      significance: "high",
    });

    defensiveActions.push(
      "Update security questions and account recovery information."
    );
  }

  /*
    ============================================
    7. MULTI-DATA CORRELATION
  ============================================
  */

  if (dataExposed.length >= 4) {
    threats.push({
      type: "multi_vector_attack",
      name: "Multi-Vector Attack Potential",
      likelihood: "critical",
      description:
        "Multiple exposed data categories can be correlated to create more targeted attacks.",
    });

    indicators.push({
      type: "multi_data_exposure",
      value: `${dataExposed.length}_data_categories`,
      significance: "critical",
    });

    defensiveActions.push(
      "Treat the incident as a high-priority security event."
    );
  }

  /*
    ============================================
    8. SEVERITY INDICATOR
  ============================================
  */

  if (severity === "critical") {
    indicators.push({
      type: "breach_severity",
      value: "critical",
      significance: "critical",
    });
  } else if (severity === "high") {
    indicators.push({
      type: "breach_severity",
      value: "high",
      significance: "high",
    });
  }

  /*
    ============================================
    9. THREAT LEVEL
  ============================================
  */

  let threatLevel = "low";

  if (
    severity === "critical" ||
    threats.some(
      (threat) => threat.likelihood === "critical"
    )
  ) {
    threatLevel = "critical";
  } else if (
    severity === "high" ||
    threats.some(
      (threat) => threat.likelihood === "high"
    )
  ) {
    threatLevel = "high";
  } else if (threats.length > 0) {
    threatLevel = "medium";
  }

  /*
    ============================================
    10. THREAT SUMMARY
  ============================================
  */

  let summary =
    "No significant threat patterns were identified from the exposed data.";

  if (threatLevel === "medium") {
    summary =
      "Moderate threat activity is possible based on the exposed information.";
  }

  if (threatLevel === "high") {
    summary =
      "Multiple high-probability attack patterns were identified. Increased monitoring is recommended.";
  }

  if (threatLevel === "critical") {
    summary =
      "Critical threat patterns identified. Multiple exposed data types could be combined for coordinated attacks.";
  }

  /*
    ============================================
    11. DEFAULT DEFENSIVE ACTIONS
  ============================================
  */

  const defaultActions = [
    "Enable multi-factor authentication.",
    "Review recent account activity.",
    "Monitor the affected identity for suspicious activity.",
  ];

  for (const action of defaultActions) {
    if (!defensiveActions.includes(action)) {
      defensiveActions.push(action);
    }
  }

  /*
    ============================================
    12. ATTACK CAPABILITIES
  ============================================
  */

  const compromisedCapabilities = [];

  if (has("password")) {
    compromisedCapabilities.push(
      "Unauthorized account access",
      "Credential stuffing against other services"
    );
  }

  if (has("email")) {
    compromisedCapabilities.push(
      "Targeted phishing",
      "Email-based social engineering"
    );
  }

  if (has("phone", "mobile")) {
    compromisedCapabilities.push(
      "Phone-based phishing",
      "SIM-swap targeting"
    );
  }

  if (has("username")) {
    compromisedCapabilities.push(
      "Account discovery"
    );
  }

  if (
    has(
      "address",
      "physical_address",
      "street_address",
      "home_address",
      "date_of_birth",
      "date of birth",
      "dob"
    )
  ) {
    compromisedCapabilities.push(
      "Identity profiling"
    );
  }

  if (dataExposed.length >= 4) {
    compromisedCapabilities.push(
      "Cross-data identity profiling"
    );
  }

  /*
    ============================================
    FINAL RESULT
  ============================================
  */

  return {
    available: true,

    threatLevel,

    summary,

    threats,

    indicators,

    compromisedCapabilities,

    defensiveActions,

    analyzedAt: new Date(),
  };
};

module.exports = {
  analyzeThreatIntelligence,
};