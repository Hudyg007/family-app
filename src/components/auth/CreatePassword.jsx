import { useState } from "react";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

const sha256 = async (str) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const strength = (p) => {
  if (!p) return null;
  if (p.length < 8 || !/\d/.test(p)) return { label: "Weak",   color: "#EF4444", w: "33%"  };
  if (!/[A-Z]/.test(p))              return { label: "Fair",   color: "#F97316", w: "66%"  };
  return                                     { label: "Strong", color: "#16A34A", w: "100%" };
};

export default function CreatePassword() {
  const { updateAccount, setScreen } = useAuth();

  const [pw,       setPw]       = useState("");
  const [conf,     setConf]     = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const str = strength(pw);

  const submit = async () => {
    const errs = {};
    if (pw.length < 8)      errs.pw   = "Password must be at least 8 characters.";
    else if (!/\d/.test(pw)) errs.pw  = "Password must contain at least one number.";
    if (pw !== conf)         errs.conf = "Passwords don't match.";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const hash = await sha256(pw);
    updateAccount({ passwordHash: hash });
    setLoading(false);
    setScreen("onboarding");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp">
        <button
          onClick={() => setScreen("email-verify")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5"
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800">Create a password</h2>
          <p className="text-gray-500 text-sm mt-1">
            This password will be used to log in to your Family Hub account.
          </p>
        </div>

        <div className="space-y-4">
          {/* Password field */}
          <div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={e => { setPw(e.target.value); setErrors({}); }}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {str && (
              <div className="mt-2">
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: str.w, background: str.color }}
                  />
                </div>
                <p className="text-xs mt-1 font-medium" style={{ color: str.color }}>
                  {str.label}
                </p>
              </div>
            )}
            {errors.pw && <p className="text-red-500 text-xs mt-1">{errors.pw}</p>}
          </div>

          {/* Confirm field */}
          <div>
            <div className="relative">
              <input
                type={showConf ? "text" : "password"}
                value={conf}
                onChange={e => { setConf(e.target.value); setErrors({}); }}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="Confirm password"
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => setShowConf(v => !v)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.conf && <p className="text-red-500 text-xs mt-1">{errors.conf}</p>}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? "Setting up…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
