import { createContext, useContext, useState, useCallback } from "react";
import { pushAccountToCloud } from "../lib/cloudSync.js";

export const LS_ACCOUNT = "familyHub_account";
export const LS_DATA    = "familyHub_data";          // legacy / fallback key
export const SS_SESSION = "familyHub_session_active";

/** Returns the localStorage key for family data, namespaced per account email.
 *  Falls back to the legacy key if no email is provided (backward compat). */
export const getDataKey = (email) =>
  email ? `familyHub_data_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}` : LS_DATA;

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const readAccount = () => { try { return JSON.parse(localStorage.getItem(LS_ACCOUNT)); } catch { return null; } };

const initScreen = () => {
  const a = readAccount();
  const session = sessionStorage.getItem(SS_SESSION) === "true";
  if (!a)                return "landing";
  if (!a.emailVerified)  return "email-verify";
  if (!a.setupComplete)  return "onboarding";
  if (session)           return "family-select";
  return "login";
};

export function AuthProvider({ children }) {
  const [account, setAccountState] = useState(readAccount);
  const [screen,  setScreen]       = useState(initScreen);

  const updateAccount = useCallback((updates) => {
    setAccountState(prev => {
      const next = { ...(prev || {}), ...updates };
      localStorage.setItem(LS_ACCOUNT, JSON.stringify(next));
      // Sync to cloud once email is verified (so we have a real account)
      if (next.email && next.emailVerified) {
        pushAccountToCloud(next.email, next);
      }
      return next;
    });
  }, []);

  const startSession = useCallback(() => {
    sessionStorage.setItem(SS_SESSION, "true");
  }, []);

  const endSession = useCallback(() => {
    sessionStorage.removeItem(SS_SESSION);
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(LS_ACCOUNT);
    localStorage.removeItem(LS_DATA);
    sessionStorage.removeItem(SS_SESSION);
    setAccountState(null);
    setScreen("landing");
  }, []);

  return (
    <AuthContext.Provider value={{ account, updateAccount, screen, setScreen, startSession, endSession, resetAll }}>
      {children}
    </AuthContext.Provider>
  );
}
