/* Dolphin Sonar: turns a listing link plus listing text into calculator inputs.
   It never fetches anything. It reads only what the user pastes or sends from their own open page. Original code. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SONAR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const title = (s) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
  const toNum = (s) => { const n = parseFloat(String(s).replace(/[$,\s]/g, '')); return Number.isFinite(n) ? n : 0; };
  function money(s, suffix) { // "$1.25M", "850K", "1,200"
    let n = toNum(s); const sx = (suffix || '').toLowerCase();
    if (sx === 'm') n *= 1e6; else if (sx === 'k') n *= 1e3; return n;
  }
  const monthly = (v, unit) => { const u = (unit || '').toLowerCase(); if (/^y|^a/.test(u)) return v / 12; if (/^q/.test(u)) return v / 3; return v; };

  /* ---------- the link ---------- */
  function parseUrl(raw) {
    const out = { site: '', address: '', city: '', state: '', zip: '', unit: '', listingId: '' };
    let u; try { u = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return out; }
    const host = u.hostname.replace(/^www\./, '').toLowerCase(), parts = u.pathname.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
    const clean = (s) => title(s.replace(/-/g, ' ').replace(/\s+/g, ' ').trim());
    if (host.endsWith('redfin.com')) {
      out.site = 'Redfin';
      const st = parts.findIndex((p) => /^[A-Z]{2}$/.test(p));
      if (st >= 0 && parts[st + 2]) {
        out.state = parts[st]; out.city = clean(parts[st + 1]);
        const m = parts[st + 2].match(/^(.*?)-(\d{5})$/);
        out.address = m ? clean(m[1]) : clean(parts[st + 2]); if (m) out.zip = m[2];
        const un = parts.find((p) => /^unit-/i.test(p)); if (un) out.unit = un.replace(/^unit-/i, '').toUpperCase();
      }
      const id = parts[parts.length - 1]; if (/^\d{5,}$/.test(id)) out.listingId = id;
    } else if (host.endsWith('zillow.com')) {
      out.site = 'Zillow';
      const slug = parts.find((p, i) => parts[i - 1] === 'homedetails' || parts[i - 1] === 'b') || '';
      const m = slug.match(/^(.*)-([A-Z]{2})-(\d{5})$/i);
      if (m) { out.address = clean(m[1]); out.state = m[2].toUpperCase(); out.zip = m[3]; } else out.address = clean(slug);
      const z = parts.find((p) => /_zpid$/i.test(p)); if (z) out.listingId = z.replace(/_zpid$/i, '');
    } else if (host.endsWith('streeteasy.com')) {
      out.site = 'StreetEasy';
      const i = parts.indexOf('building');
      if (i >= 0 && parts[i + 1]) { out.address = clean(parts[i + 1]); if (parts[i + 2]) out.unit = parts[i + 2].toUpperCase(); }
      const j = parts.findIndex((p) => p === 'sale' || p === 'rental'); if (j >= 0 && /^\d+$/.test(parts[j + 1] || '')) out.listingId = parts[j + 1];
      out.state = 'NY';
    }
    return out;
  }

  /* ---------- structured data (schema.org JSON-LD) ---------- */
  function fromJsonLd(str) {
    const found = {}; if (!str) return found;
    const walk = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(walk);
      const t = [].concat(o['@type'] || []).join(' ');
      if (o.offers) { const f = [].concat(o.offers)[0]; if (f && f.price && !found.price) found.price = toNum(f.price); }
      if (/Residence|House|Apartment|Accommodation|RealEstate|Product|Place/i.test(t) || o.numberOfBedrooms || o.address) {
        if (o.numberOfBedrooms && !found.beds) found.beds = toNum(o.numberOfBedrooms);
        const ba = o.numberOfBathroomsTotal || o.numberOfFullBathrooms; if (ba && !found.baths) found.baths = toNum(ba);
        if (o.floorSize && !found.sqft) found.sqft = toNum(o.floorSize.value || o.floorSize);
        if (o.yearBuilt && !found.year) found.year = toNum(o.yearBuilt);
        if (o.address && typeof o.address === 'object' && o.address.streetAddress && !found.address) found.address = String(o.address.streetAddress);
      }
      Object.keys(o).forEach((k) => { if (typeof o[k] === 'object') walk(o[k]); });
    };
    String(str).split('\n').forEach((chunk) => { try { walk(JSON.parse(chunk)); } catch (e) { /* not JSON on its own */ } });
    try { walk(JSON.parse(str)); } catch (e) { /* several blocks joined */ }
    return found;
  }

  /* ---------- the text ---------- */
  function parseText(text) {
    const t = String(text || '').slice(0, 60000), r = {}, one = (re) => { const m = t.match(re); return m; };
    // price: label first, then the first plausible amount
    let m = one(/(?:list(?:ed|ing)?\s*price|asking(?:\s*price)?|price|sale\s*price|listed\s*(?:at|for))\s*[:\-]?\s*\$\s?([\d,.]+)\s*([MmKk])?\b/);
    if (!m) m = one(/\$\s?([\d,]{5,}(?:\.\d+)?)\s*([MmKk])?\b|\$\s?(\d+(?:\.\d+)?)\s*([Mm])\b/);
    if (m) { const v = m[1] ? money(m[1], m[2]) : money(m[3], m[4]); if (v >= 10000) r.price = v; }
    m = one(/(\d+(?:\.\d)?)\s*(?:bd|beds?|bedrooms?)\b/i); if (m) r.beds = +m[1];
    m = one(/(\d+(?:\.\d)?)\s*(?:ba|baths?|bathrooms?)\b/i); if (m) r.baths = +m[1];
    m = one(/([\d,]{3,6})\s*(?:sq\.?\s?ft\.?|sqft|square\s*feet)/i); if (m) r.sqft = toNum(m[1]);
    m = one(/(?:year\s*built|built\s*in|built)\D{0,12}(1[6-9]\d\d|20\d\d)/i); if (m) r.year = +m[1];
    m = one(/(?:hoa|association)(?:\s*(?:fees?|dues))?[^$\n]{0,30}\$\s?([\d,]+(?:\.\d+)?)(?:\s*(?:\/|per)?\s*(mo(?:nth)?|yr|year|annual(?:ly)?|quarter(?:ly)?))?/i);
    if (m) r.hoaMo = Math.round(monthly(toNum(m[1]), m[2] || 'mo'));
    m = one(/common\s*charges?[^$\n]{0,25}\$\s?([\d,]+)/i); if (m) r.commonMo = toNum(m[1]);
    m = one(/(?:monthly\s*)?maintenance(?:\s*fee)?[^$\n]{0,25}\$\s?([\d,]+)/i); if (m) r.maintMo = toNum(m[1]);
    m = one(/(?:real\s*estate\s*|property\s*)?tax(?:es)?(?:\s*(?:\(monthly\)|monthly|annual|yearly))?[^$\n]{0,30}\$\s?([\d,]+(?:\.\d+)?)(?:\s*(?:\/|per)?\s*(mo(?:nth)?|yr|year|annual(?:ly)?))?/i);
    if (m) { const v = toNum(m[1]); let unit = m[2]; if (!unit) { const line = m[0].toLowerCase(); unit = /monthly/.test(line) ? 'mo' : /annual|yearly/.test(line) ? 'yr' : (r.price && v / r.price * 100 < 0.5 ? 'mo' : 'yr'); } r.taxYr = Math.round(/^y|^a/i.test(unit) ? v : v * 12); }
    m = one(/(?:rent\s*zestimate|rental\s*estimate|estimated\s*rent|rent\s*estimate|market\s*rent)[^$\n]{0,25}\$\s?([\d,]+)/i); if (m) r.rent = toNum(m[1]);
    m = one(/(\d)\s*[- ]?\s*(?:units?|family)\b/i); if (m && +m[1] >= 2 && +m[1] <= 8) r.units = +m[1];
    if (/duplex/i.test(t)) r.units = r.units || 2; else if (/triplex/i.test(t)) r.units = r.units || 3; else if (/fourplex|quadplex/i.test(t)) r.units = r.units || 4;
    if (/\bco-?op\b|cooperative/i.test(t)) r.type = 'coop';
    else if (/\bcondo(?:minium)?\b/i.test(t)) r.type = 'condo';
    else if (/vacant\s*land|lot\s*\/\s*land|land\s*for\s*sale|buildable\s*lot|\bacres?\b.*\b(?:lot|land)\b/i.test(t) && !r.beds) r.type = 'land';
    else if (r.units >= 2 || /multi-?family/i.test(t)) r.type = 'multi';
    else if (/townhouse|townhome/i.test(t)) r.type = 'townhouse'; else if (r.beds || /single[- ]family|house/i.test(t)) r.type = 'house';
    return r;
  }

  const LABEL = { price: 'Price', beds: 'Bedrooms', baths: 'Bathrooms', sqft: 'Square feet', year: 'Year built', hoaMo: 'HOA per month', commonMo: 'Common charges per month', maintMo: 'Co-op maintenance per month', taxYr: 'Property tax per year', rent: 'Rent estimate per month', units: 'Units' };
  function parseListing(o) {
    const link = parseUrl(o.url || ''), ld = fromJsonLd(o.jsonld), tx = parseText(o.text);
    const f = Object.assign({}, tx, Object.fromEntries(Object.entries(ld).filter(([k, v]) => v && k !== 'address' && !(tx[k] && k !== 'price'))));
    if (ld.price && ld.price >= 10000) f.price = ld.price;
    const address = link.address ? [link.address, link.unit ? 'Unit ' + link.unit : '', link.city, link.state, link.zip].filter(Boolean).join(', ') : (ld.address || '');
    const type = f.type || (link.site === 'StreetEasy' ? '' : '');
    const found = Object.keys(LABEL).filter((k) => f[k]).map((k) => ({ key: k, label: LABEL[k], value: f[k] }));
    return { site: link.site, address, listingId: link.listingId, type, facts: f, found, link };
  }

  /* ---------- map onto a calculator mode ---------- */
  function suggestMode(p) { const t = p.type; return t === 'coop' ? 'coop' : t === 'condo' ? 'condo' : t === 'land' ? 'land' : t === 'multi' ? 'house-hacker' : 'home'; }
  function toValues(p, mode, fields) {
    const f = p.facts, v = {}, set = (k, x) => { if (x > 0 && fields.includes(k)) v[k] = Math.round(x * 100) / 100; };
    const taxMo = f.taxYr ? f.taxYr / 12 : 0, dues = f.commonMo || f.hoaMo || 0;
    set('price', f.price);
    if (f.price && f.taxYr) set('taxPct', (f.taxYr / f.price) * 100);
    set('taxYr', f.taxYr); set('taxMo', taxMo);
    if (mode === 'condo') { set('hoaMo', dues); }
    else if (mode === 'coop') { set('maintMo', f.maintMo || dues); }
    else if (mode === 'investment') { set('rent', f.rent); set('utilMo', f.hoaMo || f.commonMo || 0); }
    else if (mode === 'home-rental') { set('rent', f.rent); }
    else if (mode === 'house-hacker') { const n = f.units || 2; set('unitsTotal', n); set('unitsRented', n - 1); if (f.rent) set('rent', f.rent / (f.units ? 1 : 1)); }
    else { set('hoaMo', dues); }
    if (mode === 'condo' && f.hoaMo && !f.commonMo) set('hoaMo', f.hoaMo);
    return v;
  }
  function decodeHash(hash) {
    const m = String(hash || '').match(/^#?sonar=([A-Za-z0-9_\-]{1,200000})$/); if (!m) return null;
    try {
      const b = m[1].replace(/-/g, '+').replace(/_/g, '/'), pad = b + '==='.slice((b.length + 3) % 4);
      const bin = typeof atob === 'function' ? atob(pad) : Buffer.from(pad, 'base64').toString('binary');
      const json = decodeURIComponent(bin.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const d = JSON.parse(json); return { url: String(d.u || '').slice(0, 500), text: String(d.t || '').slice(0, 60000), jsonld: String(d.j || '').slice(0, 20000) };
    } catch (e) { return null; }
  }
  function bookmarkletSource(calcUrl) {
    const K = '/\\$|\\bbeds?\\b|\\bbd\\b|\\bbaths?\\b|\\bba\\b|sq\\.?\\s?ft|hoa|tax|maintenance|common charge|year built|built in|rent|zestimate|units?\\b|\\blot\\b|co-?op|condo|duplex|triplex|multi-?family|vacant land/i';
    return "javascript:(function(){var K=" + K + ";var L=(document.body.innerText||'').split('\\n').map(function(s){return s.trim()}).filter(function(s){return s&&s.length<300&&K.test(s)}).slice(0,160).join('\\n');" +
      "var J=[].slice.call(document.querySelectorAll('script[type=\"application/ld+json\"]')).map(function(s){return s.textContent}).join('\\n').slice(0,6000);" +
      "var b=btoa(unescape(encodeURIComponent(JSON.stringify({u:location.href,t:L,j:J})))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');" +
      "window.open(" + JSON.stringify(calcUrl) + "+'#sonar='+b,'_blank')})();";
  }
  return { parseUrl, fromJsonLd, parseText, parseListing, suggestMode, toValues, decodeHash, bookmarkletSource, LABEL };
});
