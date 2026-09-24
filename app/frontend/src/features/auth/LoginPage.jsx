import { useState } from "react";
import { isDesktop } from "../../api/client";

export default function LoginPage({ onLogin, error }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");

  function handleSubmit(e) {
    e.preventDefault();
    onLogin(username, password);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Order Manager</h1>
        <p className="text-sm text-gray-500 mb-6">
          {isDesktop ? "Desktop · Offline" : "Web · Local API"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 text-sm transition-colors"
          >
            Log in
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6">Demo: admin / admin123</p>
      </div>
    </main>
  );
}
