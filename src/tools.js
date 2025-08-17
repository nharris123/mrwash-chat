// src/tools.js — dynamic loader (reads locations.json on each call)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOC_PATH = path.join(__dirname, 'locations.json');

function loadLocations() {
  try {
    const raw = fs.readFileSync(LOC_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return (Array.isArray(data) ? data : []).map((loc) => {
      const copy = { ...loc };
      if (copy.lat !== null && copy.lat !== undefined) copy.lat = Number(copy.lat);
      if (copy.lng !== null && copy.lng !== undefined) copy.lng = Number(copy.lng);
      return copy;
    });
  } catch (e) {
    console.error('Failed to load locations.json:', e.message);
    return [];
  }
}

function toRad(d) { return (d * Math.PI) / 180; }
function milesBetween(a, b) {
  if (!a || !b) return null;
  const { lat: lat1, lng: lon1 } = a;
  const { lat: lat2, lng: lon2 } = b;
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function listAllLocations() {
  return loadLocations(); // always fresh
}

export function nearestLocations({ lat, lng, limit = 3 }) {
  const here = { lat: Number(lat), lng: Number(lng) };
  if (Number.isNaN(here.lat) || Number.isNaN(here.lng)) return [];
  return loadLocations()
    .map(loc => {
      const d = milesBetween(here, loc);
      return d == null ? null : { ...loc, distance_mi: Number(d.toFixed(2)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance_mi - b.distance_mi)
    .slice(0, Math.max(1, Number(limit) || 3));
}

export function findNearestLocation({ lat, lng }) {
  const list = nearestLocations({ lat, lng, limit: 1 });
  return list[0] || { error: 'No geocoded locations available' };
}

export default { listAllLocations, nearestLocations, findNearestLocation };
