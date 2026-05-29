import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LayoutCRM() {
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleGoEis = () => {
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
              CRM
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Gestión del CRM
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Clientes y pipeline conectados con tu EIS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to="clientes"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/10"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`
              }
            >
              Clientes
            </NavLink>
            <NavLink
              to="pipeline"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/10"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`
              }
            >
              Pipeline
            </NavLink>
            {role === "admin" ? (
              <button
                type="button"
                onClick={handleGoEis}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cambiar a EIS
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
