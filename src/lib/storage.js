const PREFIX = 'erp:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export function seedOnce(key, seedFn) {
  const existing = localStorage.getItem(PREFIX + key);
  if (existing !== null) return load(key, []);
  const seeded = seedFn();
  save(key, seeded);
  return seeded;
}

export function nextFolio(prefix, list) {
  const n = list.length + 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}

export function resetAll() {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
}
