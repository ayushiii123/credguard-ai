const Alert = require("../models/Alert");

const createSecurityAlert = async ({
  userId,
  monitoredAccountId,
  type,
  severity,
  title,
  message,
  riskScore = 0,
}) => {
  try {
    // Prevent duplicate unread alerts
    const existingAlert = await Alert.findOne({
      userId,
      monitoredAccountId,
      type,
      severity,
      isRead: false,
    });
if (existingAlert) {
  console.log("⚠️ Existing alert found");

  // Update alert if new risk score is higher
  if (riskScore > existingAlert.riskScore) {
    existingAlert.riskScore = riskScore;
    existingAlert.title = title;
    existingAlert.message = message;
    existingAlert.severity = severity;

    await existingAlert.save();

    console.log("🔄 Existing alert updated with higher risk:", existingAlert._id);

    return {
      created: false,
      updated: true,
      alert: existingAlert,
    };
  }

  return {
    created: false,
    updated: false,
    alert: existingAlert,
  };
}
   

    const alert = await Alert.create({
      userId,
      monitoredAccountId,
      type,
      severity,
      title,
      message,
      riskScore,
      isRead: false,
    });

    console.log("🚨 Security alert created:", alert._id);

    return {
      created: true,
      updated: false,
      alert,
    };
  } catch (error) {
    console.error(
      "Create Security Alert Error:",
      error.message
    );

    return {
      created: false,
      alert: null,
    };
  }
};

module.exports = {
  createSecurityAlert,
};