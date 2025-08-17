import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, '..', 'src', 'locations.json');

// --- parse args ---
const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const [k, ...rest] = s.replace(/^--/, '').split('=');
  return [k, rest.join('=')];
}));
const match = args.match || 'Germantown';
const address = args.address;
const name = args.name || null;
if (!address) {
  console.error('Usage: node scripts/set-location.mjs --match="Germantown" --address="19947 Father Hurley Blvd, Germantown, MD 20874" [--name="Mr Wash – Germantown"]');
  process.exit(2);
}

// --- helpers ---
async function geocode(addr) {
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('q', addr);
  u.searchParams.set('format', 'json');
  u.searchParams.set('limit', '1');
  const r = await fetch(u, { headers: { 'User-Agent': 'mrwash-fix/1.0 (engineering@mrwash.com)' } });
  if (!r.ok) return { lat: null, lng: null };
  const data = await r.json();
  if (!data[0]) return { lat: null, lng: null };
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

// --- load + update ---
const list = JSON.parse(fs.readFileSync(file, 'utf-8'));
let idx = list.findIndex(
  (x) =>
    (x.name && String(x.name).toLowerCase().includes(match.toLowerCase())) ||
    (x.address && String(x.address).toLowerCase().includes(match.toLowerCase()))
);

if (idx === -1) {
  // add new entry if we didn’t find one
  list.push({ name: name || `Mr Wash – ${match}`, address, lat: null, lng: null });
  idx = list.length - 1;
} else {
  list[idx].address = address;
  if (name) list[idx].name = name;
}

// geocode and save
const { lat, lng } = await geocode(address);
list[idx].lat = lat;
list[idx].lng = lng;

fs.writeFileSync(file, JSON.stringify(list, null, 2));
console.log('Updated location:', list[idx]);
