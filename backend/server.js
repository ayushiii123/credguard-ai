const dotenv = require("dotenv");

dotenv.config();

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dashboardRoutes = require("./routes/dashboardRoutes");
const connectDB = require("./config/db");
const monitoringRoutes = require("./routes/monitoringRoutes");
const authRoutes = require("./routes/authRoutes");
const monitorRoutes = require("./routes/monitorRoutes");
const breachRoutes = require("./routes/breachRoutes");
const riskRoutes = require("./routes/riskRoutes");
const aiRoutes = require("./routes/aiRoutes");
const alertRoutes = require("./routes/alertRoutes");
const auditRoutes = require("./routes/auditRoutes");
const protectionRoutes = require("./routes/protectionRoutes");

/* =========================
   Database
========================= */

connectDB();


/* =========================
   App
========================= */

const app = express();


/* =========================
   Security Middleware
========================= */

app.use(helmet());

app.use(
  cors()
);

app.use(
  express.json()
);


/* =========================
   Rate Limiting
========================= */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);


/* =========================
   API Routes
========================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/monitor",
  monitorRoutes
);

app.use(
  "/api/breaches",
  breachRoutes
);
app.use(
  "/api/monitoring",
  monitoringRoutes
);
app.use(
  "/api/risk",
  riskRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);
app.use("/api/dashboard", dashboardRoutes);

app.use(
  "/api/alerts",
  alertRoutes
);

app.use(
  "/api/audit",
  auditRoutes
);
app.use(
  "/api/protection",
  protectionRoutes
);

/* =========================
   Health Check
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CredGuard AI Backend is running 🚀",
  });
});


/* =========================
   Server
========================= */

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});