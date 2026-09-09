const ProtectionPlan = require("../models/ProtectionPlan");

const getProtectionPlan = async (req, res) => {
  try {
    const { breachId } = req.params;

    if (!breachId) {
      return res.status(400).json({
        success: false,
        message: "Breach ID is required",
      });
    }

    const plan = await ProtectionPlan.findOne({
      breachId: breachId,
      userId: req.user.userId,
    })
      .populate("breachId")
      .populate("monitoredAccountId");

    console.log("🔎 BREACH ID:", breachId);
    console.log("🔎 USER ID:", req.user.userId);
    console.log("🔎 PROTECTION PLAN:", plan);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Protection plan not found",
      });
    }

    return res.status(200).json({
      success: true,
      protectionPlan: plan,
    });
  } catch (error) {
    console.error(
      "❌ Get Protection Plan Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch protection plan",
    });
  }
};


const completeProtectionAction = async (req, res) => {
  try {
    const { breachId, actionId } = req.params;

    if (!breachId || !actionId) {
      return res.status(400).json({
        success: false,
        message: "Breach ID and Action ID are required",
      });
    }

    const plan = await ProtectionPlan.findOne({
      breachId,
      userId: req.user.userId,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Protection plan not found",
      });
    }

    const action = plan.actions.id(actionId);

    if (!action) {
      return res.status(404).json({
        success: false,
        message: "Protection action not found",
      });
    }

    if (action.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This action is already completed",
      });
    }

    action.status = "completed";
    action.completedAt = new Date();

    plan.totalActions = plan.actions.length;

    plan.completedActions = plan.actions.filter(
      (item) => item.status === "completed"
    ).length;

    plan.pendingActions = plan.actions.filter(
      (item) => item.status === "pending"
    ).length;

    await plan.save();

    return res.status(200).json({
      success: true,
      message: "Protection action completed successfully",
      protectionPlan: plan,
    });
  } catch (error) {
    console.error(
      "❌ Complete Protection Action Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to complete protection action",
    });
  }
};


module.exports = {
  getProtectionPlan,
  completeProtectionAction,
};