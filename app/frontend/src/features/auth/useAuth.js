import { useState, useEffect } from "react";
import { api, setSessionExpiredHandler } from "../../api/client";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setError("Session expired — please log in again");
    });
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
