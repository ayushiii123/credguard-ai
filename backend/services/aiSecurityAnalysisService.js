/*
  ============================================
  CREDGUARD AI - AI SECURITY ANALYSIS SERVICE
  ============================================

  Combines:
  - Risk Engine
  - Attack Impact
  - Threat Intelligence

  Generates:
  - Overall assessment
  - Threat summary
  - Likely attacker actions
  - Priority actions
  - User guidance
  - Risk explanation
*/

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const analyzeSecurityIncident = async ({
  breach,
  risk,
  attackImpact,
  threatIntelligence,
}) => {

  if (!breach) {
    throw new Error("Breach data is required");
  }

  const prompt = `
You are CredGuard AI, an advanced cybersecurity analyst.

Analyze this security incident using ONLY the information provided below.

BREACH INFORMATION:
${JSON.stringify(breach, null, 2)}

RISK ENGINE RESULT:
${JSON.stringify(risk, null, 2)}

ATTACK IMPACT:
${JSON.stringify(attackImpact, null, 2)}

THREAT INTELLIGENCE:
${JSON.stringify(threatIntelligence, null, 2)}

Return ONLY valid JSON in exactly this structure:

{
  "available": true,
  "overallAssessment": "",
  "threatSummary": "",
  "likelyAttackerActions": [],
  "priorityActions": [],
  "userGuidance": [],
  "riskExplanation": "",
  "urgency": "low"
}

Rules:

1. Do not invent facts.
2. Use only the supplied breach, risk, attack impact and threat intelligence.
3. likelyAttackerActions must describe possible attacker behavior, not confirmed behavior.
4. priorityActions must contain practical defensive actions.
5. Put the most urgent action first.
6. userGuidance must be simple enough for a normal user to understand.
7. urgency must be one of:
   low, medium, high, critical
8. urgency should normally match the calculated risk level.
9. Keep responses concise.
10. Return JSON only.
11. Do not use markdown.
`;

  try {

    const response =
      await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

    let text =
      response.text?.trim();

    if (!text) {
      throw new Error(
        "AI returned an empty response"
      );
    }

    /*
      Remove accidental markdown fences
    */

    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();


    const analysis =
      JSON.parse(text);


    /*
      Validate urgency
    */

    const validUrgency = [
      "low",
      "medium",
      "high",
      "critical",
    ];

    const urgency =
      validUrgency.includes(
        String(analysis.urgency).toLowerCase()
      )
        ? String(
            analysis.urgency
          ).toLowerCase()
        : risk?.level || "low";


    return {

      available: true,

      overallAssessment:
        analysis.overallAssessment ||
        "Security incident analyzed successfully.",

      threatSummary:
        analysis.threatSummary ||
        "Potential security threats were identified from the available breach information.",

      likelyAttackerActions:
        Array.isArray(
          analysis.likelyAttackerActions
        )
          ? analysis.likelyAttackerActions
          : [],

      priorityActions:
        Array.isArray(
          analysis.priorityActions
        )
          ? analysis.priorityActions
          : [],

      userGuidance:
        Array.isArray(
          analysis.userGuidance
        )
          ? analysis.userGuidance
          : [],

      riskExplanation:
        analysis.riskExplanation ||
        risk?.explanation ||
        "",

      urgency,

      analyzedAt:
        new Date(),
    };

  } catch (error) {

    console.error(
      "❌ AI Security Analysis Error:",
      error.message
    );

    /*
      AI failure should NOT break
      the complete breach detection system.
    */

    return {

      available: false,

      error:
        "AI security analysis unavailable",

      fallback: {

        overallAssessment:
          risk?.explanation ||
          "Security risk analysis completed using the CredGuard risk engine.",

        threatSummary:
          threatIntelligence?.summary ||
          "Potential security threats were identified.",

        likelyAttackerActions:
          [],

        priorityActions:
          risk?.recommendations ||
          [],

        userGuidance:
          [
            "Review the affected account immediately.",
            "Change exposed credentials if applicable.",
            "Enable multi-factor authentication.",
            "Continue monitoring for suspicious activity.",
          ],

        riskExplanation:
          risk?.explanation ||
          "",

        urgency:
          risk?.level ||
          "low",
      },

      analyzedAt:
        new Date(),
    };
  }
};


module.exports = {
  analyzeSecurityIncident,
};