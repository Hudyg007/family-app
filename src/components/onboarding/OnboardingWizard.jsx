import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Check } from "lucide-react";
import { useAuth, LS_DATA } from "../../contexts/AuthContext.jsx";

/* ── Constants ──────────────────────────────────────────────────────────────── */
const OB_COLORS = [
  { hex: "#4f86c6", key: "blue"   },
  { hex: "#e07b5b", key: "orange" },
  { hex: "#6abf69", key: "green"  },
  { hex: "#f0c040", key: "yellow" },
  { hex: "#b57bee", key: "violet" },
  { hex: "#f48fb1", key: "rose"   },
  { hex: "#4dd0e1", key: "teal"   },
  { hex: "#ff8a65", key: "red"    },
];

const ALL_AVATARS = [
  // People
  "👨","👩","👧","👦","🧒","👴","👵","🧑","👱","🧔","👮","🧕","🦸","🧙","🧑‍🎤","🧑‍🍳","🧑‍🏫","🧑‍🚀",
  // Animals
  "🐶","🐱","🐻","🦊","🐼","🐨","🐯","🦁","🐸","🐙","🦄","🦋","🦉","🐺","🦝","🐧","🦕","🐬","🐻‍❄️",
  // Fun
  "🌟","🎸","⚽","🎮","🎨","🏆","🚀","🌈","🎭","👑","🌺","🎵","🏄",
];

const uid = () => Math.random().toString(36).slice(2, 9);

const newChild = (usedColors) => {
  const nextColor = OB_COLORS.find(c => !usedColors.includes(c.hex)) || OB_COLORS[0];
  return {
    id: uid(), name: "", age: "", color: nextColor.hex, pin: "", pinConfirm: "",
    spendBal: "0", saveBal: "0", giveBal: "0", goalName: "", goalTarget: "",
    avatar: "🧒", photo: null,
  };
};

/* ── PIN uniqueness ─────────────────────────────────────────────────────────── */
const takenPins = (ws, excludeChildId = null) => {
  const pins = new Set();
  if (ws.familyPin) pins.add(ws.familyPin);
  if (ws.g1Pin)     pins.add(ws.g1Pin);
  if (ws.hasG2 && ws.g2Pin) pins.add(ws.g2Pin);
  ws.children.forEach(c => { if (c.id !== excludeChildId && c.pin) pins.add(c.pin); });
  return pins;
};

/* ── Shared UI ──────────────────────────────────────────────────────────────── */
const Fld = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);
const INP     = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const PIN_INP = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 tracking-widest text-center text-lg font-bold";

function StepBar({ step, total }) {
  return (
    <div className="flex items-center gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
          style={{ background: i < step ? "#6366F1" : "#E5E7EB" }} />
      ))}
      <span className="text-xs text-gray-400 ml-2 flex-shrink-0">Step {step} of {total}</span>
    </div>
  );
}

/* ── Simple Avatar display ──────────────────────────────────────────────────── */
function AvatarBubble({ avatar, photo, color = "#6366F1", size = 44 }) {
  if (photo) {
    return (
      <img src={photo} alt="avatar"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover",
          border: `2px solid ${color}`, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.48, flexShrink: 0,
    }}>{avatar || "🧑"}</div>
  );
}

/* ── Inline avatar picker: emoji grid + photo upload ───────────────────────── */
function AvatarPickerInline({ avatar, photo, onChangeEmoji, onChangePhoto, name, color }) {
  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState(photo ? "photo" : "emoji");
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onChangePhoto(ev.target.result); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mt-2">
        <AvatarBubble avatar={avatar} photo={photo} color={color || "#6366F1"} size={52} />
        <div>
          <p className="text-sm font-semibold text-gray-700">{name || "Member"}</p>
          <button type="button" onClick={() => setOpen(o => !o)}
            className="text-xs text-indigo-600 font-semibold mt-0.5 hover:text-indigo-800">
            {open ? "Close" : "📷 Change picture"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 bg-white rounded-2xl border border-indigo-100 shadow-sm p-3">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 mb-3 w-fit">
            <button type="button" onClick={() => setTab("emoji")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "emoji" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
              😀 Emoji
            </button>
            <button type="button" onClick={() => setTab("photo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "photo" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
              📷 Photo
            </button>
          </div>

          {tab === "emoji" && (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {ALL_AVATARS.map(a => (
                <button key={a} type="button"
                  onClick={() => { onChangeEmoji(a); onChangePhoto(null); }}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center flex-shrink-0 transition-all ${a === avatar && !photo ? "bg-indigo-100 ring-2 ring-indigo-500" : "hover:bg-gray-100"}`}
                >{a}</button>
              ))}
            </div>
          )}

          {tab === "photo" && (
            <div className="flex items-center gap-3">
              {photo
                ? <img src={photo} alt="preview" className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400 flex-shrink-0" />
                : <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl text-gray-400 flex-shrink-0">📷</div>
              }
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100">
                  {photo ? "Change Photo" : "Upload Photo"}
                </button>
                {photo && (
                  <button type="button" onClick={() => { onChangePhoto(null); setTab("emoji"); }}
                    className="px-3 py-1.5 bg-red-50 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100">
                    Remove
                  </button>
                )}
                <p className="text-xs text-gray-400">JPG, PNG, or GIF</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══ STEP 1 — Family Name & Master PIN ════════════════════════════════════════ */
function Step1({ ws, setWs }) {
  const [errors, setErrors] = useState({});
  const set = (k, v) => setWs(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!ws.familyName.trim())                              e.familyName = "Family name is required.";
    else if (!/^[A-Za-z\s'-]+$/.test(ws.familyName.trim())) e.familyName = "Letters only, please.";
    else if (ws.familyName.trim().length > 30)               e.familyName = "Max 30 characters.";
    if (ws.familyPin.length !== 4)  e.familyPin  = "PIN must be exactly 4 digits.";
    if (ws.familyPin !== ws.familyPinC) e.familyPinC = "PINs don't match.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return { validate, node: (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Let's set up your Family Hub</h2>
        <p className="text-gray-500 text-sm mt-1">This will only take a minute.</p>
      </div>
      <Fld label="Family Name" error={errors.familyName}>
        <input value={ws.familyName} onChange={e => { set("familyName", e.target.value); setErrors({}); }}
          placeholder="e.g. Smith" maxLength={30} className={INP} autoFocus />
      </Fld>
      <Fld label="Family PIN (4 digits)" error={errors.familyPin}>
        <input type="password" inputMode="numeric" maxLength={4} value={ws.familyPin}
          onChange={e => { set("familyPin", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
          placeholder="••••" className={PIN_INP} />
        <p className="text-xs text-gray-400 mt-1">Used by parents and guardians to sign in.</p>
      </Fld>
      <Fld label="Confirm Family PIN" error={errors.familyPinC}>
        <input type="password" inputMode="numeric" maxLength={4} value={ws.familyPinC}
          onChange={e => { set("familyPinC", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
          placeholder="••••" className={PIN_INP} />
      </Fld>
    </div>
  )};
}

/* ══ STEP 2 — Primary Guardian ════════════════════════════════════════════════ */
function Step2({ ws, setWs, email }) {
  const [errors, setErrors] = useState({});
  const set = (k, v) => setWs(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!ws.g1Name.trim()) e.g1Name = "Your name is required.";
    if (ws.g1Pin && ws.g1Pin.length !== 4) e.g1Pin = "PIN must be exactly 4 digits.";
    if (ws.g1Pin && ws.g1Pin !== ws.g1PinC) e.g1PinC = "PINs don't match.";
    if (ws.g1Pin && ws.g1Pin === ws.familyPin) e.g1Pin = "Personal PIN must differ from the Family PIN.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return { validate, node: (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Tell us about yourself</h2>
      </div>
      <Fld label="Your First Name" error={errors.g1Name}>
        <input value={ws.g1Name} onChange={e => { set("g1Name", e.target.value); setErrors({}); }}
          placeholder="First name" className={INP} autoFocus />
      </Fld>
      <Fld label="Account Email (linked)">
        <input value={email} readOnly className={`${INP} bg-gray-50 text-gray-400 cursor-not-allowed`} />
      </Fld>
      <Fld label="Your Personal PIN (optional)" error={errors.g1Pin}>
        <input type="password" inputMode="numeric" maxLength={4} value={ws.g1Pin}
          onChange={e => { set("g1Pin", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
          placeholder="Leave blank to use the Family PIN" className={PIN_INP} />
        <p className="text-xs text-gray-400 mt-1">You can add more guardians later in Settings.</p>
      </Fld>
      {ws.g1Pin && (
        <Fld label="Confirm Your PIN" error={errors.g1PinC}>
          <input type="password" inputMode="numeric" maxLength={4} value={ws.g1PinC}
            onChange={e => { set("g1PinC", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
            placeholder="••••" className={PIN_INP} />
        </Fld>
      )}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Profile Picture</p>
        <AvatarPickerInline
          avatar={ws.g1Avatar} photo={ws.g1Photo}
          onChangeEmoji={v => set("g1Avatar", v)}
          onChangePhoto={v => set("g1Photo", v)}
          name={ws.g1Name || "Guardian 1"}
          color="#7C3AED"
        />
      </div>
    </div>
  )};
}

/* ══ STEP 3 — Second Guardian ══════════════════════════════════════════════════ */
function Step3({ ws, setWs }) {
  const [errors, setErrors] = useState({});
  const set = (k, v) => setWs(p => ({ ...p, [k]: v }));

  const validate = () => {
    if (!ws.hasG2) return true;
    const e = {};
    if (!ws.g2Name.trim()) e.g2Name = "Their name is required.";
    if (ws.g2Pin && ws.g2Pin.length !== 4) e.g2Pin = "PIN must be exactly 4 digits.";
    if (ws.g2Pin && ws.g2Pin !== ws.g2PinC) e.g2PinC = "PINs don't match.";
    if (ws.g2Pin && ws.g2Pin === ws.familyPin) e.g2Pin = "Personal PIN must differ from the Family PIN.";
    if (ws.g2Pin && ws.g1Pin && ws.g2Pin === ws.g1Pin) e.g2Pin = "PINs must be unique across guardians.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  return { validate, node: (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Is there a second guardian?</h2>
        <p className="text-gray-500 text-sm mt-1">Co-parent, grandparent, or caregiver.</p>
      </div>
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <span className="text-sm font-medium text-gray-700">Add a partner or second guardian</span>
        <button onClick={() => { set("hasG2", !ws.hasG2); setErrors({}); }}
          style={{ background: ws.hasG2 ? "#6366F1" : "#E5E7EB" }}
          className="w-11 h-6 rounded-full relative transition-all flex-shrink-0">
          <span style={{ left: ws.hasG2 ? "calc(100% - 22px)" : "2px" }}
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all" />
        </button>
      </div>
      {ws.hasG2 && (<>
        <Fld label="Their First Name" error={errors.g2Name}>
          <input value={ws.g2Name} onChange={e => { set("g2Name", e.target.value); setErrors({}); }}
            placeholder="First name" className={INP} autoFocus />
        </Fld>
        <Fld label="Their Personal PIN (optional)" error={errors.g2Pin}>
          <input type="password" inputMode="numeric" maxLength={4} value={ws.g2Pin}
            onChange={e => { set("g2Pin", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
            placeholder="Leave blank to use the Family PIN" className={PIN_INP} />
        </Fld>
        {ws.g2Pin && (
          <Fld label="Confirm Their PIN" error={errors.g2PinC}>
            <input type="password" inputMode="numeric" maxLength={4} value={ws.g2PinC}
              onChange={e => { set("g2PinC", e.target.value.replace(/\D/g, "").slice(0,4)); setErrors({}); }}
              placeholder="••••" className={PIN_INP} />
          </Fld>
        )}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Profile Picture</p>
          <AvatarPickerInline
            avatar={ws.g2Avatar} photo={ws.g2Photo}
            onChangeEmoji={v => set("g2Avatar", v)}
            onChangePhoto={v => set("g2Photo", v)}
            name={ws.g2Name || "Guardian 2"}
            color="#475569"
          />
        </div>
      </>)}
    </div>
  )};
}

/* ══ STEP 4 — Add Kids ════════════════════════════════════════════════════════ */
function Step4({ ws, setWs }) {
  const [errors, setErrors] = useState({});

  const addChild = () => {
    if (ws.children.length >= 8) return;
    setWs(p => ({ ...p, children: [...p.children, newChild(p.children.map(c => c.color))] }));
  };

  const removeChild = (id) => {
    setWs(p => ({ ...p, children: p.children.filter(c => c.id !== id) }));
    setErrors(e => { const n = { ...e }; delete n[id]; return n; });
  };

  const setChild = (id, patch) => {
    setWs(p => ({ ...p, children: p.children.map(c => c.id === id ? { ...c, ...patch } : c) }));
    setErrors(e => { const n = { ...e }; delete n[id]; return n; });
  };

  const validate = () => {
    if (ws.children.length === 0) { setErrors({ _global:"Add at least one child to continue." }); return false; }
    const e = {};
    ws.children.forEach(c => {
      const ce = {};
      if (!c.name.trim())         ce.name = "Name is required.";
      if (!c.age || +c.age < 1 || +c.age > 17) ce.age = "Age must be 1–17.";
      if (c.pin.length !== 4)     ce.pin  = "PIN must be exactly 4 digits.";
      if (c.pin !== c.pinConfirm) ce.pinC = "PINs don't match.";
      const taken = takenPins(ws, c.id);
      if (c.pin && taken.has(c.pin)) ce.pin = "This PIN is already used by another member.";
      if (Object.keys(ce).length) e[c.id] = ce;
    });
    const colorSet = new Set();
    ws.children.forEach(c => {
      if (colorSet.has(c.color)) e[c.id] = { ...(e[c.id]||{}), color:"Two kids can't share the same colour." };
      colorSet.add(c.color);
    });
    setErrors(e);
    return !Object.keys(e).length;
  };

  return { validate, node: (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Now let's add your kids</h2>
        <p className="text-gray-500 text-sm mt-1">You can always add more later in Settings.</p>
      </div>

      {errors._global && (
        <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3">{errors._global}</p>
      )}

      {ws.children.map((child, idx) => {
        const ce = errors[child.id] || {};
        const usedByOthers = ws.children.filter(c => c.id !== child.id).map(c => c.color);
        const childColor = OB_COLORS.find(o => o.hex === child.color)?.hex || "#6366F1";
        return (
          <div key={child.id} className="bg-gray-50 rounded-2xl p-4 space-y-3 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-700">Child {idx + 1}</span>
              <button onClick={() => removeChild(child.id)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Fld label="Name" error={ce.name}>
                <input value={child.name} onChange={e => setChild(child.id, { name: e.target.value })}
                  placeholder="First name" className={INP} />
              </Fld>
              <Fld label="Age" error={ce.age}>
                <input type="number" min={1} max={17} value={child.age}
                  onChange={e => setChild(child.id, { age: e.target.value })}
                  placeholder="e.g. 9" className={INP} />
              </Fld>
            </div>

            <Fld label="Colour" error={ce.color}>
              <div className="flex gap-2 flex-wrap mt-1">
                {OB_COLORS.map(c => (
                  <button key={c.hex} onClick={() => setChild(child.id, { color: c.hex })}
                    disabled={usedByOthers.includes(c.hex)}
                    className="w-8 h-8 rounded-full transition-all disabled:opacity-25"
                    style={{
                      background: c.hex,
                      outline: child.color === c.hex ? "3px solid #1E1B4B" : "3px solid transparent",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </Fld>

            <div className="grid grid-cols-2 gap-3">
              <Fld label="PIN (4 digits)" error={ce.pin}>
                <input type="password" inputMode="numeric" maxLength={4} value={child.pin}
                  onChange={e => setChild(child.id, { pin: e.target.value.replace(/\D/g, "").slice(0,4) })}
                  placeholder="••••" className={PIN_INP} />
              </Fld>
              <Fld label="Confirm PIN" error={ce.pinC}>
                <input type="password" inputMode="numeric" maxLength={4} value={child.pinConfirm}
                  onChange={e => setChild(child.id, { pinConfirm: e.target.value.replace(/\D/g, "").slice(0,4) })}
                  placeholder="••••" className={PIN_INP} />
              </Fld>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[["spendBal","💸 Spend"],["saveBal","🏦 Save"],["giveBal","❤️ Give"]].map(([k,lbl]) => (
                <Fld key={k} label={lbl}>
                  <input type="number" min={0} step="0.01" value={child[k]}
                    onChange={e => setChild(child.id, { [k]: e.target.value })}
                    placeholder="0.00" className={INP} />
                </Fld>
              ))}
            </div>

            <Fld label="First Savings Goal (optional)">
              <input value={child.goalName}
                onChange={e => setChild(child.id, { goalName: e.target.value })}
                placeholder="e.g. New Bike" className={INP} />
            </Fld>
            {child.goalName.trim() && (
              <Fld label="Goal Target ($)">
                <input type="number" min={1} value={child.goalTarget}
                  onChange={e => setChild(child.id, { goalTarget: e.target.value })}
                  placeholder="e.g. 120" className={INP} />
              </Fld>
            )}

            {/* Avatar picker per child */}
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Profile Picture</p>
              <AvatarPickerInline
                avatar={child.avatar} photo={child.photo}
                onChangeEmoji={v => setChild(child.id, { avatar: v })}
                onChangePhoto={v => setChild(child.id, { photo: v })}
                name={child.name || `Child ${idx+1}`}
                color={childColor}
              />
            </div>
          </div>
        );
      })}

      {ws.children.length < 8 && (
        <button onClick={addChild}
          className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-2xl text-sm font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Add a Child
        </button>
      )}
    </div>
  )};
}

/* ══ STEP 5 — Review ══════════════════════════════════════════════════════════ */
function Step5({ ws, email, onEdit }) {
  const mask = pin => (pin ? "••••" : "uses Family PIN");
  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Here's your family</h2>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-4">
        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-2">Account</p>
        <p className="text-sm text-gray-700">{email}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Family</p>
          <button onClick={() => onEdit(1)} className="text-xs text-indigo-500 hover:underline">Edit</button>
        </div>
        <p className="font-semibold text-gray-800">{ws.familyName} Family</p>
        <p className="text-xs text-gray-500 mt-0.5">Family PIN: ••••</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Guardians</p>
          <button onClick={() => onEdit(2)} className="text-xs text-indigo-500 hover:underline">Edit</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <AvatarBubble avatar={ws.g1Avatar} photo={ws.g1Photo} color="#7C3AED" size={44} />
            <div>
              <p className="font-semibold text-gray-800 text-sm">{ws.g1Name}</p>
              <p className="text-xs text-gray-400">PIN: {mask(ws.g1Pin)}</p>
            </div>
          </div>
          {ws.hasG2 && (
            <div className="flex items-center gap-3">
              <AvatarBubble avatar={ws.g2Avatar} photo={ws.g2Photo} color="#475569" size={44} />
              <div>
                <p className="font-semibold text-gray-800 text-sm">{ws.g2Name}</p>
                <p className="text-xs text-gray-400">PIN: {mask(ws.g2Pin)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Children</p>
          <button onClick={() => onEdit(4)} className="text-xs text-indigo-500 hover:underline">Edit</button>
        </div>
        <div className="space-y-3">
          {ws.children.map((c) => {
            const childColor = OB_COLORS.find(o => o.hex === c.color)?.hex || "#6366F1";
            return (
              <div key={c.id} className="flex items-start gap-3">
                <AvatarBubble avatar={c.avatar} photo={c.photo} color={childColor} size={44} />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{c.name} <span className="text-gray-400 font-normal">· age {c.age}</span></p>
                  <p className="text-xs text-gray-400">PIN: •••• · Spend ${(+c.spendBal||0).toFixed(2)} · Save ${(+c.saveBal||0).toFixed(2)} · Give ${(+c.giveBal||0).toFixed(2)}</p>
                  {c.goalName.trim() && <p className="text-xs text-indigo-500">🎯 {c.goalName}{c.goalTarget ? ` · $${c.goalTarget}` : ""}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══ SUCCESS ══════════════════════════════════════════════════════════════════ */
function SuccessScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}>
      <div className="text-center fadeUp">
        <div className="text-8xl mb-4">🎉</div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Your Family Hub is ready!</h1>
        <p className="text-indigo-200 text-lg">Setting things up…</p>
      </div>
    </div>
  );
}

/* ══ WIZARD SHELL ═════════════════════════════════════════════════════════════ */
export default function OnboardingWizard() {
  const { account, updateAccount, setScreen, startSession } = useAuth();
  const [step,    setStep]    = useState(1);
  const [success, setSuccess] = useState(false);
  const [ws,      setWs]      = useState({
    familyName: "", familyPin: "", familyPinC: "",
    g1Name: "", g1Pin: "", g1PinC: "", g1Avatar: "👨", g1Photo: null,
    hasG2: false, g2Name: "", g2Pin: "", g2PinC: "", g2Avatar: "👩", g2Photo: null,
    children: [],
  });

  const s1 = Step1({ ws, setWs });
  const s2 = Step2({ ws, setWs, email: account?.email || "" });
  const s3 = Step3({ ws, setWs });
  const s4 = Step4({ ws, setWs });
  const steps = [s1, s2, s3, s4];
  const TOTAL = 5;

  const next = () => {
    if (step < 5) {
      const idx = step - 1;
      if (steps[idx] && !steps[idx].validate()) return;
      setStep(s => s + 1);
    }
  };
  const back = () => { if (step > 1) setStep(s => s - 1); };

  const confirm = () => {
    const members = [
      {
        id: uid(), name: ws.g1Name.trim(), role: "parent",
        pin: ws.g1Pin || ws.familyPin,
        familyName: ws.familyName.trim(),
        avatar: ws.g1Avatar || "👨", photo: ws.g1Photo || null,
        colorKey: "violet",
      },
      ...(ws.hasG2 ? [{
        id: uid(), name: ws.g2Name.trim(), role: "parent",
        pin: ws.g2Pin || ws.familyPin,
        familyName: ws.familyName.trim(),
        avatar: ws.g2Avatar || "👩", photo: ws.g2Photo || null,
        colorKey: "slate",
      }] : []),
      ...ws.children.map((c) => ({
        id: c.id, name: c.name.trim(), role: "child",
        pin: c.pin, avatar: c.avatar || "🧒", photo: c.photo || null,
        colorKey: OB_COLORS.find(o => o.hex === c.color)?.key || "blue",
        age: parseInt(c.age) || 0,
      })),
    ];

    const wallets = Object.fromEntries(
      ws.children.map(c => [c.id, {
        spend: parseFloat(c.spendBal)||0, save: parseFloat(c.saveBal)||0,
        give:  parseFloat(c.giveBal)||0,  allowance:0, history:[],
      }])
    );

    const goals = ws.children
      .filter(c => c.goalName.trim())
      .map(c => ({
        id: uid(), owner: c.id, title: c.goalName.trim(),
        target: parseFloat(c.goalTarget)||0, current:0, emoji:"🎯",
      }));

    localStorage.setItem(LS_DATA, JSON.stringify({
      familyName: ws.familyName.trim(), familyPin: ws.familyPin,
      members, events:[], chores:[], lists:[], wallets, goals, budget:[],
    }));
    updateAccount({ setupComplete: true });
    startSession();
    setSuccess(true);
    setTimeout(() => setScreen("family-select"), 2000);
  };

  if (success) return <SuccessScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center py-10"
      style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg mx-4 fadeUp" style={{ maxWidth:520 }}>
        <StepBar step={step} total={TOTAL} />
        <div style={{ minHeight:360 }}>
          {step === 1 && s1.node}
          {step === 2 && s2.node}
          {step === 3 && s3.node}
          {step === 4 && s4.node}
          {step === 5 && <Step5 ws={ws} email={account?.email||""} onEdit={setStep} />}
        </div>
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={back}
              className="flex items-center gap-1 px-5 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 5 ? (
            <button onClick={next}
              className="flex-1 flex items-center justify-center gap-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={confirm}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Create My Family Hub
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
