import { useEffect, useRef, useState } from "react";
import { getAlerts } from "../services/api";

const CHECK_INTERVAL = 5000;
const RISK_THRESHOLD = 50;

function SecurityNotification() {
  const [notification, setNotification] = useState(null);

  const knownAlertsRef = useRef(new Set());
  const initializedRef = useRef(false);
  const audioContextRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    /* =========================
       Browser Notification Permission
    ========================= */

    if (
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission().catch((error) => {
        console.error(
          "Notification permission error:",
          error
        );
      });
    }

    /* =========================
       Web Audio
    ========================= */

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    /* =========================
       Beep Sound
    ========================= */

    const playBeep = () => {
      const context = audioContextRef.current;

      if (!context) return;

      try {
        if (context.state === "suspended") {
          context.resume();
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gainNode.gain.setValueAtTime(
          0.0001,
          context.currentTime
        );

        gainNode.gain.exponentialRampToValueAtTime(
          0.25,
          context.currentTime + 0.02
        );

        gainNode.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.35
        );

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start();

        oscillator.stop(
          context.currentTime + 0.35
        );
      } catch (error) {
        console.error(
          "Alert sound error:",
          error
        );
      }
    };

    /* =========================
       Browser Notification
    ========================= */

    const showBrowserNotification = (alert) => {
      if (
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          const browserNotification =
            new Notification(
              alert.title ||
                "CredGuard Security Alert",
              {
                body:
                  alert.message ||
                  `Security risk detected. Risk Score: ${alert.riskScore}/100`,
                icon: "/favicon.ico",
              }
            );

          browserNotification.onclick = () => {
            window.focus();
            window.location.href = "/alerts";
          };
        } catch (error) {
          console.error(
            "Browser notification error:",
            error
          );
        }
      }
    };

    /* =========================
       Check Alerts
    ========================= */

    const checkAlerts = async () => {
      try {
        const data = await getAlerts();

        const alerts = data.alerts || [];

        /*
         * First API call:
         * Existing alerts ko notify nahi karna.
         */

        if (!initializedRef.current) {
          alerts.forEach((alert) => {
            knownAlertsRef.current.add(
              alert._id
            );
          });

          initializedRef.current = true;

          return;
        }

        /*
         * Find NEW alerts with risk >= 50
         */

        const newHighRiskAlerts =
          alerts.filter(
            (alert) =>
              !knownAlertsRef.current.has(
                alert._id
              ) &&
              Number(alert.riskScore) >=
                RISK_THRESHOLD
          );

        /*
         * Remember every alert
         */

        alerts.forEach((alert) => {
          knownAlertsRef.current.add(
            alert._id
          );
        });

        if (
          newHighRiskAlerts.length === 0
        ) {
          return;
        }

        /*
         * Show latest high-risk alert
         */

        const alert =
          newHighRiskAlerts[0];

        setNotification(alert);

        /* Sound */
        playBeep();

        /* Browser notification */
        showBrowserNotification(
          alert
        );

        /*
         * Remove in-app notification
         * after 8 seconds.
         */

        if (timeoutRef.current) {
          clearTimeout(
            timeoutRef.current
          );
        }

        timeoutRef.current =
          setTimeout(() => {
            setNotification(null);
          }, 8000);
      } catch (error) {
        console.error(
          "Security Notification Error:",
          error.message
        );
      }
    };

    /* =========================
       Initial Check
    ========================= */

    checkAlerts();

    /* =========================
       Auto Check Every 5 Seconds
    ========================= */

    const interval = setInterval(
      checkAlerts,
      CHECK_INTERVAL
    );

    /* =========================
       Cleanup
    ========================= */

    return () => {
      clearInterval(interval);

      if (timeoutRef.current) {
        clearTimeout(
          timeoutRef.current
        );
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /* =========================
     No Notification
  ========================= */

  if (!notification) {
    return null;
  }

  /* =========================
     In-App Notification
  ========================= */

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[360px] max-w-[calc(100vw-40px)]">
      <div className="rounded-2xl border border-red-500/40 bg-slate-900 p-5 shadow-2xl shadow-red-500/20">

        <div className="flex items-start gap-4">

          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xl">
            🚨
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">

            <div className="flex items-center justify-between gap-3">

              <p className="font-bold text-red-400">
                Security Alert
              </p>

              <button
                onClick={() =>
                  setNotification(null)
                }
                className="text-slate-500 hover:text-white"
              >
                ✕
              </button>

            </div>

            <h3 className="mt-1 font-semibold text-white">
              {notification.title}
            </h3>

            <p className="mt-2 text-sm leading-5 text-slate-400">
              {notification.message}
            </p>

            <div className="mt-3 inline-flex rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400">
              Risk Score:{" "}
              {notification.riskScore}/100
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default SecurityNotification;