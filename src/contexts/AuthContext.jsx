import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const ACCOUNTS_KEY = "trayva-accounts";
const AUTH_KEY = "trayva-auth";
const MAX_ACCOUNTS = 5;

// ── helpers ──────────────────────────────────────────────────────────────────

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeAccounts(list) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState(() => readAccounts());

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");

      if (!auth.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/account/profile");
        setUser(response.data.data);
      } catch (error) {
        console.error("Failed to load user:", error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ── internal helpers ────────────────────────────────────────────────────────

  const refreshSavedAccounts = useCallback(() => {
    setSavedAccounts(readAccounts());
  }, []);

  /**
   * Persist a session to the accounts list (called internally after login).
   * Max MAX_ACCOUNTS entries; replaces existing entry for same user id.
   */
  const addAccount = useCallback((userData, token, refreshToken) => {
    const existing = readAccounts();
    const idx = existing.findIndex((a) => a.id === userData.id);
    const entry = { id: userData.id, user: userData, token, refreshToken };

    let updated;
    if (idx !== -1) {
      // update in place
      updated = existing.map((a, i) => (i === idx ? entry : a));
    } else {
      updated = [entry, ...existing].slice(0, MAX_ACCOUNTS);
    }

    writeAccounts(updated);
    setSavedAccounts(updated);
  }, []);

  /**
   * Switch to a saved account without re-entering credentials.
   */
  const switchAccount = useCallback((accountId) => {
    const accounts = readAccounts();
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return;

    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ token: target.token, refreshToken: target.refreshToken, user: target.user })
    );
    setUser(target.user);
  }, []);

  /**
   * Remove a saved account from the list.
   */
  const removeAccount = useCallback((accountId) => {
    const updated = readAccounts().filter((a) => a.id !== accountId);
    writeAccounts(updated);
    setSavedAccounts(updated);
  }, []);

  // ── public auth methods (unchanged API) ─────────────────────────────────────

  const login = useCallback((userData, token, refreshToken) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ token, refreshToken, user: userData }));
    setUser(userData);
    // also persist to accounts list
    addAccount(userData, token, refreshToken);
  }, [addAccount]);

  const clearSession = () => {
    // Remove the active auth but keep saved accounts so user can switch back
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    window.location.href = "/auth/login";
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Remove from saved accounts too
      if (user) removeAccount(user.id);
      localStorage.removeItem(AUTH_KEY);
      setUser(null);
      window.location.href = "/auth/login";
    }
  };

  const logoutAll = async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (error) {
      console.error("Logout all API error:", error);
    } finally {
      // Clear all saved accounts
      writeAccounts([]);
      setSavedAccounts([]);
      localStorage.removeItem(AUTH_KEY);
      setUser(null);
      window.location.href = "/auth/login";
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) || "{}");
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...auth, user: userData }));
    // also update in the accounts list
    const accounts = readAccounts();
    const updated = accounts.map((a) =>
      a.id === userData.id ? { ...a, user: userData } : a
    );
    writeAccounts(updated);
    setSavedAccounts(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        logoutAll,
        updateUser,
        // multi-account
        savedAccounts,
        addAccount,
        switchAccount,
        removeAccount,
        refreshSavedAccounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};