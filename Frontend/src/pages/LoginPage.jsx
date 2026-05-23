import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(username.trim(), password.trim());
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#071325] p-6">
      {/* Fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_35%),linear-gradient(125deg,rgba(6,17,34,0.95),rgba(11,29,58,0.9))]" />
      </div>

      {/* Card */}
      <section
        className="
          relative w-full max-w-md
          rounded-3xl
          border border-white/10
          bg-white/95
          p-8 lg:p-10
          backdrop-blur-xl
          shadow-[0_10px_40px_rgba(0,0,0,0.22)]
          animate-[fadeIn_.45s_ease]
        "
      >
        <article className="flex flex-col">
          {/* Logo */}
          <img
            src="/LOGO.png"
            alt="Logo Sistema EIS"
            className="mx-auto mb-4 h-20 w-20 object-contain drop-shadow-md"
          />

          {/* Titulo */}
          <p className="text-center text-sm font-bold uppercase tracking-[0.32em] text-cyan-700">
            Sistema EIS
          </p>

          <h2 className="mt-3 text-center text-3xl font-bold text-[#0B1D3A]">
            Iniciar sesión
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500">
            Ingresa tus credenciales para acceder al panel.
          </p>

          {/* Form */}
          <form
            className="mt-8 space-y-5"
            onSubmit={onSubmit}
            autoComplete="off"
          >
            {/* Usuario */}
            <label className="block text-sm font-medium text-slate-600">
              Usuario

              <input
                type="text"
                name="username"
                autoComplete="new-password"
                aria-label="Usuario"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="
                  mt-2 w-full rounded-xl
                  border border-slate-300
                  bg-white/80
                  px-4 py-3
                  text-slate-700
                  outline-none
                  transition-all duration-200
                  focus:border-cyan-500
                  focus:ring-4
                  focus:ring-cyan-100
                "
              />
            </label>

            {/* Password */}
            <label className="block text-sm font-medium text-slate-600">
              Contraseña

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  aria-label="Contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="
                    w-full rounded-xl
                    border border-slate-300
                    bg-white/80
                    px-4 py-3 pr-12
                    text-slate-700
                    outline-none
                    transition-all duration-200
                    focus:border-cyan-500
                    focus:ring-4
                    focus:ring-cyan-100
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition hover:text-slate-700
                  "
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </label>

            {/* Error */}
            {error ? (
              <p className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full rounded-xl
                bg-[#0B1D3A]
                px-4 py-3
                font-semibold
                text-white
                shadow-lg
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-[#132B52]
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${
                  loading
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
            >
              {loading ? "Ingresando..." : "Acceder"}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}