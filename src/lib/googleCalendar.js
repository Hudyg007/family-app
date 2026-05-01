// ── Google Calendar Integration ───────────────────────────────────────────
// To activate: replace the CLIENT_ID value below with your real Google OAuth
// Client ID from https://console.cloud.google.com/
// Make sure your OAuth consent screen has the Calendar API scope enabled and
// your app's origin is listed as an authorised JavaScript origin.

export const GCAL_CLIENT_ID = "450608800886-vrh1937c5ei6c0gjr8icaadra56j3uad.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar";
const STORAGE_KEY = "gcal_access_token";

let _tokenClient = null;
let _accessToken = localStorage.getItem(STORAGE_KEY) || null;

// ── Token helpers ─────────────────────────────────────────────────────────

export function getAccessToken() { return _accessToken; }

export function isConnected() { return !!_accessToken; }

function setToken(token) {
  _accessToken = token;
  if (token) localStorage.setItem(STORAGE_KEY, token);
  else localStorage.removeItem(STORAGE_KEY);
}

// ── Initialise Google Identity Services ──────────────────────────────────

export function loadGoogleIdentityServices() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

export async function initTokenClient(onTokenChange) {
  await loadGoogleIdentityServices();
  _tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GCAL_CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response?.access_token) {
        setToken(response.access_token);
        onTokenChange(true);
      } else {
        setToken(null);
        onTokenChange(false);
      }
    },
  });
}

export function requestAccess() {
  if (_tokenClient) _tokenClient.requestAccessToken({ prompt: "" });
}

export function disconnect() {
  if (_accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(_accessToken, () => {});
  }
  setToken(null);
}

// ── REST helpers ──────────────────────────────────────────────────────────

async function gcalFetch(path, options = {}) {
  if (!_accessToken) throw new Error("Not connected to Google Calendar");
  const base = "https://www.googleapis.com/calendar/v3";
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    // Token expired – clear it so the UI shows "reconnect"
    setToken(null);
    throw new Error("Google Calendar token expired. Please reconnect.");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google API error ${res.status}`);
  }
  if (res.status === 204) return null; // DELETE returns no body
  return res.json();
}

// ── Event CRUD ────────────────────────────────────────────────────────────

/**
 * Fetch all Google Calendar events for the next 90 days.
 * Returns raw Google event objects.
 */
export async function fetchGoogleEvents() {
  const timeMin = new Date().toISOString();
  const future = new Date();
  future.setDate(future.getDate() + 90);
  const timeMax = future.toISOString();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const data = await gcalFetch(`/calendars/primary/events?${params}`);
  return data?.items || [];
}

/**
 * Create a new event in Google Calendar.
 * Returns the created Google event (contains `.id` to store back on the family event).
 */
export async function createGoogleEvent(familyEvent) {
  const body = toGoogleEvent(familyEvent);
  return gcalFetch("/calendars/primary/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateGoogleEvent(googleEventId, familyEvent) {
  const body = toGoogleEvent(familyEvent);
  return gcalFetch(`/calendars/primary/events/${googleEventId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteGoogleEvent(googleEventId) {
  return gcalFetch(`/calendars/primary/events/${googleEventId}`, {
    method: "DELETE",
  });
}

// ── Format converters ─────────────────────────────────────────────────────

/**
 * Convert a Family App event → Google Calendar event body.
 */
export function toGoogleEvent(ev) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (ev.time) {
    // Timed event – add 1 hour as default end time
    const [h, m] = ev.time.split(":").map(Number);
    const endH = String(h + 1 > 23 ? 23 : h + 1).padStart(2, "0");
    return {
      summary: ev.title,
      start: { dateTime: `${ev.date}T${ev.time}:00`, timeZone: tz },
      end:   { dateTime: `${ev.date}T${endH}:${String(m).padStart(2,"0")}:00`, timeZone: tz },
    };
  }
  // All-day event
  return {
    summary: ev.title,
    start: { date: ev.date },
    end:   { date: ev.date },
  };
}

/**
 * Convert a Google Calendar event → Family App event shape.
 */
export function fromGoogleEvent(gev) {
  const date = gev.start?.date || gev.start?.dateTime?.split("T")[0] || "";
  const time = gev.start?.dateTime
    ? gev.start.dateTime.split("T")[1]?.slice(0, 5)
    : "";
  return {
    id:            `gcal_${gev.id}`,
    googleEventId: gev.id,
    title:         gev.summary || "(no title)",
    date,
    time:          time || "",
    members:       [],
    colorMember:   "",
    recurring:     "none",
    countdown:     false,
    fromGoogle:    true,   // flag so UI can show a Google badge
  };
}
