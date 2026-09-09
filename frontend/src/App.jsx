
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Layout from "./components/Layout";
import Accounts from "./pages/Accounts";
import AISecurity from "./pages/AISecurity";
import MonitoredAccounts from "./pages/MonitoredAccounts";
import BreachDetection from "./pages/BreachDetection";
import RiskDashboard from "./pages/RiskDashboard";
import AuditLogs from "./pages/AuditLogs";
import BreachDetails from "./pages/BreachDetails";
import SecurityCheck from "./pages/SecurityCheck";
import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";
import { Toaster } from "react-hot-toast";


/* =========================
   PROTECTED LAYOUT
========================= */

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Layout />;
}


/* =========================
   LOGIN ROUTE
========================= */

function LoginRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Login />;
}


/* =========================
   APP
========================= */

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          {/* =========================
              LOGIN
          ========================= */}

          <Route
            path="/login"
            element={<LoginRoute />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* =========================
              PROTECTED APPLICATION
          ========================= */}

          <Route
            element={<ProtectedLayout />}
          >

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />


            {/* Alerts */}
            <Route
              path="/alerts"
              element={<Alerts />}
            />


            {/* Accounts */}
            <Route
              path="/accounts"
              element={<Accounts />}
            />


            {/* Monitored Accounts */}
            <Route
              path="/monitored-accounts"
              element={<MonitoredAccounts />}
            />

            <Route
              path="/monitoring/check/:id"
              element={<SecurityCheck />}
            />


            {/* Breach Detection */}
            <Route
              path="/breaches"
              element={<BreachDetection />}
            />


            {/* AI Security */}
            <Route
              path="/ai-security"
              element={<AISecurity />}
            />


            {/* Audit Logs */}
            <Route
              path="/audit-logs"
              element={<AuditLogs />}
            />

            <Route
              path="/risk-dashboard"
              element={<RiskDashboard />}
            />

</Route>

          {/* =========================
              DEFAULT
          ========================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          {/* =========================
              UNKNOWN ROUTE
          ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
<Route
  path="/breaches/:id"
  element={<BreachDetails />}
/>
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #334155",
            },
          }}
        />

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

