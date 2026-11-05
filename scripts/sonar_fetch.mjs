// Dolphin Sonar link reader: a polite, single-URL page reader.
// Rules built in: obeys robots.txt, refuses listing portals whose terms forbid automated access,
// identifies itself, never evades blocking (no stealth, proxies, cookies or CAPTCHA handling),
// blocks private network addresses (SSRF), and stops at the first refusal.
// CLI: node scripts/sonar_fetch.mjs <url>
import dns from 'node:dns/promises';
import net from 'node:net';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../assets/calc/sonar.js');

export const UA = 'FiveOceansSonar/1.0 (+https://github.com/Sukonik/5oceans; reads one user-supplied URL; obeys robots.txt)';
// Listing portals whose terms of use generally forbid automated access. Sonar will not fetch these.
export const DENY = ['zillow.com', 'redfin.com', 'streeteasy.com', 'realtor.com', 'trulia.com', 'homes.com', 'apartments.com', 'loopnet.com', 'compass.com', 'movoto.com', 'zumper.com', 'hotpads.com', 'rent.com', 'craigslist.org', 'onekeymls.com'];
const MAX_BYTES = 1_500_000, TIMEOUT = 10_000, MAX_REDIRECTS = 3;
const BLOCK_MARKERS = /captcha|are you a robot|access denied|px-captcha|cf-chl|verify you are human|unusual traffic|request blocked/i;

export const hostDenied = (host) => DENY.some((d) => host === d || host.endsWith('.' + d));

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === '::1' || x === '::' || x.startsWith('fe80') || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('ff')) return true;
    const m = x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); return m ? isPrivateIp(m[1]) : false;
  }
  return true;
}

/** Decide whether a URL may be read at all, without touching the network. */
export function policy(raw, { allowPrivate = false } = {}) {
  let u; try { u = new URL(raw); } catch (e) { return { ok: false, code: 'bad-url', reason: 'That is not a valid link.' }; }
  if (!/^https?:$/.test(u.protocol)) return { ok: false, code: 'bad-scheme', reason: 'Only http and https links can be read.' };
  if (u.username || u.password) return { ok: false, code: 'bad-url', reason: 'Links with a username or password are not read.' };
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (hostDenied(host)) return { ok: false, code: 'portal', reason: `${host} is a listing portal whose terms generally forbid automated access, so Sonar does not fetch it. Use the link for the address and paste the listing text, or use the bookmarklet.` };
  if (!allowPrivate) {
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return { ok: false, code: 'private', reason: 'Private addresses are not read.' };
    if (net.isIP(host) && isPrivateIp(host)) return { ok: false, code: 'private', reason: 'Private addresses are not read.' };
    if (u.port && !['80', '443'].includes(u.port)) return { ok: false, code: 'port', reason: 'Only the standard web ports are read.' };
  }
  return { ok: true, url: u };
}

async function resolvePublic(host, allowPrivate) {
  if (allowPrivate || net.isIP(host)) return;
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw Object.assign(new Error('private'), { code: 'private' });
}

/** Parse robots.txt text and decide for a path. Longest matching rule wins; Allow wins ties. */
export function robotsAllows(txt, path, ua = 'fiveoceanssonar') {
  const groups = []; let cur = null;
  for (const raw of String(txt || '').split(/\r?\n/)) {
    const line = raw.split('#')[0].trim(); if (!line) continue;
    const i = line.indexOf(':'); if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase(), v = line.slice(i + 1).trim();
    if (k === 'user-agent') { if (!cur || cur.rules.length) { cur = { ua: [], rules: [] }; groups.push(cur); } cur.ua.push(v.toLowerCase()); }
    else if ((k === 'allow' || k === 'disallow') && cur) cur.rules.push([k, v]);
  }
  const mine = groups.filter((g) => g.ua.some((x) => x !== '*' && ua.includes(x)));
  const use = mine.length ? mine : groups.filter((g) => g.ua.includes('*'));
  let best = { len: -1, allow: true };
  for (const g of use) for (const [k, v] of g.rules) {
    if (!v) continue;
    const re = new RegExp('^' + v.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(path) && (v.length > best.len || (v.length === best.len && k === 'allow'))) best = { len: v.length, allow: k === 'allow' };
  }
  return best.allow;
}

async function get(url, accept, opts, signal) {
  const res = await fetch(url, { redirect: 'manual', signal, headers: { 'User-Agent': UA, Accept: accept, 'Accept-Language': 'en-US,en;q=0.8' } });
  return res;
}
async function body(res) {
  const reader = res.body.getReader(), chunks = []; let n = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; n += value.length; if (n > MAX_BYTES) { await reader.cancel(); break; } chunks.push(value); }
  return Buffer.concat(chunks).toString('utf8');
}

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d));
export function extract(html) {
  const jsonld = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].trim()).join('\n').slice(0, 20000);
  const meta = (n) => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']*)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${n}["']`, 'i')); return m ? decode(m[1]) : ''; };
  const price = meta('product:price:amount') || meta('og:price:amount'), title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ''])[1]).trim();
  const body = decode(html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d|td|th|section|span)>/gi, '\n').replace(/<[^>]+>/g, ' '));
  const og = meta('og:description');
  const text = [...(price ? ['Price: $' + price] : []), ...(og && S.KEEP.test(og) ? [og] : []), S.selectLines(body, 30000)].filter(Boolean).join('\n');
  return { title, jsonld, text };
}

let lastAt = 0;
/** Read one link. Resolves to { ok, status, reason, code, finalUrl, title, jsonld, text }. Never throws. */
export async function readLink(raw, { allowPrivate = process.env.SONAR_ALLOW_PRIVATE === '1', minGapMs = 1000 } = {}) {
  const gate = policy(raw, { allowPrivate });
  if (!gate.ok) return gate;
  const wait = lastAt + minGapMs - Date.now(); if (wait > 0) await new Promise((r) => setTimeout(r, wait)); lastAt = Date.now();
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT);
  try {
    let url = gate.url;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const g = policy(url.href, { allowPrivate }); if (!g.ok) return g;
      await resolvePublic(url.hostname.toLowerCase(), allowPrivate);
      // robots.txt first
      let rob = '';
      const rr = await get(new URL('/robots.txt', url.origin).href, 'text/plain', {}, ctl.signal);
      if (rr.status >= 500) return { ok: false, code: 'robots', reason: 'robots.txt could not be read, so the page was not fetched.' };
      if (rr.status === 200) rob = (await body(rr)).slice(0, 200000); else if (rr.body) await rr.body.cancel();
      if (!robotsAllows(rob, url.pathname + url.search)) return { ok: false, code: 'robots', reason: 'The site\'s robots.txt does not allow this page to be read by a bot. Paste the text instead.' };
      const res = await get(url.href, 'text/html,application/xhtml+xml', {}, ctl.signal);
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) { if (res.body) await res.body.cancel(); url = new URL(res.headers.get('location'), url); continue; }
      if ([401, 403, 429, 503].includes(res.status)) { if (res.body) await res.body.cancel(); return { ok: false, code: 'blocked', status: res.status, reason: `The site refused automated access (HTTP ${res.status}). Sonar does not try to get around that. Paste the listing text instead.` }; }
      if (res.status !== 200) { if (res.body) await res.body.cancel(); return { ok: false, code: 'http', status: res.status, reason: `The page returned HTTP ${res.status}.` }; }
      const ct = res.headers.get('content-type') || ''; if (!/html|xml/i.test(ct)) { await res.body.cancel(); return { ok: false, code: 'type', reason: 'That link is not a web page.' }; }
      const html = await body(res);
      if (BLOCK_MARKERS.test(html.slice(0, 20000)) && html.length < 60000 && !/application\/ld\+json/i.test(html)) return { ok: false, code: 'blocked', status: 200, reason: 'The page looks like a bot check. Sonar does not try to get around that. Paste the listing text instead.' };
      return { ok: true, status: 200, finalUrl: url.href, ...extract(html) };
    }
    return { ok: false, code: 'redirects', reason: 'Too many redirects.' };
  } catch (e) {
    return { ok: false, code: e.code === 'private' ? 'private' : 'error', reason: e.code === 'private' ? 'Private addresses are not read.' : (e.name === 'AbortError' ? 'The page took too long to answer.' : 'The page could not be reached.') };
  } finally { clearTimeout(timer); }
}

/** Read a link and run it through Sonar. */
export async function pingLink(raw, opts) {
  const r = await readLink(raw, opts), link = S.parseUrl(raw);
  const p = S.parseListing({ url: raw, text: r.ok ? r.text : '', jsonld: r.ok ? r.jsonld : '' });
  return { read: r, listing: p };
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv[2]) {
  const { read, listing } = await pingLink(process.argv[2]);
  console.log(JSON.stringify({ ok: read.ok, code: read.code, reason: read.reason, status: read.status, address: listing.address, site: listing.site, facts: Object.fromEntries(listing.found.map((f) => [f.label, f.value])) }, null, 2));
}
