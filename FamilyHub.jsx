import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, CheckSquare, ShoppingCart, Wallet, Target, Settings,
  ChevronLeft, ChevronRight, Plus, X, Check, Star, TrendingUp,
  Home, Bell, Lock, Trash2, DollarSign, ArrowUpCircle, Repeat,
  Edit3, BarChart2, User, Save, UserPlus, AlertTriangle,
  Utensils, MoreVertical } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell } from "recharts";
import { useAuth, LS_DATA, getDataKey } from "./src/contexts/AuthContext.jsx";
import MealPlannerTab, { DEFAULT_MEAL_PLANNER } from "./src/components/adult/mealplanner/MealPlannerTab.jsx";
import LandingScreen       from "./src/components/auth/LandingScreen.jsx";
import EmailEntry          from "./src/components/auth/EmailEntry.jsx";
import EmailVerification   from "./src/components/auth/EmailVerification.jsx";
import CreatePassword      from "./src/components/auth/CreatePassword.jsx";
import LoginScreenAuth     from "./src/components/auth/LoginScreen.jsx";
import ForgotPassword      from "./src/components/auth/ForgotPassword.jsx";
import OnboardingWizard    from "./src/components/onboarding/OnboardingWizard.jsx";
import { sendIssueReport }   from "./src/lib/emailService.js";
import { pushFamilyToCloud } from "./src/lib/cloudSync.js";
/* ── MEMBER AVATAR HELPER ────────────────────────────────────────────────── */
function MemberAvatar({ member, size = 44, style: extraStyle = {} }) {
  if (!member) return null;
  // Photo takes top priority
  if (member.photo) {
    return (
      <img
        src={member.photo}
        alt={member.name}
        style={{
          width: size, height: size, borderRadius: "50%", objectFit: "cover",
          flexShrink: 0, border: `2px solid ${getP(member.colorKey)?.bg || "#6366F1"}`,
          ...extraStyle,
        }}
      />
    );
  }
  const c = getP(member.colorKey);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: c?.light || "#EEF2FF",
      border: `2px solid ${c?.bg || "#6366F1"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, flexShrink: 0, ...extraStyle,
    }}>
      {member.avatar || "🧑"}
    </div>
  );
}

/* ── COLORS ─────────────────────────────────────────────────────────────── */
const PRESETS = [
  { key:"violet", bg:"#7C3AED", light:"#EDE9FE", text:"#7C3AED", label:"Violet" },
  { key:"blue",   bg:"#2563EB", light:"#DBEAFE", text:"#2563EB", label:"Blue"   },
  { key:"pink",   bg:"#DB2777", light:"#FCE7F3", text:"#DB2777", label:"Pink"   },
  { key:"orange", bg:"#EA580C", light:"#FFEDD5", text:"#EA580C", label:"Orange" },
  { key:"green",  bg:"#16A34A", light:"#DCFCE7", text:"#16A34A", label:"Green"  },
  { key:"teal",   bg:"#0891B2", light:"#CFFAFE", text:"#0891B2", label:"Teal"   },
  { key:"red",    bg:"#DC2626", light:"#FEE2E2", text:"#DC2626", label:"Red"    },
  { key:"rose",   bg:"#E11D48", light:"#FFE4E6", text:"#E11D48", label:"Rose"   },
  { key:"yellow", bg:"#CA8A04", light:"#FEF9C3", text:"#CA8A04", label:"Yellow" },
  { key:"slate",  bg:"#475569", light:"#F1F5F9", text:"#475569", label:"Slate"  },
];
const getP = k => PRESETS.find(c => c.key === k) || PRESETS[0];

/* ── CONSTANTS ──────────────────────────────────────────────────────────── */
const AVATARS = [
  // People
  "👨","👩","👧","👦","🧒","👴","👵","🧑","👱","🧔","👮","👩‍💼","👨‍💼","🧕","🦸","🧙","🧑‍🎤","🧑‍🍳","🧑‍🏫","🧑‍🚀",
  // Animals
  "🐶","🐱","🐻","🦊","🐼","🐨","🐯","🦁","🐸","🐙","🦄","🦋","🦉","🐺","🦝","🐧","🦕","🐬","🐼","🐻‍❄️",
  // Fun
  "🌟","🎸","⚽","🎮","🎨","🏆","🚀","🌈","🎭","🎪","🦖","👑","🌺","🍕","🎵","🏄",
];
const GOAL_EMOJIS = ["🎯","🚲","📱","🎮","🏠","✈️","🎨","🎸","👟","🎁","🏖️","🧸","🍦","⚽","🏄"];
const CHORE_CATS = { bedroom:"🛏️", kitchen:"🍳", cleaning:"🧹", pets:"🐾", outdoor:"🌿", laundry:"👕", errands:"📦" };
const POTS = [
  { key:"spend", label:"Spend", icon:"💸", desc:"Ready to use",    color:"#2563EB" },
  { key:"save",  label:"Save",  icon:"🏦", desc:"Building goals",  color:"#16A34A" },
  { key:"give",  label:"Give",  icon:"❤️", desc:"Sharing & giving", color:"#DB2777" },
];
const TX_ICON = { allowance:"💰", chore:"✅", boost:"⭐", spend:"🛒", transfer:"🔄", adjust:"✏️" };
const BCOLORS = ["#6366F1","#2563EB","#16A34A","#DB2777","#EA580C","#7C3AED","#0891B2","#CA8A04"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DSHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const FREQ_LABELS = { daily:"Daily", weekly:"Weekly", biweekly:"Every 2 Weeks", monthly:"Monthly", custom:"Custom" };
const NAV = [
  { id:"calendar", icon:Calendar,    label:"Calendar"  },
  { id:"chores",   icon:CheckSquare, label:"Chores"    },
  { id:"lists",    icon:ShoppingCart,label:"Lists"     },
  { id:"meals",    icon:Utensils,    label:"Meal Planner" },
  { id:"wallet",   icon:Wallet,      label:"Wallet"    },
  { id:"goals",    icon:Target,      label:"Goals"     },
  { id:"budget",   icon:BarChart2,   label:"Budget"    },
  { id:"settings", icon:Settings,    label:"Settings"  },
];

/* ── UTILS ──────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, "0");
const ds  = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const now = new Date();
const Y = now.getFullYear(), M = now.getMonth() + 1, D = now.getDate();
const fmtMoney  = n => `$${Math.abs(n).toFixed(2)}`;
/** Strip leading zeros from a money/number input value */
const cleanNum  = v => { const s = String(v).replace(/^0+(\d)/, "$1"); return s === "" ? "" : s; };
const fmtDate   = s => { try { return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" }); } catch(e) { return s; } };
const daysUntil = s => { try { const d = new Date(s + "T00:00:00"), t = new Date(); t.setHours(0,0,0,0); return Math.ceil((d - t) / 86400000); } catch(e) { return 0; } };
const daysInMonth  = (y, m) => new Date(y, m, 0).getDate();
const firstWeekDay = (y, m) => new Date(y, m - 1, 1).getDay();
const freqDays  = a => ({ daily:1, weekly:7, biweekly:14, monthly:30 }[a.frequency] ?? (a.customDays || 7));
const advanceDate = (dateStr, days) => { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + days); return ds(d.getFullYear(), d.getMonth()+1, d.getDate()); };

/* ── CONTEXT ────────────────────────────────────────────────────────────── */
const FamilyCtx = createContext({});
const useFamily = () => useContext(FamilyCtx);


/* ── SHARED UI ──────────────────────────────────────────────────────────── */
const INP = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Fld({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ background: value ? "#6366F1" : "#E5E7EB" }}
      className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
    >
      <span
        style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
      />
    </button>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map(c => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          title={c.label}
          style={{ background: c.bg, outline: value === c.key ? "3px solid #1E1B4B" : "3px solid transparent", outlineOffset: "2px" }}
          className="w-7 h-7 rounded-full transition-all"
        />
      ))}
    </div>
  );
}

function AvatarPicker({ value, photo, onChangeEmoji, onChangePhoto }) {
  const [tab, setTab] = useState(photo ? "photo" : "emoji");
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
      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-0.5 mb-3 w-fit">
        <button
          type="button"
          onClick={() => setTab("emoji")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "emoji" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >😀 Emoji</button>
        <button
          type="button"
          onClick={() => setTab("photo")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "photo" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >📷 Photo</button>
      </div>

      {tab === "emoji" && (
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
          {AVATARS.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => { onChangeEmoji(a); onChangePhoto(null); }}
              className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all flex-shrink-0 ${value === a && !photo ? "bg-indigo-100 ring-2 ring-indigo-500" : "hover:bg-gray-100"}`}
            >{a}</button>
          ))}
        </div>
      )}

      {tab === "photo" && (
        <div className="flex items-center gap-4">
          {photo ? (
            <img src={photo} alt="profile" className="w-16 h-16 rounded-full object-cover border-2 border-indigo-400 flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-2xl flex-shrink-0">📷</div>
          )}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >{photo ? "Change Photo" : "Upload Photo"}</button>
            {photo && (
              <button
                type="button"
                onClick={() => { onChangePhoto(null); setTab("emoji"); }}
                className="px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
              >Remove Photo</button>
            )}
            <p className="text-xs text-gray-400">JPG, PNG, or GIF</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}
    </div>
  );
}

function Pill({ id }) {
  const { members, getColor } = useFamily();
  const m = members.find(x => x.id === id);
  const c = getColor(id);
  if (!m || !c) return null;
  return (
    <span
      style={{ background: c.light, color: c.text, border: `1px solid ${c.bg}30` }}
      className="inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 font-medium"
    >
      {m.photo
        ? <img src={m.photo} alt={m.name} style={{ width:16, height:16, borderRadius:"50%", objectFit:"cover" }} />
        : m.avatar}
      {m.name}
    </span>
  );
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── SIDEBAR ────────────────────────────────────────────────────────────── */
function Sidebar({ active, setActive, collapsed, setCollapsed, pendingCount }) {
  const { members, getColor } = useFamily();
  return (
    <aside
      style={{ background: "#1E1B4B", minHeight: "100dvh", transition: "width .25s" }}
      className={`hidden md:flex flex-col flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <span className="text-2xl">🏠</span>
        {!collapsed && <span className="text-white font-bold text-lg">Family App</span>}
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(n => {
          const Icon = n.icon;
          const isActive = active === n.id;
          const badge = n.id === "calendar" && pendingCount > 0 ? pendingCount : 0;
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              style={isActive ? { background: "rgba(255,255,255,0.15)" } : {}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${isActive ? "text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {badge > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-gray-900 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">{badge}</span>}
              </div>
              {!collapsed && <span className="text-sm font-medium flex-1">{n.label}</span>}
              {!collapsed && badge > 0 && <span className="bg-amber-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">{badge}</span>}
            </button>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="px-4 pb-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">Family</p>
          {members.map(m => {
            const c = getColor(m.id);
            return (
              <div key={m.id} className="flex items-center gap-2 mb-2">
                <div className="flex-shrink-0">
                  <MemberAvatar member={m} size={24} />
                </div>
                <span className="text-white/70 text-sm truncate">{m.name}</span>
                <span style={{ background: c?.bg }} className="ml-auto w-2 h-2 rounded-full flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 text-white/40 hover:text-white border-t border-white/10"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}

/* ── MOBILE BOTTOM NAV ──────────────────────────────────────────────────── */
const NAV_PRIMARY = ["home", "calendar", "chores", "wallet", "meals"];
const HOME_NAV = { id:"home", icon:Home, label:"Home" };

function MobileBottomNav({ active, setActive, pendingCount }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = [HOME_NAV, ...NAV.filter(n => NAV_PRIMARY.slice(1).includes(n.id))];
  const moreItems    = NAV.filter(n => !NAV_PRIMARY.includes(n.id));

  const pick = (id) => { setActive(id); setMoreOpen(false); };

  return (
    <>
      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 flex md:hidden"
        style={{
          background: "#1E1B4B",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
          zIndex: 100,
          width: "100%",
        }}
      >
        {primaryItems.map(n => {
          const Icon = n.icon;
          const isActive = active === n.id && !moreOpen;
          const badge = n.id === "calendar" && pendingCount > 0 ? pendingCount : 0;
          return (
            <button key={n.id} onClick={() => pick(n.id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
              style={{
                color: isActive ? "#A5B4FC" : "rgba(255,255,255,0.45)",
                paddingTop: 8,
                paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
              }}>
              {badge > 0 && (
                <span className="absolute top-1.5 left-1/2 translate-x-1 bg-amber-400 text-gray-900 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none z-10">
                  {badge}
                </span>
              )}
              <Icon size={20} />
              <span className="text-xs font-medium leading-tight">{n.label}</span>
              {isActive && <div className="absolute left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background:"#A5B4FC", bottom:"calc(env(safe-area-inset-bottom) + 2px)" }} />}
            </button>
          );
        })}
        {/* More button */}
        <button onClick={() => setMoreOpen(o => !o)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
          style={{
            color: moreOpen ? "#A5B4FC" : "rgba(255,255,255,0.45)",
            paddingTop: 8,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
          }}>
          <MoreVertical size={20} />
          <span className="text-xs font-medium leading-tight">More</span>
        </button>
      </div>

      {/* More sheet — rendered into body so it sits above the nav bar (z-index 100) */}
      {moreOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.2)", zIndex:150 }}
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="fadeUp"
            style={{
              position:"fixed", bottom:0, left:0, right:0,
              background:"white", borderRadius:"24px 24px 0 0",
              boxShadow:"0 -8px 40px rgba(0,0,0,0.18)",
              paddingBottom:"calc(env(safe-area-inset-bottom) + 16px)",
              zIndex:200,
            }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-5" />
            <div className="grid grid-cols-3 gap-3 px-5 pb-2">
              {moreItems.map(n => {
                const Icon = n.icon;
                const isActive = active === n.id;
                return (
                  <button key={n.id} onClick={() => pick(n.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${isActive ? "bg-indigo-50 text-indigo-600" : "bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"}`}>
                    <Icon size={24} />
                    <span className="text-xs font-semibold text-center leading-tight">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

/* ── CALENDAR ───────────────────────────────────────────────────────────── */
const blankEvt = () => ({ title:"", date:ds(Y,M,D), time:"", members:[], colorMember:"", recurring:"none", countdown:false });

function EventModal({ evt, title, onSave, onClose }) {
  const { members } = useFamily();
  const [f, setF] = useState({ ...blankEvt(), ...evt });
  const set = p => setF(x => ({ ...x, ...p }));
  const toggleM = id => {
    const next = f.members.includes(id) ? f.members.filter(x => x !== id) : [...f.members, id];
    set({ members: next });
  };
  const save = () => { if (!f.title.trim()) return; onSave({ ...f, title: f.title.trim() }); };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Fld label="Title">
          <input value={f.title} onChange={e => set({ title: e.target.value })} className={INP} placeholder="Event name" autoFocus />
        </Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Date"><input type="date" value={f.date} onChange={e => set({ date: e.target.value })} className={INP} /></Fld>
          <Fld label="Time"><input type="time" value={f.time} onChange={e => set({ time: e.target.value })} className={INP} /></Fld>
        </div>
        <Fld label="Members">
          <div className="flex gap-2 flex-wrap mt-1">
            {members.map(m => {
              const sel = f.members.includes(m.id);
              const p = getP(m.colorKey);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleM(m.id)}
                  style={sel ? { background: p.bg, color: "white", borderColor: p.bg } : { borderColor: p.bg, color: p.text }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                >{m.avatar} {m.name}</button>
              );
            })}
          </div>
        </Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Color">
            <select value={f.colorMember} onChange={e => set({ colorMember: e.target.value })} className={INP}>
              <option value="">— pick —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Fld>
          <Fld label="Repeat">
            <select value={f.recurring} onChange={e => set({ recurring: e.target.value })} className={INP}>
              <option value="none">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Fld>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={!!f.countdown} onChange={e => set({ countdown: e.target.checked })} className="rounded" />
          <span className="text-sm text-gray-700">Show countdown banner</span>
        </label>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Save</button>
      </div>
    </Modal>
  );
}

function WeekView({ wdays, evC, setModal }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {wdays.map(d => {
          const isT = d.date === ds(Y, M, D);
          return (
            <div key={d.date} className="text-center py-3 border-r border-gray-100 last:border-0">
              <p className="text-xs text-gray-400 font-medium">{d.label}</p>
              <p className={`text-lg font-bold mt-0.5 w-9 h-9 flex items-center justify-center rounded-full mx-auto ${isT ? "bg-indigo-600 text-white" : "text-gray-700"}`}>{d.num}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-64">
        {wdays.map(d => (
          <div key={d.date} className="border-r border-gray-100 last:border-0 p-2 space-y-1">
            {d.evts.map(ev => {
              const c = evC(ev);
              return (
                <div
                  key={ev.id}
                  style={{ background: c.light, borderLeft: `3px solid ${c.bg}` }}
                  onClick={() => setModal({ mode:"edit", evt:ev })}
                  className="text-xs p-1.5 rounded font-medium text-gray-700 cursor-pointer hover:opacity-80"
                >
                  {ev.time && <span className="text-gray-400 block">{ev.time}</span>}
                  <span className="block truncate">{ev.title}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarModule({ events, setEvents, pendingRequests, setPendingRequests }) {
  const { members, getColor } = useFamily();
  const [view, setView] = useState("month");
  const [cur, setCur] = useState(new Date());
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState("all");

  const cy = cur.getFullYear(), cm = cur.getMonth() + 1;
  const dim = daysInMonth(cy, cm), fd = firstWeekDay(cy, cm);
  const filtered = filter === "all" ? events : events.filter(e => e.members.includes(filter));
  const evC = ev => getColor(ev.colorMember) || { bg:"#6366F1", light:"#EEF2FF", text:"#6366F1" };

  const ws = new Date(cur);
  ws.setDate(ws.getDate() - ws.getDay());
  const wdays = Array.from({ length:7 }, (_, i) => {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    const dstr = ds(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return { date:dstr, label:DSHORT[i], num:d.getDate(), evts:filtered.filter(e => e.date === dstr) };
  });

  const countdowns = events.filter(e => e.countdown && daysUntil(e.date) > 0).slice(0, 3);
  const agenda = Array.from({ length:7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const dstr = ds(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
    return { date:dstr, label, evts:filtered.filter(e => e.date === dstr) };
  });

  const saveEvt = form => {
    if (modal?.mode === "edit") setEvents(prev => prev.map(e => e.id === form.id ? form : e));
    else setEvents(prev => [...prev, { ...form, id:uid() }]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Family Calendar"
        subtitle={`${MONTHS[cm - 1]} ${cy}`}
        action={
          <button onClick={() => setModal({ mode:"add" })} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Add Event
          </button>
        }
      />

      {countdowns.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {countdowns.map(e => {
            const c = evC(e);
            return (
              <div key={e.id} style={{ borderLeft:`4px solid ${c.bg}`, background:c.light }} className="flex-1 min-w-36 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Countdown</p>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{e.title}</p>
                <p style={{ color:c.text }} className="text-2xl font-extrabold">{daysUntil(e.date)}<span className="text-sm font-normal text-gray-500 ml-1">days</span></p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {["month","week","agenda"].map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? "bg-white shadow text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>{v}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${filter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}>All</button>
          {members.map(m => {
            const c = getColor(m.id);
            return (
              <button key={m.id} onClick={() => setFilter(filter === m.id ? "all" : m.id)}
                style={filter === m.id ? { background:c?.bg, color:"white", borderColor:c?.bg } : { borderColor:c?.bg+"40", color:c?.text }}
                className="text-xs px-3 py-1.5 rounded-full font-medium border transition-all"
              >{m.avatar} {m.name}</button>
            );
          })}
        </div>
        {view !== "agenda" && (
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setCur(new Date(cy, cur.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronLeft size={16} /></button>
            <span className="font-semibold text-gray-700 min-w-36 text-center">{MONTHS[cm - 1]} {cy}</span>
            <button onClick={() => setCur(new Date(cy, cur.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {view === "month" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DSHORT.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-3">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length:fd }).map((_, i) => <div key={`e${i}`} className="min-h-24 border-r border-b border-gray-50 bg-gray-50/50" />)}
            {Array.from({ length:dim }, (_, i) => {
              const day = i + 1;
              const dstr = ds(cy, cm, day);
              const evts = filtered.filter(e => e.date === dstr);
              const isT = cy === Y && cm === M && day === D;
              return (
                <div key={day} className="min-h-24 border-r border-b border-gray-50 p-1.5 hover:bg-blue-50/30">
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isT ? "bg-indigo-600 text-white" : "text-gray-600"}`}>{day}</div>
                  <div className="space-y-0.5">
                    {evts.slice(0, 3).map(ev => {
                      const c = evC(ev);
                      return (
                        <div key={ev.id} style={{ background:c.bg, color:"white" }}
                          onClick={() => setModal({ mode:"edit", evt:ev })}
                          className="text-xs px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80"
                        >
                          {ev.time && <span className="opacity-75 mr-1">{ev.time}</span>}{ev.title}
                        </div>
                      );
                    })}
                    {evts.length > 3 && <div className="text-xs text-gray-400 pl-1">+{evts.length - 3} more</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "week" && <WeekView wdays={wdays} evC={evC} setModal={setModal} />}

      {view === "agenda" && (
        <div className="space-y-4">
          {agenda.map(day => (
            <div key={day.date}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{day.label}</p>
              {day.evts.length === 0
                ? <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-400 text-center">No events</div>
                : (
                  <div className="space-y-2">
                    {day.evts.map(ev => {
                      const c = evC(ev);
                      return (
                        <div key={ev.id} style={{ borderLeft:`4px solid ${c.bg}` }} className="bg-white rounded-xl border border-gray-100 p-3 flex items-start gap-3 group">
                          <div className="flex-1">
                            {ev.time && <span className="text-xs text-gray-400 font-medium">{ev.time}</span>}
                            <p className="font-semibold text-gray-800 text-sm">{ev.title}</p>
                            <div className="flex gap-1 mt-1 flex-wrap">{ev.members.map(mid => <Pill key={mid} id={mid} />)}</div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal({ mode:"edit", evt:ev })} className="p-1 text-gray-400 hover:text-indigo-500"><Edit3 size={13} /></button>
                            <button onClick={() => setEvents(prev => prev.filter(e => e.id !== ev.id))} className="p-1 text-gray-400 hover:text-red-400"><X size={13} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          ))}
        </div>
      )}

      {/* ── Kid Event Requests ── */}
      {pendingRequests && pendingRequests.filter(r => r.status === "pending").length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📬</span>
            <h3 className="font-bold text-gray-800">Kid Event Requests</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.filter(r => r.status === "pending").length} pending
            </span>
          </div>
          <div className="space-y-3">
            {pendingRequests.filter(r => r.status === "pending").map(req => {
              const rideAdult = req.rideAdultId ? members.find(m => m.id === req.rideAdultId) : null;
              const TRANSPORT_LABEL = { walk:"🚶 Walking", ride:"🚗 Needs a ride", bus:"🚌 Bus", bike:"🚲 Biking", other:"✏️ Other" };
              return (
              <div key={req.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{req.kidAvatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{req.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.kidName} · {req.date}{req.time ? ` at ${req.time}` : ""}
                  </p>
                  {req.location && <p className="text-xs text-gray-600 mt-1">📍 {req.location}</p>}
                  {req.transport && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {TRANSPORT_LABEL[req.transport] || req.transport}
                      {rideAdult && <span className="ml-1 font-semibold text-amber-700"> — asking {rideAdult.avatar} {rideAdult.name}</span>}
                    </p>
                  )}
                  {req.note && <p className="text-xs text-gray-600 mt-1 italic">"{req.note}"</p>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEvents(prev => [...prev, {
                        id: uid(),
                        title: req.title,
                        date: req.date,
                        time: req.time || "",
                        notes: req.note || "",
                        location: req.location || "",
                        members: [req.kidId, ...(req.rideAdultId ? [req.rideAdultId] : [])],
                        colorMember: req.kidId,
                        countdown: false,
                      }]);
                      setPendingRequests(prev => prev.map(r => r.id === req.id ? { ...r, status:"approved" } : r));
                    }}
                    className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 transition-colors"
                  >✓ Approve</button>
                  <button
                    onClick={() => setPendingRequests(prev => prev.map(r => r.id === req.id ? { ...r, status:"denied" } : r))}
                    className="px-3 py-1.5 bg-red-100 text-red-600 text-xs font-bold rounded-xl hover:bg-red-200 transition-colors"
                  >✗ Deny</button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <EventModal
          evt={modal.mode === "edit" ? modal.evt : blankEvt()}
          title={modal.mode === "edit" ? "Edit Event" : "New Event"}
          onSave={saveEvt}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ── CHORES ─────────────────────────────────────────────────────────────── */
const blankChore = () => ({ title:"", assignee:"", points:10, reward:1.00, category:"bedroom", recurring:"daily", timesRequired:1 });

function ChoreModal({ chore, title, onSave, onClose }) {
  const { members } = useFamily();
  const kids = members.filter(m => m.role === "child");
  const [f, setF] = useState({ ...blankChore(), ...chore });
  const set = p => setF(x => ({ ...x, ...p }));
  const save = () => { if (!f.title.trim() || !f.assignee) return; onSave({ ...f, title: f.title.trim() }); };
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Fld label="Title"><input value={f.title} onChange={e => set({ title: e.target.value })} className={INP} placeholder="Chore name" autoFocus /></Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Assigned To">
            <select value={f.assignee} onChange={e => set({ assignee: e.target.value })} className={INP}>
              <option value="">— pick —</option>
              {kids.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </Fld>
          <Fld label="Category">
            <select value={f.category} onChange={e => set({ category: e.target.value })} className={INP}>
              {Object.keys(CHORE_CATS).map(k => <option key={k} value={k}>{CHORE_CATS[k]} {k}</option>)}
            </select>
          </Fld>
          <Fld label="Points"><input type="number" value={f.points || ""} onChange={e => set({ points: +e.target.value })} onFocus={e => e.target.select()} className={INP} /></Fld>
          <Fld label="Reward ($)"><input type="number" step="0.25" value={f.reward || ""} onChange={e => set({ reward: +e.target.value })} onFocus={e => e.target.select()} className={INP} /></Fld>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Repeat">
            <select value={f.recurring} onChange={e => set({ recurring: e.target.value })} className={INP}>
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </Fld>
          <Fld label="Times to complete">
            <input type="number" min="1" max="20" value={f.timesRequired || 1} onFocus={e => e.target.select()}
              onChange={e => set({ timesRequired: Math.max(1, +e.target.value || 1) })} className={INP} />
          </Fld>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600">Save</button>
      </div>
    </Modal>
  );
}

function ChoresModule({ chores, setChores, wallets, setWallets }) {
  const { members, getColor } = useFamily();
  const kids = members.filter(m => m.role === "child");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null);

  const shown = filter === "all" ? chores : chores.filter(c => c.assignee === filter);
  const stats = kids.map(m => {
    const mine = chores.filter(c => c.assignee === m.id);
    const done = mine.filter(c => c.done);
    return { ...m, total:mine.length, done:done.length, pct:mine.length ? Math.round(done.length / mine.length * 100) : 0, earned:done.reduce((s, c) => s + c.reward, 0) };
  });

  const toggle = id => setChores(prev => prev.map(c => {
    if (c.id !== id) return c;
    const required = c.timesRequired || 1;
    const completions = c.completions || 0;
    if (completions < required) {
      // Add one completion; pay reward each time
      const newCount = completions + 1;
      setWallets(w => ({
        ...w,
        [c.assignee]: {
          ...w[c.assignee],
          spend: (w[c.assignee]?.spend || 0) + c.reward,
          history: [...(w[c.assignee]?.history || []), { date:ds(Y,M,D), amount:c.reward, type:"chore", desc:`Chore: ${c.title}${required > 1 ? ` (${newCount}/${required})` : ""}` }],
        },
      }));
      return { ...c, completions: newCount, done: newCount >= required };
    } else {
      // Undo — reset completions
      return { ...c, completions: 0, done: false };
    }
  }));

  const saveChore = form => {
    if (modal?.mode === "edit") setChores(prev => prev.map(c => c.id === form.id ? { ...form, done:c.done } : c));
    else setChores(prev => [...prev, { ...form, id:uid(), done:false }]);
    setModal(null);
  };

  return (
    <div>
      <PageHeader
        title="Chore Chart"
        subtitle="Tasks & rewards"
        action={
          <button onClick={() => setModal({ mode:"add" })} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600">
            <Plus size={16} /> Add Chore
          </button>
        }
      />
      {kids.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stats.map(s => {
            const c = getColor(s.id);
            return (
              <div key={s.id} style={{ borderTop:`3px solid ${c?.bg}` }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{s.avatar}</span>
                  <div><p className="font-bold text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.done}/{s.total} done</p></div>
                  <div className="ml-auto text-right"><p style={{ color:c?.text }} className="font-bold text-sm">{fmtMoney(s.earned)}</p><p className="text-xs text-gray-400">earned</p></div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div style={{ width:`${s.pct}%`, background:c?.bg }} className="h-2 rounded-full transition-all duration-500" /></div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filter === "all" ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 border-gray-200"}`}>All</button>
        {kids.map(m => {
          const c = getColor(m.id);
          return (
            <button key={m.id} onClick={() => setFilter(filter === m.id ? "all" : m.id)}
              style={filter === m.id ? { background:c?.bg, color:"white", borderColor:c?.bg } : {}}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${filter !== m.id ? "bg-white text-gray-600 border-gray-200" : ""}`}
            >{m.avatar} {m.name}</button>
          );
        })}
      </div>
      <div className="grid gap-3">
        {shown.map(chore => {
          const c = getColor(chore.assignee);
          return (
            <div key={chore.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-4 group ${chore.done ? "opacity-60" : ""}`}>
              <button onClick={() => toggle(chore.id)} style={chore.done ? { background:c?.bg, borderColor:c?.bg } : { borderColor:c?.bg }} className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-all">
                {chore.done ? <Check size={14} className="text-white" /> : (chore.timesRequired > 1 && chore.completions > 0) ? <span className="text-xs font-bold" style={{ color:c?.bg }}>{chore.completions}</span> : null}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-400">{CHORE_CATS[chore.category] || "📋"}</span>
                  <span className={`font-semibold text-gray-800 ${chore.done ? "line-through" : ""}`}>{chore.title}</span>
                  {chore.recurring && chore.recurring !== "none" && (
                    <span className="flex items-center gap-0.5 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"><Repeat size={10} /> {chore.recurring}</span>
                  )}
                  {(chore.timesRequired || 1) > 1 && (
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">{chore.completions||0}/{chore.timesRequired}×</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Pill id={chore.assignee} />
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1"><Star size={10} fill="currentColor" /> {chore.points} pts</span>
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1"><DollarSign size={10} /> {fmtMoney(chore.reward)}</span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setModal({ mode:"edit", chore })} className="p-1.5 text-gray-400 hover:text-indigo-500"><Edit3 size={14} /></button>
                <button onClick={() => setChores(prev => prev.filter(c => c.id !== chore.id))} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-center text-gray-400 text-sm py-8">No chores here yet.</p>}
      </div>
      {modal && (
        <ChoreModal
          chore={modal.mode === "edit" ? modal.chore : blankChore()}
          title={modal.mode === "edit" ? "Edit Chore" : "New Chore"}
          onSave={saveChore}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ── LISTS ──────────────────────────────────────────────────────────────── */
function ListsModule({ lists, setLists }) {
  const [activeList, setActiveList] = useState("grocery");
  const [newItem, setNewItem] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editTxt, setEditTxt] = useState("");

  const list = lists.find(l => l.id === activeList);
  const upd = fn => setLists(prev => prev.map(l => l.id === activeList ? fn(l) : l));
  const addItem   = () => { if (!newItem.trim()) return; upd(l => ({ ...l, items:[...l.items, { id:uid(), text:newItem.trim(), done:false }] })); setNewItem(""); };
  const toggleI   = iid => upd(l => ({ ...l, items:l.items.map(i => i.id === iid ? { ...i, done:!i.done } : i) }));
  const removeI   = iid => upd(l => ({ ...l, items:l.items.filter(i => i.id !== iid) }));
  const saveEdit  = iid => { upd(l => ({ ...l, items:l.items.map(i => i.id === iid ? { ...i, text:editTxt } : i) })); setEditId(null); };
  const clearDone = () => upd(l => ({ ...l, items:l.items.filter(i => !i.done) }));
  const addList   = () => { if (!newName.trim()) return; const id = uid(); setLists(prev => [...prev, { id, name:newName.trim(), type:"todo", items:[] }]); setActiveList(id); setShowNew(false); setNewName(""); };
  const rmList    = lid => { setLists(prev => prev.filter(l => l.id !== lid)); if (activeList === lid) setActiveList(lists.find(l => l.id !== lid)?.id || ""); };

  const pending = list?.items.filter(i => !i.done) || [];
  const done    = list?.items.filter(i => i.done) || [];

  return (
    <div>
      <PageHeader title="Shared Lists" subtitle="Groceries, tasks & more" />
      <div className="flex gap-4 flex-wrap lg:flex-nowrap">
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 space-y-1">
            {lists.map(l => (
              <div key={l.id} className={`flex items-center rounded-xl ${activeList === l.id ? "bg-indigo-50" : ""}`}>
                <button onClick={() => setActiveList(l.id)} className={`flex items-center gap-2 flex-1 px-3 py-2.5 text-sm font-medium text-left ${activeList === l.id ? "text-indigo-700" : "text-gray-600 hover:text-gray-800"}`}>
                  {l.type === "grocery" ? <ShoppingCart size={14} /> : <CheckSquare size={14} />}
                  <span className="flex-1 truncate">{l.name}</span>
                  <span className="text-xs text-gray-400">{l.items.filter(i => !i.done).length}</span>
                </button>
                {activeList === l.id && lists.length > 1 && (
                  <button onClick={() => rmList(l.id)} className="pr-2 text-gray-300 hover:text-red-400"><Trash2 size={12} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setShowNew(true)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600">
              <Plus size={14} /> New list
            </button>
          </div>
        </div>
        {list && (
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {list.type === "grocery" ? <ShoppingCart size={18} className="text-indigo-500" /> : <CheckSquare size={18} className="text-indigo-500" />}
                  <h2 className="font-bold text-gray-800">{list.name}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{list.items.length} items</span>
                </div>
                {done.length > 0 && (
                  <button onClick={clearDone} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"><Trash2 size={11} /> Clear {done.length} done</button>
                )}
              </div>
              <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
                <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Add item… (Enter)" />
                <button onClick={addItem} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"><Plus size={16} /></button>
              </div>
              <div className="divide-y divide-gray-50">
                {pending.length === 0 && done.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-sm">List is empty!</div>
                )}
                {[...pending, ...done].map(item => (
                  <div key={item.id} className={`flex items-center gap-3 px-5 py-3 group hover:bg-gray-50/50 ${item.done ? "opacity-50" : ""}`}>
                    <button onClick={() => toggleI(item.id)} className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${item.done ? "bg-indigo-500 border-indigo-500" : "border-gray-300 hover:border-indigo-500"}`}>
                      {item.done && <Check size={11} className="text-white" />}
                    </button>
                    {editId === item.id
                      ? <input value={editTxt} onChange={e => setEditTxt(e.target.value)} autoFocus onBlur={() => saveEdit(item.id)}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                          className="flex-1 border border-indigo-300 rounded-lg px-2 py-0.5 text-sm focus:outline-none" />
                      : <span onClick={() => { setEditId(item.id); setEditTxt(item.text); }} className={`flex-1 text-sm text-gray-700 cursor-text ${item.done ? "line-through" : ""}`}>{item.text}</span>
                    }
                    <button onClick={() => removeI(item.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {showNew && (
        <Modal title="New List" onClose={() => setShowNew(false)}>
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addList()} className={`${INP} mb-4`} placeholder="List name" autoFocus />
          <div className="flex gap-3">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={addList} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Create</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── ALLOWANCE MODAL ────────────────────────────────────────────────────── */
function AllowanceModal({ initial, memberId, memberName, onSave, onClose }) {
  const today = ds(Y, M, D);
  const BLANK = {
    id: uid(), memberId, title:"Allowance", amount:5,
    frequency:"weekly", customDays:7,
    pot:"spend", splitSpend:60, splitSave:30, splitGive:10,
    startDate:today, nextDue:today, enabled:true, lastPaid:null,
  };
  const [f, setF] = useState(initial ? { ...initial } : { ...BLANK });
  const set = p => setF(x => ({ ...x, ...p }));
  const splitTotal = (f.splitSpend||0) + (f.splitSave||0) + (f.splitGive||0);
  const splitValid = f.pot !== "split" || splitTotal === 100;

  const save = () => {
    if (!f.title.trim() || !f.amount || f.amount <= 0 || !splitValid) return;
    onSave({ ...f, nextDue: initial ? f.nextDue : f.startDate });
  };

  return (
    <Modal title={initial ? "Edit Recurring Payment" : `New Recurring Payment — ${memberName}`} onClose={onClose}>
      <div className="space-y-4">
        <Fld label="Payment Name">
          <input value={f.title} onChange={e => set({ title:e.target.value })} className={INP} placeholder="Allowance" autoFocus />
        </Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Amount">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" step="0.50" min="0" value={f.amount} onChange={e => set({ amount:+e.target.value })} className={INP + " pl-7"} />
            </div>
          </Fld>
          <Fld label="Frequency">
            <select value={f.frequency} onChange={e => set({ frequency:e.target.value })} className={INP}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 Weeks</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </Fld>
        </div>
        {f.frequency === "custom" && (
          <Fld label="Repeat every (days)">
            <input type="number" min="1" value={f.customDays} onChange={e => set({ customDays:+e.target.value })} className={INP} />
          </Fld>
        )}
        <Fld label="Deposit to">
          <div className="grid grid-cols-4 gap-2">
            {[...POTS, { key:"split", label:"Split", icon:"🔀" }].map(p => (
              <button key={p.key} type="button" onClick={() => set({ pot:p.key })}
                className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${f.pot===p.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </Fld>
        {f.pot === "split" && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 mb-2">Split — must total 100%</p>
            {POTS.map(p => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="text-sm w-16 flex-shrink-0">{p.icon} {p.label}</span>
                <input type="number" min="0" max="100"
                  value={f[`split${p.label}`] ?? 0}
                  onChange={e => set({ [`split${p.label}`]: +e.target.value })}
                  className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <span className="text-xs text-gray-400">%</span>
              </div>
            ))}
            <p className={`text-xs font-bold mt-1 ${splitTotal===100 ? "text-green-600" : "text-red-500"}`}>
              Total: {splitTotal}% {splitTotal !== 100 && "(must be 100%)"}
            </p>
          </div>
        )}
        {!initial && (
          <Fld label="First payment date">
            <input type="date" value={f.startDate} onChange={e => set({ startDate:e.target.value, nextDue:e.target.value })} className={INP} />
          </Fld>
        )}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700 font-medium">Active</span>
          <Toggle value={f.enabled} onChange={v => set({ enabled:v })} />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={!splitValid}
          className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40">
          {initial ? "Save Changes" : "Create Payment"}
        </button>
      </div>
    </Modal>
  );
}

/* ── WALLET ─────────────────────────────────────────────────────────────── */
function WalletModule({ wallets, setWallets, allowances, setAllowances }) {
  const { members, getColor } = useFamily();
  const kids = members.filter(m => m.role === "child");
  const [selId, setSelId] = useState(() => kids[0]?.id || "");
  const [showBoost, setShowBoost] = useState(false);
  const [bAmt, setBAmt] = useState("5");
  const [bNote, setBNote] = useState("");
  const [bPot, setBPot] = useState("spend");
  const [showTf, setShowTf] = useState(false);
  const [tfAmt, setTfAmt] = useState("");
  const [tfFrom, setTfFrom] = useState("spend");
  const [tfTo, setTfTo] = useState("save");
  const [adjPot, setAdjPot] = useState(null);
  const [adjAmt, setAdjAmt] = useState("");
  const [showAllwModal, setShowAllwModal] = useState(false);
  const [editingAllw, setEditingAllw] = useState(null);

  const sid = kids.find(k => k.id === selId) ? selId : kids[0]?.id || "";
  const w = wallets[sid] || { spend:0, save:0, give:0, history:[] };
  const total = (w.spend || 0) + (w.save || 0) + (w.give || 0);
  const m = members.find(x => x.id === sid);
  const c = getColor(sid);
  const upd = patch => setWallets(prev => ({ ...prev, [sid]: { ...prev[sid], ...patch } }));
  const kidAllowances = (allowances || []).filter(a => a.memberId === sid);

  const boost = () => {
    const a = parseFloat(bAmt) || 0;
    if (a <= 0) return;
    upd({ [bPot]: (w[bPot] || 0) + a, history: [...w.history, { date:ds(Y,M,D), amount:a, type:"boost", desc:bNote || "Parent Boost 🌟" }] });
    setShowBoost(false); setBAmt("5"); setBNote("");
  };
  const xfer = () => {
    const a = parseFloat(tfAmt) || 0;
    if (a <= 0 || tfFrom === tfTo || (w[tfFrom] || 0) < a) return;
    upd({ [tfFrom]: (w[tfFrom] || 0) - a, [tfTo]: (w[tfTo] || 0) + a, history: [...w.history, { date:ds(Y,M,D), amount:0, type:"transfer", desc:`Moved ${fmtMoney(a)} ${tfFrom}→${tfTo}` }] });
    setShowTf(false); setTfAmt("");
  };
  const adj = () => {
    const a = parseFloat(adjAmt) || 0;
    if (a === 0) return;
    upd({ [adjPot]: (w[adjPot] || 0) + a, history: [...w.history, { date:ds(Y,M,D), amount:a, type:"adjust", desc:`Manual adjustment (${adjPot})` }] });
    setAdjPot(null); setAdjAmt("");
  };

  const chartData = useMemo(() => {
    let r = 0;
    return (w.history || []).map(h => ({ date: fmtDate(h.date), balance: +(r += h.amount).toFixed(2) }));
  }, [w.history]);

  if (kids.length === 0) {
    return <div className="text-center py-16 text-gray-400"><Wallet size={48} className="mx-auto mb-3 opacity-30" /><p>Add children in Settings to use the Wallet.</p></div>;
  }

  return (
    <div>
      <PageHeader title="Family Wallet" subtitle="Virtual allowance & pocket money" />
      <div className="flex gap-3 mb-6 flex-wrap">
        {kids.map(kid => {
          const kw = wallets[kid.id] || {};
          const tot = (kw.spend || 0) + (kw.save || 0) + (kw.give || 0);
          const cc = getColor(kid.id);
          return (
            <button key={kid.id} onClick={() => setSelId(kid.id)}
              style={sid === kid.id ? { background:cc?.bg, color:"white", border:`2px solid ${cc?.bg}` } : { border:`2px solid ${cc?.bg}30`, color:cc?.text, background:cc?.light }}
              className="flex-1 min-w-36 rounded-2xl p-4 text-left transition-all hover:opacity-90"
            >
              <div className="flex items-center gap-2 mb-1"><span className="text-xl">{kid.avatar}</span><span className="font-bold">{kid.name}</span></div>
              <p className={`text-xl font-extrabold ${sid === kid.id ? "text-white" : "text-gray-800"}`}>{fmtMoney(tot)}</p>
              <p className={`text-xs ${sid === kid.id ? "text-white/70" : "text-gray-500"}`}>total balance</p>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        {POTS.map(pot => {
          const bal = w[pot.key] || 0;
          const pct = total > 0 ? (bal / total * 100) : 0;
          return (
            <div key={pot.key} style={{ borderTop:`3px solid ${pot.color}` }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="text-xl">{pot.icon}</span><span className="font-bold text-gray-800">{pot.label}</span></div>
                <button onClick={() => { setAdjPot(pot.key); setAdjAmt(""); }} className="text-xs text-gray-400 hover:text-indigo-500 flex items-center gap-1"><Edit3 size={11} /> adjust</button>
              </div>
              <p className="text-3xl font-extrabold text-gray-800">{fmtMoney(bal)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{pot.desc}</p>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5"><div style={{ width:`${pct}%`, background:pot.color }} className="h-1.5 rounded-full transition-all duration-500" /></div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <button onClick={() => setShowBoost(true)} style={{ background:c?.bg }} className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90"><Star size={16} /> Give Boost</button>
        <button onClick={() => setShowTf(true)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200"><ArrowUpCircle size={16} /> Transfer Pots</button>
      </div>
      {/* ── Recurring Payments ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-5">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700 flex items-center gap-2"><Repeat size={15} className="text-indigo-400" /> Recurring Payments</h3>
          <button onClick={() => { setEditingAllw(null); setShowAllwModal(true); }}
            style={{ background:c?.bg }} className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:opacity-90">
            <Plus size={13} /> Add
          </button>
        </div>
        <div>
          {kidAllowances.length === 0 && (
            <div className="py-7 text-center text-gray-400 text-sm">No recurring payments yet — tap <strong>Add</strong> to create one</div>
          )}
          {kidAllowances.map(a => {
            const due = daysUntil(a.nextDue);
            return (
              <div key={a.id} className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 ${!a.enabled ? "opacity-50" : ""}`}>
                <div className="text-xl">💰</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-400">
                    {FREQ_LABELS[a.frequency]}{a.frequency==="custom" ? ` (every ${a.customDays}d)` : ""} ·{" "}
                    {a.pot==="split" ? `Split (${a.splitSpend}/${a.splitSave}/${a.splitGive}%)` : POTS.find(p=>p.key===a.pot)?.icon+" "+POTS.find(p=>p.key===a.pot)?.label}
                  </p>
                  <p className={`text-xs mt-0.5 font-medium ${due<=0?"text-amber-600":"text-indigo-500"}`}>
                    {due <= 0 ? "⏰ Due now — will process on next load" : `Next: ${fmtDate(a.nextDue)} (in ${due}d)`}
                  </p>
                </div>
                <div className="font-extrabold text-gray-800 text-sm mr-1">{fmtMoney(a.amount)}</div>
                <Toggle value={a.enabled} onChange={v => setAllowances(prev => prev.map(x => x.id===a.id ? {...x, enabled:v} : x))} />
                <button onClick={() => { setEditingAllw(a); setShowAllwModal(true); }} className="text-gray-400 hover:text-indigo-500 p-1"><Edit3 size={14}/></button>
                <button onClick={() => setAllowances(prev => prev.filter(x => x.id!==a.id))} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
              </div>
            );
          })}
        </div>
      </div>
      {chartData.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={16} /> Balance History</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [`$${v}`, "Balance"]} />
              <Line type="monotone" dataKey="balance" stroke={c?.bg || "#6366F1"} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Transaction History</h3></div>
        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {[...(w.history || [])].reverse().map((h, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="text-lg">{TX_ICON[h.type] || "💲"}</span>
              <div className="flex-1"><p className="text-sm font-medium text-gray-700">{h.desc}</p><p className="text-xs text-gray-400">{fmtDate(h.date)}</p></div>
              <span style={{ color: h.amount >= 0 ? "#16A34A" : "#EF4444" }} className="font-bold text-sm">{h.amount !== 0 ? (h.amount >= 0 ? "+" : "") + fmtMoney(h.amount) : "—"}</span>
            </div>
          ))}
          {(w.history || []).length === 0 && <div className="py-8 text-center text-gray-400 text-sm">No transactions yet</div>}
        </div>
      </div>
      {showBoost && (
        <Modal title={`Give ${m?.name} a Boost ⭐`} onClose={() => setShowBoost(false)}>
          <div className="space-y-3">
            <Fld label="Amount"><input type="number" step="0.50" value={bAmt} onChange={e => setBAmt(e.target.value)} className={INP} /></Fld>
            <Fld label="Pot"><select value={bPot} onChange={e => setBPot(e.target.value)} className={INP}>{POTS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}</select></Fld>
            <Fld label="Note"><input value={bNote} onChange={e => setBNote(e.target.value)} className={INP} placeholder="Great job! 🌟" /></Fld>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowBoost(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={boost} style={{ background:c?.bg }} className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-90">Give Boost</button>
          </div>
        </Modal>
      )}
      {showTf && (
        <Modal title="Transfer Between Pots" onClose={() => setShowTf(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Fld label="From"><select value={tfFrom} onChange={e => setTfFrom(e.target.value)} className={INP}>{POTS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}</select></Fld>
              <Fld label="To"><select value={tfTo} onChange={e => setTfTo(e.target.value)} className={INP}>{POTS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}</select></Fld>
            </div>
            <Fld label="Amount"><input type="number" step="0.50" value={tfAmt} onChange={e => setTfAmt(e.target.value)} className={INP} /></Fld>
            <p className="text-xs text-gray-400">Available in {tfFrom}: {fmtMoney(w[tfFrom] || 0)}</p>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowTf(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={xfer} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Transfer</button>
          </div>
        </Modal>
      )}
      {adjPot && (
        <Modal title={`Adjust ${adjPot} pot for ${m?.name}`} onClose={() => setAdjPot(null)}>
          <p className="text-sm text-gray-500 mb-4">Positive to add, negative to remove (e.g. -5).</p>
          <Fld label="Amount"><input type="number" step="0.50" value={adjAmt} onChange={e => setAdjAmt(e.target.value)} className={INP} placeholder="e.g. 10 or -3" autoFocus /></Fld>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setAdjPot(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={adj} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Apply</button>
          </div>
        </Modal>
      )}
      {showAllwModal && (
        <AllowanceModal
          initial={editingAllw}
          memberId={sid}
          memberName={m?.name}
          onSave={a => {
            if (editingAllw) {
              setAllowances(prev => prev.map(x => x.id===a.id ? a : x));
            } else {
              setAllowances(prev => [...prev, a]);
            }
            setShowAllwModal(false);
            setEditingAllw(null);
          }}
          onClose={() => { setShowAllwModal(false); setEditingAllw(null); }}
        />
      )}
    </div>
  );
}

/* ── GOALS ──────────────────────────────────────────────────────────────── */
function GoalForm({ kids, initialData, mode, onSave, onClose }) {
  const BLANK = { owner:kids[0]?.id || "", title:"", target:50, emoji:"🎯", current:0 };
  const [f, setF] = useState({ ...BLANK, ...initialData });
  const set = p => setF(x => ({ ...x, ...p }));
  const save = () => { if (!f.title.trim() || !f.owner) return; onSave({ ...f, id: f.id || uid() }); };
  return (
    <div className="space-y-4">
      <Fld label="For">
        <select value={f.owner} onChange={e => set({ owner: e.target.value })} className={INP}>
          {kids.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Fld>
      <Fld label="Goal Name">
        <input value={f.title} onChange={e => set({ title: e.target.value })} className={INP} placeholder="e.g. New bike" autoFocus />
      </Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="Target ($)"><input type="number" value={f.target} onChange={e => set({ target: +e.target.value })} className={INP} /></Fld>
        <Fld label="Currently saved ($)"><input type="number" value={f.current} onChange={e => set({ current: +e.target.value })} className={INP} /></Fld>
      </div>
      <Fld label="Emoji">
        <div className="flex flex-wrap gap-2 mt-1">
          {GOAL_EMOJIS.map(e => (
            <button key={e} onClick={() => set({ emoji: e })} className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${f.emoji === e ? "bg-green-100 ring-2 ring-green-500" : "hover:bg-gray-100"}`}>{e}</button>
          ))}
        </div>
      </Fld>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">{mode === "edit" ? "Save Changes" : "Create Goal"}</button>
      </div>
    </div>
  );
}

function GoalsModule({ goals, setGoals, wallets, setWallets }) {
  const { members, getColor } = useFamily();
  const kids = members.filter(m => m.role === "child");
  const [modal, setModal] = useState(null);

  const handleSave = form => {
    if (modal?.mode === "edit") setGoals(prev => prev.map(x => x.id === form.id ? form : x));
    else setGoals(prev => [...prev, form]);
    setModal(null);
  };

  const contribute = (goal, amount) => {
    const w = wallets[goal.owner];
    if (!w || w.save < amount) return;
    setWallets(prev => ({
      ...prev,
      [goal.owner]: {
        ...prev[goal.owner],
        save: prev[goal.owner].save - amount,
        history: [...prev[goal.owner].history, { date:ds(Y,M,D), amount:-amount, type:"save", desc:`Saved for: ${goal.title}` }],
      },
    }));
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, current: Math.min(g.current + amount, g.target) } : g));
  };

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Dream it. Save for it."
        action={
          <button onClick={() => setModal({ mode:"add" })} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">
            <Plus size={16} /> New Goal
          </button>
        }
      />
      {kids.map(kid => {
        const mine = goals.filter(g => g.owner === kid.id);
        if (mine.length === 0) return null;
        const c = getColor(kid.id);
        const w = wallets[kid.id] || {};
        return (
          <div key={kid.id} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{kid.avatar}</span>
              <h2 className="font-bold text-gray-800">{kid.name}'s Goals</h2>
              <span style={{ color:c?.text, background:c?.light }} className="text-xs px-2 py-0.5 rounded-full font-medium">{fmtMoney(w.save || 0)} in Save pot</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mine.map(goal => {
                const pct = goal.target > 0 ? Math.min(goal.current / goal.target * 100, 100) : 0;
                const done = pct >= 100;
                return (
                  <div key={goal.id} className={`bg-white rounded-2xl border shadow-sm p-5 group relative ${done ? "border-green-300 bg-green-50/30" : ""}`}>
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal({ mode:"edit", goal })} className="p-1.5 text-gray-400 hover:text-indigo-500"><Edit3 size={13} /></button>
                      <button onClick={() => setGoals(prev => prev.filter(g => g.id !== goal.id))} className="p-1.5 text-gray-400 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                    <div className="mb-3"><span className="text-3xl block mb-1">{goal.emoji}</span><h3 className="font-bold text-gray-800">{goal.title}</h3></div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-400">{fmtMoney(goal.current)} saved</span>
                        <span className="text-xs font-semibold text-gray-600">{fmtMoney(goal.target)} goal</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3"><div style={{ width:`${pct}%`, background:done ? "#16A34A" : c?.bg }} className="h-3 rounded-full transition-all duration-700" /></div>
                      <p className="text-right text-xs text-gray-400 mt-1">{Math.round(pct)}%</p>
                    </div>
                    {done
                      ? <p className="text-center text-sm font-bold text-green-600">🎉 Goal reached!</p>
                      : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{fmtMoney(Math.max(goal.target - goal.current, 0))} to go</span>
                          <div className="flex gap-1.5">
                            {[1, 5, 10].map(a => (
                              <button key={a} onClick={() => contribute(goal, a)} disabled={(w.save || 0) < a}
                                style={{ borderColor:c?.bg, color:c?.text }} className="text-xs px-2.5 py-1 rounded-lg border font-medium disabled:opacity-30 hover:opacity-80">+${a}</button>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {goals.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Target size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No goals yet</p>
          <p className="text-sm mt-1">Add a goal to start saving!</p>
        </div>
      )}
      {modal && (
        <Modal title={modal.mode === "edit" ? "Edit Goal" : "New Savings Goal"} onClose={() => setModal(null)}>
          <GoalForm kids={kids} initialData={modal.mode === "edit" ? modal.goal : {}} mode={modal.mode} onSave={handleSave} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

/* ── BUDGET ─────────────────────────────────────────────────────────────── */
function BudgetModule({ budget, setBudget }) {
  const totB = budget.reduce((s, b) => s + b.budgeted, 0);
  const totS = budget.reduce((s, b) => s + b.spent, 0);
  const [editId, setEditId] = useState(null);
  const [ef, setEf] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [nc, setNc] = useState({ cat:"", budgeted:100, spent:0 });

  const summaryCards = [
    { label:"Monthly Budget", value:totB,      sub:"total allocated",                         color:"#6366F1", icon:"📊" },
    { label:"Spent So Far",   value:totS,      sub:`${totB ? Math.round(totS/totB*100) : 0}% of budget`, color:"#EA580C", icon:"💳" },
    { label:"Remaining",      value:totB-totS, sub:"left to spend",                           color:(totB-totS) >= 0 ? "#16A34A" : "#EF4444", icon:(totB-totS) >= 0 ? "✅" : "⚠️" },
  ];

  return (
    <div>
      <PageHeader
        title="Family Budget"
        subtitle={`${MONTHS[M - 1]} ${Y} · Household finances`}
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
            <Plus size={16} /> Add Category
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        {summaryCards.map(s => (
          <div key={s.label} style={{ borderTop:`3px solid ${s.color}` }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2"><span className="text-lg">{s.icon}</span><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p></div>
            <p style={{ color:s.color }} className="text-3xl font-extrabold">{fmtMoney(s.value)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h3 className="font-bold text-gray-700 mb-4">Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={budget} margin={{ top:0, right:0, bottom:0, left:0 }}>
            <XAxis dataKey="cat" tick={{ fontSize:10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={(v, n) => [`$${v}`, n === "budgeted" ? "Budgeted" : "Spent"]} />
            <Bar dataKey="budgeted" name="budgeted" fill="#E0E7FF" radius={[4,4,0,0]} />
            <Bar dataKey="spent" name="spent" radius={[4,4,0,0]}>
              {budget.map((_, i) => <Cell key={i} fill={BCOLORS[i % BCOLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">Categories <span className="text-xs text-gray-400 font-normal ml-1">— click a row to edit</span></h3>
        </div>
        <div className="divide-y divide-gray-50">
          {budget.map((b, i) => {
            const pct = Math.min(b.spent / b.budgeted * 100, 100);
            const over = b.spent > b.budgeted;
            const color = BCOLORS[i % BCOLORS.length];
            if (editId === b.id) {
              return (
                <div key={b.id} className="px-5 py-4 bg-indigo-50/50">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input value={ef.cat} onChange={e => setEf(f => ({ ...f, cat: e.target.value }))} autoFocus className="border border-indigo-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none" placeholder="Category" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Budget: $</span>
                      <input type="number" value={ef.budgeted} onChange={e => setEf(f => ({ ...f, budgeted: e.target.value }))} className="border border-indigo-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">Spent: $</span>
                      <input type="number" value={ef.spent} onChange={e => setEf(f => ({ ...f, spent: e.target.value }))} className="border border-indigo-300 rounded-lg px-2 py-1.5 text-sm w-24 focus:outline-none" />
                    </div>
                    <button
                      onClick={() => { setBudget(prev => prev.map(x => x.id === editId ? { ...x, ...ef, budgeted:+ef.budgeted, spent:+ef.spent } : x)); setEditId(null); }}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-indigo-700"
                    ><Check size={13} /> Save</button>
                    <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 px-2 py-1.5"><X size={13} /></button>
                    <button onClick={() => { setBudget(prev => prev.filter(x => x.id !== b.id)); setEditId(null); }} className="ml-auto text-red-400 hover:text-red-600 flex items-center gap-1 text-xs"><Trash2 size={12} /> Delete</button>
                  </div>
                </div>
              );
            }
            return (
              <div key={b.id} onClick={() => { setEditId(b.id); setEf({ cat:b.cat, budgeted:b.budgeted, spent:b.spent }); }} className="px-5 py-4 cursor-pointer hover:bg-gray-50/80 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:color }} />
                    <span className="font-medium text-gray-700 text-sm">{b.cat}</span>
                    {over && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Over</span>}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${over ? "text-red-500" : "text-gray-700"}`}>{fmtMoney(b.spent)}</span>
                    <span className="text-xs text-gray-400 ml-1">/ {fmtMoney(b.budgeted)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2"><div style={{ width:`${pct}%`, background:over ? "#EF4444" : color }} className="h-2 rounded-full transition-all duration-500" /></div>
              </div>
            );
          })}
        </div>
      </div>
      {showAdd && (
        <Modal title="Add Budget Category" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <Fld label="Category Name"><input value={nc.cat} onChange={e => setNc(n => ({ ...n, cat: e.target.value }))} className={INP} placeholder="e.g. Subscriptions" autoFocus /></Fld>
            <div className="grid grid-cols-2 gap-3">
              <Fld label="Budget ($)"><input type="number" value={nc.budgeted} onChange={e => setNc(n => ({ ...n, budgeted: e.target.value }))} className={INP} /></Fld>
              <Fld label="Spent ($)"><input type="number" value={nc.spent} onChange={e => setNc(n => ({ ...n, spent: e.target.value }))} className={INP} /></Fld>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={() => { if (!nc.cat.trim()) return; setBudget(prev => [...prev, { ...nc, id:uid(), budgeted:+nc.budgeted, spent:+nc.spent }]); setShowAdd(false); setNc({ cat:"", budgeted:100, spent:0 }); }}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >Add</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── SETTINGS ───────────────────────────────────────────────────────────── */
function MemberModal({ member, onSave, onClose }) {
  const blank = { id:uid(), name:"", role:"child", pin:"", familyName:"", avatar:"👧", photo:null, colorKey:"teal", age:"" };
  const [f, setF] = useState({ ...blank, ...(member || {}) });
  const set = p => setF(x => ({ ...x, ...p }));
  const p = getP(f.colorKey);
  const save = () => { if (!f.name.trim()) return; onSave({ ...f, name:f.name.trim(), age:f.age ? +f.age : undefined }); };
  return (
    <Modal title={member ? "Edit Member" : "Add Family Member"} onClose={onClose}>
      <div className="space-y-4">
        {/* Preview */}
        <div className="flex items-center gap-4 py-2">
          <MemberAvatar member={f} size={56} />
          <div>
            <p className="font-semibold text-gray-800">{f.name || "Preview"}</p>
            <p className="text-xs text-gray-400 capitalize">{f.role}</p>
          </div>
        </div>
        <Fld label="Name"><input value={f.name} onChange={e => set({ name: e.target.value })} className={INP} placeholder="First name" autoFocus /></Fld>
        <Fld label="Role">
          <div className="flex gap-3 mt-1">
            {["parent","child"].map(r => (
              <button key={r} onClick={() => set({ role: r })}
                style={f.role === r ? { background:"#6366F1", color:"white", borderColor:"#6366F1" } : {}}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${f.role !== r ? "border-gray-200 text-gray-600 hover:bg-gray-50" : ""}`}
              >{r}</button>
            ))}
          </div>
        </Fld>
        {f.role === "child" && (
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Age"><input type="number" value={f.age || ""} onChange={e => set({ age: e.target.value })} className={INP} placeholder="e.g. 9" /></Fld>
            <Fld label="PIN (4 digits)"><input type="text" maxLength={4} value={f.pin} onChange={e => set({ pin: e.target.value.replace(/\D/g,"").slice(0,4) })} className={INP} placeholder="1234" /></Fld>
          </div>
        )}
        {f.role === "parent" && (
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Family Name"><input value={f.familyName || ""} onChange={e => set({ familyName: e.target.value })} className={INP} placeholder="e.g. Gibbs" /></Fld>
            <Fld label="Guardian PIN"><input type="text" maxLength={4} value={f.pin} onChange={e => set({ pin: e.target.value.replace(/\D/g,"").slice(0,4) })} className={INP} placeholder="4 digits" /></Fld>
          </div>
        )}
        <Fld label="Profile Picture">
          <div className="mt-1">
            <AvatarPicker
              value={f.avatar}
              photo={f.photo}
              onChangeEmoji={v => set({ avatar: v })}
              onChangePhoto={v => set({ photo: v })}
            />
          </div>
        </Fld>
        <Fld label="Color"><div className="mt-1.5"><ColorPicker value={f.colorKey} onChange={v => set({ colorKey: v })} /></div></Fld>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={save} style={{ background:p.bg }} className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium hover:opacity-90">Save</button>
      </div>
    </Modal>
  );
}

function SettingsModule({ members, setMembers, wallets, setWallets, onReset, issueReports = [], setIssueReports }) {
  const { getColor } = useFamily();
  const { account }  = useAuth();
  const [mm,   setMm]   = useState(null);
  const [delC, setDelC] = useState(null);
  const [pLock, setPLock] = useState(true);
  const [notifs, setNotifs] = useState(true);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    try {
      const dataKey = getDataKey(account?.email);
      const rawData = localStorage.getItem(dataKey) || localStorage.getItem(LS_DATA);
      const backup = {
        version:    1,
        exportedAt: new Date().toISOString(),
        account:    account || {},
        data:       JSON.parse(rawData) || {},
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `family-hub-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  const saveMember = form => {
    if (mm === "add") {
      setMembers(prev => [...prev, form]);
      if (form.role === "child") setWallets(prev => ({ ...prev, [form.id]: { spend:0, save:0, give:0, allowance:0, history:[] } }));
    } else {
      setMembers(prev => prev.map(m => m.id === form.id ? form : m));
    }
    setMm(null);
  };
  const delMember = id => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setWallets(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDelC(null);
  };

  const prefRows = [
    { val:pLock, set:setPLock, label:"Parental Lock",    desc:"Prevent children from editing events or finances", icon:<Lock size={16} />  },
    { val:notifs, set:setNotifs, label:"Reminders",      desc:"Event and chore reminders",                        icon:<Bell size={16} />  },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Family preferences & controls" />
      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-indigo-600" /> Family Members</h2>
            <button onClick={() => setMm("add")} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"><UserPlus size={15} /> Add Member</button>
          </div>
          <div className="space-y-3">
            {members.map(m => {
              const c = getColor(m.id);
              return (
                <div key={m.id} style={{ borderLeft:`4px solid ${c?.bg}`, background:c?.light }} className="flex items-center gap-3 px-4 py-3 rounded-xl group">
                  <MemberAvatar member={m} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{m.role}{m.age ? ` · Age ${m.age}` : ""}{m.role === "child" && m.pin ? ` · PIN: ${m.pin}` : ""}</p>
                  </div>
                  <span style={{ color:c?.text, background:c?.bg+"25" }} className="text-xs font-semibold px-2 py-0.5 rounded-full">{c?.label}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setMm(m)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Edit3 size={14} /></button>
                    <button onClick={() => setDelC(m)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Settings size={18} className="text-gray-500" /> Preferences</h2>
          <div className="space-y-5">
            {prefRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{row.icon}</span>
                  <div><p className="font-medium text-gray-700 text-sm">{row.label}</p><p className="text-xs text-gray-400">{row.desc}</p></div>
                </div>
                <Toggle value={row.val} onChange={row.set} />
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
          className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${saved ? "bg-green-100 text-green-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
        >
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
        </button>

        {/* Issue Reports inbox */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              🚩 Family Reports
              {issueReports.filter(r => !r.read).length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {issueReports.filter(r => !r.read).length} new
                </span>
              )}
            </h2>
            {issueReports.length > 0 && (
              <button
                onClick={() => setIssueReports(prev => prev.map(r => ({ ...r, read: true })))}
                className="text-xs text-indigo-500 hover:underline"
              >Mark all read</button>
            )}
          </div>
          {issueReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No reports yet. Family members can submit feedback using the 🚩 button.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {issueReports.map(r => (
                <div
                  key={r.id}
                  onClick={() => setIssueReports(prev => prev.map(x => x.id === r.id ? { ...x, read: true } : x))}
                  className={`rounded-xl p-3 border cursor-pointer transition-all ${r.read ? "border-gray-100 bg-gray-50" : "border-indigo-200 bg-indigo-50"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{r.reporter}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{r.date}</span>
                      {!r.read && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-indigo-600 mb-1">{r.type}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.message}</p>
                  <button
                    onClick={e => { e.stopPropagation(); setIssueReports(prev => prev.filter(x => x.id !== r.id)); }}
                    className="mt-2 text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backup & Restore */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-1 flex items-center gap-2">💾 Backup & Restore</h2>
          <p className="text-xs text-gray-500 mb-4">Download a backup of all your family data. Use it to sign in on a new device without losing anything.</p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            ⬇️ Export Family Data
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h2 className="font-bold text-red-700 mb-1 flex items-center gap-2"><AlertTriangle size={16} /> Danger Zone</h2>
          <p className="text-xs text-red-500 mb-4">This will permanently delete all family data, your account, and sign you out. This cannot be undone.</p>
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
          >
            Reset &amp; Start Over
          </button>
        </div>
      </div>
      {mm && <MemberModal member={mm === "add" ? null : mm} onSave={saveMember} onClose={() => setMm(null)} />}
      {delC && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
            <h2 className="text-lg font-bold text-gray-800 mb-1">Remove {delC.name}?</h2>
            <p className="text-sm text-gray-500 mb-5">This will also delete their wallet data. Cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelC(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => delMember(delC.id)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Remove</button>
            </div>
          </div>
        </div>
      )}
      {confirmReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Are you absolutely sure?</h2>
            <p className="text-sm text-gray-500 mb-5">All family data, events, wallets, and your account will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setConfirmReset(false); onReset?.(); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Yes, Reset Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DASHBOARD ──────────────────────────────────────────────────────────── */
function Dashboard({ events, chores, wallets }) {
  const { members, getColor } = useFamily();
  const kids = members.filter(m => m.role === "child");
  const todayEvts = events.filter(e => e.date === ds(Y, M, D));
  const evC = ev => getColor(ev.colorMember) || { bg:"#6366F1", light:"#EEF2FF" };

  return (
    <div>
      <PageHeader
        title="Good morning, family! 👋"
        subtitle={new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" })}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 rounded-2xl shadow-sm p-5" style={{ background:"#EEF2FF", border:"1px solid #C7D2FE" }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color:"#3730A3" }}><Calendar size={16} /> Today's Events</h3>
          {todayEvts.length === 0
            ? <p className="text-sm text-gray-400">Nothing scheduled today 🎉</p>
            : (
              <div className="space-y-2">
                {todayEvts.map(ev => {
                  const c = evC(ev);
                  return (
                    <div key={ev.id} style={{ borderLeft:`3px solid ${c.bg}`, background:c.light }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                      {ev.time && <span className="text-xs text-gray-500 font-medium w-10">{ev.time}</span>}
                      <span className="text-sm font-medium text-gray-700 flex-1">{ev.title}</span>
                      <div className="flex gap-1">{ev.members.map(mid => <span key={mid} className="text-base">{members.find(m => m.id === mid)?.avatar}</span>)}</div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
        <div className="rounded-2xl shadow-sm p-5" style={{ background:"#F0FDF4", border:"1px solid #BBF7D0" }}>
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color:"#166534" }}><CheckSquare size={16} /> Chores</h3>
          <div className="space-y-3">
            {kids.map(kid => {
              const mine = chores.filter(c => c.assignee === kid.id);
              const done = mine.filter(c => c.done);
              const c = getColor(kid.id);
              return (
                <div key={kid.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{kid.avatar} {kid.name}</span>
                    <span className="text-xs text-gray-400">{done.length}/{mine.length}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div style={{ width:mine.length ? `${done.length/mine.length*100}%` : "0%", background:c?.bg }} className="h-2 rounded-full transition-all" /></div>
                </div>
              );
            })}
            {kids.length === 0 && <p className="text-sm text-gray-400">Add children in Settings.</p>}
          </div>
        </div>
      </div>
      {kids.length > 0 && (
        <div className="rounded-2xl shadow-sm p-5" style={{ background:"#FFF7ED", border:"1px solid #FED7AA" }}>
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color:"#9A3412" }}><Wallet size={16} /> Wallet Snapshot</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kids.map(kid => {
              const w = wallets[kid.id] || { spend:0, save:0, give:0 };
              const tot = (w.spend || 0) + (w.save || 0) + (w.give || 0);
              const c = getColor(kid.id);
              return (
                <div key={kid.id} style={{ borderTop:`3px solid ${c?.bg}` }} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-2"><span className="text-xl">{kid.avatar}</span><span className="font-semibold text-gray-700 text-sm">{kid.name}</span></div>
                  <p style={{ color:c?.text }} className="text-2xl font-extrabold">{fmtMoney(tot)}</p>
                  <div className="flex gap-1 mt-2">
                    {[{k:"spend",l:"💸"},{k:"save",l:"🏦"},{k:"give",l:"❤️"}].map(pot => (
                      <div key={pot.k} className="flex-1 text-center">
                        <p className="text-xs">{pot.l}</p>
                        <p className="text-xs font-medium text-gray-600">{fmtMoney(w[pot.k] || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── ANIMATION STYLES ───────────────────────────────────────────────────── */
function AppStyles() {
  return (
    <style>{`
      /* ── Animations ── */
      @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-10px)} 80%{transform:translateX(10px)} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes popIn  { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
      @keyframes coinPop{ 0%{opacity:0;transform:scale(0.5) translateY(0)} 60%{opacity:1;transform:scale(1.3) translateY(-20px)} 100%{opacity:0;transform:scale(1) translateY(-40px)} }
      .shake  { animation: shake  0.45s ease-in-out; }
      .fadeUp { animation: fadeUp 0.3s ease-out; }
      .popIn  { animation: popIn  0.25s ease-out; }
      .coinPop{ animation: coinPop 0.7s ease-out forwards; }

      /* ── iOS / Mobile global fixes ── */
      *, *::before, *::after { box-sizing: border-box; }
      html {
        height: 100%;
        height: -webkit-fill-available;
        overflow: hidden;
        overscroll-behavior: none;
      }
      body {
        height: 100%;
        overflow: hidden;
        overscroll-behavior: none;
        -webkit-tap-highlight-color: transparent;
        -webkit-text-size-adjust: 100%;
      }
      #root {
        min-height: 100dvh;
        min-height: -webkit-fill-available;
        display: flex;
        flex-direction: column;
      }

      /* Prevent iOS zoom on input focus (needs font-size >= 16px) */
      @media (max-width: 768px) {
        input, select, textarea, button { touch-action: manipulation; }
        input, select, textarea { font-size: 16px !important; }
      }

      /* Smooth momentum scrolling on iOS */
      .overflow-auto, .overflow-y-auto, .overflow-x-auto {
        -webkit-overflow-scrolling: touch;
      }

      /* Safe-area utility classes */
      .safe-top    { padding-top:    env(safe-area-inset-top);    }
      .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
      .safe-left   { padding-left:   env(safe-area-inset-left);   }
      .safe-right  { padding-right:  env(safe-area-inset-right);  }
      .mb-safe     { margin-bottom:  env(safe-area-inset-bottom); }

      /* Bottom nav safe area */
      .bottom-nav-height { height: calc(60px + env(safe-area-inset-bottom)); }
      .bottom-nav-pad    { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }

      /* Fill the safe-area gap below bottom nav — must be on html not body
         because body has overflow:hidden which clips body::after in some browsers */
      html::after {
        content: "";
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: env(safe-area-inset-bottom);
        background: #1E1B4B;
        z-index: 99;
        pointer-events: none;
      }
    `}</style>
  );
}

/* ── PIN DOTS ────────────────────────────────────────────────────────────── */
function PinDots({ length }) {
  return (
    <div className="flex gap-4 justify-center my-4">
      {[0,1,2,3].map(i => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${i < length ? "bg-indigo-600 border-indigo-600 scale-110" : "border-gray-300"}`} />
      ))}
    </div>
  );
}

/* ── NUM PAD ─────────────────────────────────────────────────────────────── */
function NumPad({ value, onChange, onSubmit, accentColor }) {
  const bg = accentColor || "#6366F1";
  const keys = [1,2,3,4,5,6,7,8,9,"",0,"⌫"];
  return (
    <div>
      <PinDots length={value.length} />
      <div className="grid grid-cols-3 gap-3 max-w-52 mx-auto">
        {keys.map((k, i) => {
          if (k === "") return <div key={i} />;
          const isBack = k === "⌫";
          return (
            <button key={i}
              onClick={() => { if (isBack) onChange(value.slice(0,-1)); else if (value.length < 4) onChange(value + k); }}
              className={`h-14 rounded-2xl text-lg font-bold transition-all active:scale-95 ${isBack ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
            >{k}</button>
          );
        })}
      </div>
      {value.length === 4 && (
        <button onClick={onSubmit} style={{ background:bg }} className="w-full mt-5 py-3 text-white rounded-2xl text-base font-bold hover:opacity-90 transition-all popIn">
          Unlock ✓
        </button>
      )}
    </div>
  );
}

/* ── ISSUE REPORT MODAL ──────────────────────────────────────────────────── */
const ISSUE_TYPES = [
  { key: "bug",     label: "🐛 App Bug",         desc: "Something isn't working right" },
  { key: "feedback",label: "💬 Feedback",         desc: "General comment or concern" },
  { key: "request", label: "✨ Feature Request",  desc: "Something you'd like added" },
  { key: "other",   label: "📋 Other",            desc: "Anything else" },
];

function IssueReportModal({ reporter, accountEmail, onSubmit, onClose }) {
  const [type,    setType]    = useState("feedback");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);
  const [emailOk, setEmailOk] = useState(null); // null | true | false

  const submit = async () => {
    if (!message.trim()) return;
    setSending(true);
    const date = new Date().toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" });
    const typeLbl = ISSUE_TYPES.find(t => t.key === type)?.label || type;
    const result = await sendIssueReport(accountEmail, {
      reporterName: reporter?.name || "Unknown",
      issueType:    typeLbl,
      message:      message.trim(),
      date,
    });
    onSubmit({ id: Math.random().toString(36).slice(2,9), reporter: reporter?.name || "Unknown",
      type: typeLbl, message: message.trim(), date, read: false });
    setSending(false);
    setEmailOk(result.ok);
    setDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">🚩 Report an Issue</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
        </div>

        {done ? (
          <div className="px-5 py-8 text-center">
            <div className="text-5xl mb-3">{emailOk ? "📬" : "📥"}</div>
            <p className="font-bold text-gray-800 mb-1">{emailOk ? "Report sent!" : "Report saved!"}</p>
            <p className="text-sm text-gray-500">
              {emailOk
                ? `Your report was emailed to ${accountEmail}.`
                : "Saved to the app — the parent will see it in Settings."}
            </p>
            <button onClick={onClose} className="mt-5 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">
              Done
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Reporter */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-lg">{reporter?.avatar || "🧑"}</span>
              <span className="text-sm font-semibold text-gray-700">{reporter?.name}</span>
              <span className="text-xs text-gray-400 ml-auto">submitting report</span>
            </div>

            {/* Type selector */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {ISSUE_TYPES.map(t => (
                  <button key={t.key} onClick={() => setType(t.key)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${type === t.key ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    <div className="font-semibold text-xs">{t.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Description</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe the issue or idea…"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <div className="flex gap-3 pb-1">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={submit}
                disabled={!message.trim() || sending}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${message.trim() && !sending ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                {sending ? "Sending…" : "Submit Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── FAMILY MEMBER SELECTION ─────────────────────────────────────────────── */
function FamilyMemberSelection({ members, onLogin, onSignOut, onSwitchAccount, onDeleteAccount, accountEmail }) {
  const [mode, setMode] = useState(null); // null | "parent" | "kid"
  const [selectedKid, setSelectedKid] = useState(null);
  const [pin, setPin] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0=off 1=confirm 2=type DELETE
  const [deleteInput, setDeleteInput] = useState("");

  const kids    = members.filter(m => m.role === "child");
  const parents = members.filter(m => m.role === "parent");
  const fName   = members.find(m => m.familyName)?.familyName || "Family";

  const triggerShake = () => { setShaking(true); setTimeout(() => setShaking(false), 450); };

  const tryParentLogin = () => {
    const match = parents.find(p =>
      (p.familyName || "").toLowerCase() === familyName.trim().toLowerCase() && p.pin === pin
    );
    if (match) { onLogin(match); }
    else { setError("Incorrect family name or PIN. Please try again."); setPin(""); triggerShake(); }
  };

  const tryKidLogin = () => {
    if (selectedKid && selectedKid.pin === pin) { onLogin(selectedKid); }
    else { setError("Wrong PIN! Try again 🙈"); setPin(""); triggerShake(); }
  };

  const back = () => { setMode(null); setSelectedKid(null); setPin(""); setFamilyName(""); setError(""); };

  // Main entry screen
  if (!mode) {
    return (
      <div className="min-h-screen flex items-center justify-center relative safe-top safe-bottom" style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}>
        <AppStyles />

        {/* Account menu button */}
        <div style={{ position:"absolute", right:16, top:"calc(env(safe-area-inset-top) + 12px)", zIndex:100 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width:44, height:44,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(255,255,255,0.12)",
              border:"1px solid rgba(255,255,255,0.22)",
              borderRadius:14,
              color:"white",
              cursor:"pointer",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Account menu — rendered via portal directly into document.body so nothing can clip it */}
        {menuOpen && createPortal(
          <>
            {/* Full-screen dismissal overlay */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position:"fixed", top:0, left:0, right:0, bottom:0,
                background:"rgba(0,0,0,0.28)",
                zIndex:9990,
              }}
            />
            {/* Menu panel */}
            <div style={{
              position:"fixed",
              top:72,
              right:16,
              width:260,
              background:"#ffffff",
              borderRadius:14,
              boxShadow:"0 8px 40px rgba(0,0,0,0.22)",
              zIndex:9991,
              overflow:"hidden",
            }}>
              {accountEmail && (
                <div style={{ padding:"10px 16px 9px", borderBottom:"1px solid #e5e5ea" }}>
                  <div style={{ fontSize:12, color:"#8e8e93", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{accountEmail}</div>
                </div>
              )}
              {[
                { emoji:"🚪", label:"Sign Out",       color:"#1c1c1e", action:() => { setMenuOpen(false); onSignOut(); } },
                { emoji:"🔄", label:"Switch Account",  color:"#1c1c1e", action:() => { setMenuOpen(false); onSwitchAccount?.(); } },
                { emoji:"🗑️", label:"Delete Account",  color:"#ff3b30", action:() => { setMenuOpen(false); setDeleteStep(1); } },
                { emoji:"✕",  label:"Cancel",          color:"#8e8e93", action:() => setMenuOpen(false) },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <button
                    onClick={item.action}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      width:"100%", textAlign:"left",
                      padding:"0 16px", height:52,
                      fontSize:16, fontWeight:500, color:item.color,
                      background:"none", border:"none", cursor:"pointer",
                      WebkitTapHighlightColor:"transparent",
                      fontFamily:"inherit", boxSizing:"border-box",
                    }}
                    onTouchStart={e => e.currentTarget.style.background="#f2f2f7"}
                    onTouchEnd={e => { e.currentTarget.style.background="none"; }}
                  >
                    <span style={{ fontSize:20, lineHeight:1 }}>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                  {i < arr.length - 1 && (
                    <div style={{ height:1, background:"#e5e5ea" }} />
                  )}
                </div>
              ))}
            </div>
          </>,
          document.body
        )}

        <div className="text-center fadeUp px-6">
          <div className="text-7xl mb-4">🏠</div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Family App</h1>
          <p className="text-indigo-200 mb-12 text-lg">Welcome, {fName} family!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-sm mx-auto">
            <button onClick={() => setMode("parent")}
              className="flex-1 flex flex-col items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-3xl p-6 transition-all hover:scale-105 backdrop-blur"
            >
              <span className="text-4xl">👨‍👩‍👧</span>
              <span className="font-bold text-base">I'm a Parent</span>
              <span className="text-indigo-200 text-xs">Full access</span>
            </button>
            {kids.length > 0 && (
              <button onClick={() => setMode("kid")}
                className="flex-1 flex flex-col items-center gap-3 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-3xl p-6 transition-all hover:scale-105 backdrop-blur"
              >
                <span className="text-4xl">🧒</span>
                <span className="font-bold text-base">I'm a Kid</span>
                <span className="text-indigo-200 text-xs">My stuff</span>
              </button>
            )}
          </div>
          <button onClick={onSignOut} className="mt-10 text-indigo-300/60 hover:text-indigo-200 text-xs underline transition-colors">
            Not your family? Sign out of account
          </button>
        </div>

        {/* Delete account — step 1: warning */}
        {deleteStep === 1 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
              <div className="text-4xl text-center mb-3">⚠️</div>
              <h3 className="font-bold text-gray-800 text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                This will permanently erase all family data, members, wallets, chores, and history for <strong>{accountEmail}</strong>. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteStep(0)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={() => setDeleteStep(2)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">Continue</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete account — step 2: type DELETE to confirm */}
        {deleteStep === 2 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="font-bold text-gray-800 mb-2">Final Confirmation</h3>
              <p className="text-sm text-gray-500 mb-4">Type <strong>DELETE</strong> below to permanently erase this account.</p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="flex gap-3">
                <button onClick={() => { setDeleteStep(0); setDeleteInput(""); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button
                  disabled={deleteInput !== "DELETE"}
                  onClick={() => { setDeleteStep(0); setDeleteInput(""); onDeleteAccount?.(); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${deleteInput === "DELETE" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                >
                  Delete Everything
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Parent login
  if (mode === "parent") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}>
        <AppStyles />
        <div className={`bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp ${shaking ? "shake" : ""}`}>
          <button onClick={back} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm"><ChevronLeft size={16}/> Back</button>
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">👨‍👩‍👧</div>
            <h2 className="text-xl font-bold text-gray-800">Parent / Guardian</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your family name and PIN</p>
          </div>
          <div className="space-y-3 mb-4">
            <input
              value={familyName}
              onChange={e => setFamilyName(e.target.value)}
              className={INP}
              placeholder={`Family name (e.g. ${fName})`}
              autoFocus
              onKeyDown={e => { if (e.key === "Enter" && pin.length === 4) tryParentLogin(); }}
            />
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g,"").slice(0,4))}
              className={INP}
              placeholder="4-digit PIN"
              onKeyDown={e => { if (e.key === "Enter" && pin.length === 4) tryParentLogin(); }}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}
          <button
            onClick={tryParentLogin}
            disabled={!familyName.trim() || pin.length < 4}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-40 transition-all"
          >Sign In</button>
        </div>
      </div>
    );
  }

  // Kid login — step 1: pick profile
  if (mode === "kid" && !selectedKid) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:"linear-gradient(135deg,#1E1B4B 0%,#312E81 50%,#4338CA 100%)" }}>
        <AppStyles />
        <div className="text-center fadeUp px-6 w-full max-w-lg">
          <button onClick={back} className="text-indigo-300 hover:text-white mb-6 flex items-center gap-1 text-sm mx-auto"><ChevronLeft size={16}/> Back</button>
          <div className="text-4xl mb-2">🧒</div>
          <h2 className="text-2xl font-bold text-white mb-1">Who are you?</h2>
          <p className="text-indigo-200 mb-8 text-sm">Tap your name</p>
          <div className="flex gap-4 flex-wrap justify-center">
            {kids.map(kid => {
              const c = getP(kid.colorKey);
              return (
                <button key={kid.id} onClick={() => { setSelectedKid(kid); setPin(""); setError(""); }}
                  className="flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all hover:scale-105 popIn"
                  style={{ borderColor:c.bg, background:c.light+"33" }}
                >
                  <div style={{ borderRadius:"50%", boxShadow:`0 0 0 4px ${c.bg}` }}>
                    <MemberAvatar member={kid} size={80} />
                  </div>
                  <span className="font-bold text-white text-lg">{kid.name}</span>
                  {kid.age && <span className="text-indigo-200 text-xs">Age {kid.age}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Kid login — step 2: PIN
  if (mode === "kid" && selectedKid) {
    const c = getP(selectedKid.colorKey);
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:`linear-gradient(135deg,${c.bg} 0%,${c.bg}cc 100%)` }}>
        <AppStyles />
        <div className={`bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 fadeUp ${shaking ? "shake" : ""}`}>
          <button onClick={() => { setSelectedKid(null); setPin(""); setError(""); }} className="text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1 text-sm"><ChevronLeft size={16}/> Back</button>
          <div className="text-center mb-4">
            <div className="mx-auto mb-3" style={{ width:80, height:80, borderRadius:"50%", boxShadow:`0 0 0 4px ${c.bg}` }}>
              <MemberAvatar member={selectedKid} size={80} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Hi, {selectedKid.name}! 👋</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your PIN</p>
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <NumPad value={pin} onChange={v => { setPin(v); setError(""); }} onSubmit={tryKidLogin} accentColor={c.bg} />
        </div>
      </div>
    );
  }

  return null;
}

/* ── KID VIEW COMPONENTS ─────────────────────────────────────────────────── */
function KidDay({ events, kid, pendingRequests, setPendingRequests }) {
  const { members, setNotifications } = useFamily();
  const adults = members.filter(m => m.role === "parent");

  const todayStr = ds(Y, M, D);
  const mine = events.filter(e => e.members.includes(kid.id));
  const today = mine.filter(e => e.date === todayStr);
  const upcoming = mine.filter(e => e.date > todayStr && daysUntil(e.date) <= 14).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5);
  const countdowns = mine.filter(e => e.countdown && daysUntil(e.date) > 0).slice(0,3);
  const c = getP(kid.colorKey);

  const [showReq,     setShowReq]     = useState(false);
  const [reqTitle,    setReqTitle]    = useState("");
  const [reqDate,     setReqDate]     = useState(ds(Y, M, D));
  const [reqTime,     setReqTime]     = useState("");
  const [reqLocation, setReqLocation] = useState("");
  const [reqTransport,setReqTransport]= useState("walk");
  const [reqRideAdult,setReqRideAdult]= useState("");
  const [reqNote,     setReqNote]     = useState("");
  const [sent,        setSent]        = useState(false);

  const myPending = (pendingRequests || []).filter(r => r.kidId === kid.id);

  const TRANSPORT_OPTS = [
    { val:"walk",  label:"🚶 Walking" },
    { val:"ride",  label:"🚗 Need a ride" },
    { val:"bus",   label:"🚌 School bus" },
    { val:"bike",  label:"🚲 Biking" },
    { val:"other", label:"✏️ Other" },
  ];

  const submitRequest = () => {
    if (!reqTitle.trim() || !reqDate) return;
    const req = {
      id: uid(),
      kidId: kid.id, kidName: kid.name, kidAvatar: kid.avatar,
      title: reqTitle.trim(),
      date: reqDate, time: reqTime,
      location: reqLocation.trim(),
      transport: reqTransport,
      rideAdultId: reqTransport === "ride" ? reqRideAdult : "",
      note: reqNote.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };
    setPendingRequests(prev => [...(prev || []), req]);
    if (reqTransport === "ride" && reqRideAdult) {
      const adult = adults.find(a => a.id === reqRideAdult);
      setNotifications(prev => [...(prev || []), {
        id: uid(),
        targetMemberId: reqRideAdult,
        type: "ride-request",
        requestId: req.id,
        message: `${kid.name} needs a ride to "${req.title}" on ${fmtDate(req.date)}${req.time ? ` at ${req.time}` : ""}${req.location ? ` · 📍 ${req.location}` : ""}`,
        from: `${kid.avatar} ${kid.name}`,
        read: false,
        createdAt: new Date().toISOString(),
      }]);
    }
    setSent(true);
    setReqTitle(""); setReqDate(ds(Y,M,D)); setReqTime("");
    setReqLocation(""); setReqTransport("walk"); setReqRideAdult(""); setReqNote("");
    setTimeout(() => { setSent(false); setShowReq(false); }, 1800);
  };

  return (
    <div className="space-y-5 fadeUp">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">My Day 📅</h2>
        <button onClick={() => setShowReq(true)} style={{ background:c.bg }} className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90">
          <Plus size={13} /> Request Event
        </button>
      </div>

      {/* Pending requests status */}
      {myPending.length > 0 && (
        <div className="space-y-2">
          {myPending.map(r => (
            <div key={r.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm border ${r.status === "approved" ? "bg-green-50 border-green-200" : r.status === "denied" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <span className="text-base">{r.status === "approved" ? "✅" : r.status === "denied" ? "❌" : "⏳"}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{r.title}</p>
                <p className="text-xs text-gray-400">{fmtDate(r.date)} · {r.status === "approved" ? "Approved!" : r.status === "denied" ? "Not this time" : "Waiting for parent"}</p>
              </div>
              {r.status !== "pending" && (
                <button onClick={() => setPendingRequests(prev => prev.filter(x => x.id !== r.id))} className="text-gray-300 hover:text-gray-500"><X size={14}/></button>
              )}
            </div>
          ))}
        </div>
      )}

      {countdowns.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {countdowns.map(e => (
            <div key={e.id} style={{ borderLeft:`4px solid ${c.bg}`, background:c.light }} className="flex-1 min-w-32 rounded-2xl p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Countdown!</p>
              <p className="font-bold text-gray-800 text-sm">{e.title}</p>
              <p style={{ color:c.text }} className="text-3xl font-extrabold">{daysUntil(e.date)}<span className="text-sm font-normal text-gray-500 ml-1">days</span></p>
            </div>
          ))}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-gray-500 mb-2">Today</p>
        {today.length === 0
          ? <div className="bg-gray-50 rounded-2xl p-4 text-center text-gray-400 text-sm">No events today 🎉 Free day!</div>
          : today.map(e => (
            <div key={e.id} style={{ borderLeft:`3px solid ${c.bg}`, background:c.light+"80" }} className="rounded-xl p-3 mb-2">
              {e.time && <span className="text-xs text-gray-400 font-medium block">{e.time}</span>}
              <p className="font-semibold text-gray-800">{e.title}</p>
            </div>
          ))
        }
      </div>
      {upcoming.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">Coming Up</p>
          {upcoming.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 mb-2">
              <div style={{ background:c.light }} className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{daysUntil(e.date) <= 1 ? "🔥" : "📌"}</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{e.title}</p>
                <p className="text-xs text-gray-400">{fmtDate(e.date)} · in {daysUntil(e.date)} day{daysUntil(e.date) !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request event sheet */}
      {showReq && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 pb-8 fadeUp">
            {sent
              ? <div className="text-center py-6"><div className="text-5xl mb-2">🎉</div><p className="font-bold text-gray-800">Request sent!</p><p className="text-sm text-gray-400 mt-1">A parent will review it soon.</p></div>
              : <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-800">Request an Event</h3>
                    <button onClick={() => setShowReq(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What's the event?</label>
                      <input value={reqTitle} onChange={e => setReqTitle(e.target.value)} className={INP} placeholder="e.g. Sleepover at Jake's" autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                        <input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} className={INP} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time (optional)</label>
                        <input type="time" value={reqTime} onChange={e => setReqTime(e.target.value)} className={INP} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📍 Location (optional)</label>
                      <input value={reqLocation} onChange={e => setReqLocation(e.target.value)} className={INP} placeholder="e.g. 123 Main St or Jake's house" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🚗 How are you getting there?</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TRANSPORT_OPTS.map(opt => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => { setReqTransport(opt.val); if (opt.val !== "ride") setReqRideAdult(""); }}
                            className={`text-xs py-2 px-3 rounded-xl border font-medium transition-all text-left ${reqTransport === opt.val ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                          >{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    {reqTransport === "ride" && adults.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Who are you asking for a ride?</label>
                        <div className="flex gap-2 flex-wrap">
                          {adults.map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setReqRideAdult(a.id)}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${reqRideAdult === a.id ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                            >
                              <span>{a.avatar}</span> {a.name}
                            </button>
                          ))}
                        </div>
                        {reqTransport === "ride" && !reqRideAdult && <p className="text-xs text-amber-600 mt-1">Pick who you're asking — they'll get an alert!</p>}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note to parent (optional)</label>
                      <input value={reqNote} onChange={e => setReqNote(e.target.value)} className={INP} placeholder="Any details…" />
                    </div>
                  </div>
                  <button
                    onClick={submitRequest}
                    disabled={!reqTitle.trim() || (reqTransport === "ride" && !reqRideAdult)}
                    style={{ background:c.bg }}
                    className="w-full mt-5 py-3 text-white rounded-2xl font-bold disabled:opacity-40 hover:opacity-90"
                  >
                    Send Request 📨
                  </button>
                </>
            }
          </div>
        </div>
      )}
    </div>
  );
}

function KidChoresList({ chores, setChores, wallets, setWallets, kid }) {
  const mine = chores.filter(c => c.assignee === kid.id);
  const c = getP(kid.colorKey);
  const [coins, setCoins] = useState([]);

  const toggle = id => {
    const chore = mine.find(ch => ch.id === id);
    if (!chore || chore.done) return; // only allow marking done, not undoing in kid view
    setCoins(prev => [...prev, { id:uid(), x:Math.random()*80+10 }]);
    setTimeout(() => setCoins(prev => prev.filter(c => c.id !== uid())), 800);
    setChores(prev => prev.map(ch => {
      if (ch.id !== id) return ch;
      setWallets(w => ({
        ...w,
        [kid.id]: { ...w[kid.id], spend:(w[kid.id]?.spend||0)+ch.reward, history:[...(w[kid.id]?.history||[]),{date:ds(Y,M,D),amount:ch.reward,type:"chore",desc:`Chore: ${ch.title}`}] }
      }));
      return { ...ch, done:true };
    }));
  };

  const done = mine.filter(ch => ch.done);
  const pending = mine.filter(ch => !ch.done);
  const pct = mine.length ? Math.round(done.length / mine.length * 100) : 0;

  return (
    <div className="space-y-4 fadeUp relative">
      {coins.map(coin => (
        <div key={coin.id} className="fixed coinPop text-2xl pointer-events-none z-50" style={{ left:`${coin.x}%`, top:"50%" }}>⭐</div>
      ))}
      <h2 className="text-xl font-bold text-gray-800">My Chores ✅</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">{done.length} of {mine.length} done</span>
          <span style={{ color:c.text }} className="font-bold text-sm">{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3"><div style={{ width:`${pct}%`, background:c.bg }} className="h-3 rounded-full transition-all duration-700" /></div>
        {mine.length > 0 && done.length === mine.length && <p className="text-center text-green-600 font-bold mt-2 text-sm">🎉 All done! Great job!</p>}
      </div>
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">To Do</p>
          {pending.map(chore => (
            <button key={chore.id} onClick={() => toggle(chore.id)} className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 p-4 mb-2 text-left hover:border-indigo-300 transition-all active:scale-98">
              <div style={{ borderColor:c.bg }} className="w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center">
                <Plus size={14} style={{ color:c.text }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{chore.title}</p>
                <p className="text-xs text-gray-400">{CHORE_CATS[chore.category] || "📋"} · {chore.points} pts · ${chore.reward.toFixed(2)}</p>
              </div>
              <span className="text-xs text-gray-400">tap to complete</span>
            </button>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed</p>
          {done.map(chore => (
            <div key={chore.id} className="flex items-center gap-3 bg-green-50 rounded-2xl border border-green-100 p-4 mb-2 opacity-70">
              <div style={{ background:c.bg }} className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-600 line-through">{chore.title}</p>
                <p className="text-xs text-green-600">+${chore.reward.toFixed(2)} earned! 🌟</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {mine.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No chores assigned yet!</p>}
    </div>
  );
}

function KidWalletView({ wallets, kid, goals, allowances }) {
  const w = wallets[kid.id] || { spend:0, save:0, give:0, history:[] };
  const total = (w.spend||0)+(w.save||0)+(w.give||0);
  const c = getP(kid.colorKey);
  const myGoals = goals.filter(g => g.owner === kid.id);
  const myAllowances = (allowances||[]).filter(a => a.memberId === kid.id && a.enabled);
  return (
    <div className="space-y-4 fadeUp">
      <h2 className="text-xl font-bold text-gray-800">My Wallet 💰</h2>
      <div style={{ background:c.bg }} className="rounded-3xl p-6 text-white">
        <p className="text-white/70 text-sm font-medium">Total Balance</p>
        <p className="text-4xl font-extrabold my-1">{fmtMoney(total)}</p>
        <p className="text-white/60 text-xs">Keep it up, {kid.name}! 🌟</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {POTS.map(pot => {
          const bal = w[pot.key] || 0;
          return (
            <div key={pot.key} style={{ borderTop:`3px solid ${pot.color}` }} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className="text-2xl mb-1">{pot.icon}</div>
              <p className="font-extrabold text-gray-800">{fmtMoney(bal)}</p>
              <p className="text-xs text-gray-400">{pot.label}</p>
            </div>
          );
        })}
      </div>
      {myGoals.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">My Savings Goals ⭐</p>
          {myGoals.map(g => {
            const pct = g.target > 0 ? Math.min(g.current / g.target * 100, 100) : 0;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-gray-100 p-4 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{g.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{g.title}</p>
                    <p className="text-xs text-gray-400">{fmtMoney(g.current)} of {fmtMoney(g.target)} saved</p>
                  </div>
                  <span style={{ color:c.text }} className="font-bold text-sm">{Math.round(pct)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3"><div style={{ width:`${pct}%`, background:pct>=100?"#16A34A":c.bg }} className="h-3 rounded-full transition-all duration-700" /></div>
                {pct >= 100 && <p className="text-green-600 font-bold text-sm text-center mt-1">🎉 Goal reached!</p>}
              </div>
            );
          })}
        </div>
      )}
      {myAllowances.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">💰</span>
            <p className="font-bold text-gray-700 text-sm">My Recurring Payments</p>
          </div>
          {myAllowances.map(a => {
            const due = daysUntil(a.nextDue);
            return (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-400">{FREQ_LABELS[a.frequency]}{a.frequency==="custom"?` · every ${a.customDays} days`:""}</p>
                </div>
                <div className="text-right">
                  <p style={{ color:c.text }} className="font-extrabold text-sm">{fmtMoney(a.amount)}</p>
                  <p className={`text-xs ${due<=1?"text-amber-500":"text-gray-400"}`}>
                    {due <= 0 ? "⏰ Due now!" : due === 1 ? "⏰ Tomorrow!" : `in ${due} days`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100"><p className="font-bold text-gray-700 text-sm">Recent Transactions</p></div>
        <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
          {[...(w.history||[])].reverse().slice(0,10).map((h,i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-lg">{TX_ICON[h.type]||"💲"}</span>
              <div className="flex-1"><p className="text-sm text-gray-700">{h.desc}</p><p className="text-xs text-gray-400">{fmtDate(h.date)}</p></div>
              <span style={{ color:h.amount>=0?"#16A34A":"#EF4444" }} className="font-bold text-sm">{h.amount!==0?(h.amount>=0?"+":"")+fmtMoney(h.amount):"—"}</span>
            </div>
          ))}
          {(w.history||[]).length===0 && <p className="py-6 text-center text-gray-400 text-sm">No transactions yet</p>}
        </div>
      </div>
    </div>
  );
}

function KidGoalsView({ goals, setGoals, wallets, kid }) {
  const c = getP(kid.colorKey);
  const w = wallets[kid.id] || {};
  const myGoals = goals.filter(g => g.owner === kid.id);

  const [showNew,   setShowNew]   = useState(false);
  const [newTitle,  setNewTitle]  = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newEmoji,  setNewEmoji]  = useState("🎯");

  const createGoal = () => {
    if (!newTitle.trim() || !newTarget || +newTarget <= 0) return;
    setGoals(prev => [...prev, { id:uid(), owner:kid.id, title:newTitle.trim(), target:+newTarget, current:0, emoji:newEmoji }]);
    setNewTitle(""); setNewTarget(""); setNewEmoji("🎯"); setShowNew(false);
  };

  return (
    <div className="space-y-4 fadeUp">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">My Goals ⭐</h2>
        <button onClick={() => setShowNew(true)} style={{ background:c.bg }} className="flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-90">
          <Plus size={13} /> New Goal
        </button>
      </div>

      <div style={{ background:c.light, borderLeft:`4px solid ${c.bg}` }} className="rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Save Pot Balance</p>
        <p style={{ color:c.text }} className="text-2xl font-extrabold">{fmtMoney(w.save||0)}</p>
        <p className="text-xs text-gray-400">Available to put toward goals</p>
      </div>

      {myGoals.length === 0 && !showNew && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🎯</div>
          <p className="font-medium">No goals yet!</p>
          <p className="text-sm mt-1">Tap <strong>New Goal</strong> to add one.</p>
        </div>
      )}

      {myGoals.map(g => {
        const pct = g.target > 0 ? Math.min(g.current / g.target * 100, 100) : 0;
        const done = pct >= 100;
        const toGo = Math.max(g.target - g.current, 0);
        return (
          <div key={g.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${done ? "border-green-300" : "border-gray-100"}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{g.emoji}</span>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{g.title}</h3>
                <p className="text-xs text-gray-400">Goal: {fmtMoney(g.target)}</p>
              </div>
              <button onClick={() => setGoals(prev => prev.filter(x => x.id !== g.id))} className="text-gray-200 hover:text-red-400 p-1"><Trash2 size={14}/></button>
            </div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-gray-500">{fmtMoney(g.current)} saved</span>
              <span style={{ color:c.text }} className="font-bold">{Math.round(pct)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
              <div style={{ width:`${pct}%`, background:done?"#16A34A":c.bg }} className="h-4 rounded-full transition-all duration-700" />
            </div>
            {done
              ? <p className="text-center text-green-600 font-bold">🎉 You made it! Goal complete!</p>
              : <p className="text-center text-gray-400 text-sm">{fmtMoney(toGo)} more to go!</p>
            }
          </div>
        );
      })}

      {/* New goal sheet */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 pb-8 fadeUp">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800">New Savings Goal</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What are you saving for?</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className={INP} placeholder="e.g. New bike" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">How much does it cost? ($)</label>
                <input type="number" min={1} value={newTarget} onChange={e => setNewTarget(e.target.value)} className={INP} placeholder="e.g. 120" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pick an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewEmoji(e)} className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${newEmoji===e?"bg-green-100 ring-2 ring-green-500":"hover:bg-gray-100"}`}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={createGoal} disabled={!newTitle.trim() || !newTarget || +newTarget<=0} style={{ background:c.bg }} className="w-full mt-5 py-3 text-white rounded-2xl font-bold disabled:opacity-40 hover:opacity-90">
              Create Goal 🎯
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── KID VIEW SHELL ──────────────────────────────────────────────────────── */
const KID_TABS = [
  { id:"day",    icon:"📅", label:"My Day"   },
  { id:"chores", icon:"✅", label:"Chores"   },
  { id:"wallet", icon:"💰", label:"Wallet"   },
  { id:"goals",  icon:"⭐", label:"Goals"    },
];

function KidView({ kid, events, chores, setChores, wallets, setWallets, goals, setGoals, allowances, pendingRequests, setPendingRequests, onLogout, onOpenReport }) {
  const [tab, setTab] = useState("day");
  const c = getP(kid.colorKey);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"#F0F4FF" }}>
      <AppStyles />
      <div className="w-full max-w-sm mx-auto bg-white flex flex-col shadow-2xl" style={{ minHeight:"100dvh", maxHeight:"100dvh" }}>
        {/* Header — pt accounts for iPhone notch/Dynamic Island */}
        <div style={{ background:c.bg, paddingTop:"calc(env(safe-area-inset-top) + 24px)" }} className="px-5 pb-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ borderRadius:"50%", boxShadow:"0 0 0 3px rgba(255,255,255,0.3)" }}>
                <MemberAvatar member={kid} size={48} />
              </div>
              <div>
                <p className="font-extrabold text-lg">{kid.name}</p>
                <p className="text-white/70 text-xs">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onOpenReport} className="text-white/70 hover:text-white text-xs flex flex-col items-center gap-0.5">
                <span className="text-lg">🚩</span>
                <span>Report</span>
              </button>
              <button onClick={onLogout} className="text-white/60 hover:text-white text-xs flex flex-col items-center gap-0.5">
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {tab === "day"    && <KidDay events={events} kid={kid} pendingRequests={pendingRequests} setPendingRequests={setPendingRequests} />}
          {tab === "chores" && <KidChoresList chores={chores} setChores={setChores} wallets={wallets} setWallets={setWallets} kid={kid} />}
          {tab === "wallet" && <KidWalletView wallets={wallets} kid={kid} goals={goals} allowances={allowances} />}
          {tab === "goals"  && <KidGoalsView goals={goals} setGoals={setGoals} wallets={wallets} kid={kid} />}
        </div>
        {/* Bottom nav — pb accounts for iPhone home indicator */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="flex">
            {KID_TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all ${tab===t.id ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}`}>
                <span className="text-xl">{t.icon}</span>
                <span className="text-xs font-medium">{t.label}</span>
                {tab === t.id && <div style={{ background:c.bg }} className="w-1 h-1 rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── APP ROOT ───────────────────────────────────────────────────────────── */
export default function App() {
  const { screen, setScreen, endSession, resetAll, account } = useAuth();
  const DATA_KEY = getDataKey(account?.email); // email-namespaced localStorage key

  const [currentUser, setCurrentUser] = useState(null);
  const [active,      setActive]      = useState("home");
  const [collapsed,   setCollapsed]   = useState(false);
  const [members,  setMembers]  = useState([]);
  const [events,   setEvents]   = useState([]);
  const [chores,   setChores]   = useState([]);
  const [lists,    setLists]    = useState([]);
  const [wallets,  setWallets]  = useState({});
  const [goals,           setGoals]           = useState([]);
  const [budget,          setBudget]          = useState([]);
  const [allowances,      setAllowances]      = useState([]);
  const [mealPlanner,     setMealPlanner]     = useState({ ...DEFAULT_MEAL_PLANNER });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [notifications,   setNotifications]   = useState([]);
  const [issueReports,    setIssueReports]    = useState([]);
  const [reportOpen,      setReportOpen]      = useState(false);
  const [headerMenuOpen,  setHeaderMenuOpen]  = useState(false);
  const avatarBtnRef = useRef(null);

  /* Load/reload family data whenever we land on the family-select screen */
  useEffect(() => {
    if (screen !== "family-select") return;
    try {
      // Try namespaced key first, fall back to legacy key for migration
      const raw = localStorage.getItem(DATA_KEY) || localStorage.getItem(LS_DATA);
      const d = JSON.parse(raw);
      if (!d) return;
      if (d.members) setMembers(d.members);
      if (d.events)  setEvents(d.events);
      if (d.chores)  setChores(d.chores);
      if (d.lists)   setLists(d.lists);
      if (d.goals)           setGoals(d.goals);
      if (d.budget)          setBudget(d.budget);
      if (d.pendingRequests) setPendingRequests(d.pendingRequests);
      if (d.notifications)   setNotifications(d.notifications);
      if (d.mealPlanner)   setMealPlanner(p => ({ ...p, ...d.mealPlanner }));
      if (d.issueReports)  setIssueReports(d.issueReports);
      // Process any due recurring payments on load
      const today = ds(Y, M, D);
      const rawAllowances = d.allowances || [];
      const rawWallets    = d.wallets    || {};
      const hasDue = rawAllowances.some(a => a.enabled && a.nextDue && a.nextDue <= today);
      if (hasDue) {
        let newWallets = { ...rawWallets };
        const updated = rawAllowances.map(a => {
          if (!a.enabled || !a.nextDue || a.nextDue > today) return a;
          let cur = { ...a };
          while (cur.nextDue <= today) {
            const kid = cur.memberId;
            const w = newWallets[kid] || { spend:0, save:0, give:0, history:[] };
            const amt = parseFloat(cur.amount) || 0;
            let patch = {};
            if (cur.pot === "split") {
              const s  = parseFloat((amt * (cur.splitSpend || 0) / 100).toFixed(2));
              const sv = parseFloat((amt * (cur.splitSave  || 0) / 100).toFixed(2));
              const g  = parseFloat((amt * (cur.splitGive  || 0) / 100).toFixed(2));
              patch = { spend:(w.spend||0)+s, save:(w.save||0)+sv, give:(w.give||0)+g };
            } else {
              patch = { [cur.pot]: (w[cur.pot]||0) + amt };
            }
            newWallets[kid] = { ...w, ...patch,
              history: [...(w.history||[]), { date:cur.nextDue, amount:amt, type:"allowance", desc:`${cur.title} 💰` }]
            };
            cur = { ...cur, nextDue: advanceDate(cur.nextDue, freqDays(cur)), lastPaid: cur.nextDue };
          }
          return cur;
        });
        setAllowances(updated);
        setWallets(newWallets);
      } else {
        if (d.allowances) setAllowances(d.allowances);
        if (d.wallets)    setWallets(d.wallets);
      }
    } catch {}
  }, [screen]);

  /* Persist all state changes back to localStorage (only once data is loaded) */
  useEffect(() => {
    if (members.length === 0) return; // skip before data is loaded
    const payload = { members, events, chores, lists, wallets, goals, budget, allowances, mealPlanner, pendingRequests, notifications, issueReports };
    localStorage.setItem(DATA_KEY, JSON.stringify(payload));
    // Debounced cloud sync — fires 3 seconds after last change to avoid spamming
    const t = setTimeout(() => pushFamilyToCloud(account?.email, payload), 3000);
    return () => clearTimeout(t);
  }, [members, events, chores, lists, wallets, goals, budget, allowances, mealPlanner, pendingRequests, notifications, issueReports]); // eslint-disable-line react-hooks/exhaustive-deps

  const getColor = id => { const m = members.find(x => x.id === id); return m ? getP(m.colorKey) : null; };
  const ctx = useMemo(() => ({ members, getColor, notifications, setNotifications }), [members, notifications, setNotifications]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Account-level sign out (back to login screen) */
  const handleSignOut = () => {
    endSession();
    setCurrentUser(null);
    setActive("home");
    setScreen("login");
  };

  /* Full reset — wipes everything */
  const handleReset = () => {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(LS_DATA);
    resetAll();
    setCurrentUser(null);
    setActive("home");
    setMembers([]); setEvents([]); setChores([]);
    setLists([]); setWallets({}); setGoals([]); setBudget([]); setAllowances([]);
    setMealPlanner({ ...DEFAULT_MEAL_PLANNER }); setNotifications([]); setIssueReports([]);
  };

  /* Switch account — stay logged in to auth but go back to landing (data preserved) */
  const handleSwitchAccount = () => {
    setCurrentUser(null);
    setActive("home");
    endSession();
  };

  /* Delete account — wipe this account's data entirely then reset auth */
  const handleDeleteAccount = () => {
    localStorage.removeItem(DATA_KEY);
    localStorage.removeItem(LS_DATA);
    setCurrentUser(null);
    setActive("home");
    setMembers([]); setEvents([]); setChores([]);
    setLists([]); setWallets({}); setGoals([]); setBudget([]); setAllowances([]);
    setMealPlanner({ ...DEFAULT_MEAL_PLANNER }); setNotifications([]); setIssueReports([]);
    resetAll();
  };

  /* Family-member login (inner PIN screen) */
  const handleMemberLogin = user => {
    setCurrentUser(user);
    if (user.role === "parent") setActive("home");
  };

  /* Switch member (go back to family-select without signing out of account) */
  const handleSwitchMember = () => {
    setCurrentUser(null);
    setActive("home");
  };

  /* ── Auth / onboarding screens ── */
  if (screen === "landing")          return <LandingScreen />;
  if (screen === "email-entry")      return <EmailEntry />;
  if (screen === "email-verify")     return <EmailVerification />;
  if (screen === "create-password")  return <CreatePassword />;
  if (screen === "onboarding")       return <OnboardingWizard />;
  if (screen === "forgot-password")  return <ForgotPassword />;
  if (screen === "login")            return <LoginScreenAuth />;

  /* ── Family-select screen (no member chosen yet) ── */
  if (screen === "family-select" && !currentUser) {
    return (
      <FamilyCtx.Provider value={ctx}>
        <FamilyMemberSelection
          members={members}
          onLogin={handleMemberLogin}
          onSignOut={handleSignOut}
          onSwitchAccount={handleSwitchAccount}
          onDeleteAccount={handleDeleteAccount}
          accountEmail={account?.email}
        />
      </FamilyCtx.Provider>
    );
  }

  /* ── Kid view ── */
  if (currentUser?.role === "child") {
    return (
      <FamilyCtx.Provider value={ctx}>
        <AppStyles />
        <KidView
          kid={currentUser}
          events={events}
          chores={chores}   setChores={setChores}
          wallets={wallets} setWallets={setWallets}
          goals={goals}     setGoals={setGoals}
          allowances={allowances}
          pendingRequests={pendingRequests} setPendingRequests={setPendingRequests}
          onLogout={handleSwitchMember}
          onOpenReport={() => setReportOpen(true)}
        />
        {reportOpen && (
          <IssueReportModal
            reporter={currentUser}
            accountEmail={account?.email}
            onSubmit={r => setIssueReports(prev => [r, ...prev])}
            onClose={() => setReportOpen(false)}
          />
        )}
      </FamilyCtx.Provider>
    );
  }

  /* ── Parent view ── */
  const renderPage = () => {
    if (active === "calendar") return <CalendarModule events={events} setEvents={setEvents} pendingRequests={pendingRequests} setPendingRequests={setPendingRequests} />;
    if (active === "chores")   return <ChoresModule   chores={chores}   setChores={setChores}   wallets={wallets} setWallets={setWallets} />;
    if (active === "lists")    return <ListsModule    lists={lists}     setLists={setLists} />;
    if (active === "wallet")   return <WalletModule   wallets={wallets} setWallets={setWallets} allowances={allowances} setAllowances={setAllowances} />;
    if (active === "goals")    return <GoalsModule    goals={goals}     setGoals={setGoals}     wallets={wallets} setWallets={setWallets} />;
    if (active === "budget")   return <BudgetModule   budget={budget}   setBudget={setBudget} />;
    if (active === "meals")    return <MealPlannerTab mealPlanner={mealPlanner} setMealPlanner={setMealPlanner} />;
    if (active === "settings") return <SettingsModule members={members} setMembers={setMembers} wallets={wallets} setWallets={setWallets} onReset={handleReset} issueReports={issueReports} setIssueReports={setIssueReports} />;
    return <Dashboard events={events} chores={chores} wallets={wallets} />;
  };

  const myNotifs = currentUser ? notifications.filter(n => n.targetMemberId === currentUser.id && !n.read) : [];

  return (
    <FamilyCtx.Provider value={ctx}>
      <AppStyles />
      <div style={{
        position:"fixed", top:0, left:0, right:0, bottom:0,
        width:"100%", height:"100dvh",
        overflow:"hidden",
        background:"#1E1B4B", fontFamily:"'Inter',system-ui,sans-serif",
        display:"flex",
      }}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed} pendingCount={pendingRequests.filter(r => r.status === "pending").length} />

        {/* Main column */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

          {/* ── Header ── */}
          <div className="flex-shrink-0 backdrop-blur border-b px-4 md:px-6 flex items-center justify-between"
               style={{ paddingTop:"calc(env(safe-area-inset-top) + 4px)", paddingBottom:6, background:"linear-gradient(135deg,#1E1B4B 0%,#4338CA 100%)", borderColor:"rgba(255,255,255,0.1)" }}>

            {/* Left: logo / dashboard */}
            <button onClick={() => setActive("home")} className="flex items-center gap-2">
              <span className="text-xl">🏠</span>
              <span className="font-bold text-sm hidden md:inline text-white/90">Family App</span>
            </button>

            {/* Right: notification + avatar menu */}
            <div className="flex items-center gap-2">
              {/* Ride-request bell — only when there are pending ones */}
              {myNotifs.length > 0 && (
                <button
                  onClick={() => {
                    setNotifications(prev => prev.map(n => n.targetMemberId === currentUser.id ? { ...n, read:true } : n));
                    setActive("calendar");
                  }}
                  className="relative flex items-center gap-1 text-xs rounded-xl px-2.5 py-1.5 font-semibold"
                  style={{ background:"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.25)" }}
                >
                  🔔 <span>{myNotifs.length}</span>
                </button>
              )}

              {/* Avatar + bottom-sheet menu */}
              <div>
                <button
                  onClick={() => setHeaderMenuOpen(o => !o)}
                  className="flex items-center gap-2 rounded-xl pl-1 pr-2 py-1 transition-colors"
                  style={{ background:"rgba(255,255,255,0.1)" }}
                >
                  {currentUser && <MemberAvatar member={currentUser} size={32} />}
                  <span className="text-xs font-semibold text-white/80 hidden md:inline max-w-24 truncate">{currentUser?.name}</span>
                  <ChevronRight size={14} style={{ color:"rgba(255,255,255,0.6)" }} />
                </button>

                {headerMenuOpen && createPortal(
                  <>
                    {/* Full-screen backdrop — rendered into body so nothing clips it */}
                    <div
                      onClick={() => setHeaderMenuOpen(false)}
                      style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:9998, background:"rgba(0,0,0,0.3)" }}
                    />
                    {/* Bottom sheet */}
                    <div style={{
                      position: "fixed",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 9999,
                      background: "white",
                      borderRadius: "20px 20px 0 0",
                      boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                      paddingBottom: "env(safe-area-inset-bottom)",
                    }}>
                      {/* Drag handle */}
                      <div style={{ display:"flex", justifyContent:"center", paddingTop:10, paddingBottom:4 }}>
                        <div style={{ width:36, height:4, borderRadius:2, background:"#e5e7eb" }} />
                      </div>
                      {/* Member avatars row */}
                      <div style={{ padding:"10px 20px 14px", borderBottom:"1px solid #f3f4f6", display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"#6b7280", fontWeight:600, marginRight:4 }}>Family</span>
                        {members.map(m => (
                          <div key={m.id} title={m.name} style={{ borderRadius:"50%", boxShadow:`0 0 0 2px ${getColor(m.id)?.bg||"#6366F1"}` }}>
                            <MemberAvatar member={m} size={30} />
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { setHeaderMenuOpen(false); setReportOpen(true); }}
                        style={{ width:"100%", textAlign:"left", padding:"16px 20px", fontSize:15, color:"#374151", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                        🚩 <span>Report an Issue</span>
                      </button>
                      <button onClick={() => { setHeaderMenuOpen(false); handleSwitchMember(); }}
                        style={{ width:"100%", textAlign:"left", padding:"16px 20px", fontSize:15, color:"#374151", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
                        🔄 <span>Switch Member</span>
                      </button>
                      <button onClick={() => { setHeaderMenuOpen(false); handleSignOut(); }}
                        style={{ width:"100%", textAlign:"left", padding:"16px 20px", fontSize:15, color:"#ef4444", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:12, borderTop:"1px solid #f3f4f6" }}>
                        🚪 <span>Sign Out</span>
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>

          {/* ── Scrollable content ──
               Scrollable div is transparent so the dark shell shows below content.
               Inner wrapper carries the ECEAF8 background — only as tall as content,
               so any empty space below the last card shows dark (matches nav). */}
          <div style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", background:"#ECEAF8", minHeight:0 }}>
            <div className="p-4 md:p-8 max-w-6xl mx-auto" style={{
              paddingBottom:"calc(env(safe-area-inset-bottom) + 56px)",
            }}>
              {renderPage()}
            </div>
          </div>
        </div>

        <MobileBottomNav
          active={active}
          setActive={setActive}
          pendingCount={pendingRequests.filter(r => r.status === "pending").length}
        />
      </div>
      {reportOpen && (
        <IssueReportModal
          reporter={currentUser}
          accountEmail={account?.email}
          onSubmit={r => setIssueReports(prev => [r, ...prev])}
          onClose={() => setReportOpen(false)}
        />
      )}
    </FamilyCtx.Provider>
  );
}
