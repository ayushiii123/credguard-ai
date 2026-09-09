const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const analyzeSecurityRisk = async (breach, risk) => {
  try {
    const dataExposed = Array.isArray(breach?.dataExposed)
      ? breach.dataExposed
      : [];

    const prompt = `
You are CredGuard AI, an advanced cybersecurity risk analyst.

Analyze this security breach and provide a concise, actionable assessment.

Breach Information:
- Breach Name: ${breach?.breachName || "Unknown"}
- Source: ${breach?.source || "Unknown"}
- Severity: ${breach?.severity || "Unknown"}
- Data Exposed: ${dataExposed.length ? dataExposed.join(", ") : "None specified"}
- Breach Date: ${breach?.breachDate || "Unknown"}
- Description: ${breach?.description || "No description available"}

Risk Engine Assessment:
- Risk Score: ${risk?.score ?? 0}/100
- Risk Level: ${risk?.level || "low"}

Return ONLY valid JSON.

Required structure:
{
  "summary": "Short explanation of the security incident.",
  "riskExplanation": "Explain why this risk score and level were assigned.",
  "exposedDataAnalysis": [
    "Explain the security impact of each important exposed data type."
  ],
  "recommendedActions": [
    "Immediate action",
    "Short-term action",
    "Long-term protection action"
  ],
  "urgency": "low|medium|high|critical"
}

Rules:
- Do not include markdown.
- Do not include code fences.
- Do not invent facts that are not present in the breach information.
- Prioritize password exposure, account takeover, phishing, identity theft, credential stuffing, and social engineering risks where applicable.
- Recommendations must be practical and defensive.
- urgency must match the risk level.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    let text = response?.text || "";

    // Remove accidental markdown/code fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(text);

      return {
        summary: parsed.summary || "Security breach detected.",
        riskExplanation:
          parsed.riskExplanation ||
          `Risk score is ${risk.score}/100 with ${risk.level} severity.`,
        exposedDataAnalysis: Array.isArray(
          parsed.exposedDataAnalysis
        )
          ? parsed.exposedDataAnalysis
          : [],
        recommendedActions: Array.isArray(
          parsed.recommendedActions
        )
          ? parsed.recommendedActions
          : [],
        urgency: ["low", "medium", "high", "critical"].includes(
          parsed.urgency
        )
          ? parsed.urgency
          : risk.level,
      };
    } catch (parseError) {
      console.error(
        "AI JSON Parse Error:",
        parseError.message
      );

      return {
        summary:
          "AI analysis was generated but could not be parsed into structured JSON.",
        riskExplanation:
          `The risk engine assigned a ${risk.level} risk with a score of ${risk.score}/100.`,
        exposedDataAnalysis: dataExposed.map(
          (item) => `${item} data may increase security risk.`
        ),
        recommendedActions: [
          "Immediately change exposed passwords.",
          "Enable multi-factor authentication.",
          "Review recent account activity.",
          "Continue monitoring the affected account.",
        ],
        urgency: risk.level,
      };
    }
  } catch (error) {
    console.error(
      "AI Security Analysis Error:",
      error.message
    );

    // AI failure should NOT break the breach/risk system
    return {
      summary:
        "Security breach detected. AI analysis is temporarily unavailable.",
      riskExplanation:
        `Risk engine assigned ${risk.level} risk with a score of ${risk.score}/100.`,
      exposedDataAnalysis: Array.isArray(breach?.dataExposed)
        ? breach.dataExposed.map(
            (item) => `${item} exposure may increase security risk.`
          )
        : [],
      recommendedActions: [
        "Immediately change exposed passwords.",
        "Do not reuse compromised passwords.",
        "Enable multi-factor authentication.",
        "Review recent login and account activity.",
        "Continue monitoring the affected identity.",
      ],
      urgency: risk?.level || "high",
    };
  }
};

module.exports = {
  analyzeSecurityRisk,
};