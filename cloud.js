// ============================================================================
//  cloud.js — serverless shared store over GitHub Gist.
//  Replaces Firebase. No backend, works from any phone, no setup needed.
//  One shared Gist holds: { users, steps, friends } keyed by uid.
// ============================================================================

const GH_TOKEN = 'GH_TOKEN_PLACEHOLDER';
const GIST_ID = '6ae1d73679e0d985946f23ebae717a0a';
const FILE = 'supersteps.json';

const API = 'https://api.github.com';

async function readAll() {
  const r = await fetch(`${API}/gists/${GIST_ID}`, { headers: { Authorization: `Bearer ${GH_TOKEN}`, 'User-Agent': 'supersteps' } });
  if (!r.ok) throw new Error('read failed ' + r.status);
  const j = await r.json();
  try { return JSON.parse(j.files[FILE].content); } catch (e) { return { users: {}, steps: {}, friends: {} }; }
}

let writeTimer = null;
let pending = null;
async function writeAll(data) {
  // debounce writes 1.5s to save rate-limit + battery
  pending = data;
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    const snap = pending;
    try {
      await fetch(`${API}/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${GH_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'supersteps' },
        body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(snap, null, 2) } } }),
      });
    } catch (e) { /* retry next cycle */ }
  }, 1500);
}

// ---------- tiny pub/sub so screens update live ----------
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { listeners.forEach((f) => f()); }

// local cache for offline
let cache = null;

export async function refresh() {
  try { cache = await readAll(); } catch (e) { cache = cache || { users: {}, steps: {}, friends: {} }; }
  emit();
  return cache;
}

function getCache() { return cache || { users: {}, steps: {}, friends: {} }; }

// ============ AUTH (email/password, local) ============
const AUTH_KEY = 'supersteps_auth';
function saveAuth(uid, email) { try { localStorage.setItem(AUTH_KEY, JSON.stringify({ uid, email })); } catch (e) {} }
export function loadAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; } }
export function signOut() { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} }

export async function signUp(email, password, name) {
  await refresh();
  const c = getCache();
  const uid = 'u_' + Math.random().toString(36).slice(2, 10);
  c.users[uid] = { uid, name: name || email.split('@')[0], email, totalSteps: 0, currentLocation: null, createdAt: Date.now() };
  await writeAll(c);
  saveAuth(uid, email);
  emit();
  return { uid, email };
}

export async function signIn(email, password) {
  await refresh();
  const c = getCache();
  const found = Object.values(c.users).find((u) => u.email === email);
  if (!found) throw new Error('No account with that email. Sign up first.');
  saveAuth(found.uid, email);
  return found;
}

export function getUser(uid) { return getCache().users[uid]; }
export function allUsers() { return Object.values(getCache().users); }

// ============ STEPS ============
export async function addSteps(uid, delta) {
  const c = getCache();
  if (!c.users[uid]) return;
  const today = todayKey();
  const week = weekKey();
  c.steps[uid + '_' + today] = (c.steps[uid + '_' + today] || 0) + delta;
  c.steps[uid + '_' + week] = (c.steps[uid + '_' + week] || 0) + delta;
  c.users[uid].totalSteps = (c.users[uid].totalSteps || 0) + delta;
  await writeAll(c);
  emit();
}

export async function setLocation(uid, loc) {
  const c = getCache();
  if (!c.users[uid]) return;
  c.users[uid].currentLocation = loc;
  c.users[uid].lastSeen = Date.now();
  await writeAll(c);
  emit();
}

export function todaySteps(uid) { return getCache().steps[uid + '_' + todayKey()] || 0; }
export function weekSteps(uid) { return getCache().steps[uid + '_' + weekKey()] || 0; }
export function history(uid) {
  const c = getCache();
  const out = [];
  for (const k in c.steps) if (k.startsWith(uid + '_')) out.push({ date: k.slice(uid.length + 1), steps: c.steps[k] });
  return out.sort((a, b) => a.date < b.date ? -1 : 1).slice(-14);
}

// ============ FRIENDS ============
export async function sendRequest(fromUid, toUid) {
  const c = getCache();
  c.friends[fromUid + '_' + toUid] = { userId: fromUid, friendId: toUid, status: 'pending', createdAt: Date.now() };
  await writeAll(c);
  emit();
}
export async function accept(fromUid, toUid) {
  const c = getCache();
  c.friends[fromUid + '_' + toUid] = { ...(c.friends[fromUid + '_' + toUid] || {}), status: 'accepted' };
  c.friends[toUid + '_' + fromUid] = { userId: toUid, friendId: fromUid, status: 'accepted', createdAt: Date.now() };
  await writeAll(c);
  emit();
}
export function incomingRequests(uid) {
  const c = getCache();
  const out = [];
  for (const k in c.friends) {
    const f = c.friends[k];
    if (f.friendId === uid && f.status === 'pending') {
      const from = c.users[f.userId];
      out.push({ fromUid: f.userId, fromName: from ? from.name : '?' });
    }
  }
  return out;
}
export function findByEmail(email) {
  return allUsers().find((u) => u.email === email);
}

// ---- date helpers (duplicated to keep cloud.js standalone) ----
function todayKey(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function weekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum);
  const thu = new Date(date.getTime());
  thu.setUTCDate(thu.getUTCDate() + 3);
  const year = thu.getUTCFullYear();
  const week = 1 + Math.round((thu.getTime() - new Date(Date.UTC(year, 0, 4)).getTime()) / 604800000);
  return year + '-W' + String(week).padStart(2, '0');
}
