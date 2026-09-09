import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SecurityNotification from "./SecurityNotification";
function Layout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl transition ${
      isActive
        ? "bg-cyan-500/10 text-cyan-400"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
<SecurityNotification />
      {/* =========================
          Sidebar
      ========================= */}

      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col">

        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            🛡️ CredGuard
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            AI Security Platform
          </p>
        </div>


        {/* User Profile */}
        <div className="mb-6 p-4 bg-slate-800/60 border border-slate-700 rounded-xl">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">

              <p className="font-semibold truncate">
                {user?.name || "User"}
              </p>

              <p className="text-xs text-slate-500 truncate">
                {user?.email || ""}
              </p>

            </div>

          </div>

        </div>


        {/* Navigation */}
        <nav className="space-y-2">

          <NavLink
            to="/dashboard"
            className={linkClass}
          >
            🏠 Dashboard
          </NavLink>

          <NavLink
            to="/accounts"
            className={linkClass}
          >
            🛡️ Monitored Accounts
          </NavLink>

          <NavLink
            to="/breaches"
            className={linkClass}
          >
            🚨 Breaches
          </NavLink>

          <NavLink
            to="/alerts"
            className={linkClass}
          >
            🔔 Alerts
          </NavLink>
          <NavLink to="/audit-logs" className={linkClass}>
  🔐 Audit Logs
</NavLink>
<NavLink
  to="/risk-dashboard"
  className={linkClass}
>
  📊 Risk Dashboard
</NavLink>
          <NavLink
            to="/ai-security"
            className={linkClass}
          >
            🤖 AI Security
          </NavLink>

        </nav>


        {/* Bottom */}
        <div className="mt-auto pt-6">

          <div className="border-t border-slate-800 pt-4">

            <button
              onClick={logout}
              className="w-full px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10 transition"
            >
              🚪 Logout
            </button>

          </div>

        </div>

      </aside>


      {/* =========================
          Main Content
      ========================= */}

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

    </div>
  );
}

export default Layout;