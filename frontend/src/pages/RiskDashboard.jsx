import { useEffect, useMemo, useState } from "react";
import {
  getMonitoredAccounts,
  getBreaches,
  getOverallRisk,
} from "../services/api";
import RiskDistributionChart from "../components/RiskDistributionChart";
import RiskScoreGauge from "../components/RiskScoreGauge";

function RiskDashboard() {
  const [accounts, setAccounts] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [overallRisk, setOverallRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRiskData = async () => {
    try {
      setLoading(true);
      setError("");

      const [accountsData, breachesData, overallRiskData] = await Promise.all([
        getMonitoredAccounts(),
        getBreaches(),
        getOverallRisk(),
      ]);

      setAccounts(accountsData?.accounts || []);
      setBreaches(breachesData?.breaches || []);
      setOverallRisk(overallRiskData?.risk || null);
    } catch (err) {
      console.error("Risk Dashboard Error:", err);
      setError(err?.message || "Failed to load risk intelligence");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      loadRiskData();
    }, 0);

    return () => clearTimeout(initialLoad);
  }, []);

  /* =========================================
     RISK CALCULATIONS
  ========================================= */

  const riskStats = useMemo(() => {
    const scores = accounts.map((account) =>
      Number(account.riskScore || 0)
    );

    const totalRisk = scores.reduce(
      (sum, score) => sum + score,
      0
    );

    const overallScore =
      scores.length > 0
        ? Math.round(totalRisk / scores.length)
        : 0;

    return {
      critical: scores.filter((score) => score >= 75).length,
      high: scores.filter(
        (score) => score >= 50 && score < 75
      ).length,
      medium: scores.filter(
        (score) => score >= 26 && score < 50
      ).length,
      low: scores.filter((score) => score <= 25).length,
      overallScore: Number(overallRisk?.score ?? overallScore),
    };
  }, [accounts, overallRisk]);

  const topRiskAccounts = useMemo(() => {
    return [...accounts]
      .sort(
        (a, b) =>
          Number(b.riskScore || 0) -
          Number(a.riskScore || 0)
      )
      .slice(0, 5);
  }, [accounts]);

  const breachSeverity = useMemo(() => {
    return {
      critical: breaches.filter(
        (b) => b.severity === "critical"
      ).length,

      high: breaches.filter(
        (b) => b.severity === "high"
      ).length,

      medium: breaches.filter(
        (b) => b.severity === "medium"
      ).length,

      low: breaches.filter(
        (b) => b.severity === "low"
      ).length,
    };
  }, [breaches]);

  const getRiskLevel = (score) => {
    if (score >= 75) return "Critical";
    if (score >= 50) return "High";
    if (score >= 26) return "Medium";
    return "Low";
  };

  const getRiskColor = (score) => {
    if (score >= 75) return "text-red-400";
    if (score >= 50) return "text-orange-400";
    if (score >= 26) return "text-yellow-400";
    return "text-green-400";
  };

  const getRiskBorder = (score) => {
    if (score >= 75) return "border-red-500/30";
    if (score >= 50) return "border-orange-500/30";
    if (score >= 26) return "border-yellow-500/30";
    return "border-green-500/30";
  };

  const getRiskBar = (score) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 50) return "bg-orange-500";
    if (score >= 26) return "bg-yellow-500";
    return "bg-green-500";
  };

  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-400">
              Loading security risk intelligence...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================
     PAGE
  ========================================= */

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* =====================================
            HEADER
        ===================================== */}

        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              CredGuard Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Risk Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Explainable security intelligence showing where
              your monitored identities are most exposed.
            </p>
          </div>

          <button
            onClick={loadRiskData}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            ↻ Refresh Intelligence
          </button>

        </header>

        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* =====================================
            VISUAL RISK INTELLIGENCE
        ===================================== */}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <RiskDistributionChart
            riskStats={riskStats}
            breachSeverity={breachSeverity}
            totalAccounts={accounts.length}
            totalBreaches={breaches.length}
          />
          <RiskScoreGauge score={riskStats.overallScore} />
        </section>

        {/* =====================================
            WHY THIS SCORE?
        ===================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
              Explainable Intelligence
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Why is the risk elevated?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Risk is derived from multiple security indicators,
              rather than a single breach count.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase text-slate-600">
                Monitored Identities
              </p>

              <p className="mt-2 text-3xl font-bold">
                {accounts.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Accounts currently monitored
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase text-slate-600">
                Recorded Incidents
              </p>

              <p className="mt-2 text-3xl font-bold text-red-400">
                {breaches.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Security incidents detected
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase text-slate-600">
                Critical Exposure
              </p>

              <p className="mt-2 text-3xl font-bold text-red-400">
                {breachSeverity.critical}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Critical severity incidents
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
              <p className="text-xs uppercase text-slate-600">
                High Exposure
              </p>

              <p className="mt-2 text-3xl font-bold text-orange-400">
                {breachSeverity.high}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                High severity incidents
              </p>
            </div>

          </div>

        </section>

        {/* =====================================
            RISK DISTRIBUTION
        ===================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div>
            <h2 className="text-xl font-semibold">
              Risk Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Security posture across monitored identities.
            </p>
          </div>

          <div className="mt-7 space-y-5">

            {[
              {
                label: "Critical",
                count: riskStats.critical,
                color: "bg-red-500",
                text: "text-red-400",
              },
              {
                label: "High",
                count: riskStats.high,
                color: "bg-orange-500",
                text: "text-orange-400",
              },
              {
                label: "Medium",
                count: riskStats.medium,
                color: "bg-yellow-500",
                text: "text-yellow-400",
              },
              {
                label: "Low",
                count: riskStats.low,
                color: "bg-green-500",
                text: "text-green-400",
              },
            ].map((item) => {

              const percentage =
                accounts.length > 0
                  ? Math.round(
                      (item.count /
                        accounts.length) *
                        100
                    )
                  : 0;

              return (
                <div key={item.label}>

                  <div className="mb-2 flex justify-between text-sm">

                    <span className={item.text}>
                      {item.label}
                    </span>

                    <span className="text-slate-500">
                      {item.count} account
                      {item.count !== 1
                        ? "s"
                        : ""}{" "}
                      · {percentage}%
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* =====================================
            TOP RISK IDENTITIES
        ===================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-semibold">
                Highest-Risk Identities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Accounts requiring the highest level of attention.
              </p>
            </div>

            <span className="text-xs uppercase tracking-wider text-slate-600">
              Top 5
            </span>

          </div>

          {topRiskAccounts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">
              <p className="text-4xl">🛡️</p>

              <p className="mt-3 font-semibold">
                No risk data available
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">

              {topRiskAccounts.map(
                (account, index) => {

                  const score = Number(
                    account.riskScore || 0
                  );

                  return (
                    <div
                      key={account._id}
                      className={`rounded-xl border ${getRiskBorder(
                        score
                      )} bg-slate-950 p-5`}
                    >

                      <div className="flex flex-col gap-4 md:flex-row md:items-center">

                        <div className="flex items-center gap-4">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-400">
                            #{index + 1}
                          </div>

                          <div>
                            <p className="text-xs uppercase text-slate-600">
                              {account.type ||
                                "Identity"}
                            </p>

                            <h3 className="font-semibold">
                              {account.value ||
                                "Unknown account"}
                            </h3>
                          </div>

                        </div>

                        <div className="flex-1 md:ml-6">

                          <div className="flex justify-between text-xs">

                            <span className="text-slate-600">
                              Risk exposure
                            </span>

                            <span
                              className={getRiskColor(
                                score
                              )}
                            >
                              {score}%
                            </span>

                          </div>

                          <div className="mt-2 h-2 rounded-full bg-slate-800">

                            <div
                              className={`h-full rounded-full ${getRiskBar(
                                score
                              )}`}
                              style={{
                                width: `${score}%`,
                              }}
                            />

                          </div>

                        </div>

                        <div className="md:w-24 md:text-right">

                          <p
                            className={`text-lg font-bold ${getRiskColor(
                              score
                            )}`}
                          >
                            {score}/100
                          </p>

                          <p
                            className={`text-xs ${getRiskColor(
                              score
                            )}`}
                          >
                            {getRiskLevel(score)}
                          </p>

                        </div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================
            PRIORITY ACTIONS
        ===================================== */}

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
              🎯
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Priority Actions
              </h2>

              <p className="text-sm text-slate-500">
                Recommended next steps based on current posture.
              </p>
            </div>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            {riskStats.critical > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">

                <p className="text-xs uppercase text-red-400">
                  Priority 1
                </p>

                <h3 className="mt-2 font-semibold">
                  Secure Critical Accounts
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review critical identities and immediately
                  rotate exposed credentials.
                </p>

              </div>
            )}

            {riskStats.high > 0 && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">

                <p className="text-xs uppercase text-orange-400">
                  Priority 2
                </p>

                <h3 className="mt-2 font-semibold">
                  Investigate High-Risk Accounts
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Review suspicious activity and strengthen
                  authentication controls.
                </p>

              </div>
            )}

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">

              <p className="text-xs uppercase text-cyan-400">
                Continuous
              </p>

              <h3 className="mt-2 font-semibold">
                Continue Monitoring
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Keep monitored identities under continuous
                breach and security observation.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================
            FOOTER STATUS
        ===================================== */}

        <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">

          <span>
            CredGuard Risk Intelligence Engine
          </span>

          <span>
            {accounts.length} identities monitored ·{" "}
            {breaches.length} incidents recorded
          </span>

        </div>

      </div>
    </div>
  );
}

export default RiskDashboard;