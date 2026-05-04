// ── Gemini Chat Edge Function ─────────────────────────────────────────────
// Proxies requests from the Family App to Google's Gemini API.
// The API key is stored as a Supabase secret — never exposed to the browser.
//
// Deploy via Supabase dashboard → Edge Functions → New Function → paste this code
// Then set the secret: GEMINI_API_KEY = your key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL          = "gemini-1.5-flash";
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Pre-flight
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const { messages, familyData } = await req.json();

    // Build Gemini-format message array (user / model alternation)
    const contents = (messages as { role: string; content: string }[]).map(m => ({
      role:  m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      contents,
      systemInstruction: { parts: [{ text: buildSystem(familyData) }] },
      generationConfig:  { temperature: 0.7, maxOutputTokens: 1024 },
    };

    const gemRes  = await fetch(GEMINI_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const gemData = await gemRes.json();

    if (!gemRes.ok) {
      throw new Error(gemData?.error?.message ?? `Gemini error ${gemRes.status}`);
    }

    const reply = gemData?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Sorry, I couldn't generate a response right now.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...CORS },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status:  500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }
});

// ── System prompt builder ─────────────────────────────────────────────────

function buildSystem(d: any): string {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const upcomingEvents = (d?.events ?? [])
    .filter((e: any) => e.date >= todayStr)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .slice(0, 30);

  const members  = d?.members  ?? [];
  const chores   = d?.chores   ?? [];
  const wallets  = d?.wallets  ?? {};
  const goals    = d?.goals    ?? [];
  const budget   = d?.budget   ?? [];

  return `You are a warm, friendly AI assistant built into the Family Hub app.
Today is ${today}.

Your role is to help the family stay organised, answer questions about their schedule, chores, and finances, and offer helpful life-organisation suggestions. Keep responses concise and friendly — you're talking to parents and kids.

── FAMILY MEMBERS ──
${JSON.stringify(members, null, 2)}

── UPCOMING EVENTS ──
${JSON.stringify(upcomingEvents, null, 2)}

── CHORES ──
${JSON.stringify(chores, null, 2)}

── WALLETS ──
${JSON.stringify(wallets, null, 2)}

── GOALS ──
${JSON.stringify(goals, null, 2)}

── BUDGET ──
${JSON.stringify(budget, null, 2)}

Guidelines:
- Answer questions using the data above whenever possible.
- Be encouraging and positive, especially with kids.
- If you suggest a new app feature, clearly label it as a "Feature Suggestion 💡" and explain what it would do. It will be sent to the app owner for approval before anything is built.
- Never make up family data — only use what's provided above.
- Keep responses under 200 words unless a detailed answer is truly needed.`;
}
