import { useEffect, useMemo, useState } from "react";
import { FiAlertTriangle, FiCalendar, FiChevronDown, FiEye, FiFileText, FiSearch, FiShield, FiUserCheck } from "react-icons/fi";
import { getAuditLogs } from "../services/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const showLegacyCards = false;

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAuditLogs();

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (err) {
      console.error("Audit Logs Error:", err);

      setError(
        err?.message || "Failed to load audit logs"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      loadLogs();
    }, 0);

    return () => clearTimeout(initialLoad);
  }, []);

  // =========================
  // FILTER LOGS
  // =========================

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const now = new Date();

    return logs.filter((log) => {
      const matchesCategory =
        filter === "all" ||
        String(log.category || "").toLowerCase() === filter.toLowerCase();
      const searchableText = [
        log.action,
        log.category,
        log.description,
        log.ipAddress,
        log.user,
        log.userName,
        log.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
      const createdAt = log.createdAt ? new Date(log.createdAt) : null;
      const matchesDate =
        dateFilter === "all" ||
        (createdAt && !Number.isNaN(createdAt.getTime()) &&
          (dateFilter === "today"
            ? createdAt.toDateString() === now.toDateString()
            : dateFilter === "week"
              ? now - createdAt <= 7 * 24 * 60 * 60 * 1000
              : createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()));

      return matchesCategory && matchesSearch && matchesDate;
    });
  }, [logs, filter, search, dateFilter]);

  // =========================
  // COUNTS
  // =========================

  const authenticationCount = logs.filter(
    (log) =>
      String(log.category || "").toLowerCase() ===
      "authentication"
  ).length;

  const breachCount = logs.filter(
    (log) =>
      String(log.category || "").toLowerCase() ===
      "breach"
  ).length;

  const securityCount = logs.filter(
    (log) =>
      String(log.category || "").toLowerCase() ===
      "security"
  ).length;

  // =========================
  // CATEGORY STYLE
  // =========================

  const categoryStyle = (category) => {
    const normalizedCategory = String(
      category || ""
    ).toLowerCase();

    switch (normalizedCategory) {
      case "authentication":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";

      case "breach":
        return "bg-red-500/10 text-red-400 border-red-500/30";

      case "security":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";

      case "monitoring":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";

      case "ai":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";

      case "alert":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";

      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  // =========================
  // ICON BACKGROUND
  // =========================

  const iconBackground = (category) => {
    const normalizedCategory = String(
      category || ""
    ).toLowerCase();

    switch (normalizedCategory) {
      case "authentication":
        return "bg-cyan-500/10";

      case "breach":
        return "bg-red-500/10";

      case "security":
        return "bg-yellow-500/10";

      case "monitoring":
        return "bg-blue-500/10";

      case "ai":
        return "bg-purple-500/10";

      case "alert":
        return "bg-orange-500/10";

      default:
        return "bg-slate-800";
    }
  };

  // =========================
  // ICON
  // =========================

  const getIcon = (category) => {
    const normalizedCategory = String(
      category || ""
    ).toLowerCase();

    switch (normalizedCategory) {
      case "authentication":
        return "🔐";

      case "breach":
        return "🚨";

      case "security":
        return "🛡️";

      case "monitoring":
        return "👁️";

      case "ai":
        return "🤖";

      case "alert":
        return "🔔";

      default:
        return "📋";
    }
  };

  // =========================
  // DATE FORMAT
  // =========================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString();
  };

  // =========================
  // METADATA FORMAT
  // =========================

  const formatMetadataValue = (value) => {
    if (value === null || value === undefined) {
      return "None";
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? value.join(", ")
        : "None";
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const getUserName = (log) => {
    if (typeof log.user === "string") return log.user;
    return log.user?.name || log.userName || log.name || "System";
  };

  const getStatus = (log) => {
    const status = String(log.status || "").toLowerCase();
    if (["failed", "error", "failure"].includes(status)) {
      return { label: "Failed", className: "text-red-400 bg-red-500/10", icon: "✕" };
    }
    if (["warning", "warn", "at_risk"].includes(status) || String(log.category).toLowerCase() === "breach") {
      return { label: "Warning", className: "text-yellow-300 bg-yellow-500/10", icon: "⚠" };
    }
    return { label: "Success", className: "text-emerald-300 bg-emerald-500/10", icon: "✓" };
  };

  const formatShortDescription = (description) => {
    const value = description || "No description available.";
    return value.length > 72 ? `${value.slice(0, 72)}...` : value;
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-400">
              Loading security activity...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* =========================
            HEADER
        ========================= */}

        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              Security Center
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Audit Logs
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Track authentication, monitoring, breach and security activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Refreshing..."
              : "↻ Refresh Logs"}
          </button>

        </header>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400 sm:flex-row sm:items-center sm:justify-between">

            <p>{error}</p>

            <button
              type="button"
              onClick={loadLogs}
              className="w-fit rounded-lg border border-red-500/30 px-3 py-1 text-sm transition hover:bg-red-500/10"
            >
              Retry
            </button>

          </div>
        )}

        {/* =========================
            STATS
        ========================= */}

        <div className="grid gap-5 md:grid-cols-4">

          {/* Total */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-slate-900">
            <div className="flex items-center justify-between"><p className="text-slate-400">Total Events</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300"><FiFileText aria-hidden="true" /></span></div>

            <p className="mt-2 text-3xl font-bold text-white">
              {logs.length}
            </p>
          </div>

          {/* Authentication */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-cyan-500/30 hover:bg-slate-900">
            <div className="flex items-center justify-between"><p className="text-slate-400">Authentication</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300"><FiUserCheck aria-hidden="true" /></span></div>

            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {authenticationCount}
            </p>
          </div>

          {/* Breach */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-red-500/30 hover:bg-slate-900">
            <div className="flex items-center justify-between"><p className="text-slate-400">Breach Events</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/10 text-red-300"><FiAlertTriangle aria-hidden="true" /></span></div>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {breachCount}
            </p>
          </div>

          {/* Security */}
          <div className="group rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition hover:-translate-y-0.5 hover:border-yellow-500/30 hover:bg-slate-900">
            <div className="flex items-center justify-between"><p className="text-slate-400">Security Events</p><span className="grid h-9 w-9 place-items-center rounded-lg bg-yellow-500/10 text-yellow-300"><FiShield aria-hidden="true" /></span></div>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {securityCount}
            </p>
          </div>

        </div>

        {/* =========================
            FILTERS
        ========================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">

          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <label className="relative min-w-0 flex-1">
              <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
              />
            </label>
            <label className="relative lg:w-48">
              <FiCalendar aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-9 text-sm text-slate-300 outline-none focus:border-cyan-400"
              >
                <option value="all">Any date</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
              </select>
              <FiChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">

            {[
              "all",
              "authentication",
              "monitoring",
              "breach",
              "ai",
              "alert",
              "security",
            ].map((item) => (

              <button
                type="button"
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  filter === item
                    ? "bg-cyan-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {item === "all"
                  ? "All Activity"
                  : item.charAt(0).toUpperCase() +
                    item.slice(1)}
              </button>

            ))}

          </div>

        </div>

        {/* =========================
            CURRENT FILTER
        ========================= */}

        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-5 py-3">

          <div>
            <span className="text-sm text-slate-500">
              Showing:
            </span>

            <span className="ml-2 font-semibold text-cyan-400">
              {filter === "all"
                ? "All Activity"
                : filter.charAt(0).toUpperCase() +
                  filter.slice(1)}
            </span>
          </div>

          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-400">
            {filteredLogs.length} event
            {filteredLogs.length !== 1 ? "s" : ""}
          </span>

        </div>

        {/* =========================
            LOGS
        ========================= */}

        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <div className="mb-4 text-5xl">🛡️</div>
            <h2 className="text-xl font-semibold">No Security Activity Found</h2>
            <p className="mt-2 text-slate-400">Try changing your search or filter.</p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/10">
            <div className="flex flex-col gap-2 border-b border-slate-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Audit Activity</h2>
                <p className="mt-1 text-sm text-slate-500">Scan and review security events from your workspace.</p>
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-600">{filteredLogs.length} visible event{filteredLogs.length === 1 ? "" : "s"}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full text-left">
                <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Time</th>
                    <th className="px-5 py-4 font-medium">User</th>
                    <th className="px-5 py-4 font-medium">Action</th>
                    <th className="px-5 py-4 font-medium">Category</th>
                    <th className="px-5 py-4 font-medium">Description</th>
                    <th className="px-5 py-4 font-medium">IP Address</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-right font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredLogs.map((log) => {
                    const status = getStatus(log);
                    return (
                      <tr key={log._id} className="group transition hover:bg-slate-800/40">
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-400">{formatDate(log.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/10 text-cyan-300"><FiUserCheck aria-hidden="true" /></span>
                            <span className="max-w-32 truncate text-sm font-medium text-slate-200">{getUserName(log)}</span>
                          </div>
                        </td>
                        <td className="max-w-40 px-5 py-4 text-sm font-medium text-slate-200">{log.action || "Security Event"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase ${categoryStyle(log.category)}`}>
                            <span>{getIcon(log.category)}</span>{log.category || "security"}
                          </span>
                        </td>
                        <td className="max-w-64 px-5 py-4 text-sm text-slate-400" title={log.description || "No description available."}>{formatShortDescription(log.description)}</td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">{log.ipAddress || "Unknown"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}><span>{status.icon}</span>{status.label}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button type="button" onClick={() => setSelectedLog(log)} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-400/10">
                            <FiEye aria-hidden="true" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="audit-event-details">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
              <div className="flex items-start justify-between border-b border-slate-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconBackground(selectedLog.category)}`}>{getIcon(selectedLog.category)}</span>
                  <div><p className="text-xs uppercase tracking-wider text-slate-500">Audit Event Details</p><h2 id="audit-event-details" className="mt-1 text-lg font-semibold">{selectedLog.action || "Security Event"}</h2></div>
                </div>
                <button type="button" onClick={() => setSelectedLog(null)} aria-label="Close details" className="rounded-lg px-2 py-1 text-2xl text-slate-500 hover:bg-slate-800 hover:text-white">×</button>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {[
                  ["Action", selectedLog.action || "Unknown"],
                  ["Category", selectedLog.category || "Unknown"],
                  ["User", getUserName(selectedLog)],
                  ["Time", formatDate(selectedLog.createdAt)],
                  ["IP Address", selectedLog.ipAddress || "Unknown"],
                  ["Status", getStatus(selectedLog).label],
                ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><p className="text-xs uppercase tracking-wider text-slate-600">{label}</p><p className="mt-2 break-words text-sm text-slate-200">{value}</p></div>)}
                <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wider text-slate-600">Full Description</p><p className="mt-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">{selectedLog.description || "No description available."}</p></div>
                <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wider text-slate-600">Metadata</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-300">{selectedLog.metadata && Object.keys(selectedLog.metadata).length ? formatMetadataValue(selectedLog.metadata) : "None"}</pre></div>
                <div className="sm:col-span-2"><p className="text-xs uppercase tracking-wider text-slate-600">User Agent</p><p className="mt-2 break-all rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs leading-5 text-slate-400">{selectedLog.userAgent || "Unknown"}</p></div>
              </div>
            </div>
          </div>
        )}

        {showLegacyCards && (filteredLogs.length === 0 ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">

            <div className="mb-4 text-5xl">
              🛡️
            </div>

            <h2 className="text-xl font-semibold">
              No Security Activity
            </h2>

            <p className="mt-2 text-slate-400">
              No audit events were found for this filter.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {filteredLogs.map((log) => (

              <div
                key={log._id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >

                {/* =========================
                    MAIN LOG
                ========================= */}

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  <div className="flex min-w-0 gap-4">

                    {/* Icon */}

                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${iconBackground(
                        log.category
                      )}`}
                    >
                      {getIcon(log.category)}
                    </div>

                    {/* Content */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-3">

                        <h2 className="text-lg font-semibold">
                          {log.action ||
                            "Security Event"}
                        </h2>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${categoryStyle(
                            log.category
                          )}`}
                        >
                          {log.category ||
                            "security"}
                        </span>

                      </div>

                      <p className="mt-3 text-slate-300">
                        {log.description ||
                          "No description available."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-5 text-sm">

                        <span className="text-slate-500">
                          🕐{" "}
                          <span className="text-slate-400">
                            {formatDate(
                              log.createdAt
                            )}
                          </span>
                        </span>

                        <span className="text-slate-500">
                          🌐 IP:{" "}
                          <span className="text-slate-400">
                            {log.ipAddress ||
                              "Unknown"}
                          </span>
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* =========================
                    METADATA
                ========================= */}

                {log.metadata &&
                  typeof log.metadata ===
                    "object" &&
                  Object.keys(log.metadata)
                    .length > 0 && (

                    <div className="mt-6 border-t border-slate-800 pt-5">

                      <h3 className="mb-3 text-sm font-semibold text-slate-400">
                        EVENT DETAILS
                      </h3>

                      <div className="grid gap-3 md:grid-cols-2">

                        {Object.entries(
                          log.metadata
                        ).map(
                          ([key, value]) => (

                            <div
                              key={key}
                              className="rounded-xl bg-slate-800 p-3"
                            >

                              <p className="text-xs uppercase text-slate-500">
                                {key}
                              </p>

                              <p className="mt-1 break-all whitespace-pre-wrap text-sm text-slate-300">
                                {formatMetadataValue(
                                  value
                                )}
                              </p>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  )}

                {/* =========================
                    USER AGENT
                ========================= */}

                <div className="mt-5 border-t border-slate-800 pt-4">

                  <p className="text-xs text-slate-500">
                    USER AGENT
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-400">
                    {log.userAgent ||
                      "Unknown"}
                  </p>

                </div>

              </div>

            ))}

          </div>

        ))}

      </div>
    </div>
  );
}

export default AuditLogs;