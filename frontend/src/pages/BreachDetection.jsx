import { useEffect, useState } from "react";
import {
  getMonitoredAccounts,
  getBreaches,
  createBreach,
  analyzeBreachWithAI,
} from "../services/api";
import { useNavigate } from "react-router-dom";
import ProtectionPlan from "../components/ProtectionPlan";

function BreachDetection() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [selectedBreachId, setSelectedBreachId] =
    useState(null);
  const [monitoredAccountId, setMonitoredAccountId] =
    useState("");

  const [source, setSource] = useState("");
  const [breachName, setBreachName] = useState("");
  const [breachDate, setBreachDate] = useState("");
  const [severity, setSeverity] = useState("high");
  const [description, setDescription] = useState("");

  const [dataExposed, setDataExposed] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [calculatedRisk, setCalculatedRisk] = useState(null);

  const exposedOptions = [
    "email",
    "password",
    "username",
    "phone",
    "address",
    "credit_card",
    "personal_information",
  ];

  const loadData = async () => {
    try {
      const [accountsData, breachesData] =
        await Promise.all([
          getMonitoredAccounts(),
          getBreaches(),
        ]);

      setAccounts(accountsData.accounts || []);
      setBreaches(breachesData.breaches || []);

      if (
        accountsData.accounts?.length > 0
      ) {
        setMonitoredAccountId(
          accountsData.accounts[0]._id
        );
      }
    } catch (error) {
      console.error(
        "Breach Page Error:",
        error.message
      );

      setError(
        "Failed to load monitoring data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExposedData = (item) => {
    setDataExposed((current) =>
      current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextFieldErrors = {};

    if (!monitoredAccountId) nextFieldErrors.account = "Account is required.";
    if (!source.trim()) nextFieldErrors.source = "Source is required.";
    if (!breachName.trim()) nextFieldErrors.breachName = "Breach name is required.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError("Complete the required breach fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      setFieldErrors({});

      const data = await createBreach({
        monitoredAccountId,
        source: source.trim(),
        breachName: breachName.trim(),
        breachDate,
        dataExposed,
        severity,
        description: description.trim(),
      });

      setCalculatedRisk(data.risk || null);
      setMessage(
        data.risk
          ? `Breach recorded. Risk Score: ${data.risk.score}/100 | Risk Level: ${String(data.risk.level).toUpperCase()} | Severity: ${String(data.risk.severity || severity).toUpperCase()}`
          : "Breach recorded successfully."
      );

      await loadData();

      setSource("");
      setBreachName("");
      setBreachDate("");
      setSeverity("high");
      setDescription("");
      setDataExposed([]);

    } catch (error) {
      console.error(
        "Breach Creation Error:",
        error.message
      );

      const backendFields = {};
      (error.fields || []).forEach((field) => {
        const key = field.toLowerCase().startsWith("breach")
          ? "breachName"
          : field.toLowerCase();
        backendFields[key] = `${field} is required.`;
      });
      setFieldErrors(backendFields);
      setError(error.message || "Failed to create breach.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAIAnalysis = async (breachId) => {
    try {
      setAnalyzing(true);
      setError("");
      setMessage("");

      const data =
        await analyzeBreachWithAI(
          breachId
        );

      setCalculatedRisk(data.risk || null);
      setMessage(
        `AI analysis completed. Risk Score: ${data.risk.score}/100 | Risk Level: ${String(data.risk.level).toUpperCase()}`
      );

      await loadData();

    } catch (error) {
      console.error(
        "AI Analysis Error:",
        error.message
      );

      setError(
        "AI analysis failed."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityStyle = (severity) => {
    if (severity === "critical") {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }

    if (severity === "high") {
      return "bg-orange-500/10 text-orange-400 border-orange-500/30";
    }

    if (severity === "medium") {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    }

    return "bg-green-500/10 text-green-400 border-green-500/30";
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400">
        Loading breach detection...
      </div>
    );
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-8">

        <h1 className="text-3xl font-bold">
          🚨 Breach Detection
        </h1>

        <p className="text-slate-400 mt-2">
          Detect security breaches and analyze their risk with AI.
        </p>

      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4">
          {message}
        </div>
      )}

      {calculatedRisk && (
        <div className="mb-6 bg-slate-900 border border-cyan-500/30 rounded-xl p-4 text-slate-200">
          <p className="text-sm uppercase tracking-wider text-cyan-400">
            Calculated Risk Result
          </p>
          <p className="mt-2 font-semibold">
            {calculatedRisk.score}/100 - {String(calculatedRisk.level).toUpperCase()}
          </p>
          {calculatedRisk.severity && (
            <p className="mt-1 text-sm text-slate-400">
              Severity: {String(calculatedRisk.severity).toUpperCase()}
            </p>
          )}
        </div>
      )}

      {/* Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">

        <h2 className="text-xl font-semibold mb-6">
          Report Security Breach
        </h2>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* Account */}
          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Monitored Account
            </label>

            <select
              value={monitoredAccountId}
              onChange={(e) =>
                setMonitoredAccountId(
                  e.target.value
                )
              }
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500"
            >
              <option value="">
                Select account
              </option>

              {accounts.map((account) => (
                <option
                  key={account._id}
                  value={account._id}
                >
                  {account.value} —{" "}
                  {account.label ||
                    account.type}
                </option>
              ))}
            </select>

            {fieldErrors.account && (
              <p className="mt-2 text-sm text-red-400">{fieldErrors.account}</p>
            )}

            {accounts.length === 0 && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
                <p>No monitored accounts found. Please add an account to Monitoring Accounts first.</p>
                <button
                  type="button"
                  onClick={() => navigate("/monitored-accounts")}
                  className="mt-3 rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950 hover:bg-amber-300"
                >
                  Add Monitoring Account
                </button>
              </div>
            )}

          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Breach Name
              </label>

              <input
                type="text"
                value={breachName}
                onChange={(e) =>
                  setBreachName(
                    e.target.value
                  )
                }
                placeholder="Example Data Breach 2026"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-cyan-500"
              />

              {fieldErrors.breachName && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.breachName}</p>
              )}

            </div>

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Source
              </label>

              <select
                value={source}
                onChange={(e) =>
                  setSource(e.target.value)
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-cyan-500"
              >
                <option value="">Select source</option>
                <option value="Internal/Test Dataset">Internal/Test Dataset</option>
              </select>

              {fieldErrors.source && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.source}</p>
              )}

            </div>

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Breach Date
              </label>

              <input
                type="date"
                value={breachDate}
                onChange={(e) =>
                  setBreachDate(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500"
              />

            </div>

            <div>

              <label className="block text-sm text-slate-400 mb-2">
                Severity
              </label>

              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value
                  )
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500"
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="critical">
                  Critical
                </option>
              </select>

            </div>

          </div>

          {/* Exposed Data */}
          <div>

            <label className="block text-sm text-slate-400 mb-3">
              Data Exposed
            </label>

            <div className="flex flex-wrap gap-3">

              {exposedOptions.map((item) => {

                const selected =
                  dataExposed.includes(
                    item
                  );

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      handleExposedData(
                        item
                      )
                    }
                    className={`px-4 py-2 rounded-lg border text-sm capitalize ${
                      selected
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {item.replace(
                      "_",
                      " "
                    )}
                  </button>
                );
              })}

            </div>

          </div>

          {/* Description */}
          <div>

            <label className="block text-sm text-slate-400 mb-2">
              Description
            </label>

            <textarea
              rows="4"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe what happened in the breach..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-cyan-500 resize-none"
            />

          </div>

          <button
            type="submit"
            disabled={submitting || accounts.length === 0}
            className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-3 rounded-xl disabled:opacity-50"
          >
            {submitting ? "Creating breach..." : "Create Breach"}
          </button>

        </form>

      </div>

      {/* Breach History */}
      <div>

        <h2 className="text-xl font-semibold mb-5">
          Breach History
        </h2>

        {breaches.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">

            <div className="text-5xl mb-4">
              🛡️
            </div>

            <p className="text-slate-400">
              No breaches recorded yet.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {breaches.map((breach) => (

              <div
                key={breach._id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
              >

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">

                  <div>

                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="text-lg font-semibold">
                        {breach.breachName}
                      </h3>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border uppercase ${getSeverityStyle(
                          breach.severity
                        )}`}
                      >
                        {breach.severity}
                      </span>

                    </div>

                    <p className="text-slate-400 mt-2">
                      Source: {breach.source}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {breach.breachDate
                        ? new Date(
                            breach.breachDate
                          ).toLocaleDateString()
                        : "Date not provided"}
                    </p>

                    {breach.description && (
                      <p className="text-slate-400 mt-4">
                        {breach.description}
                      </p>
                    )}

                    {breach.dataExposed?.length >
                      0 && (
                      <div className="flex flex-wrap gap-2 mt-4">

                        {breach.dataExposed.map(
                          (data) => (
                            <span
                              key={data}
                              className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs capitalize"
                            >
                              {data.replace(
                                "_",
                                " "
                              )}
                            </span>
                          )
                        )}

                      </div>
                    )}

                  </div>

                  <button
                    onClick={() =>
                      handleAIAnalysis(
                        breach._id
                      )
                    }
                    disabled={analyzing}
                    className="whitespace-nowrap bg-purple-500 hover:bg-purple-400 text-white font-semibold px-5 py-3 rounded-xl disabled:opacity-50"
                  >
                    {analyzing
                      ? "Analyzing..."
                      : "🤖 Analyze with AI"}
                  </button>
<button
  onClick={() =>
    setSelectedBreachId(
      selectedBreachId === breach._id
        ? null
        : breach._id
    )
  }
  className="whitespace-nowrap bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-5 py-3 rounded-xl"
>
  🛡️ Protection Plan
</button>
</div>
{selectedBreachId === breach._id && (
  <div className="mt-6">
    <ProtectionPlan breachId={breach._id} />
  </div>
)}
                

              </div>

            ))}

          </div>
        )}

      </div>

    </div>
  );
}

export default BreachDetection;