import { FiActivity } from "react-icons/fi";

const scoreStyles = (score) => {
  if (score >= 75) return { color: "#f87171", label: "Critical Risk" };
  if (score >= 50) return { color: "#fb923c", label: "High Risk" };
  if (score >= 26) return { color: "#facc15", label: "Moderate Risk" };
  return { color: "#4ade80", label: "Low Risk" };
};

function RiskScoreGauge({ score }) {
  const safeScore = Math.min(Math.max(Number(score) || 0, 0), 100);
  const { color, label } = scoreStyles(safeScore);

  return (
    <div className="flex h-full min-h-64 flex-col justify-between rounded-xl border border-slate-700/70 bg-slate-950/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Overall Risk Score
          </p>
          <p className="mt-1 text-sm text-slate-400">Current security posture</p>
        </div>
        <FiActivity aria-hidden="true" className="text-cyan-300" size={20} />
      </div>

      <div className="my-6 flex items-center gap-4">
        <div
          className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${color} ${safeScore}%, #1e293b ${safeScore}% 100%)`,
          }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-slate-950">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{safeScore}</p>
              <p className="text-xs text-slate-500">/ 100</p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Status</p>
          <p className="mt-1 text-lg font-semibold" style={{ color }}>
            {label}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Score calculated from monitored identity exposure.
          </p>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${safeScore}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default RiskScoreGauge;
