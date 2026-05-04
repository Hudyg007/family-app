import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, LS_DATA, getDataKey } from "../../contexts/AuthContext.jsx";
import { pullFromCloud } from "../../lib/cloudSync.js";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

export default function LoginScreen() {
  const { account, updateAccount, setScreen, startSession } = useAuth();

  const [pw,      setPw]      = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);

  /* New-device restore state */
  const [restoreEmail,   setRestoreEmail]   = useState("");
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError,   setRestoreError]   = useState("");

  /* No account on this device yet */
  const noLocalAccount = !account?.email;

  /* Pull primary guardian name for the greeting */
  const guardianName = (() => {
    try {
      const dataKey = getDataKey(account?.email);
      const d = JSON.parse(localStorage.getItem(dataKey) || localStorage.getItem(LS_DATA));
      return d?.members?.find(m => m.role === "parent")?.name || account?.email || "there";
    } catch { return account?.email || "there"; }
  })();

  /* Lockout countdown */
  useEffect(() => {
    if (!account?.lockoutUntil) return;
    const tick = () => setLockLeft(Math.max(0, Math.ceil((account.lockoutUntil - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [account?.lockoutUntil]);

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 450); };

  const handleRestore = async () => {
    const email = restoreEmail.trim().toLowerCase();
    if (!email) { setRestoreError("Please enter your email address."); return; }
    setRestoreLoading(true);
    setRestoreError("");
    try {
      const result = await pullFromCloud(email);
      if (!result || !result.accountJson || !result.accountJson.email) {
        setRestoreError("No account found for that email. Double-check it and try again.");
        return;
      }
      // Restore account into localStorage + context
      updateAccount(result.accountJson);
      // Restore family data
      if (result.familyJson) {
        const dataKey = getDataKey(email);
        localStorage.setItem(dataKey, JSON.stringify(result.familyJson));
      }
      // Go straight to login so the user enters their password
      setScreen("login");
    } catch {
      setRestoreError("Something went wrong. Please try again.");
    } finally {
      setRestoreLoading(false);
    }
  };

  const submit = async () => {
    if (lockLeft > 0) return;
    if (!pw) { setError("Please enter your password."); return; }

    setLoading(true);
    const hash      = await sha256(pw);
    const hashMatch = hash === account?.passwordHash;

    if (hashMatch) {
      updateAccount({ failedLoginAttempts: 0, lockoutUntil: null });
      startSession();
      setScreen("family-select");
    } else {
      const attempts = (account?.failedLoginAttempts || 0) + 1;
      if (attempts >= 5) {
        const lockoutUntil = Date.now() + 120_000;
        updateAccount({ failedLoginAttempts: attempts, lockoutUntil });
        setError("Too many attempts. Please wait 2 minutes.");
      } else {
        updateAccount({ failedLoginAttempts: attempts });
        setError("Incorrect password. Please try again.");
      }
      shake();
    }
    setLoading(false);
  };

  /* ── New-device state: no local account ── */
  if (noLocalAccount) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp text-center">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Family App</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your email to restore your account on this device.</p>

          <div className="text-left mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Account Email</label>
            <input
              type="email"
              value={restoreEmail}
              onChange={e => { setRestoreEmail(e.target.value); setRestoreError(""); }}
              onKeyDown={e => e.key === "Enter" && handleRestore()}
              placeholder="you@example.com"
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {restoreError && (
            <p className="text-red-500 text-xs text-center mb-3">{restoreError}</p>
          )}

          <button
            onClick={handleRestore}
            disabled={restoreLoading}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all mb-3"
          >
            {restoreLoading ? "Looking up account…" : "Restore My Account →"}
          </button>

          <button
            onClick={() => setScreen("landing")}
            className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-2xl font-semibold hover:bg-gray-200 transition-all text-sm"
          >← Back</button>
        </div>
      </div>
    );
  }

  /* ── Normal login: account exists on this device ── */
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className={`bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp ${shaking ? "shake" : ""}`}>
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏠</div>
          <h1 className="text-2xl font-extrabold text-gray-800">Family App</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {guardianName}!</p>
          {/* Show the account email so user knows which account this is */}
          <p className="text-xs text-indigo-400 mt-0.5 font-medium">{account.email}</p>
        </div>

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Enter your password"
            autoComplete="current-password"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
        {lockLeft > 0 && (
          <p className="text-orange-500 text-xs text-center mt-1">
            Try again in {Math.floor(lockLeft / 60)}:{String(lockLeft % 60).padStart(2, "0")}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading || lockLeft > 0}
          className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all"
        >
          {loading ? "Signing in…" : "Log In"}
        </button>

        <div className="text-center mt-4">
          <button
            onClick={() => setScreen("forgot-password")}
            className="text-xs text-indigo-500 hover:text-indigo-700 underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
}
