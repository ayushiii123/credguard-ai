import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiEye, FiRefreshCw, FiSearch, FiShield, FiAlertTriangle } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { checkMonitoredAccount, getBreaches, getMonitoredAccounts } from "../services/api";

const riskLevel = (score) => {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Medium";
  return "Low";
};

const riskColor = (score) => {
  if (score >= 76) return "text-red-400";
  if (score >= 51) return "text-orange-400";
  if (score >= 26) return "text-yellow-300";
  return "text-emerald-300";
};

const statusStyle = (status) => {
  if (status === "breached") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (status === "at_risk") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
};

const formatDate = (date) => {
  if (!date) return "Not checked yet";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleString();
};

const formatRelative = (date) => {
  if (!date) return "Not checked yet";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  const minutes = Math.floor((Date.now() - parsed.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
};

function SecurityCheck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [accountsData, breachesData] = await Promise.all([getMonitoredAccounts(), getBreaches()]);
      setAccounts(accountsData?.accounts || []);
      setBreaches(breachesData?.breaches || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load account details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(loadData, 0);
    return () => clearTimeout(initialLoad);
  }, []);

  const account = accounts.find((item) => String(item._id) === String(id));
  const accountBreaches = useMemo(
    () => breaches.filter((breach) => String(breach.monitoredAccountId) === String(id)),
    [breaches, id]
  );
  const visibleAccounts = useMemo(
    () => accounts.filter((item) => `${item.value} ${item.label} ${item.type}`.toLowerCase().includes(query.toLowerCase())),
    [accounts, query]
  );

  const runCheck = async () => {
    try {
      setChecking(true);
      const result = await checkMonitoredAccount(id);
      if (result.account) {
        setAccounts((current) => current.map((item) => item._id === id ? result.account : item));
      }
      await loadData();
      toast.success(result.message || "Security check completed successfully.");
    } catch (checkError) {
      toast.error(checkError.message || "Security check failed.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-400">Loading security information...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <h1 className="text-xl font-semibold text-red-300">Unable to load account details</h1>
          <p className="mt-2 text-slate-300">{error}</p>
          <button type="button" onClick={loadData} className="mt-5 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Retry</button>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-white">
        <div className="mx-auto max-w-5xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <FiShield className="mx-auto text-cyan-300" size={40} />
          <h1 className="mt-4 text-2xl font-semibold">Account not found</h1>
          <p className="mt-2 text-slate-400">This monitored account may have been removed.</p>
          <button type="button" onClick={() => navigate("/monitored-accounts")} className="mt-6 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Back to Monitoring</button>
        </div>
      </div>
    );
  }

  const score = Number(account.riskScore) || 0;
  const level = riskLevel(score);

  return (
    <div className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button type="button" onClick={() => navigate("/monitored-accounts")} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"><FiArrowLeft /> Back to Monitoring</button>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">CredGuard Intelligence</p>
            <h1 className="mt-2 text-3xl font-bold">Account Security Check</h1>
            <p className="mt-2 text-sm text-slate-400">{account.type || "Account"}: <span className="text-slate-200">{account.value}</span></p>
          </div>
          <button type="button" onClick={runCheck} disabled={checking} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">
            <FiRefreshCw className={checking ? "animate-spin" : ""} /> {checking ? "Checking account security..." : "Run Security Check"}
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Risk Score</p><p className={`mt-3 text-3xl font-bold ${riskColor(score)}`}>{score}<span className="text-base text-slate-500"> / 100</span></p><p className={`mt-1 text-sm font-medium ${riskColor(score)}`}>{level}</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Breaches Found</p><p className="mt-3 text-3xl font-bold text-red-300">{accountBreaches.length}</p><p className="mt-1 text-sm text-slate-500">Records linked to this account</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Account Status</p><p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold capitalize ${statusStyle(account.status)}`}><span className="mr-2">●</span>{String(account.status || "safe").replace("_", " ")}</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5"><p className="text-xs uppercase tracking-wider text-slate-500">Last Checked</p><p className="mt-3 text-xl font-semibold text-slate-200">{formatRelative(account.lastChecked)}</p><p className="mt-1 text-xs text-slate-500">{formatDate(account.lastChecked)}</p></div>
        </section>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Risk Exposure</p><h2 className="mt-2 text-xl font-semibold">Live security score</h2></div><span className={`text-lg font-bold ${riskColor(score)}`}>{level}</span></div>
          <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all duration-700 ${score >= 76 ? "bg-red-500" : score >= 51 ? "bg-orange-500" : score >= 26 ? "bg-yellow-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-slate-600"><span>Low</span><span>Medium</span><span>High</span><span>Critical</span></div>
        </section>

        {accountBreaches.length > 0 && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6"><div className="flex items-center gap-3"><FiAlertTriangle className="text-red-300" /><div><h2 className="text-xl font-semibold">Breach Information</h2><p className="text-sm text-slate-500">Actual breach records linked to this account.</p></div></div><div className="mt-5 space-y-3">{accountBreaches.map((breach) => <div key={breach._id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold text-slate-200">{breach.breachName || "Unknown breach"}</h3><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase text-red-300">{breach.severity || "Unknown"}</span></div><p className="mt-2 text-sm text-slate-400">{breach.description || "No description available."}</p>{breach.dataExposed?.length > 0 && <p className="mt-3 text-xs text-slate-500">Exposed data: <span className="text-slate-300">{breach.dataExposed.join(", ")}</span></p>}</div>)}</div></section>
        )}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-xl font-semibold">Monitoring Accounts</h2><p className="mt-1 text-sm text-slate-500">Select another account to inspect its real security data.</p></div><label className="relative lg:w-72"><FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search account..." className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-cyan-400" /></label></div>
          <div className="mt-5 overflow-x-auto"><table className="min-w-[850px] w-full text-left"><thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Risk</th><th className="px-4 py-3">Breaches</th><th className="px-4 py-3">Last Checked</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-800/80">{visibleAccounts.map((item) => { const itemScore = Number(item.riskScore) || 0; const itemBreaches = breaches.filter((breach) => String(breach.monitoredAccountId) === String(item._id)).length; return <tr key={item._id} className={item._id === account._id ? "bg-cyan-500/5" : "hover:bg-slate-800/40"}><td className="px-4 py-4"><p className="font-medium text-slate-200">{item.label || "Monitored Account"}</p><p className="text-xs text-slate-500">{item.value}</p></td><td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${statusStyle(item.status)}`}>{String(item.status || "safe").replace("_", " ")}</span></td><td className={`px-4 py-4 font-semibold ${riskColor(itemScore)}`}>{itemScore}/100 <span className="text-xs font-normal">{riskLevel(itemScore)}</span></td><td className="px-4 py-4 text-slate-300">{itemBreaches}</td><td className="px-4 py-4 text-sm text-slate-400">{formatRelative(item.lastChecked)}</td><td className="px-4 py-4 text-right"><button type="button" onClick={() => navigate(`/monitoring/check/${item._id}`)} className="mr-2 inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-400/10"><FiRefreshCw /> Check</button><button type="button" onClick={() => navigate(`/monitoring/check/${item._id}`)} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-slate-500"><FiEye /> View</button></td></tr>; })}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}

export default SecurityCheck;
