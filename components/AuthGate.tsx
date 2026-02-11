import React, { useState } from "react";
import { bootstrapAdmin, login, storeToken } from "../services/api";
import { AuthUser } from "../types";

interface AuthGateProps {
  onAuth: (token: string, user: AuthUser) => void;
}

const AuthGate: React.FC<AuthGateProps> = ({ onAuth }) => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await login(formData.username, formData.password);
      storeToken(result.token);
      onAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsBusy(false);
    }
  };

  const handleBootstrap = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const result = await bootstrapAdmin(formData.username, formData.password);
      storeToken(result.token);
      onAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bootstrap failed");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">WTG Vault</h1>
          <p className="text-sm text-slate-500">Sign in to access your vault.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
            <input
              type="text"
              className="mt-1 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="admin"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="mt-1 w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="********"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isBusy}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {isBusy ? "Working..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={handleBootstrap}
              disabled={isBusy}
              className="flex-1 bg-slate-900 text-white py-2 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              First setup
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Use "First setup" only once to create the initial admin user.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
