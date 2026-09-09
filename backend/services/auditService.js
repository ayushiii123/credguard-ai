const AuditLog = require("../models/AuditLog");

/*
  ============================================
  CREDGUARD AI - AUDIT LOG SERVICE
  ============================================

  Purpose:
  - Record security activities
  - Track authentication/breach/AI/alert events
  - Capture request information
  - Never break the main request if logging fails
*/

const createAuditLog = async ({
  userId = null,
  action,
  category = "security",
  description,
  req,
  metadata = {},
}) => {
  try {
    if (!action || !description) {
      console.error(
        "Audit Log Error: action and description are required"
      );

      return {
        success: false,
      };
    }

    /* ============================================
       IP ADDRESS
    ============================================ */

    let ipAddress =
      req?.headers?.["x-forwarded-for"] ||
      req?.headers?.["x-real-ip"] ||
      req?.socket?.remoteAddress ||
      "unknown";

    /*
      x-forwarded-for can contain multiple IPs.
      First IP is normally the original client.
    */

    if (typeof ipAddress === "string") {
      ipAddress =
        ipAddress
          .split(",")[0]
          .trim() || "unknown";
    }


    /* ============================================
       USER AGENT
    ============================================ */

    const userAgent =
      req?.headers?.["user-agent"] ||
      "unknown";


    /* ============================================
       REQUEST INFORMATION
    ============================================ */

    const requestInfo = {
      method:
        req?.method || "unknown",

      path:
        req?.originalUrl ||
        req?.path ||
        "unknown",
    };


    /* ============================================
       CREATE LOG
    ============================================ */

    const auditLog =
      await AuditLog.create({
        userId,

        action,

        category,

        description,

        ipAddress,

        userAgent,

        metadata: {
          ...metadata,

          request: requestInfo,

          timestamp:
            new Date(),
        },
      });


    console.log(
      "📝 Audit log created:",
      auditLog._id
    );


    return {
      success: true,
      log: auditLog,
    };

  } catch (error) {

    /*
      Audit failure should NEVER
      break the main security flow.
    */

    console.error(
      "⚠️ Audit Log Error:",
      error.message
    );

    return {
      success: false,
      log: null,
    };
  }
};


module.exports = {
  createAuditLog,
};