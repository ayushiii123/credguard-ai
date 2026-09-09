import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  Critical: "#f87171",
  High: "#fb923c",
  Medium: "#facc15",
  Low: "#4ade80",
};

function RiskTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400">{item.name} risk</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

function RiskDistributionChart({ riskStats, breachSeverity, totalAccounts, totalBreaches }) {
  const data = [
    {
      name: "Critical",
      accounts: Number(riskStats?.critical) || 0,
      breaches: Number(breachSeverity?.critical) || 0,
    },
    {
      name: "High",
      accounts: Number(riskStats?.high) || 0,
      breaches: Number(breachSeverity?.high) || 0,
    },
    {
      name: "Medium",
      accounts: Number(riskStats?.medium) || 0,
      breaches: Number(breachSeverity?.medium) || 0,
    },
    {
      name: "Low",
      accounts: Number(riskStats?.low) || 0,
      breaches: Number(breachSeverity?.low) || 0,
    },
  ];
  const hasData = data.some((item) => item.accounts > 0 || item.breaches > 0);
  const leadingRisk = hasData
    ? data.reduce((leading, item) => {
      const itemTotal = item.accounts + item.breaches;
      const leadingTotal = leading.accounts + leading.breaches;
      return itemTotal > leadingTotal ? item : leading;
    })
    : null;

  return (
    <section className="rounded-2xl border border-cyan-500/15 bg-slate-900/90 p-6 shadow-lg shadow-cyan-500/[0.03]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Visual Risk Intelligence
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Overall Risk Distribution
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Monitored identities grouped by their current exposure score.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-right sm:flex sm:gap-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-600">Monitored</p>
            <p className="mt-1 text-lg font-semibold text-slate-200">{totalAccounts}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-600">Breaches</p>
            <p className="mt-1 text-lg font-semibold text-slate-200">{totalBreaches}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="mt-7 grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 text-center">
          <div>
            <p className="font-medium text-slate-300">No risk data available</p>
            <p className="mt-1 text-sm text-slate-600">Add a monitored identity to see distribution insights.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-7 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 5" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip cursor={{ fill: "rgba(34, 211, 238, 0.05)" }} content={<RiskTooltip />} />
                <Bar dataKey="accounts" name="Accounts" fill="#22d3ee" radius={[5, 5, 0, 0]} animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="breaches" name="Breaches" radius={[5, 5, 0, 0]} animationDuration={1100} animationEasing="ease-out">
                  {data.map((item) => (
                    <Cell key={item.name} fill={COLORS[item.name]} fillOpacity={item.name === leadingRisk?.name ? 1 : 0.72} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Accounts by score
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              Breaches by severity
            </span>
            {data.map((item) => (
              <span key={item.name} className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[item.name] }} />
                {item.name}
              </span>
            ))}
            {leadingRisk && (
              <span className="ml-auto text-slate-400">
                Highest exposure: <strong style={{ color: COLORS[leadingRisk.name] }}>{leadingRisk.name}</strong>
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export default RiskDistributionChart;
