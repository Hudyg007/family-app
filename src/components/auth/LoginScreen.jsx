import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, LS_DATA, getDataKey } from "../../contexts/AuthContext.jsx";

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
          <p className="text-gray-500 text-sm mb-6">No account found on this device.</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-xs text-amber-700 font-semibold mb-1">Setting up on a new device?</p>
            <p className="text-xs text-amber-600">Go back and tap <strong>Restore Account from Backup</strong> to import your existing account from the JSON backup you exported on your other device.</p>
          </div>
          <button
            onClick={() => setScreen("landing")}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
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
