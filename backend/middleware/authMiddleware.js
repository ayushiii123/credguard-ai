const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER:", authHeader);

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token required",
      });
    }

    const token = authHeader
      .replace(/^Bearer\s+/i, "")
      .trim();

    console.log("TOKEN LENGTH:", token.length);
    console.log("JWT SECRET:", process.env.JWT_SECRET ? "EXISTS" : "MISSING");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("JWT VERIFIED:", decoded);

    req.user = decoded;
    next();

  } catch (error) {
    console.error("JWT ERROR NAME:", error.name);
    console.error("JWT ERROR MESSAGE:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;