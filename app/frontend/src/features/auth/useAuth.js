// ! built-in imports
import { useState, useEffect } from "react";

// ! internal imports
import { api, setSessionExpiredHandler } from "../../api/client.js";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("restaurant_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setError("Session expired — please log in again");
    });

    if (api.auth?.me) {
      api.auth
        .me()
        .then(current => {
          if (current) setUser(current);
        })
        .catch(() => {
          // Keep cached user if server is offline or unreachable
        });
    }

    return () => setSessionExpiredHandler(() => {});
  }, []);

  async function login(username, password) {
    try {
      setError("");
      const loggedIn = await api.auth.login({ username, password });
      setUser(loggedIn);
      return loggedIn;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  return { user, error, login, logout };
}
