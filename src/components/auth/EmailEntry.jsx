import { useState } from "react";
import { ChevronLeft, Mail, Loader2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { sendVerificationEmail, emailConfigured } from "../../lib/emailService.js";

const genCode    = () => String(Math.floor(100000 + Math.random() * 900000));
const validEmail = e  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());

export default function EmailEntry() {
  const { setScreen, updateAccount } = useAuth();
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!validEmail(trimmed)) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    setError("");

    const code   = genCode();
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    const result = await sendVerificationEmail(trimmed, code);

    if (!result.ok) {
      // Should not reach here since emailService falls back to devMode on failure
      setError("Couldn't send the email — please try again.");
      setLoading(false);
      return;
    }

    // Save account data — code is stored so EmailVerification can check it
    updateAccount({
      email:                trimmed,
      lastVerificationCode: code,
      codeExpiry:           expiry,
      emailVerified:        false,
      setupComplete:        false,
      createdAt:            new Date().toISOString(),
      failedLoginAttempts:  0,
      lockoutUntil:         null,
      passwordHash:         "",
      devMode:              result.devMode ?? false,
    });

    setLoading(false);
    setScreen("email-verify");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp">
        <button
          onClick={() => setScreen("landing")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Let's get started</h2>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email to create your Family Hub account. We'll send you a quick verification code.
          </p>
        </div>

        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && !loading && submit()}
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          disabled={loading}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
        />
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

        {!emailConfigured && (
          <p className="text-amber-600 text-xs mt-2 bg-amber-50 rounded-lg px-3 py-2">
            ⚠️ Email service not configured — the verification code will be shown on the next screen for testing.
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Sending…</>
          ) : (
            "Send Verification Email"
          )}
        </button>
      </div>
    </div>
  );
}
