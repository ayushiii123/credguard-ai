import { useEffect, useRef, useState } from "react";
import {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
} from "../services/api";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState("default");

  const [popupAlert, setPopupAlert] = useState(null);

  // Stores IDs of alerts that have already triggered notification/sound
  const notifiedAlertIds = useRef(new Set());

  // Used to avoid notification on the very first fetch
  const initialLoadCompleted = useRef(false);

  /* =====================================================
     Browser Notification Permission
  ===================================================== */

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  /* =====================================================
     Enable Sound
  ===================================================== */

  const enableSound = () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        console.warn("AudioContext is not supported.");
        return;
      }

      const audioContext = new AudioContext();

      // Small silent/very short oscillator to unlock audio
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      gainNode.gain.value = 0.0001;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.01);

      setSoundEnabled(true);
    } catch (error) {
      console.error("Sound enable error:", error);
    }
  };

  /* =====================================================
     Play Alert Sound
  ===================================================== */

  const playAlertSound = (severity = "medium") => {
    if (!soundEnabled) {
      return;
    }

    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";

      /*
       * Critical alerts get a higher frequency.
       */
      const frequency =
        severity === "critical"
          ? 1000
          : severity === "high"
          ? 800
          : 600;

      oscillator.frequency.setValueAtTime(
        frequency,
        audioContext.currentTime
      );

      gainNode.gain.setValueAtTime(
        0.0001,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.25,
        audioContext.currentTime + 0.03
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.35
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.4
      );

      /*
       * Critical alert gets a second short beep.
       */
      if (severity === "critical") {
        setTimeout(() => {
          try {
            const secondContext = new AudioContext();

            const secondOscillator =
              secondContext.createOscillator();

            const secondGain =
              secondContext.createGain();

            secondOscillator.connect(secondGain);
            secondGain.connect(
              secondContext.destination
            );

            secondOscillator.type = "sine";

            secondOscillator.frequency.setValueAtTime(
              1200,
              secondContext.currentTime
            );

            secondGain.gain.setValueAtTime(
              0.0001,
              secondContext.currentTime
            );

            secondGain.gain.exponentialRampToValueAtTime(
              0.25,
              secondContext.currentTime + 0.03
            );

            secondGain.gain.exponentialRampToValueAtTime(
              0.0001,
              secondContext.currentTime + 0.35
            );

            secondOscillator.start();

            secondOscillator.stop(
              secondContext.currentTime + 0.4
            );
          } catch (error) {
            console.error(
              "Critical alert sound error:",
              error
            );
          }
        }, 450);
      }
    } catch (error) {
      console.error(
        "Alert sound error:",
        error
      );
    }
  };

  /* =====================================================
     Browser Notification
  ===================================================== */

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return;
    }

    try {
      const permission =
        await Notification.requestPermission();

      setNotificationPermission(permission);
    } catch (error) {
      console.error(
        "Notification permission error:",
        error
      );
    }
  };

  const showBrowserNotification = (alert) => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    try {
      const isCritical =
        alert.riskScore >= 80 ||
        alert.severity === "critical";

      new Notification(
        isCritical
          ? "🚨 Critical Security Alert"
          : "⚠️ Security Risk Detected",
        {
          body: `${alert.title}\nRisk Score: ${alert.riskScore}/100`,
          tag: alert._id,
        }
      );
    } catch (error) {
      console.error(
        "Browser notification error:",
        error
      );
    }
  };

  /* =====================================================
     Handle New Alert
  ===================================================== */

  const handleNewAlert = (alert) => {
    if (!alert?._id) {
      return;
    }

    /*
     * Only notify for risk >= 50.
     */
    if (Number(alert.riskScore) < 50) {
      return;
    }

    /*
     * Prevent duplicate sound/notification.
     */
    if (notifiedAlertIds.current.has(alert._id)) {
      return;
    }

    notifiedAlertIds.current.add(alert._id);

    /*
     * Show in-app popup.
     */
    setPopupAlert(alert);

    /*
     * Play sound.
     */
    playAlertSound(
      alert.riskScore >= 80
        ? "critical"
        : alert.severity
    );

    /*
     * Browser notification.
     */
    showBrowserNotification(alert);

    /*
     * Automatically hide popup.
     */
    setTimeout(() => {
      setPopupAlert((current) => {
        if (current?._id === alert._id) {
          return null;
        }

        return current;
      });
    }, 6000);
  };

  /* =====================================================
     Fetch Alerts
  ===================================================== */

  const fetchAlerts = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }

      setError("");

      const data = await getAlerts();

      const newAlerts = data.alerts || [];

      /*
       * First API call:
       * Don't make old alerts beep immediately.
       */
      if (!initialLoadCompleted.current) {
        newAlerts.forEach((alert) => {
          notifiedAlertIds.current.add(alert._id);
        });

        initialLoadCompleted.current = true;
      } else {
        /*
         * Check for newly created alerts.
         */
        newAlerts.forEach((alert) => {
          if (
            !alert.isRead &&
            Number(alert.riskScore) >= 50 &&
            !notifiedAlertIds.current.has(alert._id)
          ) {
            handleNewAlert(alert);
          }
        });
      }

      setAlerts(newAlerts);
    } catch (err) {
      console.error("Alerts Error:", err);

      if (!isPolling) {
        setError(
          err.message || "Failed to load alerts"
        );
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  /* =====================================================
     Initial Fetch + Real-Time Polling
  ===================================================== */

  useEffect(() => {
    fetchAlerts();

    /*
     * Check for new alerts every 10 seconds.
     */
    const interval = setInterval(() => {
      fetchAlerts(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =====================================================
     Mark Single Alert As Read
  ===================================================== */

  const handleMarkAsRead = async (id) => {
    try {
      setActionLoading(true);
      setError("");

      await markAlertAsRead(id);

      setAlerts((previousAlerts) =>
        previousAlerts.map((alert) =>
          alert._id === id
            ? { ...alert, isRead: true }
            : alert
        )
      );
    } catch (err) {
      console.error(
        "Mark Alert Error:",
        err
      );

      setError(
        err.message ||
          "Failed to mark alert as read"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     Mark All Alerts As Read
  ===================================================== */

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      setError("");

      const data =
        await markAllAlertsAsRead();

      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(
        "Mark All Alerts Error:",
        err
      );

      setError(
        err.message ||
          "Failed to update alerts"
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     Severity Style
  ===================================================== */

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "critical":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      case "high":
        return "border-orange-500/30 bg-orange-500/10 text-orange-400";

      case "medium":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

      default:
        return "border-green-500/30 bg-green-500/10 text-green-400";
    }
  };

  /* =====================================================
     Counts
  ===================================================== */

  const unreadCount = alerts.filter(
    (alert) => !alert.isRead
  ).length;

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity === "critical" ||
      Number(alert.riskScore) >= 80
  ).length;

  const highRiskCount = alerts.filter(
    (alert) =>
      Number(alert.riskScore) >= 50 &&
      Number(alert.riskScore) < 80
  ).length;

  /* =====================================================
     Loading
  ===================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <p className="text-slate-400">
              Loading security alerts...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* =================================================
            NEW ALERT POPUP
        ================================================= */}

        {popupAlert && (
          <div className="fixed right-6 top-6 z-50 w-[calc(100%-3rem)] max-w-sm animate-pulse">
            <div
              className={`rounded-2xl border p-5 shadow-2xl backdrop-blur ${
                Number(popupAlert.riskScore) >= 80
                  ? "border-red-500/40 bg-red-950/95 shadow-red-500/20"
                  : "border-orange-500/40 bg-slate-900/95 shadow-orange-500/20"
              }`}
            >
              <div className="flex items-start gap-3">

                <div className="text-2xl">
                  {Number(
                    popupAlert.riskScore
                  ) >= 80
                    ? "🚨"
                    : "⚠️"}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        Security Alert
                      </p>

                      <h3 className="mt-1 font-bold text-white">
                        {popupAlert.title}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        setPopupAlert(null)
                      }
                      className="text-slate-500 transition hover:text-white"
                    >
                      ✕
                    </button>

                  </div>

                  <p className="mt-2 text-sm leading-5 text-slate-300">
                    {popupAlert.message}
                  </p>

                  <div className="mt-4 flex items-center justify-between">

                    <span
                      className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                        Number(
                          popupAlert.riskScore
                        ) >= 80
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-orange-500/30 bg-orange-500/10 text-orange-400"
                      }`}
                    >
                      Risk: {popupAlert.riskScore}/100
                    </span>

                    <button
                      onClick={() => {
                        setPopupAlert(null);
                      }}
                      className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                      View Alerts
                    </button>

                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
              Security Center
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Security Alerts
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Monitor and manage security alerts generated by CredGuard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* Sound Button */}
            <button
              onClick={enableSound}
              disabled={soundEnabled}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                soundEnabled
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-500 hover:text-cyan-400"
              }`}
            >
              {soundEnabled
                ? "🔊 Sound Enabled"
                : "🔇 Enable Alert Sound"}
            </button>

            {/* Browser Notification */}
            {notificationPermission !==
              "granted" && (
              <button
                onClick={
                  requestNotificationPermission
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
              >
                🔔 Enable Notifications
              </button>
            )}

            {/* Mark All */}
            <button
              onClick={
                handleMarkAllAsRead
              }
              disabled={
                unreadCount === 0 ||
                actionLoading
              }
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {actionLoading
                ? "Updating..."
                : "Mark All as Read"}
            </button>

          </div>

        </header>

        {/* =================================================
            INFO
        ================================================= */}

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">

          <div className="flex items-start gap-3">

            <span className="text-xl">
              🛡️
            </span>

            <div>

              <p className="font-semibold text-cyan-400">
                Real-Time Security Monitoring
              </p>

              <p className="mt-1 text-sm text-slate-400">
                CredGuard automatically checks for new
                security alerts every 10 seconds.
                Alerts with a risk score of{" "}
                <strong className="text-white">
                  50+
                </strong>{" "}
                trigger notifications and alert sounds.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">

            <p>{error}</p>

            <button
              onClick={() => fetchAlerts()}
              className="rounded-lg border border-red-500/30 px-3 py-1 text-sm hover:bg-red-500/10"
            >
              Retry
            </button>

          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-slate-400">
              Total Alerts
            </p>

            <p className="mt-2 text-4xl font-bold text-cyan-400">
              {alerts.length}
            </p>

          </div>

          {/* Unread */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-slate-400">
              Unread Alerts
            </p>

            <p className="mt-2 text-4xl font-bold text-amber-400">
              {unreadCount}
            </p>

          </div>

          {/* High Risk */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-slate-400">
              High Risk
            </p>

            <p className="mt-2 text-4xl font-bold text-orange-400">
              {highRiskCount}
            </p>

          </div>

          {/* Critical */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-slate-400">
              Critical Alerts
            </p>

            <p className="mt-2 text-4xl font-bold text-red-400">
              {criticalCount}
            </p>

          </div>

        </div>

        {/* =================================================
            ALERT LIST
        ================================================= */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold">
              Recent Alerts
            </h2>

            <span className="text-sm text-slate-400">
              {alerts.length} total
            </span>

          </div>

          {alerts.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">

              <p className="text-slate-400">
                No security alerts found.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-4">

              {alerts.map((alert) => {

                const isHighRisk =
                  Number(alert.riskScore) >= 50;

                const isCritical =
                  Number(alert.riskScore) >= 80 ||
                  alert.severity === "critical";

                return (
                  <div
                    key={alert._id}
                    className={`rounded-xl border p-5 transition ${
                      alert.isRead
                        ? "border-slate-800 bg-slate-950"
                        : isCritical
                        ? "border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5"
                        : isHighRisk
                        ? "border-orange-500/20 bg-orange-500/5 shadow-lg shadow-orange-500/5"
                        : "border-cyan-500/20 bg-slate-950 shadow-lg shadow-cyan-500/5"
                    }`}
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="text-lg">
                            {isCritical
                              ? "🚨"
                              : isHighRisk
                              ? "⚠️"
                              : "🔔"}
                          </span>

                          <h3 className="font-semibold text-white">
                            {alert.title}
                          </h3>

                          {!alert.isRead && (
                            <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-semibold text-cyan-400">
                              NEW
                            </span>
                          )}

                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {alert.message}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">

                          <span>
                            Risk Score:{" "}
                            <strong
                              className={
                                isCritical
                                  ? "text-red-400"
                                  : isHighRisk
                                  ? "text-orange-400"
                                  : "text-slate-300"
                              }
                            >
                              {alert.riskScore}/100
                            </strong>
                          </span>

                          <span>
                            {alert.createdAt
                              ? new Date(
                                  alert.createdAt
                                ).toLocaleString()
                              : "Unknown date"}
                          </span>

                        </div>

                      </div>

                      <div className="flex flex-wrap items-center gap-3">

                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold uppercase ${getSeverityStyle(
                            alert.severity
                          )}`}
                        >
                          {alert.severity}
                        </span>

                        {!alert.isRead && (
                          <button
                            onClick={() =>
                              handleMarkAsRead(
                                alert._id
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Mark Read
                          </button>
                        )}

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

export default Alerts;