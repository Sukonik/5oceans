import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const RE = createRequire(import.meta.url)('../assets/calc/engine.js');
const near = (a, b, t = 1) => assert.ok(Math.abs(a - b) <= t, `${a} vs ${b}`);
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

ok('loan payment', () => near(RE.pmt(300000, 6, 30), 1798.65, 0.01));
ok('balance after full term is 0', () => assert.equal(RE.balance(300000, 6, 30, 360), 0));
ok('zero-rate loan', () => near(RE.pmt(120000, 0, 10), 1000, 0.001));

ok('handbook duplex fixture (home with rental)', () => {
  const r = RE.run('home-rental', { piOverride: 2100 });
  const row = (k) => r.rows.find((x) => x.k.startsWith(k)).v;
  near(row('Total carrying cost'), 3300, 0.5);
  near(row('Rent available toward costs'), 1748, 0.5);
  near(r.key, 1552, 0.5);
  near(row('Gross rent needed'), 3776, 1);
  near(row('Savings vs the owner-only'), 998, 0.5);
  near(row('Months to recover'), 60.1, 0.2);
  near(row('Bad year: monthly cost'), 1920, 0.5);
  near(row('Bad year: total outlay'), 29040, 1);
});

ok('every mode runs with defaults and returns finite numbers', () => {
  for (const id of Object.keys(RE.MODES)) {
    const r = RE.run(id);
    assert.ok(Number.isFinite(r.key), id + ' key');
    assert.ok(r.rows.length >= 5, id + ' rows');
    for (const row of r.rows) assert.ok(Number.isFinite(row.v), `${id}: ${row.k}`);
    for (const s of RE.stressTests(id, {})) assert.ok(Number.isFinite(s.value), id + ' stress ' + s.label);
  }
});
ok('14 modes', () => assert.equal(Object.keys(RE.MODES).length, 14));

ok('investment metrics', () => {
  const r = RE.run('investment', { price: 500000, downPct: 25, rate: 7, term: 30, closingPct: 0, rehab: 0, rent: 4000, vacancy: 0, mgmt: 0, taxYr: 0, insYr: 0, repairsPct: 0, capexPct: 0, utilMo: 0 });
  const row = (k) => r.rows.find((x) => x.k.startsWith(k)).v;
  near(row('Net operating income'), 48000, 1);
  near(row('Cap rate'), 9.6, 0.01);
  near(row('Gross rent multiplier'), 10.4167, 0.001);
  near(row('Monthly rent as %'), 0.8, 0.001);
});
ok('vacation: 14-day rule', () => {
  const warn = (v) => RE.run('vacation', v).warn[0];
  assert.match(warn({ personalDays: 10, rentedDays: 100 }), /rental property/);
  assert.match(warn({ personalDays: 45, rentedDays: 100 }), /residence/);
  assert.match(warn({ personalDays: 20, rentedDays: 10 }), /fewer than 15/);
});
ok('flipper 70% rule', () => {
  const r = RE.run('flipper', { arv: 400000, rehab: 50000, contingency: 0 });
  near(r.rows.find((x) => x.k.startsWith('70% rule')).v, 230000, 0.5);
});
ok('sensitivity grid shape', () => { const s = RE.sensitivity('investment', {}); assert.equal(s.grid.length, 3); assert.equal(s.grid[0].length, 3); });
ok('renter vs buyer returns a break-even year or zero', () => { const r = RE.run('renter'); assert.ok(r.rows.some((x) => x.k.startsWith('First year'))); });
ok('savings bridge fixture (effective monthly rates)', () => {
  const eff = (a) => Math.pow(1 + a / 100, 1 / 12) - 1, r = eff(3);
  near(600 * (Math.pow(1 + r, 120) - 1) / r, 83669, 1);
});
ok('bridge: $600 for 10 years at 3% then 18-year draw at 2%', () => {
  const b = RE.bridge({ start: 0, deposit: 600, years: 10, ret: 3, drawYears: 18, drawRet: 2, gap: 1000 });
  near(b.end, 83669, 1); near(b.draw, 460.1, 0.2); near(b.need, 181847, 3);
  near(b.shortfall, 181847 - 83669, 3);
});
console.log(n + ' checks passed');
