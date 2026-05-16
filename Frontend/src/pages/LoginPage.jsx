import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071325] p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%),linear-gradient(125deg,rgba(6,17,34,0.95),rgba(11,29,58,0.9))]" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-cyan-100/20 bg-white/95 p-8 shadow-soft backdrop-blur lg:p-10">
        <article className="flex flex-col">
          <img src="/LOGO.png" alt="Logo Sistema EIS" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <p className="text-center text-sm font-bold uppercase tracking-[0.32em] text-cyan-700">Sistema EIS</p>
          <h2 className="mt-3 text-center text-2xl font-semibold text-eis-navy">Iniciar sesion</h2>
          <p className="mt-1 text-center text-sm text-slate-500">
            Ingresa tus credenciales para acceder al panel.
          </p>

          <form className="mt-8 space-y-5" onSubmit={onSubmit} autoComplete="off">
            <label className="block text-sm text-slate-600">
              Usuario
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-eis-sky focus:ring-2 focus:ring-cyan-100"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>

            <label className="block text-sm text-slate-600">
              Contraseña
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-eis-sky focus:ring-2 focus:ring-cyan-100"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error ? <p className="rounded-lg bg-red-100 p-2 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-eis-navy px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Acceder"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
