import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'https://mrwash.com';
const LIST_URL = BASE + '/locations/';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outPath = path.join(__dirname, '..', 'src', 'locations.json');

const UA = 'mrwash-location-sync/1.1 (engineering@mrwash.com)';

async function getHtml(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return await r.text();
}

// 1) Get ONLY on-site location pages from /locations/
async function getLocationPages() {
  const html = await getHtml(LIST_URL);
  const $ = cheerio.load(html);
  const urls = new Set();

  $('a[href]').each((_, a) => {
    let href = $(a).attr('href') || '';
    // normalize to absolute
    if (href.startsWith('/')) href = BASE + href;
    if (!href.startsWith(BASE)) return;
    // must look like https://mrwash.com/<slug>/ (no external, no portal)
    const u = new URL(href);
    if (u.hostname !== 'mrwash.com') return;
    if (u.pathname === '/' || u.pathname.startsWith('/locations')) return;
    if (!/^\/[a-z0-9-]+\/$/i.test(u.pathname)) return;
    if (/portal\.mrwash\.com/i.test(href)) return;
    urls.add(u.toString());
  });

  return [...urls];
}

// 2) From each location page, find the Google Maps anchor and use its TEXT as the address
function extractAddress($) {
  let addr = null;
  $('a[href*="google.com"]').each((_, el) => {
    const t = $(el).text().replace(/\s+/g, ' ').trim();
    // simple validation: looks like "123 Something Rd City, ST 12345"
    if (/\d{3,}.*,\s*[A-Za-z .'-]+,\s*(VA|MD|DC|DE)\s+\d{5}/i.test(t)) {
      addr = t;
      return false; // break
    }
  });
  return addr;
}

async function geocode(address) {
  if (!address) return { lat: null, lng: null };
  const u = new URL('https://nominatim.openstreetmap.org/search');
  u.searchParams.set('q', address);
  u.searchParams.set('format', 'json');
  u.searchParams.set('limit', '1');
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) return { lat: null, lng: null };
  const data = await r.json();
  if (!data[0]) return { lat: null, lng: null };
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

function nameFromPage($, url) {
  // Use the H1 or the page title to get the city name, e.g. "Falls Church, VA" -> "Mr Wash – Falls Church"
  const h1 = $('h1').first().text().trim() || '';
  const m = h1.match(/Mr Wash.*? in ([^,]+),\s*(VA|MD|DC|DE)/i) || h1.match(/Mr Wash.*? ([^,]+),\s*(VA|MD|DC|DE)/i);
  const city = m ? m[1] : (url.split('/').filter(Boolean).pop() || '').replace(/-/g, ' ');
  const City = city.split(' ').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ');
  return `Mr Wash – ${City}`;
}

async function run() {
  console.log('Fetching list:', LIST_URL);
  const pages = await getLocationPages();
  if (!pages.length) throw new Error('No location pages found. The site structure may have changed.');

  console.log('Found', pages.length, 'candidate pages');
  const out = [];
  for (const url of pages) {
    try {
      const html = await getHtml(url);
      const $ = cheerio.load(html);
      const address = extractAddress($);
      const name = nameFromPage($, url);
      let lat = null, lng = null;
      if (address) {
        const g = await geocode(address);
        lat = g.lat; lng = g.lng;
      }
      out.push({ name, address, lat, lng, page: url });
      console.log('✓', name, '—', address || 'NO ADDRESS FOUND');
      await new Promise(r => setTimeout(r, 1200)); // be polite to OSM
    } catch (e) {
      console.warn('✗', url, e.message);
    }
  }

  // Deduplicate by page URL just in case
  const seen = new Set();
  const final = out.filter(x => !seen.has(x.page) && seen.add(x.page));

  fs.writeFileSync(outPath, JSON.stringify(final, null, 2));
  console.log(`Wrote ${final.length} locations -> ${outPath}`);
}

run().catch(e => { console.error(e); process.exit(1); });
