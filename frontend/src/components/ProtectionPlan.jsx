import React, { useEffect, useState } from "react";

const ProtectionPlan = ({ breachId }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingAction, setCompletingAction] = useState(null);

  const fetchProtectionPlan = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/protection/${breachId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setPlan(data.protectionPlan);
      }
    } catch (error) {
      console.error("Protection Plan Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (breachId) {
      fetchProtectionPlan();
    }
  }, [breachId]);

  const handleCompleteAction = async (actionId) => {
    try {
      setCompletingAction(actionId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/protection/${breachId}/action/${actionId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to complete action"
        );
      }

      if (data.success) {
        setPlan(data.protectionPlan);
      }
    } catch (error) {
      console.error(
        "Complete Action Error:",
        error
      );

      alert(error.message);
    } finally {
      setCompletingAction(null);
    }
  };

  if (loading) {
    return (
      <p className="text-slate-400">
        Loading protection plan...
      </p>
    );
  }

  if (!plan) {
    return (
      <p className="text-slate-400">
        Protection plan not available.
      </p>
    );
  }

  const progress =
    plan.totalActions > 0
      ? Math.round(
          (plan.completedActions /
            plan.totalActions) *
            100
        )
      : 0;

  return (
    <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

        <div>
          <h2 className="text-2xl font-bold text-white">
            🛡️ Protection Plan
          </h2>

          <p className="text-slate-400 mt-1">
            Security actions generated for this breach.
          </p>
        </div>

        <span className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-semibold uppercase text-sm">
          {plan.protectionLevel}
        </span>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Total Actions
          </p>

          <p className="text-2xl font-bold text-white mt-1">
            {plan.totalActions}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Pending
          </p>

          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {plan.pendingActions}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">
            Completed
          </p>

          <p className="text-2xl font-bold text-green-400 mt-1">
            {plan.completedActions}
          </p>
        </div>

      </div>

      {/* Progress */}
      <div className="mb-8">

        <div className="flex justify-between mb-2">
          <span className="text-sm text-slate-400">
            Protection Progress
          </span>

          <span className="text-sm text-cyan-400 font-semibold">
            {progress}%
          </span>
        </div>

        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">

          <div
            className="h-full bg-cyan-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* Actions */}
      <div>

        <h3 className="text-lg font-semibold text-white mb-4">
          Recommended Security Actions
        </h3>

        <div className="space-y-4">

          {plan.actions?.map((action) => {

            const completed =
              action.status === "completed";

            return (
              <div
                key={action._id}
                className={`border rounded-xl p-5 transition ${
                  completed
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-slate-800 bg-slate-950"
                }`}
              >

                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2 mb-2">

                      <h4
                        className={`font-semibold ${
                          completed
                            ? "text-green-400"
                            : "text-white"
                        }`}
                      >
                        {completed
                          ? "✓ "
                          : ""}
                        {action.title}
                      </h4>

                      <span className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs uppercase">
                        {action.priority}
                      </span>

                    </div>

                    <p className="text-slate-400 text-sm">
                      {action.description}
                    </p>

                    {action.reason && (
                      <p className="text-slate-500 text-xs mt-2">
                        Reason: {action.reason}
                      </p>
                    )}

                    {completed &&
                      action.completedAt && (
                        <p className="text-green-500 text-xs mt-2">
                          Completed on{" "}
                          {new Date(
                            action.completedAt
                          ).toLocaleString()}
                        </p>
                      )}

                  </div>

                  <button
                    onClick={() =>
                      handleCompleteAction(
                        action._id
                      )
                    }
                    disabled={
                      completed ||
                      completingAction ===
                        action._id
                    }
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                      completed
                        ? "bg-green-500/10 text-green-400 border border-green-500/30 cursor-not-allowed"
                        : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                    }`}
                  >
                    {completingAction ===
                    action._id
                      ? "Updating..."
                      : completed
                      ? "✓ Completed"
                      : "Mark Complete"}
                  </button>

                </div>

              </div>
            );
          })}

        </div>

      </div>

    </div>
  );
};

export default ProtectionPlan;