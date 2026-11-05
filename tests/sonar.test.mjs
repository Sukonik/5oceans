import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../assets/calc/sonar.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

ok('Redfin link', () => {
  const u = S.parseUrl('https://www.redfin.com/NY/Long-Beach/123-Ocean-Blvd-11561/home/12345678');
  assert.deepEqual([u.site, u.address, u.city, u.state, u.zip, u.listingId], ['Redfin', '123 Ocean Blvd', 'Long Beach', 'NY', '11561', '12345678']);
});
ok('Redfin condo unit link', () => {
  const u = S.parseUrl('https://www.redfin.com/NY/Long-Beach/45-Park-Ave-Unit-4B-11561/unit-4B/home/999999');
  assert.equal(u.site, 'Redfin'); assert.equal(u.unit, '4B');
});
ok('Zillow link', () => {
  const u = S.parseUrl('https://www.zillow.com/homedetails/123-Ocean-Blvd-Long-Beach-NY-11561/12345678_zpid/');
  assert.equal(u.site, 'Zillow'); assert.equal(u.address, '123 Ocean Blvd Long Beach'); assert.equal(u.state, 'NY'); assert.equal(u.zip, '11561'); assert.equal(u.listingId, '12345678');
});
ok('StreetEasy links', () => {
  const a = S.parseUrl('https://streeteasy.com/building/the-beacon-tower/4b'); assert.equal(a.site, 'StreetEasy'); assert.equal(a.address, 'The Beacon Tower'); assert.equal(a.unit, '4B');
  const b = S.parseUrl('streeteasy.com/sale/1234567'); assert.equal(b.listingId, '1234567');
});
ok('garbage and unknown links do not throw', () => { assert.equal(S.parseUrl('not a link').site, ''); assert.equal(S.parseUrl('https://example.com/x').site, ''); });

const house = `Listed price: $875,000
3 beds 2.5 baths 1,850 sq ft
Year built: 1962
Property taxes: $11,400 / yr
HOA fee $85 / month
Rental estimate $3,900/mo`;
ok('house text', () => {
  const f = S.parseText(house);
  assert.equal(f.price, 875000); assert.equal(f.beds, 3); assert.equal(f.baths, 2.5); assert.equal(f.sqft, 1850); assert.equal(f.year, 1962);
  assert.equal(f.taxYr, 11400); assert.equal(f.hoaMo, 85); assert.equal(f.rent, 3900); assert.equal(f.type, 'house');
});
ok('condo with common charges', () => {
  const f = S.parseText('$1.25M\n2 bd 2 ba 1,100 sqft\nCondo\nCommon charges $1,150\nReal estate taxes $1,420/mo');
  assert.equal(f.price, 1250000); assert.equal(f.type, 'condo'); assert.equal(f.commonMo, 1150); assert.equal(f.taxYr, 17040);
});
ok('co-op with maintenance', () => {
  const f = S.parseText('Asking price $485K\nCo-op\nMonthly maintenance $2,310\n1 bd 1 ba');
  assert.equal(f.type, 'coop'); assert.equal(f.price, 485000); assert.equal(f.maintMo, 2310);
});
ok('multi-family and land', () => {
  assert.equal(S.parseText('Duplex $640,000 two units 4 beds 3 baths').type, 'multi');
  assert.equal(S.parseText('Vacant land for sale $120,000 1.2 acres lot').type, 'land');
});
ok('tax without a unit is guessed from the price', () => {
  assert.equal(S.parseText('Price $500,000\nProperty tax $6,000').taxYr, 6000);
  assert.equal(S.parseText('Price $500,000\nProperty tax $1,100').taxYr, 13200);
});
ok('JSON-LD fills price and details', () => {
  const j = JSON.stringify({ '@type': 'SingleFamilyResidence', numberOfBedrooms: 4, numberOfBathroomsTotal: 3, floorSize: { value: 2400 }, yearBuilt: 1998, address: { streetAddress: '9 Shell Ln' }, offers: { price: '699000' } });
  const p = S.parseListing({ url: '', text: '', jsonld: j });
  assert.equal(p.facts.price, 699000); assert.equal(p.facts.beds, 4); assert.equal(p.facts.sqft, 2400); assert.equal(p.address, '9 Shell Ln');
});
ok('mode suggestion and mapping', () => {
  const p = S.parseListing({ url: 'https://www.redfin.com/NY/Long-Beach/123-Ocean-Blvd-11561/home/1', text: house });
  assert.equal(S.suggestMode(p), 'home'); assert.equal(p.address, '123 Ocean Blvd, Long Beach, NY, 11561');
  const v = S.toValues(p, 'home', ['price', 'taxPct', 'hoaMo', 'rate']);
  assert.equal(v.price, 875000); assert.equal(v.hoaMo, 85); assert.equal(Math.round(v.taxPct * 100) / 100, 1.3); assert.equal(v.rate, undefined);
  const inv = S.toValues(p, 'investment', ['price', 'rent', 'taxYr', 'utilMo']); assert.equal(inv.rent, 3900); assert.equal(inv.taxYr, 11400); assert.equal(inv.utilMo, 85);
  assert.equal(S.suggestMode({ type: 'coop' }), 'coop'); assert.equal(S.suggestMode({ type: 'multi' }), 'house-hacker');
});
ok('bookmarklet payload round-trips', () => {
  const d = { u: 'https://www.zillow.com/homedetails/1-Main-St-NY-10001/1_zpid/', t: 'Price $500,000\n3 bd', j: '' };
  const b = Buffer.from(unescape(encodeURIComponent(JSON.stringify(d))), 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const back = S.decodeHash('#sonar=' + b); assert.equal(back.url, d.u); assert.equal(back.text, d.t);
  assert.equal(S.decodeHash('#investment'), null); assert.equal(S.decodeHash('#sonar=%%%'), null);
  assert.match(S.bookmarkletSource('https://x.test/tools/real-estate/'), /^javascript:\(function\(\)\{/);
});

const fx = (n) => readFileSync(new URL('./fixtures/' + n + '.txt', import.meta.url), 'utf8');
ok('Redfin-style listing: 50+ fields across every category', () => {
  const p = S.parseListing({ url: 'https://www.redfin.com/NY/Seabright-Beach/12-Shell-Cove-Rd-11500/home/1', text: fx('redfin-style') }), f = p.facts;
  assert.ok(p.found.length >= 50, 'fields ' + p.found.length);
  assert.deepEqual([f.price, f.estMonthly, f.downPct, f.downAmt, f.rate, f.term], [925000, 6380, 20, 185000, 7.13, 30]);
  assert.deepEqual([f.pi, f.taxMo, f.taxYr, f.insMo, f.hoaMo], [4990, 1180, 14160, 210, 0]);
  assert.deepEqual([f.beds, f.baths, f.fullBaths, f.halfBaths, f.sqft, f.year, f.stories], [4, 2.5, 2, 1, 2410, 1968, 2]);
  assert.deepEqual([f.lotSqft, f.garage, f.basement, f.county, f.apn, f.pricePerSqft], [6000, 2, 'Finished', 'Nassau County', '60080 00030', 384]);
  assert.deepEqual([f.dom, f.domSite, f.avgDom, f.saleToList, f.offerAt, f.offerChance, f.views, f.saves], [78, 77, 35, 100.8, 930000, 75, 490, 17]);
  assert.deepEqual([f.peakPrice, f.reducedPct, f.priceCuts, f.pastRent, f.rent, f.rentSource], [1150000, 19.6, 2, 6000, 6000, 'Past rental listing']);
  assert.match(f.flood, /Major/); assert.equal(f.sun, '93/100'); assert.match(f.walk, /0\.4\/10/); assert.match(f.quiet, /8\.8\/10/); assert.ok(f.schools.length >= 3);
  assert.deepEqual([f.mlsNo, f.brokerage, f.listingUpdated], ['1000000', 'Example Realty Greater NY LLC', 'Oct 17, 2026']); assert.match(f.mls, /OneKey/);
  assert.ok(f.features.includes('Finished basement') && f.features.includes('Fireplace')); assert.ok(f.flags.some((x) => /accessory unit/i.test(x)));
  const groups = new Set(p.found.map((x) => x.group)); S.GROUPS.forEach((g) => assert.ok(groups.has(g), 'missing group ' + g));
  assert.equal(S.suggestMode(p), 'home-rental');
});
ok('implausible rental history ($18,000 on a $925,000 home) is ignored', () => { assert.equal(S.parseListing({ text: fx('redfin-style') }).facts.pastRent, 6000); });
ok('never captures agent names, phone numbers or emails', () => {
  const all = JSON.stringify(S.parseListing({ url: '', text: fx('redfin-style') + '\nContact: 555-010-0000 agent@example.com' }));
  for (const bad of ['Agent Example', '555-010-0000', 'agent@example.com', 'Contact']) assert.ok(!all.includes(bad), bad);
});
ok('Zillow-style listing', () => {
  const f = S.parseListing({ url: 'https://www.zillow.com/homedetails/12-Maple-Court-Springfield-NY-10001/99_zpid/', text: fx('zillow-style') }).facts;
  assert.deepEqual([f.price, f.estValue, f.estMonthly, f.pi, f.taxMo, f.taxYr, f.insMo, f.hoaMo, f.miMo], [625000, 641000, 4310, 3205, 610, 7320, 145, 45, 0]);
  assert.deepEqual([f.beds, f.baths, f.sqft, f.year, f.parking, f.pricePerSqft, f.rent, f.dom, f.views, f.saves], [4, 3, 2100, 1985, 2, 298, 3450, 12, 480, 31]);
  assert.equal(f.lotAcres, 0.25); assert.equal(f.lotSqft, 10890); assert.equal(f.lastSoldPrice, 480000); assert.match(f.flood, /Minor/); assert.equal(f.walk, '45/100'); assert.equal(f.transit, '38/100');
  assert.ok(f.features.includes('Finished basement') && f.features.includes('Fireplace') && !f.features.includes('Pool'));
  assert.ok(f.flags.some((x) => /accessory/i.test(x)) && f.flags.some((x) => /as-is/i.test(x)));
});
ok('StreetEasy-style co-op', () => {
  const p = S.parseListing({ url: 'https://streeteasy.com/building/the-example/4b', text: fx('streeteasy-style') }), f = p.facts;
  assert.deepEqual([p.type, f.price, f.maintMo, f.flipTaxPct, f.financingPct, f.beds, f.baths, f.sqft, f.year, f.dom], ['coop', 1150000, 2350, 2, 80, 2, 2, 1150, 1925, 34]);
  assert.equal(S.suggestMode(p), 'coop'); assert.ok(f.features.includes('Doorman') && f.features.includes('Elevator'));
  assert.match(p.insights.map((x) => x.text).join(' '), /Co-op maintenance/);
});
ok('insights: flood warning, price cut, days on market, rental yield, no-HOA', () => {
  const txt = S.parseListing({ text: fx('redfin-style') }).insights.map((x) => x.text).join(' | ');
  assert.match(txt, /Flood risk is major/); assert.match(txt, /19\.6% below/); assert.match(txt, /78 days on market/); assert.match(txt, /gross yield/); assert.match(txt, /No HOA/); assert.match(txt, /accessory unit/);
});
ok('mapping fills price, tax, insurance, down payment, rate, term and rent', () => {
  const p = S.parseListing({ text: fx('redfin-style') });
  const home = S.toValues(p, 'home', ['price', 'taxPct', 'insYr', 'hoaMo', 'downPct', 'rate', 'term']);
  assert.deepEqual([home.price, home.insYr, home.downPct, home.rate, home.term], [925000, 2520, 20, 7.13, 30]); assert.equal(Math.round(home.taxPct * 100) / 100, 1.53);
  const rent = S.toValues(p, 'home-rental', ['price', 'taxMo', 'insMo', 'rent', 'downPct', 'rate']); assert.deepEqual([rent.price, rent.taxMo, rent.insMo, rent.rent, rent.downPct, rent.rate], [925000, 1180, 210, 6000, 20, 7.13]);
  const inv = S.toValues(p, 'investment', ['price', 'taxYr', 'insYr', 'rent']); assert.deepEqual([inv.taxYr, inv.insYr, inv.rent], [14160, 2520, 6000]);
});
ok('bookmarklet runs on a page, keeps label and value lines, and the result parses to 40+ fields', () => {
  const out = {}; const lines = fx('redfin-style').split('\n');
  const ctx = { document: { body: { innerText: lines.join('\n') }, querySelectorAll: () => [] }, location: { href: 'https://www.redfin.com/NY/Seabright-Beach/12-Shell-Cove-Rd-11500/home/1' }, btoa: (x) => Buffer.from(x, 'binary').toString('base64'), unescape, encodeURIComponent, JSON, window: { open: (u) => { out.url = u; } } };
  vm.runInNewContext(S.bookmarkletSource('https://x.test/tools/real-estate/').replace(/^javascript:/, ''), ctx);
  const d = S.decodeHash('#' + out.url.split('#')[1]); assert.ok(d.text.length < 30000);
  assert.match(d.text, /Property taxes\n\$1,180/); assert.match(d.text, /HOA dues\n\$0/);
  const p = S.parseListing(d); assert.ok(p.found.length >= 40, 'fields ' + p.found.length); assert.equal(p.facts.price, 925000); assert.equal(p.facts.taxMo, 1180);
  assert.ok(p.facts.flags.some((x) => /accessory unit/i.test(x)), 'long description paragraph is kept'); assert.equal(S.suggestMode(p), 'home-rental');
});
ok('the field catalog in docs stays in sync with the code', () => {
  const doc = readFileSync(new URL('../docs/sonar-fields.md', import.meta.url), 'utf8');
  for (const [k, v] of Object.entries(S.FIELDS)) { assert.ok(doc.includes('| ' + v[0] + ' |'), 'docs missing ' + v[0]); assert.ok(doc.includes('`' + k + '`'), 'docs missing key ' + k); }
});
console.log(n + ' sonar checks passed');
