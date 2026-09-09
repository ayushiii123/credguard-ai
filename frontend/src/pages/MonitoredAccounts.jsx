
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMonitoredAccounts,
  deleteMonitoredAccount,
} from "../services/api";

function MonitoredAccounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState("email");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================
     LOAD ACCOUNTS
  ========================= */

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMonitoredAccounts();

      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Accounts Error:", error.message);
      setError(
        error.message || "Failed to load monitored accounts."
      );
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

  /* =========================
     ADD ACCOUNT
  ========================= */

  const handleAddAccount = async (e) => {
    e.preventDefault();

    if (!value.trim()) {
      setError("Please enter an account value.");
      return;
    }

    try {
      setAdding(true);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/monitor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            value: value.trim(),
            label: label.trim() || "My Account",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add account"
        );
      }

      setAccounts((current) => [
        data.account,
        ...current,
      ]);

      setValue("");
      setLabel("");

      setSuccess("Account added successfully.");
    } catch (error) {
      console.error(
        "Add Account Error:",
        error.message
      );

      setError(
        error.message || "Failed to add account."
      );
    } finally {
      setAdding(false);
    }
  };

  /* =========================
     DELETE ACCOUNT
  ========================= */

  const handleDeleteAccount = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this monitored account?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteMonitoredAccount(id);

      setAccounts((current) =>
        current.filter(
          (account) => account._id !== id
        )
      );

      setSuccess(
        "Monitored account removed successfully."
      );
    } catch (error) {
      console.error(
        "Delete Account Error:",
        error.message
      );

      setError(
        error.message ||
          "Failed to remove monitored account."
      );
    }
  };

  /* =========================
     STATUS STYLE
  ========================= */

  const getStatusStyle = (status) => {
    if (status === "breached") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }

    if (status === "at_risk") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }

    return "bg-green-500/10 text-green-400 border-green-500/20";
  };

  /* =========================
     RISK STYLE
  ========================= */

  const getRiskStyle = (score) => {
    if (score >= 75) {
      return "text-red-400";
    }

    if (score >= 50) {
      return "text-orange-400";
    }

    if (score >= 26) {
      return "text-yellow-400";
    }

    return "text-green-400";
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        Loading monitored accounts...
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="p-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            🛡️ Monitored Accounts
          </h1>

          <p className="mt-2 text-slate-400">
            Add accounts and monitor them for security breaches.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAccounts}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400"
        >
          ↻ Refresh
        </button>

      </div>

      {/* ADD ACCOUNT */}

      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h2 className="mb-5 text-xl font-semibold">
          ➕ Add Account for Monitoring
        </h2>

        <form
          onSubmit={handleAddAccount}
          className="grid grid-cols-1 gap-4 md:grid-cols-4"
        >

          {/* TYPE */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Account Type
            </label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="email">
                Email
              </option>

              <option value="username">
                Username
              </option>

              <option value="phone">
                Phone
              </option>

              <option value="domain">
                Domain
              </option>
            </select>
          </div>

          {/* VALUE */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Account
            </label>

            <input
              type="text"
              value={value}
              onChange={(e) =>
                setValue(e.target.value)
              }
              placeholder={
                type === "email"
                  ? "you@example.com"
                  : type === "phone"
                  ? "+91..."
                  : type === "domain"
                  ? "example.com"
                  : "username"
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-cyan-500"
            />
          </div>

          {/* LABEL */}

          <div>
            <label className="mb-2 block text-sm text-slate-400">
              Label
            </label>

            <input
              type="text"
              value={label}
              onChange={(e) =>
                setLabel(e.target.value)
              }
              placeholder="Personal Email"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-cyan-500"
            />
          </div>

          {/* BUTTON */}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding
                ? "Adding..."
                : "Start Monitoring"}
            </button>
          </div>

        </form>

        {/* MESSAGES */}

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 text-sm text-green-400">
            {success}
          </p>
        )}

      </div>

      {/* ACCOUNT LIST */}

      <div>

        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            Your Monitored Accounts
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {accounts.length} account
            {accounts.length !== 1
              ? "s"
              : ""}{" "}
            being monitored
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">

            <div className="mb-4 text-5xl">
              🔍
            </div>

            <h3 className="text-xl font-semibold">
              No accounts yet
            </h3>

            <p className="mt-2 text-slate-400">
              Add your first account above to start monitoring.
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {accounts.map((account) => (

              <div
                key={account._id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700"
              >

                {/* ACCOUNT HEADER */}

                <div className="flex items-start justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
                      {account.type === "email"
                        ? "📧"
                        : account.type === "phone"
                        ? "📱"
                        : account.type === "domain"
                        ? "🌐"
                        : "👤"}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {account.label ||
                          "My Account"}
                      </h3>

                      <p className="text-sm text-slate-400">
                        {account.value}
                      </p>
                    </div>

                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                      account.status
                    )}`}
                  >
                    {account.status
                      ?.replace("_", " ") ||
                      "safe"}
                  </span>

                </div>

                {/* RISK + LAST CHECK */}

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-5">

                  <div>
                    <p className="text-xs uppercase text-slate-500">
                      Risk Score
                    </p>

                    <p
                      className={`mt-1 text-2xl font-bold ${getRiskStyle(
                        account.riskScore || 0
                      )}`}
                    >
                      {account.riskScore || 0}
                      <span className="text-sm text-slate-500">
                        /100
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Last Checked
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {account.lastChecked
                        ? new Date(
                            account.lastChecked
                          ).toLocaleString()
                        : "Not checked yet"}
                    </p>
                  </div>

                </div>

                {/* ACTIONS */}

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row">

                  <button
                    type="button"
                    onClick={() => navigate(`/monitoring/check/${account._id}`)}
                    className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    🔍 Check Now
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteAccount(
                        account._id
                      )
                    }
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                  >
                    Remove Account
                  </button>

                </div>

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default MonitoredAccounts;
