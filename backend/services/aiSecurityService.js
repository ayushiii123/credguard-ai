const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const getUrgency = (score, severity) => {
  if (score >= 80 || severity === "critical") return "IMMEDIATE ACTION";
  if (score >= 60 || severity === "high") return "HIGH PRIORITY";
  if (score >= 30 || severity === "medium") return "ACTION SOON";
  return "LOW";
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getFallbackAnalysis = (breach, risk) => {
  const exposedData = Array.isArray(breach.dataExposed)
    ? breach.dataExposed.map((item) => String(item).toLowerCase())
    : [];
  const hasPassword = exposedData.some((item) =>
    item.includes("password") || item.includes("credential")
  );
  const hasEmail = exposedData.some((item) => item.includes("email"));
  const hasPhone = exposedData.some((item) => item.includes("phone"));
  const whyRisky = [];

  if (hasPassword) whyRisky.push("A password or credential was exposed.");
  if (hasEmail) whyRisky.push("An email address was exposed.");
  if (hasPhone) whyRisky.push("Phone information was exposed.");
  if (exposedData.length > 1) {
    whyRisky.push(`${exposedData.length} types of information were exposed, increasing the attack surface.`);
  }
  if (breach.severity) {
    whyRisky.push(`This was recorded as a ${breach.severity} severity breach.`);
  }

  const possibleAttacks = [];
  if (hasPassword) possibleAttacks.push("The account could be targeted by credential stuffing or account takeover attempts.");
  if (hasEmail) possibleAttacks.push("The address may be targeted by phishing or password-spraying attempts.");
  if (hasPhone) possibleAttacks.push("The phone information may be used in smishing or SIM-swap attempts.");

  const recommendedActions = [];
  if (hasPassword) {
    recommendedActions.push("Change the compromised password immediately.");
    recommendedActions.push("Do not reuse the compromised password on other services.");
    recommendedActions.push("Log out or revoke active sessions where supported.");
  }
  if (hasPassword || hasEmail) recommendedActions.push("Enable MFA or 2FA on the affected account.");
  if (hasEmail || hasPhone) recommendedActions.push("Monitor the account for suspicious messages and login activity.");
  if (recommendedActions.length === 0) recommendedActions.push("Review recent account activity and continue monitoring the account.");

  return {
    riskScore: risk.score,
    riskLevel: String(risk.level).toUpperCase(),
    summary: `The ${breach.breachName || "detected breach"} exposed ${exposedData.length || "some"} type(s) of information. The Risk Engine classifies this as ${String(risk.level).toUpperCase()} risk.`,
    whyRisky,
    possibleAttacks,
    recommendedActions: [...new Set(recommendedActions)],
    prevention: [
      "Use a unique password for every service.",
      "Use a password manager and enable MFA where available.",
      "Continue monitoring the account for suspicious activity.",
    ],
    urgency: getUrgency(risk.score, breach.severity),
  };
};

const analyzeSecurityRisk = async (breach, risk) => {
  const fallback = getFallbackAnalysis(breach, risk);
  const prompt = `
You are CredGuard AI, a security advisor for a normal user.

Analyze only this selected breach. Use only the supplied structured breach data and Risk Engine result.

Breach Information:
${JSON.stringify({
  breachName: breach.breachName,
  source: breach.source,
  severity: breach.severity,
  dataExposed: Array.isArray(breach.dataExposed) ? breach.dataExposed : [],
  breachDate: breach.breachDate,
  description: breach.description,
})}

Risk Assessment:
- Risk Score: ${risk.score}/100
- Risk Level: ${risk.level}

Return ONLY valid JSON in this exact structure:

{
  "riskScore": 0,
  "riskLevel": "LOW",
  "summary": "Short explanation of the security situation.",
  "whyRisky": [],
  "possibleAttacks": [],
  "recommendedActions": [],
  "prevention": [],
  "urgency": "LOW"
}

Rules:
1. riskScore and riskLevel MUST exactly match the Risk Engine result. Never calculate or change them.
2. Explain only data types actually present in dataExposed; do not invent exposure, attacks, dark-web activity, or credentials.
3. possibleAttacks describe what could happen, never an attack that occurred.
4. Make recommendedActions relevant to the actual exposed data and prioritize them.
5. urgency must be exactly one of LOW, ACTION SOON, HIGH PRIORITY, IMMEDIATE ACTION and must reflect the supplied score and severity.
6. Do not include markdown or any fields outside this structure.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    let text = response.text?.trim();

    if (!text) throw new Error("AI returned an empty response");

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(text);
    const analysis = {
      ...fallback,
      summary: typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : fallback.summary,
      whyRisky: toStringArray(parsed.whyRisky),
      possibleAttacks: toStringArray(parsed.possibleAttacks),
      recommendedActions: toStringArray(parsed.recommendedActions),
      prevention: toStringArray(parsed.prevention),
    };

    return {
      ...analysis,
      whyRisky: analysis.whyRisky.length ? analysis.whyRisky : fallback.whyRisky,
      possibleAttacks: analysis.possibleAttacks.length ? analysis.possibleAttacks : fallback.possibleAttacks,
      recommendedActions: analysis.recommendedActions.length ? analysis.recommendedActions : fallback.recommendedActions,
      prevention: analysis.prevention.length ? analysis.prevention : fallback.prevention,
    };
  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    return fallback;
  }
};

module.exports = {
  analyzeSecurityRisk,
};