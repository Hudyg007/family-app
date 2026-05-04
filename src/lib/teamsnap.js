// ── TeamSnap iCal Integration ─────────────────────────────────────────────
// Fetches a TeamSnap iCal (.ics) URL and converts events into Family App format.
// The user pastes their team's iCal URL from TeamSnap → Schedule → Export/Subscribe.

const CORS_PROXY = "https://corsproxy.io/?url=";

// ── Fetch & parse ─────────────────────────────────────────────────────────

/**
 * Fetch a .ics URL and return an array of Family App events.
 * Tries direct fetch first; falls back to CORS proxy if blocked.
 */
export async function fetchTeamSnapEvents(icsUrl) {
  if (!icsUrl?.trim()) return [];

  let text = null;

  // 1. Try direct fetch
  try {
    const res = await fetch(icsUrl, { cache: "no-store" });
    if (res.ok) text = await res.text();
  } catch { /* CORS blocked — try proxy */ }

  // 2. Fall back to CORS proxy
  if (!text) {
    try {
      const proxyUrl = CORS_PROXY + encodeURIComponent(icsUrl);
      const res = await fetch(proxyUrl, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (e) {
      throw new Error("Could not load TeamSnap schedule. Check the iCal URL and try again.");
    }
  }

  if (!text?.includes("BEGIN:VCALENDAR")) {
    throw new Error("The URL doesn't look like a valid iCal feed. Make sure you copied the iCal/subscribe link from TeamSnap.");
  }

  return parseIcal(text);
}

// ── iCal parser ───────────────────────────────────────────────────────────

function parseIcal(raw) {
  // Normalise line endings and unfold continuation lines
  const text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, ""); // unfold

  const events = [];
  let current = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) {
        const ev = icsToFamily(current);
        if (ev) events.push(ev);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    // Split on first colon; handle property parameters (e.g. DTSTART;TZID=...)
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const fullKey = line.substring(0, colonIdx);
    const value   = line.substring(colonIdx + 1);

    // Base key is everything before the first ";"
    const baseKey = fullKey.split(";")[0].toUpperCase();

    // Keep TZID parameter if present
    const tzMatch = fullKey.match(/TZID=([^;:]+)/i);
    const tzid    = tzMatch ? tzMatch[1] : null;

    current[baseKey]          = value;
    if (tzid) current[`${baseKey}_TZID`] = tzid;
  }

  return events;
}

// ── Date helpers ──────────────────────────────────────────────────────────

/**
 * Parse an iCal date/datetime string.
 * Returns { date: "YYYY-MM-DD", time: "HH:MM" | "" }
 */
function parseDate(raw, tzid) {
  if (!raw) return null;
  const s = raw.trim();

  // All-day: YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    return {
      date: `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`,
      time: "",
    };
  }

  // DateTime: YYYYMMDDTHHmmss[Z]
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;

  const [, yr, mo, dy, hh, mm, , utc] = m;

  if (utc === "Z") {
    // UTC — convert to local
    const d = new Date(`${yr}-${mo}-${dy}T${hh}:${mm}:00Z`);
    return {
      date: fmt(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  }

  // Floating / local time (or named timezone — treat as local for simplicity)
  return {
    date: `${yr}-${mo}-${dy}`,
    time: `${hh}:${mm}`,
  };
}

const pad = n => String(n).padStart(2, "0");
const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// ── Convert iCal event → Family App event ─────────────────────────────────

function icsToFamily(ics) {
  const raw   = ics["DTSTART"] || "";
  const tzid  = ics["DTSTART_TZID"] || null;
  const parsed = parseDate(raw, tzid);
  if (!parsed) return null;

  const uid     = ics["UID"] || `ts_${Math.random().toString(36).slice(2)}`;
  const summary = decode(ics["SUMMARY"] || "TeamSnap Event");
  const loc     = decode(ics["LOCATION"] || "");

  return {
    id:            `teamsnap_${uid}`,
    teamsnapUid:   uid,
    title:         summary,
    date:          parsed.date,
    time:          parsed.time,
    location:      loc,
    members:       [],
    colorMember:   "",
    recurring:     "none",
    countdown:     false,
    fromTeamSnap:  true,   // flag for 🏆 badge in UI
  };
}

/** Unescape iCal text values */
function decode(s) {
  return s
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}
