/*
  ============================================
  CREDGUARD AI - ATTACK IMPACT ANALYSIS
  ============================================

  Analyzes what an attacker could potentially
  do with exposed information.

  Returns:
  - impactScore
  - impactLevel
  - attackVectors
  - compromisedCapabilities
  - priorityActions
  - defensiveControls
*/

const calculateAttackImpact = (breach) => {
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

  let impactScore = 0;

  const attackVectors = [];
  const compromisedCapabilities = [];
  const priorityActions = [];
  const defensiveControls = [];


  const has = (...keywords) =>
    dataExposed.some((item) =>
      keywords.some((keyword) =>
        item.includes(keyword)
      )
    );


  /* ============================================
     1. PASSWORD EXPOSURE
  ============================================ */

  if (has("password")) {
    impactScore += 30;

    attackVectors.push({
      type: "credential_compromise",
      title: "Credential Compromise",
      severity: "critical",
      description:
        "Exposed passwords may enable unauthorized access and credential-stuffing attacks.",
    });

    compromisedCapabilities.push(
      "Unauthorized account access"
    );

    compromisedCapabilities.push(
      "Credential stuffing"
    );

    compromisedCapabilities.push(
      "Password reuse exploitation"
    );

    priorityActions.push(
      "Immediately change the affected password."
    );

    priorityActions.push(
      "Reset the same password on other services where it was reused."
    );

    defensiveControls.push(
      "Enable multi-factor authentication."
    );

    defensiveControls.push(
      "Invalidate active sessions after password reset."
    );
  }


  /* ============================================
     2. EMAIL EXPOSURE
  ============================================ */

  if (has("email")) {
    impactScore += 15;

    attackVectors.push({
      type: "phishing",
      title: "Targeted Phishing",
      severity: "high",
      description:
        "Exposed email addresses can be used for targeted phishing and social-engineering attacks.",
    });

    compromisedCapabilities.push(
      "Targeted phishing"
    );

    compromisedCapabilities.push(
      "Email-based social engineering"
    );

    priorityActions.push(
      "Monitor suspicious emails and phishing attempts."
    );

    defensiveControls.push(
      "Enable phishing-resistant MFA where available."
    );
  }


  /* ============================================
     3. PHONE EXPOSURE
  ============================================ */

  if (has("phone", "mobile")) {
    impactScore += 15;

    attackVectors.push({
      type: "social_engineering",
      title: "Phone-Based Social Engineering",
      severity: "high",
      description:
        "Exposed phone information can increase the risk of smishing, social engineering and SIM-swap targeting.",
    });

    compromisedCapabilities.push(
      "Phone-based phishing"
    );

    compromisedCapabilities.push(
      "SIM-swap targeting"
    );

    priorityActions.push(
      "Monitor unexpected calls, SMS messages and SIM-related activity."
    );

    defensiveControls.push(
      "Add carrier-level account protection or a SIM PIN where supported."
    );
  }


  /* ============================================
     4. USERNAME EXPOSURE
  ============================================ */

  if (has("username")) {
    impactScore += 5;

    attackVectors.push({
      type: "account_enumeration",
      title: "Account Enumeration",
      severity: "medium",
      description:
        "Exposed usernames can help attackers identify valid accounts.",
    });

    compromisedCapabilities.push(
      "Account discovery"
    );

    compromisedCapabilities.push(
      "Targeted login attempts"
    );
  }


  /* ============================================
     5. ADDRESS EXPOSURE
  ============================================ */

  if (
    has(
      "address",
      "physical_address",
      "street_address",
      "home_address"
    )
  ) {
    impactScore += 10;

    attackVectors.push({
      type: "identity_targeting",
      title: "Identity Targeting",
      severity: "medium",
      description:
        "Address information can provide additional context for targeted social engineering.",
    });

    compromisedCapabilities.push(
      "Identity profiling"
    );

    compromisedCapabilities.push(
      "Targeted social engineering"
    );

    priorityActions.push(
      "Be cautious of unexpected identity-verification requests."
    );
  }


  /* ============================================
     6. SECURITY QUESTIONS
  ============================================ */

  if (has("security")) {
    impactScore += 15;

    attackVectors.push({
      type: "account_recovery_attack",
      title: "Account Recovery Abuse",
      severity: "high",
      description:
        "Exposed security information may weaken account recovery mechanisms.",
    });

    compromisedCapabilities.push(
      "Account recovery manipulation"
    );

    priorityActions.push(
      "Update security questions and account recovery information."
    );

    defensiveControls.push(
      "Use stronger recovery methods such as authenticator-based MFA."
    );
  }


  /* ============================================
     7. DATE OF BIRTH
  ============================================ */

  if (
    has(
      "date_of_birth",
      "date of birth",
      "dob"
    )
  ) {
    impactScore += 10;

    attackVectors.push({
      type: "identity_fraud",
      title: "Identity Fraud Risk",
      severity: "medium",
      description:
        "Date-of-birth information can contribute to identity impersonation attempts.",
    });

    compromisedCapabilities.push(
      "Identity profiling"
    );

    compromisedCapabilities.push(
      "Identity verification abuse"
    );
  }


  /* ============================================
     8. MULTIPLE DATA TYPES
  ============================================ */

  if (dataExposed.length >= 4) {
    impactScore += 10;

    attackVectors.push({
      type: "multi_vector_attack",
      title: "Multi-Vector Attack Potential",
      severity: "critical",
      description:
        "Multiple exposed data categories can be correlated to create more convincing and targeted attacks.",
    });

    compromisedCapabilities.push(
      "Cross-data identity profiling"
    );

    compromisedCapabilities.push(
      "Coordinated social engineering"
    );

    priorityActions.push(
      "Treat the incident as a high-priority security event."
    );

    defensiveControls.push(
      "Increase monitoring and review authentication activity."
    );
  }


  /* ============================================
     9. CREDENTIAL + IDENTITY CORRELATION
  ============================================ */

  const hasCredentials =
    has("password", "username", "email");

  const hasIdentity =
    has(
      "phone",
      "address",
      "date_of_birth",
      "date of birth",
      "dob"
    );

  if (hasCredentials && hasIdentity) {
    impactScore += 10;

    attackVectors.push({
      type: "identity_correlation",
      title: "Credential + Identity Correlation",
      severity: "critical",
      description:
        "Credential and identity information together can significantly increase the effectiveness of targeted attacks.",
    });

    compromisedCapabilities.push(
      "Highly targeted impersonation"
    );

    compromisedCapabilities.push(
      "Credential-based identity attacks"
    );

    priorityActions.push(
      "Review account security, recovery settings and recent authentication activity."
    );
  }


  /* ============================================
     10. SEVERITY IMPACT
  ============================================ */

  if (severity === "critical") {
    impactScore += 20;
  } else if (severity === "high") {
    impactScore += 15;
  } else if (severity === "medium") {
    impactScore += 5;
  }


  /* ============================================
     11. LIMIT SCORE
  ============================================ */

  impactScore = Math.min(
    Math.max(impactScore, 0),
    100
  );


  /* ============================================
     12. IMPACT LEVEL
  ============================================ */

  let impactLevel = "low";

  if (impactScore >= 80) {
    impactLevel = "critical";
  } else if (impactScore >= 60) {
    impactLevel = "high";
  } else if (impactScore >= 30) {
    impactLevel = "medium";
  }


  /* ============================================
     13. DEFAULT ACTIONS
  ============================================ */

  const defaultActions = [
    "Review recent account activity.",
    "Monitor the affected identity for suspicious activity.",
    "Continue monitoring for future breaches.",
  ];

  for (const action of defaultActions) {
    if (!priorityActions.includes(action)) {
      priorityActions.push(action);
    }
  }


  /* ============================================
     14. DEFAULT SECURITY CONTROLS
  ============================================ */

  const defaultControls = [
    "Enable multi-factor authentication.",
    "Use unique passwords for important accounts.",
    "Review active sessions and connected devices.",
  ];

  for (const control of defaultControls) {
    if (!defensiveControls.includes(control)) {
      defensiveControls.push(control);
    }
  }


  /* ============================================
     15. ATTACK SUMMARY
  ============================================ */

  let summary =
    "Limited attack impact detected. Continue monitoring the affected identity.";

  if (impactLevel === "medium") {
    summary =
      "Moderate attack impact detected. Exposed information could support targeted attacks.";
  }

  if (impactLevel === "high") {
    summary =
      "High attack impact detected. Exposed information may significantly increase the likelihood of account compromise or targeted attacks.";
  }

  if (impactLevel === "critical") {
    summary =
      "Critical attack impact detected. Multiple exposed credentials and identity attributes could enable coordinated account compromise and targeted social-engineering attacks.";
  }


  /* ============================================
     FINAL RESULT
  ============================================ */

  return {
    available: true,

    impactScore,

    impactLevel,

    summary,

    attackVectors,

    compromisedCapabilities,

    priorityActions,

    defensiveControls,

    analyzedAt: new Date(),
  };
};


module.exports = {
  calculateAttackImpact,
};