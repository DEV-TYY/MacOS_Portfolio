import React, { useState } from "react";

const DashboardLogin = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await onLogin(username.trim(), password.trim());

    if (!success) {
      setError("Invalid login. Please try again.");
    } else {
      setError("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Secure access</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard Login</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="dashboard-username">
              Username
            </label>
            <input
              id="dashboard-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="dashboard-password">
              Password
            </label>
            <input
              id="dashboard-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Continue to dashboard
          </button>
        </form>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
          Local demo credentials: <span className="text-white font-semibold">admin / admin123</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardLogin;
