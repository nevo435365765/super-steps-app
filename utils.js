// ============================================================================
//  Utils — date keys, distance, color helpers
// ============================================================================

export function todayKey(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function weekKey(d = new Date()) {
  // ISO-ish week key: year-Www
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum);
  const thu = new Date(date.getTime());
  thu.setUTCDate(thu.getUTCDate() + 3); // nearest Thursday
  const year = thu.getUTCFullYear();
  const week = 1 + Math.round((thu.getTime() - new Date(Date.UTC(year, 0, 4)).getTime()) / 604800000);
  return year + '-W' + String(week).padStart(2, '0');
}

export function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function fmtNum(n) {
  return (n || 0).toLocaleString('en-US');
}

export function avatarColor(name = '') {
  const palette = ['#4f8cff', '#36c08a', '#ffb020', '#ff5a5a', '#a96bff', '#1fb6ff'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}
