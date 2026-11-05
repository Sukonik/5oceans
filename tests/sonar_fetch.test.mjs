import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { policy, isPrivateIp, robotsAllows, extract, readLink, pingLink } from '../scripts/sonar_fetch.mjs';
const SN = createRequire(import.meta.url)('../assets/calc/sonar.js');
let n = 0; const ok = (name, fn) => Promise.resolve(fn()).then(() => { n++; console.log('ok', name); });

const LISTING = `<!doctype html><html><head><title>9 Shell Ln</title><meta property="og:description" content="Charming 3 bed 2 bath home"><meta property="product:price:amount" content="699000">
<script type="application/ld+json">{"@type":"SingleFamilyResidence","numberOfBedrooms":3,"numberOfBathroomsTotal":2,"floorSize":{"value":1700},"yearBuilt":1990,"address":{"streetAddress":"9 Shell Ln"},"offers":{"price":"699000"}}</script>
<style>.x{color:red}</style></head><body><script>var price="$1";</script><h1>$699,000</h1><p>3 beds 2 baths 1,700 sq ft</p><ul><li>Property taxes: $8,400 / yr</li><li>HOA fee $60 / month</li></ul><p>unrelated words here</p></body></html>`;
const srv = http.createServer((req, res) => {
  const send = (c, t, b, h = {}) => { res.writeHead(c, { 'content-type': t, ...h }); res.end(b); };
  if (req.url === '/robots.txt') return send(200, 'text/plain', 'User-agent: *\nDisallow: /private/\nAllow: /\n');
  if (req.url === '/listing') return send(200, 'text/html', LISTING);
  if (req.url === '/private/listing') return send(200, 'text/html', LISTING);
  if (req.url === '/blocked') return send(403, 'text/html', 'denied');
  if (req.url === '/botwall') return send(200, 'text/html', '<html><body>Please verify you are human: captcha</body></html>');
  if (req.url === '/redir') return send(302, 'text/plain', '', { location: '/listing' });
  if (req.url === '/loop') return send(302, 'text/plain', '', { location: '/loop' });
  if (req.url === '/pdf') return send(200, 'application/pdf', '%PDF');
  send(404, 'text/plain', 'no');
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${srv.address().port}`, O = { allowPrivate: true, minGapMs: 0 };

await ok('policy refuses listing portals, bad schemes and private hosts', () => {
  for (const u of ['https://www.zillow.com/homedetails/1-Main-St-NY-10001/1_zpid/', 'https://redfin.com/NY/x/y/home/1', 'https://streeteasy.com/building/a/4b', 'https://www.realtor.com/x', 'https://sub.apartments.com/y']) assert.equal(policy(u).code, 'portal', u);
  assert.equal(policy('ftp://x.test/a').code, 'bad-scheme'); assert.equal(policy('not a url').code, 'bad-url');
  assert.equal(policy('http://localhost/x').code, 'private'); assert.equal(policy('http://127.0.0.1/x').code, 'private'); assert.equal(policy('http://169.254.169.254/latest').code, 'private');
  assert.equal(policy('http://example.com:8080/x').code, 'port'); assert.equal(policy('https://user:pw@example.com/').code, 'bad-url');
  assert.equal(policy('https://example.com/page').ok, true); assert.equal(policy('https://notzillow.com/x').ok, true);
});
await ok('private address ranges', () => {
  for (const ip of ['10.1.2.3', '127.0.0.1', '172.16.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '::1', 'fe80::1', 'fd00::1', '::ffff:10.0.0.1']) assert.equal(isPrivateIp(ip), true, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:4700::1111']) assert.equal(isPrivateIp(ip), false, ip);
});
await ok('robots.txt: longest match wins, own agent group beats *', () => {
  const t = 'User-agent: *\nDisallow: /sale/*\nAllow: /sale/ok$\n\nUser-agent: FiveOceansSonar\nDisallow: /nope/\n';
  assert.equal(robotsAllows(t, '/nope/x'), false); assert.equal(robotsAllows(t, '/sale/1'), true); // own group has no /sale rule
  const u = 'User-agent: *\nDisallow: /sale/*\nAllow: /sale/ok$\n';
  assert.equal(robotsAllows(u, '/sale/1'), false); assert.equal(robotsAllows(u, '/sale/ok'), true); assert.equal(robotsAllows(u, '/building/x'), true); assert.equal(robotsAllows('', '/a'), true);
});
await ok('extractor keeps facts, drops scripts and styles', () => {
  const e = extract(LISTING);
  assert.match(e.text, /Price: \$699000/); assert.match(e.text, /3 beds 2 baths/); assert.match(e.text, /Property taxes/); assert.doesNotMatch(e.text, /var price|color:red|unrelated/); assert.match(e.jsonld, /SingleFamilyResidence/);
});
await ok('a listing laid out one line per div survives HTML to text to facts', () => {
  const lines = readFileSync(new URL('./fixtures/redfin-style.txt', import.meta.url), 'utf8').split('\n').filter((l) => l.trim() && !/Agent Example|^Contact/.test(l));
  const html = '<html><head><title>Fictional</title></head><body><nav>Buy Rent Sell</nav>' + lines.map((l) => '<div>' + l.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</div>').join('') + '<footer>Terms</footer></body></html>';
  const e = extract(html), p = SN.parseListing({ url: '', text: e.text, jsonld: e.jsonld });
  assert.ok(p.found.length >= 45, 'fields ' + p.found.length); assert.equal(p.facts.status, 'For Sale'); assert.equal(p.facts.style, 'Single Family Residential'); assert.equal(p.facts.county, 'Nassau County');
  assert.equal(p.facts.taxMo, 1180); assert.equal(p.facts.hoaMo, 0); assert.equal(p.facts.price, 925000); assert.ok(p.facts.flags.some((x) => /accessory/i.test(x)));
  assert.ok(e.text.length < 30000);
});
await ok('reads an allowed page and parses the facts', async () => {
  const { read, listing } = await pingLink(base + '/listing', O);
  assert.equal(read.ok, true); assert.equal(listing.facts.price, 699000); assert.equal(listing.facts.beds, 3); assert.equal(listing.facts.taxYr, 8400); assert.equal(listing.facts.hoaMo, 60); assert.equal(listing.facts.year, 1990);
});
await ok('follows a redirect', async () => { assert.equal((await readLink(base + '/redir', O)).ok, true); });
await ok('obeys robots.txt', async () => { const r = await readLink(base + '/private/listing', O); assert.equal(r.ok, false); assert.equal(r.code, 'robots'); });
await ok('stops at a refusal and does not evade it', async () => { const r = await readLink(base + '/blocked', O); assert.equal(r.code, 'blocked'); assert.equal(r.status, 403); const b = await readLink(base + '/botwall', O); assert.equal(b.code, 'blocked'); });
await ok('limits redirects, wrong content types and missing pages', async () => {
  assert.equal((await readLink(base + '/loop', O)).code, 'redirects'); assert.equal((await readLink(base + '/pdf', O)).code, 'type'); assert.equal((await readLink(base + '/missing', O)).code, 'http');
});
await ok('refuses localhost by default even with a valid page', async () => { assert.equal((await readLink(base + '/listing', { minGapMs: 0 })).code, 'private'); });
srv.close();
console.log(n + ' sonar-fetch checks passed');
