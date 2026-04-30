import { useState, useEffect, useRef } from "react";
import { RefreshCw, ChevronLeft, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { sendVerificationEmail } from "../../lib/emailService.js";

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const fmt     = s  => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ── OTP INPUT ─────────────────────────────────────────────────────────────── */
function OtpInput({ value, onChange, shaking, disabled }) {
  const refs = useRef([]);

  const handle = (idx, raw) => {
    const d = raw.replace(/\D/, "");
    if (!d && raw !== "") return;
    const next = [...value];
    next[idx] = d;
    onChange(next);
    if (d && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKey = (idx, e) => {
    if (e.key === "Backspace") {
      if (value[idx]) { const n = [...value]; n[idx] = ""; onChange(n); }
      else if (idx > 0) refs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft"  && idx > 0) refs.current[idx - 1]?.focus();
    else if   (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const txt  = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    txt.split("").forEach((c, i) => { next[i] = c; });
    onChange(next);
    refs.current[Math.min(txt.length, 5)]?.focus();
  };

  return (
    <div className={`flex gap-2 justify-center ${shaking ? "shake" : ""}`}>
      {Array(6).fill(0).map((_, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          autoFocus={i === 0}
          disabled={disabled}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all disabled:opacity-50"
          style={{
            border:     `2px solid ${shaking ? "#EF4444" : value[i] ? "#6366F1" : "#E5E7EB"}`,
            background: value[i] ? "#EEF2FF" : "white",
          }}
        />
      ))}
    </div>
  );
}

/* ── MAIN COMPONENT ────────────────────────────────────────────────────────── */
export default function EmailVerification() {
  const { account, updateAccount, setScreen } = useAuth();

  const [digits,         setDigits]         = useState(Array(6).fill(""));
  const [error,          setError]          = useState("");
  const [shaking,        setShaking]        = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(0);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendMsg,      setResendMsg]      = useState("");
  const [resending,      setResending]      = useState(false);

  const isDevMode = account?.devMode === true;

  /* Expiry countdown */
  useEffect(() => {
    const tick = () => setTimeLeft(Math.max(0, Math.floor(((account?.codeExpiry ?? 0) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [account?.codeExpiry]);

  /* Resend cooldown */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  /* Auto-submit when all 6 digits filled */
  useEffect(() => {
    if (digits.every(d => d !== "")) verify(digits.join(""));
  }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

  const shake = () => { setShaking(true); setTimeout(() => setShaking(false), 450); };

  const verify = (code) => {
    if (timeLeft === 0) {
      setError("This code has expired. Please request a new one.");
      shake(); setDigits(Array(6).fill(""));
      return;
    }
    if (code === account?.lastVerificationCode) {
      setSuccess(true);
      updateAccount({ emailVerified: true, devMode: false });
      setTimeout(() => setScreen("create-password"), 1200);
    } else {
      setError("That code doesn't match. Try again.");
      shake(); setDigits(Array(6).fill(""));
    }
  };

  const resend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");

    const code   = genCode();
    const expiry = Date.now() + 15 * 60 * 1000;

    const result = await sendVerificationEmail(account?.email, code);

    if (!result.ok) {
      setResendMsg("");
      setError("Failed to send — please try again.");
      setResending(false);
      return;
    }

    updateAccount({
      lastVerificationCode: code,
      codeExpiry:           expiry,
      devMode:              result.devMode ?? false,
    });
    setResendCooldown(60);
    setResendMsg("New code sent!");
    setDigits(Array(6).fill(""));
    setError("");
    setResending(false);
    setTimeout(() => setResendMsg(""), 4000);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp">
        <button
          onClick={() => setScreen("email-entry")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📬</div>
          <h2 className="text-2xl font-bold text-gray-800">Check your inbox</h2>
          <p className="text-gray-500 text-sm mt-1">
            We sent a 6-digit code to{" "}
            <strong className="text-gray-700">{account?.email}</strong>
          </p>
        </div>

        {/* Dev mode fallback — only shown when EmailJS isn't configured */}
        {isDevMode && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-5 text-center">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">
              ⚠️ Dev mode — email not sent
            </p>
            <p className="text-3xl font-extrabold tracking-[0.3em] text-amber-700 my-2">
              {account?.lastVerificationCode || "——"}
            </p>
            <p className="text-xs text-amber-400">
              Configure EmailJS in .env to send real emails
            </p>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 fadeUp">
            <div className="text-6xl mb-3">✅</div>
            <p className="font-bold text-green-600 text-lg">Email verified!</p>
            <p className="text-gray-400 text-sm mt-1">Setting up your account…</p>
          </div>
        ) : (
          <>
            <OtpInput
              value={digits}
              onChange={v => { setDigits(v); setError(""); }}
              shaking={shaking}
              disabled={timeLeft === 0}
            />

            {error     && <p className="text-red-500   text-xs text-center mt-3">{error}</p>}
            {resendMsg && <p className="text-green-600 text-xs text-center mt-3">{resendMsg}</p>}

            <div className="flex items-center justify-between mt-5 text-xs">
              <span className={`font-medium ${timeLeft === 0 ? "text-red-400" : "text-gray-400"}`}>
                {timeLeft > 0 ? `Expires in ${fmt(timeLeft)}` : "⏰ Code expired"}
              </span>
              <button
                onClick={resend}
                disabled={resendCooldown > 0 || resending}
                className="flex items-center gap-1 font-medium disabled:text-gray-300 text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed transition-colors"
              >
                {resending
                  ? <><Loader2 size={12} className="animate-spin" /> Sending…</>
                  : <><RefreshCw size={12} /> {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}</>
                }
              </button>
            </div>

            {!isDevMode && (
              <p className="text-xs text-center text-gray-400 mt-4">
                Can't find it? Check your spam folder.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
