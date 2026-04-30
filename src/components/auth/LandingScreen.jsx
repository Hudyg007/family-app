import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, LS_ACCOUNT, getDataKey } from "../../contexts/AuthContext.jsx";
import { cloudAccountExists, pullFromCloud } from "../../lib/cloudSync.js";
import { cloudEnabled } from "../../lib/supabase.js";
import { sendVerificationEmail } from "../../lib/emailService.js";

const genCode    = () => String(Math.floor(100000 + Math.random() * 900000));
const validEmail = e  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

/* ── "New device" sign-in wizard ──────────────────────────────────────────── */
function NewDeviceWizard({ onBack }) {
  const { setScreen } = useAuth();
  const [step,    setStep]    = useState("email");   // "email" | "code" | "loading" | "done"
  const [email,   setEmail]   = useState("");
  const [code,    setCode]    = useState("");
  const [sentCode, setSentCode] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  /* Step 1 — enter email and send verification code */
  const sendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!validEmail(trimmed)) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    setError("");

    // Check cloud for this account
    const exists = await cloudAccountExists(trimmed);
    if (!exists) {
      setError("No account found for that email. Double-check the address, or create a new account.");
      setLoading(false);
      return;
    }

    // Send a fresh verification code
    const fresh = genCode();
    const result = await sendVerificationEmail(trimmed, fresh);
    if (!result.ok) {
      setError("Couldn't send the verification email. Please try again.");
      setLoading(false);
      return;
    }

    setSentCode(fresh);
    setLoading(false);
    setStep("code");
  };

  /* Step 2 — verify code and restore account */
  const verifyAndRestore = async () => {
    if (code.trim() !== sentCode) {
      setError("That code doesn't match. Please try again.");
      return;
    }
    setLoading(true);
    setError("");
    setStep("loading");

    const cloud = await pullFromCloud(email.trim().toLowerCase());
    if (!cloud?.accountJson) {
      setError("Couldn't retrieve account data. Please try the backup restore option instead.");
      setStep("code");
      setLoading(false);
      return;
    }

    // Restore to localStorage
    localStorage.setItem(LS_ACCOUNT, JSON.stringify(cloud.accountJson));
    if (cloud.familyJson) {
      const dataKey = getDataKey(cloud.accountJson.email);
      localStorage.setItem(dataKey, JSON.stringify(cloud.familyJson));
    }

    setLoading(false);
    setStep("done");
    // Short pause so user sees the success state, then go to login
    setTimeout(() => setScreen("login"), 1200);
  };

  if (step === "loading") {
    return (
      <div className="text-center py-8">
        <Loader2 size={32} className="animate-spin text-indigo-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Restoring your account…</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">✅</div>
        <p className="font-bold text-gray-800">Account restored!</p>
        <p className="text-sm text-gray-500 mt-1">Taking you to sign in…</p>
      </div>
    );
  }

  return (
    <div>
      {step === "email" ? (
        <>
          <p className="text-sm text-gray-500 mb-4">Enter the email address linked to your Family App account and we'll send you a one-time code to verify it's you.</p>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && sendCode()}
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={sendCode}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Checking…</> : "Send Verification Code"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-1">We sent a 6-digit code to <strong>{email}</strong>.</p>
          <p className="text-xs text-gray-400 mb-4">Check your inbox and enter the code below.</p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g,"")); setError(""); }}
            onKeyDown={e => e.key === "Enter" && !loading && verifyAndRestore()}
            placeholder="123456"
            maxLength={6}
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={verifyAndRestore}
            disabled={loading || code.length < 6}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : "Verify & Restore Account"}
          </button>
          <button onClick={() => { setStep("email"); setCode(""); setError(""); }} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600">
            Wrong email? Go back
          </button>
        </>
      )}
    </div>
  );
}

/* ── Main landing screen ──────────────────────────────────────────────────── */
export default function LandingScreen() {
  const { setScreen } = useAuth();
  const fileRef = useRef(null);
  const [restoreError, setRestoreError] = useState("");
  const [showNewDevice, setShowNewDevice] = useState(false);

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target.result);
        if (!backup?.account?.email || !backup?.data) {
          setRestoreError("Invalid backup file. Please use a file exported from Family App.");
          return;
        }
        localStorage.setItem(LS_ACCOUNT, JSON.stringify(backup.account));
        const dataKey = getDataKey(backup.account.email);
        localStorage.setItem(dataKey, JSON.stringify(backup.data));
        setScreen("login");
      } catch {
        setRestoreError("Couldn't read that file. Make sure it's a valid Family App backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (showNewDevice) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp">
          <button
            onClick={() => setShowNewDevice(false)}
            className="text-sm text-gray-400 hover:text-gray-600 mb-5 flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">📱</div>
            <h2 className="text-xl font-extrabold text-gray-800">Sign in on New Device</h2>
          </div>
          <NewDeviceWizard onBack={() => setShowNewDevice(false)} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className="w-full max-w-sm mx-4 text-center fadeUp">
        <div className="text-8xl mb-4">🏠</div>
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Family App</h1>
        <p className="text-indigo-200 mb-12 text-lg">One home. Everyone connected.</p>
        <div className="space-y-3">
          <button
            onClick={() => setScreen("email-entry")}
            className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold text-base hover:bg-indigo-50 transition-all hover:scale-105 shadow-lg"
          >
            Create an Account
          </button>
          <button
            onClick={() => setScreen("login")}
            className="w-full py-4 bg-transparent text-white rounded-2xl font-bold text-base border-2 border-white/40 hover:bg-white/10 transition-all"
          >
            Log In
          </button>

          {/* New device sign-in (cloud sync) */}
          {cloudEnabled && (
            <button
              onClick={() => setShowNewDevice(true)}
              className="w-full py-3 bg-transparent text-indigo-300 rounded-2xl text-sm font-medium border border-indigo-400/40 hover:bg-white/5 transition-all"
            >
              📱 Sign in on a New Device
            </button>
          )}

          {/* Fallback: manual JSON restore */}
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleRestoreFile} />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 text-indigo-400/70 text-xs hover:text-indigo-300 transition-colors"
          >
            Restore from backup file
          </button>
        </div>

        {restoreError && (
          <p className="mt-4 text-red-300 text-xs bg-red-900/30 rounded-xl px-4 py-2">{restoreError}</p>
        )}
      </div>
    </div>
  );
}
