import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBreachById } from "../services/api";

function BreachDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBreach = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getBreachById(id);

        setData(result);
      } catch (err) {
        console.error("Breach Details Error:", err);

        setError(
          err?.message || "Failed to load breach details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadBreach();
    }
  }, [id]);

  const severityStyle = (level) => {
    switch (String(level || "").toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-400 border-red-500/30";

      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";

      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";

      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-400">
        Loading breach details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-cyan-400 hover:text-cyan-300"
        >
          ← Back
        </button>

        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!data?.breach) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-400">
        Breach details not found.
      </div>
    );
  }

  const {
    breach,
    risk,
    attackImpact,
    exposure,
    timeline,
  } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-8">

      {/* BACK */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-cyan-400 hover:text-cyan-300 font-medium"
      >
        ← Back to Breaches
      </button>


      {/* HEADER */}
      <div className="mb-8">

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

          <div>
            <p className="text-sm text-slate-500 uppercase tracking-wider">
              Security Incident
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              {breach.breachName}
            </h1>

            <p className="text-slate-400 mt-2">
              Source: {breach.source}
            </p>
          </div>

          <span
            className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase ${severityStyle(
              breach.severity
            )}`}
          >
            {breach.severity}
          </span>

        </div>

        {breach.description && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-300 leading-7">
              {breach.description}
            </p>
          </div>
        )}

      </div>


      {/* RISK + ATTACK IMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


        {/* RISK */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              🛡️ Risk Assessment
            </h2>

            <span
              className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase ${severityStyle(
                risk?.level
              )}`}
            >
              {risk?.level || "unknown"}
            </span>
          </div>

          <div className="mt-6">

            <p className="text-sm text-slate-500">
              Risk Score
            </p>

            <div className="flex items-end gap-2 mt-2">

              <span className="text-6xl font-extrabold text-cyan-400">
                {risk?.score ?? 0}
              </span>

              <span className="text-slate-500 mb-2">
                /100
              </span>

            </div>

          </div>


          {/* Risk explanation */}
          <div className="mt-6 bg-slate-800/60 rounded-xl p-4">

            <p className="text-sm text-slate-400">
              Explanation
            </p>

            <p className="text-slate-300 mt-2 leading-6">
              {risk?.explanation ||
                "No risk explanation available."}
            </p>

          </div>


          {/* Risk factors */}
          {risk?.factors?.length > 0 && (
            <div className="mt-6">

              <h3 className="font-semibold text-slate-300 mb-3">
                Risk Factors
              </h3>

              <div className="space-y-3">

                {risk.factors.map((factor, index) => (

                  <div
                    key={index}
                    className="bg-slate-800 rounded-xl p-4"
                  >

                    <div className="flex justify-between gap-4">

                      <div>
                        <p className="font-medium text-white">
                          {factor.label}
                        </p>

                        <p className="text-sm text-slate-400 mt-1">
                          {factor.description}
                        </p>
                      </div>

                      <span className="text-red-400 font-bold">
                        +{factor.impact}
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>
          )}

        </div>


        {/* ATTACK IMPACT */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-bold">
              🎯 Attack Impact
            </h2>

            <span
              className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase ${severityStyle(
                attackImpact?.impactLevel
              )}`}
            >
              {attackImpact?.impactLevel || "unknown"}
            </span>

          </div>


          <div className="mt-6">

            <p className="text-sm text-slate-500">
              Impact Score
            </p>

            <p className="text-5xl font-extrabold text-red-400 mt-2">
              {attackImpact?.impactScore ?? 0}
              <span className="text-xl text-slate-500">
                /100
              </span>
            </p>

          </div>


          <div className="mt-5 bg-slate-800/60 rounded-xl p-4">

            <p className="text-slate-300 leading-6">
              {attackImpact?.summary ||
                "No attack impact analysis available."}
            </p>

          </div>


          {/* Attack Vectors */}
          {attackImpact?.attackVectors?.length > 0 && (

            <div className="mt-6">

              <h3 className="font-semibold text-slate-300 mb-3">
                Attack Vectors
              </h3>

              <div className="space-y-3">

                {attackImpact.attackVectors.map(
                  (vector, index) => (

                    <div
                      key={index}
                      className="bg-slate-800 rounded-xl p-4"
                    >

                      <div className="flex justify-between gap-3">

                        <div>

                          <p className="font-semibold">
                            {vector.title}
                          </p>

                          <p className="text-sm text-slate-400 mt-1">
                            {vector.description}
                          </p>

                        </div>

                        <span
                          className={`h-fit px-2 py-1 rounded-md border text-xs uppercase ${severityStyle(
                            vector.severity
                          )}`}
                        >
                          {vector.severity}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          )}

        </div>

      </div>


      {/* EXPOSED DATA */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          🔓 Exposed Data
        </h2>

        <p className="text-slate-500 text-sm mt-1">
          {exposure?.total || 0} data categories exposed
        </p>

        <div className="flex flex-wrap gap-3 mt-5">

          {exposure?.data?.length > 0 ? (

            exposure.data.map((item, index) => (

              <span
                key={index}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-sm"
              >
                {item}
              </span>

            ))

          ) : (

            <p className="text-slate-500">
              No exposed data information available.
            </p>

          )}

        </div>

      </div>


      {/* COMPROMISED CAPABILITIES */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          ⚔️ Potential Attacker Capabilities
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

          {attackImpact?.compromisedCapabilities?.map(
            (capability, index) => (

              <div
                key={index}
                className="bg-slate-800 rounded-xl p-4"
              >
                <span className="text-slate-300">
                  • {capability}
                </span>
              </div>

            )
          )}

        </div>

      </div>


      {/* PRIORITY ACTIONS */}
      <div className="mt-6 bg-slate-900 border border-cyan-500/20 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          🛡️ Priority Actions
        </h2>

        <div className="space-y-3 mt-5">

          {attackImpact?.priorityActions?.map(
            (action, index) => (

              <div
                key={index}
                className="flex gap-4 bg-slate-800 rounded-xl p-4"
              >

                <span className="text-cyan-400 font-bold">
                  {index + 1}.
                </span>

                <span className="text-slate-300">
                  {action}
                </span>

              </div>

            )
          )}

        </div>

      </div>


      {/* RECOMMENDATIONS */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          🚨 Risk Recommendations
        </h2>

        <div className="space-y-3 mt-5">

          {risk?.recommendations?.map(
            (recommendation, index) => (

              <div
                key={index}
                className="flex gap-4 bg-slate-800 rounded-xl p-4"
              >

                <span className="text-red-400 font-bold">
                  {index + 1}.
                </span>

                <span className="text-slate-300">
                  {recommendation}
                </span>

              </div>

            )
          )}

        </div>

      </div>


      {/* TIMELINE */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">

        <h2 className="text-xl font-bold">
          🕒 Incident Timeline
        </h2>

        <div className="mt-6 space-y-5">

          <div>
            <p className="text-sm text-slate-500">
              Breach Date
            </p>

            <p className="text-slate-300 mt-1">
              {timeline?.breachDate
                ? new Date(
                    timeline.breachDate
                  ).toLocaleString()
                : "Unknown"}
            </p>
          </div>


          <div>
            <p className="text-sm text-slate-500">
              Detected At
            </p>

            <p className="text-slate-300 mt-1">
              {timeline?.detectedAt
                ? new Date(
                    timeline.detectedAt
                  ).toLocaleString()
                : "Unknown"}
            </p>
          </div>


          <div>
            <p className="text-sm text-slate-500">
              Created At
            </p>

            <p className="text-slate-300 mt-1">
              {timeline?.createdAt
                ? new Date(
                    timeline.createdAt
                  ).toLocaleString()
                : "Unknown"}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default BreachDetails;