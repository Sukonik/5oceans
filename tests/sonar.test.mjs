import assert from 'node:assert/strict';
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
console.log(n + ' sonar checks passed');
