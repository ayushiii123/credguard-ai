
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMonitoredAccounts,
} from "../services/api";

function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAccounts = async () => {
    try {
      const data = await getMonitoredAccounts();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Accounts Error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      loadAccounts();
    }, 0);

    return () => clearTimeout(initialLoad);
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        Loading monitored accounts...
      </div>
    );
  }

  return (
    <div className="p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          🛡️ Monitored Accounts
        </h1>

        <p className="text-slate-400 mt-2">
          Manage and monitor your digital identities.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-4">🔍</p>

          <h2 className="text-xl font-semibold">
            No accounts monitored
          </h2>

          <p className="text-slate-400 mt-2">
            Add an account to start monitoring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {accounts.map((account) => (

            <div
              key={account._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-sm text-slate-500 uppercase">
                    {account.type}
                  </p>

                  <h2 className="text-xl font-semibold mt-1">
                    {account.value}
                  </h2>

                  <p className="text-slate-400 text-sm mt-1">
                    {account.label}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    account.status === "breached"
                      ? "bg-red-500/10 text-red-400"
                      : account.status === "at_risk"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-green-500/10 text-green-400"
                  }`}
                >
                  {account.status}
                </span>

              </div>

              <div className="mt-6">

                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">
                    Risk Score
                  </span>

                  <span className="font-bold">
                    {account.riskScore}/100
                  </span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">

                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{
                      width: `${account.riskScore}%`,
                    }}
                  />

                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-sm text-slate-500">
                Last checked:{" "}
                {account.lastChecked
                  ? new Date(account.lastChecked).toLocaleString()
                  : "Not checked yet"}
              </div>

              <button
                type="button"
                onClick={() => navigate(`/monitoring/check/${account._id}`)}
                className="w-full mt-4 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                🔍 Check Now
              </button>

            </div>

          ))}

        </div>
      )}

    </div>
  );
}

export default Accounts;
