const Alert = require("../models/Alert");

/* =========================
   GET ALL ALERTS
========================= */

const getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(
      "Get Alerts Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
    });
  }
};


/* =========================
   GET UNREAD ALERTS
========================= */

const getUnreadAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({
      userId: req.user.userId,
      isRead: false,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(
      "Get Unread Alerts Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread alerts",
    });
  }
};


/* =========================
   MARK ONE ALERT AS READ
========================= */

const markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Alert ID is required",
      });
    }

    const alert = await Alert.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.userId,
      },
      {
        $set: {
          isRead: true,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert marked as read",
      alert,
    });
  } catch (error) {
    console.error(
      "Mark Alert As Read Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update alert",
    });
  }
};


/* =========================
   MARK ALL ALERTS AS READ
========================= */

const markAllAlertsAsRead = async (req, res) => {
  try {
    const result = await Alert.updateMany(
      {
        userId: req.user.userId,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All alerts marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Mark All Alerts As Read Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update alerts",
    });
  }
};


/* =========================
   DELETE ONE ALERT
========================= */

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Alert ID is required",
      });
    }

    const alert = await Alert.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Alert deleted successfully",
      alert,
    });
  } catch (error) {
    console.error(
      "Delete Alert Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
};


/* =========================
   EXPORTS
========================= */

module.exports = {
  getAlerts,
  getUnreadAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
};