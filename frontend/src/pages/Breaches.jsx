
import { useEffect, useState } from "react";
import {
  getBreaches,
  analyzeBreachWithAI, 
} from "../services/api";
import { useNavigate } from "react-router-dom";
function Breaches() {
  const navigate = useNavigate();
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [analyzingId, setAnalyzingId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisBreachId, setAnalysisBreachId] = useState(null);
  const [analysisError, setAnalysisError] = useState("");

  const loadBreaches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getBreaches();

      setBreaches(data.breaches || []);
    } catch (err) {
      console.error("Breaches Error:", err);
      setError(
        err.message || "Failed to load breach information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBreaches();
  }, []);

  const handleAIAnalysis = async (breachId) => {
    try {
      setAnalyzingId(breachId);
      setAnalysisError("");
      setAnalysis(null);
      setAnalysisBreachId(breachId);

      const data = await analyzeBreachWithAI(breachId);

      setAnalysis(data);
    } catch (err) {
      console.error("AI Analysis Error:", err);

      setAnalysisError(
        err.message || "AI analysis failed."
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const closeAnalysis = () => {
    setAnalysis(null);
    setAnalysisBreachId(null);
    setAnalysisError("");
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "high":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "medium":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      case "low":
        return "border-green-500/30 bg-green-500/10 text-green-400";

      default:
        return "border-slate-700 bg-slate-800 text-slate-300";
    }
  };

  const getRiskColor = (score) => {
    if (score >= 75) {
      return "text-red-400";
    }

    if (score >= 50) {
      return "text-orange-400";
    }

    if (score >= 26) {
      return "text-yellow-400";
    }

    return "text-green-400";
  };

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown";
    }

    return parsedDate.toLocaleString();
  };

  const getAnalysisObject = () => {
    if (!analysis) {
      return null;
    }

    if (analysis.analysis) {
      return analysis.analysis;
    }

    if (analysis.aiAnalysis) {
      return analysis.aiAnalysis;
    }

    if (analysis.result) {
      return analysis.result;
    }

    return analysis;
  };

  const aiResult = getAnalysisObject();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-400">
              Loading breach information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              Threat Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Breach Detection
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Review detected breaches and use AI to understand the security impact.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBreaches}
            className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            ↻ Refresh Breaches
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* SUMMARY */}
        <div className="grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Total Breaches
            </p>

            <p className="mt-2 text-4xl font-bold text-cyan-400">
              {breaches.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Critical Breaches
            </p>

            <p className="mt-2 text-4xl font-bold text-red-400">
              {
                breaches.filter(
                  (breach) =>
                    breach.severity === "critical"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              High Risk Breaches
            </p>

            <p className="mt-2 text-4xl font-bold text-orange-400">
              {
                breaches.filter(
                  (breach) =>
                    breach.severity === "high"
                ).length
              }
            </p>
          </div>

        </div>

        {/* AI ANALYSIS PANEL */}
        {(analysis || analysisError) && (
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6 shadow-lg shadow-cyan-500/5">

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wider text-cyan-400">
                  AI Security Analysis
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Breach Risk Assessment
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAnalysis}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            {analysisError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                {analysisError}
              </div>
            )}

            {aiResult && (
              <div className="mt-6 space-y-5">

                {/* Common AI fields */}
                <div className="grid gap-4 md:grid-cols-2">

                  {(aiResult.riskLevel ||
                    aiResult.level) && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs uppercase text-slate-500">
                        Risk Level
                      </p>

                      <p className="mt-2 text-xl font-bold text-red-400">
                        {String(
                          aiResult.riskLevel ||
                            aiResult.level
                        ).toUpperCase()}
                      </p>
                    </div>
                  )}

                  {(aiResult.riskScore !== undefined ||
                    aiResult.score !== undefined) && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                      <p className="text-xs uppercase text-slate-500">
                        Risk Score
                      </p>

                      <p
                        className={`mt-2 text-xl font-bold ${getRiskColor(
                          Number(
                            aiResult.riskScore ??
                              aiResult.score ??
                              0
                          )
                        )}`}
                      >
                        {Number(
                          aiResult.riskScore ??
                            aiResult.score ??
                            0
                        )}
                        /100
                      </p>
                    </div>
                  )}

                </div>

                {/* Summary */}
                {aiResult.summary && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="font-semibold text-white">
                      Security Assessment
                    </h3>

                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
                      {aiResult.summary}
                    </p>
                  </div>
                )}

                {Array.isArray(aiResult.whyRisky) && aiResult.whyRisky.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <h3 className="font-semibold text-white">Why This Is Risky</h3>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {aiResult.whyRisky.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {Array.isArray(aiResult.recommendedActions) && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                    <h3 className="font-semibold text-cyan-400">
                      Recommended Actions
                    </h3>

                    <div className="mt-4 space-y-3">
                      {aiResult.recommendedActions.length > 0 ? (
                        aiResult.recommendedActions.map((item, index) => (
                          <div
                            key={index}
                            className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                          >
                            <span className="mr-2 text-cyan-400">
                              {index + 1}.
                            </span>

                            {typeof item === "object"
                              ? JSON.stringify(item)
                              : String(item)}
                          </div>
                        ))
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Possible Attacks */}
                {Array.isArray(aiResult.possibleAttacks) && aiResult.possibleAttacks.length > 0 && (
                  <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
                    <h3 className="font-semibold text-orange-400">Possible Attacks</h3>

                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {aiResult.possibleAttacks.map((attack, index) => (
                        <p key={index}>{attack}</p>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(aiResult.prevention) && aiResult.prevention.length > 0 && (
                  <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
                    <h3 className="font-semibold text-green-400">How To Stay Protected</h3>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                      {aiResult.prevention.map((tip, index) => (
                        <p key={index}>{tip}</p>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.urgency && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                    <p className="text-xs uppercase text-slate-500">Response Urgency</p>
                    <p className="mt-2 font-bold text-cyan-400">{aiResult.urgency}</p>
                  </div>
                )}

                {/* Raw fallback */}
                <details className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-400">
                    View AI response
                  </summary>

                  <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-500">
                    {JSON.stringify(
                      analysis,
                      null,
                      2
                    )}
                  </pre>
                </details>

              </div>
            )}

          </div>
        )}

        {/* BREACH LIST */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Detected Breaches
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review security incidents affecting monitored accounts.
              </p>
            </div>

            <span className="text-sm text-slate-400">
              {breaches.length} total
            </span>
          </div>

          {breaches.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-10 text-center">
              <div className="text-5xl">
                🛡️
              </div>

              <h3 className="mt-4 text-xl font-semibold">
                No Breaches Detected
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Your monitored accounts currently have no recorded breaches.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {breaches.map((breach) => {
                const isAnalyzing =
                  analyzingId === breach._id;

                return (
                  <div
                    key={breach._id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-slate-700"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* Breach Information */}
                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-3">

                          <h3 className="text-lg font-semibold text-white">
                            {breach.breachName ||
                              "Unknown Breach"}
                          </h3>

                          <span
                            className={`rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${getSeverityStyle(
                              breach.severity
                            )}`}
                          >
                            {breach.severity ||
                              "unknown"}
                          </span>

                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">

                          <div>
                            <p className="text-xs uppercase text-slate-600">
                              Source
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {breach.source ||
                                "Unknown"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-slate-600">
                              Breach Date
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {formatDate(
                                breach.breachDate
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-slate-600">
                              Detected
                            </p>

                            <p className="mt-1 text-sm text-slate-300">
                              {formatDate(
                                breach.detectedAt
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase text-slate-600">
                              Risk
                            </p>

                            <p
                              className={`mt-1 text-sm font-semibold ${getRiskColor(
                                breach.riskScore ||
                                  (breach.severity ===
                                  "critical"
                                    ? 100
                                    : breach.severity ===
                                      "high"
                                    ? 75
                                    : breach.severity ===
                                      "medium"
                                    ? 50
                                    : 20)
                              )}`}
                            >
                              {breach.riskScore ??
                                "—"}
                              {breach.riskScore !==
                                undefined &&
                                "/100"}
                            </p>
                          </div>

                        </div>

                        {breach.description && (
                          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                            <p className="text-sm leading-6 text-slate-400">
                              {breach.description}
                            </p>
                          </div>
                        )}

                        {Array.isArray(
                          breach.dataExposed
                        ) &&
                          breach.dataExposed.length >
                            0 && (
                            <div className="mt-4">
                              <p className="text-xs uppercase text-slate-600">
                                Exposed Data
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {breach.dataExposed.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <span
                                      key={index}
                                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300"
                                    >
                                      {String(item)}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                      </div>

                      {/* AI BUTTON */}
                      <div className="flex shrink-0 lg:w-44">

                        <button
                          type="button"
                          onClick={() =>
                            handleAIAnalysis(
                              breach._id
                            )
                          }
                          disabled={analyzingId === breach._id}
                          className="w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {analyzingId === breach._id ? (
                            "Analyzing..."
                          ) : (
                            <>
                              ✨ Analyze with AI
                            </>
                          )}
                        </button>
                        <button
  onClick={() =>
    navigate(`/breaches/${breach._id}`)
  }
  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl"
>
  View Details
</button>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default Breaches;
