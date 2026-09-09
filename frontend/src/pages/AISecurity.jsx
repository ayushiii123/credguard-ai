import { useEffect, useState } from "react";
import {
  getBreaches,
  analyzeBreachWithAI,
} from "../services/api";

function AISecurity() {
  const [breaches, setBreaches] = useState([]);
  const [breachId, setBreachId] = useState("");
  const [result, setResult] = useState(null);

  const [loadingBreaches, setLoadingBreaches] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBreaches = async () => {
      try {
        setLoadingBreaches(true);

        const data = await getBreaches();

        setBreaches(data.breaches || []);
      } catch (err) {
        console.error(
          "Breaches Load Error:",
          err.message
        );

        setError(
          "Failed to load breaches."
        );
      } finally {
        setLoadingBreaches(false);
      }
    };

    loadBreaches();
  }, []);

  const analyze = async () => {
    if (!breachId) {
      setError(
        "Please select a breach."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data =
        await analyzeBreachWithAI(
          breachId
        );

      setResult(data);
    } catch (err) {
      console.error(
        "AI Security Error:",
        err.message
      );

      setError(
        "AI analysis failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getRiskConfig = (level) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return {
          text: "text-red-400",
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          bar: "bg-red-500",
          icon: "🚨",
        };

      case "high":
        return {
          text: "text-orange-400",
          bg: "bg-orange-500/10",
          border: "border-orange-500/30",
          bar: "bg-orange-500",
          icon: "🔴",
        };

      case "medium":
        return {
          text: "text-yellow-400",
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/30",
          bar: "bg-yellow-500",
          icon: "⚠️",
        };

      default:
        return {
          text: "text-green-400",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          bar: "bg-green-500",
          icon: "🛡️",
        };
    }
  };

  const analysis = result?.analysis;
  const riskScore = result?.risk?.score ?? analysis?.riskScore ?? 0;
  const riskLevel = result?.risk?.level ?? analysis?.riskLevel;
  const riskConfig = result ? getRiskConfig(riskLevel) : null;

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          🤖 AI Security Analysis
        </h1>

        <p className="text-slate-400 mt-2">
          Use CredGuard AI to analyze detected security breaches.
        </p>

      </div>

      {/* Analyze Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-semibold">
          Analyze a Breach
        </h2>

        <p className="text-slate-500 text-sm mt-1 mb-5">
          Select a detected breach to generate an AI-powered security assessment.
        </p>

        <div className="flex flex-col md:flex-row gap-3">

          <select
            value={breachId}
            onChange={(e) => {
              setBreachId(e.target.value);
              setResult(null);
              setError("");
            }}
            disabled={loadingBreaches}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500"
          >

            <option value="">
              {loadingBreaches
                ? "Loading breaches..."
                : breaches.length === 0
                ? "No breaches available"
                : "Select a breach"}
            </option>

            {breaches.map((breach) => (
              <option
                key={breach._id}
                value={breach._id}
              >
                {breach.breachName} —{" "}
                {breach.severity}
              </option>
            ))}

          </select>

          <button
            onClick={analyze}
            disabled={
              loading ||
              loadingBreaches ||
              !breachId
            }
            className="px-7 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 transition"
          >
            {loading
              ? "🤖 Analyzing..."
              : "🤖 Analyze with AI"}
          </button>

        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

      </div>

      {/* No Breaches */}
      {!loadingBreaches &&
        breaches.length === 0 && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

            <div className="text-5xl mb-4">
              🛡️
            </div>

            <h2 className="text-xl font-semibold">
              No Breaches Available
            </h2>

            <p className="text-slate-400 mt-2">
              Detect a breach first, then return here for AI analysis.
            </p>

          </div>
        )}

      {/* Result */}
      {result && riskConfig && (
        <div className="mt-8 space-y-6">

          {/* Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Score */}
            <div
              className={`bg-slate-900 border ${riskConfig.border} rounded-2xl p-6`}
            >

              <div className="flex justify-between items-center">

                <p className="text-slate-400">
                  Risk Score
                </p>

                <span className="text-2xl">
                  {riskConfig.icon}
                </span>

              </div>

              <div className="flex items-end gap-2 mt-3">

                <p
                  className={`text-5xl font-extrabold ${riskConfig.text}`}
                >
                  {riskScore}
                </p>

                <span className="text-xl text-slate-500 mb-1">
                  /100
                </span>

              </div>

              <div className="h-2 bg-slate-800 rounded-full mt-5 overflow-hidden">

                <div
                  className={`h-full rounded-full ${riskConfig.bar} transition-all duration-700`}
                  style={{
                    width: `${Math.min(
                      riskScore,
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>

            {/* Risk Level */}
            <div
              className={`${riskConfig.bg} border ${riskConfig.border} rounded-2xl p-6`}
            >

              <p className="text-slate-400">
                Risk Level
              </p>

              <p
                className={`text-3xl font-bold uppercase mt-3 ${riskConfig.text}`}
              >
                {riskLevel}
              </p>

              <p className="text-slate-500 text-sm mt-2">
                Calculated by the CredGuard Risk Engine
              </p>

            </div>

          </div>

          {/* AI Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold">
              🧠 AI Summary
            </h2>

            <p className="text-slate-300 mt-4 leading-7">
              {analysis.summary}
            </p>

          </div>

          {/* Risk Explanation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold">
              ⚠️ Why This Risk Was Assigned
            </h2>

            <p className="text-slate-300 mt-4 leading-7">
              <ul className="mt-4 space-y-3">
                {analysis.whyRisky?.map((reason, index) => (
                  <li key={index} className="text-slate-300 leading-7">
                    {reason}
                  </li>
                ))}
              </ul>
            </p>

          </div>

          {/* Exposed Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold">
              🎯 Possible Attacks
            </h2>

            <div className="mt-4 space-y-3">

              {analysis.possibleAttacks?.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex gap-3 bg-slate-800 rounded-xl p-4"
                  >

                    <span className="text-red-400">
                      ●
                    </span>

                    <p className="text-slate-300">
                      {item}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

          {/* Recommended Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <h2 className="text-xl font-semibold">
              🛡️ Recommended Actions
            </h2>

            <div className="mt-4 space-y-3">

              {analysis.recommendedActions?.map(
                (action, index) => (
                  <div
                    key={index}
                    className="flex gap-4 bg-slate-800 rounded-xl p-4"
                  >

                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold shrink-0">
                      {index + 1}
                    </div>

                    <p className="text-slate-300">
                      {action}
                    </p>

                  </div>
                )
              )}

            </div>

          </div>

          {/* Prevention */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold">
              🔒 How To Stay Protected
            </h2>

            <div className="mt-4 space-y-3">
              {analysis.prevention?.map((tip, index) => (
                <div key={index} className="flex gap-3 bg-slate-800 rounded-xl p-4">
                  <span className="text-cyan-400">●</span>
                  <p className="text-slate-300">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div
            className={`${riskConfig.bg} border ${riskConfig.border} rounded-2xl p-6`}
          >

            <div className="flex items-center justify-between">

              <div>
                <p className="text-slate-400">
                  Response Urgency
                </p>

                <p
                  className={`text-2xl font-bold uppercase mt-2 ${riskConfig.text}`}
                >
                  {analysis.urgency}
                </p>
              </div>

              <span className="text-4xl">
                {riskConfig.icon}
              </span>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AISecurity;