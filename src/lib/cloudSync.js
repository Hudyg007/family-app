/**
 * cloudSync.js — Supabase helpers for cross-device sync
 *
 * Table schema (run once in Supabase SQL editor):
 *
 *   create table if not exists family_hub (
 *     email       text primary key,
 *     account_json jsonb not null default '{}',
 *     family_json  jsonb not null default '{}',
 *     updated_at   timestamptz default now()
 *   );
 *   alter table family_hub enable row level security;
 *   create policy "allow_all" on family_hub for all using (true) with check (true);
 */

import { supabase, cloudEnabled } from "./supabase.js";

const TABLE = "family_hub";

/** Push account credentials to the cloud (non-blocking, silent on failure) */
export async function pushAccountToCloud(email, accountJson) {
  if (!cloudEnabled || !email) return;
  try {
    await supabase.from(TABLE).upsert(
      { email: email.toLowerCase(), account_json: accountJson, updated_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: false }
    );
  } catch { /* silent */ }
}

/** Push family data to the cloud (non-blocking, silent on failure) */
export async function pushFamilyToCloud(email, familyJson) {
  if (!cloudEnabled || !email) return;
  try {
    await supabase.from(TABLE).upsert(
      { email: email.toLowerCase(), family_json: familyJson, updated_at: new Date().toISOString() },
      { onConflict: "email", ignoreDuplicates: false }
    );
  } catch { /* silent */ }
}

/**
 * Pull full account + family data for an email.
 * Returns { accountJson, familyJson } or null if not found.
 */
export async function pullFromCloud(email) {
  if (!cloudEnabled || !email) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("account_json, family_json")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return { accountJson: data.account_json, familyJson: data.family_json };
  } catch {
    return null;
  }
}

/** Check if a cloud record exists for an email */
export async function cloudAccountExists(email) {
  if (!cloudEnabled || !email) return false;
  try {
    const { data } = await supabase
      .from(TABLE)
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}
