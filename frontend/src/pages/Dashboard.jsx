
import { useEffect, useState } from "react";
import {
  getOverallRisk,
  getAlerts,
  getBreaches,
  getMonitoredAccounts,
} from "../services/api";

function Dashboard() {
  const [riskData, setRiskData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      const [riskResult, alertsResult, breachesResult, accountsResult] =
        await Promise.all([
          getOverallRisk(),
          getAlerts(),
          getBreaches(),
          getMonitoredAccounts(),
        ]);

      setRiskData(riskResult);
      setAlerts(alertsResult?.alerts || []);
      setBreaches(breachesResult?.breaches || []);
      setAccounts(accountsResult?.accounts || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err?.message || "Failed to load dashboard");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
  const initialLoad = setTimeout(() => {
    loadDashboard(true);
  }, 0);

    const interval = setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-400">
              Loading security dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-bold text-red-400">
              Dashboard Error
            </h2>

            <p className="mt-2 text-slate-300">{error}</p>

            <button
              type="button"
              onClick={loadDashboard}
              className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const riskScore = Number(riskData?.risk?.score ?? 0);
  const riskLevel = String(
    riskData?.risk?.level || "low"
  ).toLowerCase();

  const statistics = riskData?.statistics || {};

  const monitoredAccounts =
    Number(statistics.monitoredAccounts) || accounts.length;

  const totalBreaches =
    Number(statistics.totalBreaches) || breaches.length;

  const criticalBreaches =
    Number(statistics.criticalBreaches) || 0;

  const highBreaches =
    Number(statistics.highBreaches) || 0;

  const unreadAlerts = alerts.filter(
    (alert) => alert?.isRead === false
  ).length;

  const getRiskTextColor = () => {
    switch (riskLevel) {
      case "critical":
        return "text-red-400";
      case "high":
        return "text-orange-400";
      case "medium":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const getRiskBarColor = () => {
    switch (riskLevel) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      default:
        return "bg-green-500";
    }
  };

  const getSeverityClass = (severity) => {
    switch (String(severity || "").toLowerCase()) {
      case "critical":
        return "bg-red-500/10 text-red-400";
      case "high":
        return "bg-orange-500/10 text-orange-400";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400";
      default:
        return "bg-green-500/10 text-green-400";
    }
  };

  const safeRiskScore = Math.min(
    Math.max(riskScore, 0),
    100
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              Overview
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Security Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor your digital security and breach activity.
            </p>
          </div>

          <div
            className={`rounded-xl border px-4 py-2 text-sm ${
              riskLevel === "critical"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : riskLevel === "high"
                ? "border-orange-500/30 bg-orange-500/10 text-orange-300"
                : riskLevel === "medium"
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                : "border-green-500/30 bg-green-500/10 text-green-300"
            }`}
          >
            Security Status:{" "}
            <span className="font-semibold capitalize">
              {riskLevel}
            </span>
            {refreshing && (
              <span className="ml-3 text-xs text-slate-500">
                Updating...
              </span>
            )}
          </div>
        </header>

        {/* STAT CARDS */}
        <div className="grid gap-6 md:grid-cols-3">

          {/* RISK SCORE */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg shadow-cyan-500/5">
            <div className="flex items-center justify-between">
              <p className="text-slate-400">
                Risk Score
              </p>

              <span className="text-xl">⚠️</span>
            </div>

            <div className="mt-3 flex items-end gap-2">
              <h3
                className={`text-5xl font-extrabold ${getRiskTextColor()}`}
              >
                {safeRiskScore}
              </h3>

              <span className="mb-1 text-slate-500">
                /100
              </span>
            </div>

            <div className="mt-5 h-2 w-full rounded-full bg-slate-800">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${getRiskBarColor()}`}
                style={{
                  width: `${safeRiskScore}%`,
                }}
              />
            </div>

            <p
              className={`mt-3 font-semibold capitalize ${getRiskTextColor()}`}
            >
              {riskLevel} Risk
            </p>
          </div>

          {/* MONITORED ACCOUNTS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Monitored Accounts
            </p>

            <h3 className="mt-3 text-4xl font-bold text-cyan-400">
              {monitoredAccounts}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Accounts currently being monitored
            </p>
          </div>

          {/* ACTIVE ALERTS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">
              Active Alerts
            </p>

            <h3 className="mt-3 text-4xl font-bold text-amber-400">
              {unreadAlerts}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {criticalBreaches} critical and{" "}
              {highBreaches} high-risk breaches
            </p>
          </div>
        </div>

        {/* THREAT SUMMARY + RECOMMENDED ACTIONS */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* THREAT SUMMARY */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Threat Summary
              </h2>

              <span className="rounded-lg bg-red-500/10 px-3 py-1 text-sm text-red-400">
                {totalBreaches} Breaches
              </span>
            </div>

            <div className="mt-5 space-y-3">

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-300">
                  Critical Breaches
                </p>

                <p className="mt-1 text-2xl font-bold text-red-400">
                  {criticalBreaches}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-300">
                  High Risk Breaches
                </p>

                <p className="mt-1 text-2xl font-bold text-orange-400">
                  {highBreaches}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-slate-300">
                  Unread Security Alerts
                </p>

                <p className="mt-1 text-2xl font-bold text-amber-400">
                  {unreadAlerts}
                </p>
              </div>
            </div>
          </div>

          {/* RECOMMENDED ACTIONS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Recommended Actions
            </h2>

            <div className="mt-5 space-y-3">

              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="font-semibold text-red-400">
                  Review Critical Alerts
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Check your critical security alerts immediately.
                </p>
              </div>

              <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
                <p className="font-semibold text-orange-400">
                  Update Compromised Credentials
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Change passwords connected with exposed accounts.
                </p>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                <p className="font-semibold text-cyan-400">
                  Continue Monitoring
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  Continue monitoring your accounts for new breaches.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT SECURITY ALERTS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recent Security Alerts
            </h2>

            <span className="text-sm text-slate-400">
              {alerts.length} total
            </span>
          </div>

          {alerts.length === 0 ? (
            <p className="mt-5 text-slate-400">
              No security alerts found.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert._id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-white">
                        {alert.title || "Security Alert"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {alert.message || "Security alert detected."}
                      </p>

                      <p className="mt-2 text-xs text-slate-500">
                        Risk Score: {alert.riskScore ?? 0}/100
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase ${getSeverityClass(
                        alert.severity
                      )}`}
                    >
                      {alert.severity || "low"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT BREACHES */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Recent Breaches
            </h2>

            <span className="text-sm text-slate-400">
              {breaches.length} total
            </span>
          </div>

          {breaches.length === 0 ? (
            <p className="mt-5 text-slate-400">
              No breaches detected.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {breaches.slice(0, 5).map((breach) => (
                <div
                  key={breach._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-white">
                      {breach.breachName || "Security Breach"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Source: {breach.source || "Unknown"}
                    </p>

                    {breach.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {breach.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`w-fit rounded-md px-3 py-1 text-xs font-semibold uppercase ${getSeverityClass(
                      breach.severity
                    )}`}
                  >
                    {breach.severity || "low"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
