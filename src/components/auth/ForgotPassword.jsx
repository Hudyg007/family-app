import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Mail, RefreshCw, ChevronLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

/* ── Helpers ────────────────────────────────────────────────────────────────── */
const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};
const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const fmt     = s  => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const strength = (p) => {
  if (!p) return null;
  if (p.length < 8 || !/\d/.test(p)) return { label: "Weak",   color: "#EF4444", w: "33%"  };
  if (!/[A-Z]/.test(p))              return { label: "Fair",   color: "#F97316", w: "66%"  };
  return                                     { label: "Strong", color: "#16A34A", w: "100%" };
};

/* ── OTP Input (shared pattern) ─────────────────────────────────────────────── */
function OtpInput({ value, onChange, shaking }) {
  const refs = useRef([]);
  const handle = (idx, raw) => {
    const d = raw.replace(/\D/, "");
    if (!d && raw !== "") return;
    const next = [...value]; next[idx] = d; onChange(next);
    if (d && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleKey = (idx, e) => {
    if (e.key === "Backspace") {
      if (value[idx]) { const n = [...value]; n[idx] = ""; onChange(n); }
      else if (idx > 0) refs.current[idx - 1]?.focus();
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const txt = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill(""); txt.split("").forEach((c, i) => { next[i] = c; });
    onChange(next); refs.current[Math.min(txt.length, 5)]?.focus();
  };
  return (
    <div className={`flex gap-2 justify-center ${shaking ? "shake" : ""}`}>
      {Array(6).fill(0).map((_, i) => (
        <input key={i} ref={el => (refs.current[i] = el)} type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ""} onChange={e => handle(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined} autoFocus={i === 0}
          className="w-11 h-14 text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
          style={{ border: `2px solid ${shaking ? "#EF4444" : value[i] ? "#6366F1" : "#E5E7EB"}`, background: value[i] ? "#EEF2FF" : "white" }}
        />
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────────────── */
export default function ForgotPassword() {
  const { account, updateAccount, setScreen } = useAuth();

  const [stage,        setStage]        = useState("email"); // email | verify | newpw | done
  const [inputEmail,   setInputEmail]   = useState(account?.email || "");
  const [emailError,   setEmailError]   = useState("");
  const [digits,       setDigits]       = useState(Array(6).fill(""));
  const [otpError,     setOtpError]     = useState("");
  const [otpShaking,   setOtpShaking]   = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(0);
  const [resendCD,     setResendCD]     = useState(0);
  const [resendMsg,    setResendMsg]    = useState("");
  const [pw,           setPw]           = useState("");
  const [conf,         setConf]         = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [showConf,     setShowConf]     = useState(false);
  const [pwErrors,     setPwErrors]     = useState({});
  const [codeRef,      setCodeRef]      = useState("");
  const [expiryRef,    setExpiryRef]    = useState(0);

  /* Expiry countdown */
  useEffect(() => {
    if (stage !== "verify") return;
    const tick = () => setTimeLeft(Math.max(0, Math.floor((expiryRef - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [expiryRef, stage]);

  /* Resend cooldown */
  useEffect(() => {
    if (resendCD <= 0) return;
    const id = setInterval(() => setResendCD(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCD]);

  /* Auto-submit OTP */
  useEffect(() => {
    if (stage === "verify" && digits.every(d => d !== "")) verifyOtp(digits.join(""));
  }, [digits, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const shakeOtp = () => { setOtpShaking(true); setTimeout(() => setOtpShaking(false), 450); };

  const sendCode = () => {
    if (!inputEmail.trim() || inputEmail.trim().toLowerCase() !== account?.email) {
      setEmailError("That email doesn't match your account."); return;
    }
    const code = genCode(); const expiry = Date.now() + 15 * 60 * 1000;
    console.log(`FAMILY HUB PASSWORD RESET — Code for ${inputEmail}: ${code}`);
    setCodeRef(code); setExpiryRef(expiry); setResendCD(60);
    setStage("verify");
  };

  const verifyOtp = (code) => {
    if (timeLeft === 0) {
      setOtpError("Code expired. Request a new one."); shakeOtp(); setDigits(Array(6).fill("")); return;
    }
    if (code === codeRef) { setStage("newpw"); }
    else { setOtpError("That code doesn't match. Try again."); shakeOtp(); setDigits(Array(6).fill("")); }
  };

  const resend = () => {
    if (resendCD > 0) return;
    const code = genCode(); const expiry = Date.now() + 15 * 60 * 1000;
    console.log(`FAMILY HUB PASSWORD RESET — Code for ${inputEmail}: ${code}`);
    setCodeRef(code); setExpiryRef(expiry); setResendCD(60);
    setResendMsg("New code sent!"); setDigits(Array(6).fill("")); setOtpError("");
    setTimeout(() => setResendMsg(""), 3000);
  };

  const submitNewPw = async () => {
    const errs = {};
    if (pw.length < 8)       errs.pw   = "Password must be at least 8 characters.";
    else if (!/\d/.test(pw)) errs.pw   = "Password must contain at least one number.";
    if (pw !== conf)         errs.conf = "Passwords don't match.";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    const hash = await sha256(pw);
    updateAccount({ passwordHash: hash, failedLoginAttempts: 0, lockoutUntil: null });
    setStage("done");
  };

  const str = strength(pw);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp">
        {stage !== "done" && (
          <button onClick={() => setScreen("login")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5">
            <ChevronLeft size={16} /> Back to login
          </button>
        )}

        {/* Stage: email */}
        {stage === "email" && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔑</div>
              <h2 className="text-2xl font-bold text-gray-800">Reset password</h2>
              <p className="text-gray-500 text-sm mt-1">Enter your account email to receive a reset code.</p>
            </div>
            <input type="email" value={inputEmail} onChange={e => { setInputEmail(e.target.value); setEmailError(""); }}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            {emailError && <p className="text-red-500 text-xs mt-2">{emailError}</p>}
            <button onClick={sendCode} className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Send Reset Code
            </button>
          </>
        )}

        {/* Stage: verify */}
        {stage === "verify" && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2 mb-6">
              <Mail size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                A reset code has been sent from <strong>Family Hub Setup</strong> to <strong>{inputEmail}</strong>.
              </p>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Enter reset code</h2>
            </div>
            <OtpInput value={digits} onChange={v => { setDigits(v); setOtpError(""); }} shaking={otpShaking} />
            {otpError  && <p className="text-red-500   text-xs text-center mt-3">{otpError}</p>}
            {resendMsg && <p className="text-green-600 text-xs text-center mt-3">{resendMsg}</p>}
            <div className="flex items-center justify-between mt-4 text-xs">
              <span className="text-gray-400">{timeLeft > 0 ? `Expires in ${fmt(timeLeft)}` : "Expired"}</span>
              <button onClick={resend} disabled={resendCD > 0}
                className="flex items-center gap-1 font-medium disabled:text-gray-300 text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed">
                <RefreshCw size={12} />{resendCD > 0 ? `Resend in ${resendCD}s` : "Resend"}
              </button>
            </div>
          </>
        )}

        {/* Stage: new password */}
        {stage === "newpw" && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔒</div>
              <h2 className="text-2xl font-bold text-gray-800">New password</h2>
              <p className="text-gray-500 text-sm mt-1">Choose a new password for your account.</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={pw}
                    onChange={e => { setPw(e.target.value); setPwErrors({}); }} placeholder="New password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-3 text-gray-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {str && <div className="mt-2"><div className="w-full bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full transition-all" style={{ width: str.w, background: str.color }} /></div><p className="text-xs mt-1 font-medium" style={{ color: str.color }}>{str.label}</p></div>}
                {pwErrors.pw && <p className="text-red-500 text-xs mt-1">{pwErrors.pw}</p>}
              </div>
              <div>
                <div className="relative">
                  <input type={showConf ? "text" : "password"} value={conf}
                    onChange={e => { setConf(e.target.value); setPwErrors({}); }} placeholder="Confirm password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <button onClick={() => setShowConf(v => !v)} className="absolute right-3 top-3 text-gray-400">
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwErrors.conf && <p className="text-red-500 text-xs mt-1">{pwErrors.conf}</p>}
              </div>
            </div>
            <button onClick={submitNewPw} className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Update Password
            </button>
          </>
        )}

        {/* Stage: done */}
        {stage === "done" && (
          <div className="text-center py-6 fadeUp">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Password updated!</h2>
            <p className="text-gray-500 text-sm mb-7">Please log in with your new password.</p>
            <button onClick={() => setScreen("login")} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Back to Log In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
