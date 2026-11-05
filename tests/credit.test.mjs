import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const CR = createRequire(import.meta.url)('../assets/credit/engine.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };

ok('bands follow published FICO ranges', () => {
  assert.equal(CR.bandFor(579).label, 'Poor'); assert.equal(CR.bandFor(580).label, 'Fair'); assert.equal(CR.bandFor(670).label, 'Good');
  assert.equal(CR.bandFor(740).label, 'Very good'); assert.equal(CR.bandFor(800).label, 'Exceptional'); assert.equal(CR.bandFor(299), null);
});
ok('score summary: three bureaus, latest wins, middle score', () => {
  const s = CR.scoreSummary([{ bureau: 'Equifax', score: 700, date: '2026-01-01' }, { bureau: 'Equifax', score: 720, date: '2026-06-01' }, { bureau: 'Experian', score: 740, date: '2026-06-01' }, { bureau: 'TransUnion', score: 690, date: '2026-06-01' }]);
  assert.equal(s.low, 690); assert.equal(s.middle, 720); assert.equal(s.high, 740); assert.equal(s.spread, 50); assert.ok(s.complete);
});
ok('FHA tiers (HUD ML 2026-11)', () => {
  assert.equal(CR.fhaTier(580).minDown, 3.5); assert.equal(CR.fhaTier(579).minDown, 10); assert.equal(CR.fhaTier(500).eligible, true); assert.equal(CR.fhaTier(499).eligible, false);
});
ok('paste-and-detect finds three scores and the model', () => {
  const d = CR.detectScores('Your VantageScore 3.0 from TransUnion is 712 and from Equifax: 705. Experian 698.');
  assert.deepEqual(d.map((x) => [x.bureau, x.score]).sort(), [['Equifax', 705], ['Experian', 698], ['TransUnion', 712]]);
  assert.equal(d[0].model, 'VantageScore 3.0');
  assert.equal(CR.detectScores('nothing here 123').length, 0);
});
ok('utilization and pay-to-target', () => {
  const cards = [{ id: 'a', limit: 10000, balance: 3000, apr: 20 }, { id: 'b', limit: 5000, balance: 500, apr: 18 }];
  const u = CR.utilization(cards); assert.equal(Math.round(u.pct * 10) / 10, 23.3);
  assert.equal(CR.payToTarget(cards[0], 9), 2100); assert.equal(CR.payToTarget(cards[1], 30), 0);
});
ok('days until a due date rolls to next month', () => {
  assert.equal(CR.daysUntil(15, '2026-11-10'), 5); assert.equal(CR.daysUntil(5, '2026-11-10'), 25); assert.equal(CR.daysUntil(31, '2026-11-10'), 20);
});
const opts = (o) => ({ extra: 500, ret: 7, years: 10, tax: 24, invested: 0, ...o });
ok('high-APR card: paying it off beats investing', () => {
  const r = CR.compareStrategies([{ name: 'Card', balance: 10000, apr: 22, min: 250 }], opts({}));
  assert.equal(r.best !== 'invest-first', true);
  const by = Object.fromEntries(r.results.map((x) => [x.strategy, x])); assert.ok(by['debt-first'].netWorth > by['invest-first'].netWorth);
  assert.equal(r.classes[0].kind, 'bad');
});
ok('cheap mortgage: investing beats prepaying', () => {
  const r = CR.compareStrategies([{ name: 'Mortgage', balance: 200000, apr: 3, min: 1200, asset: true }], opts({ years: 20 }));
  const by = Object.fromEntries(r.results.map((x) => [x.strategy, x])); assert.ok(by['invest-first'].netWorth > by['debt-first'].netWorth);
  assert.equal(r.classes[0].kind, 'good');
});
ok('mixed debts: smart split is at least as good as either extreme', () => {
  const debts = [{ name: 'Card', balance: 8000, apr: 24, min: 200 }, { name: 'Mortgage', balance: 250000, apr: 3.25, min: 1500, asset: true }];
  const by = Object.fromEntries(CR.compareStrategies(debts, opts({ years: 15 })).results.map((x) => [x.strategy, x]));
  assert.ok(by.smart.netWorth >= by['invest-first'].netWorth - 1); assert.ok(by.smart.netWorth >= by['debt-first'].netWorth - 1);
  assert.ok(by.smart.debtFreeMonths === 0 || by.smart.debtFreeMonths > 0);
});
ok('tax-deductible interest lowers the effective rate', () => {
  assert.equal(CR.afterTaxRate({ apr: 6, deductible: true }, 25), 4.5); assert.equal(CR.afterTaxRate({ apr: 6 }, 25), 6);
});
ok('packet sanitizer clamps and rejects foreign files', () => {
  assert.throws(() => CR.sanitizePacket({ app: 'x' }));
  const p = CR.sanitizePacket({ app: 'fiveoceans-credit', scores: [{ bureau: 'Equifax', score: 9999, model: 'zzz' }, { bureau: 'Bad', score: 700 }], cards: [{ name: '<b>x</b>', limit: -5, apr: 500, statement: 99 }], settings: { years: 99 } });
  assert.equal(p.scores.length, 1); assert.equal(p.scores[0].score, 850); assert.equal(p.scores[0].model, 'Other');
  assert.equal(p.cards[0].limit, 0); assert.equal(p.cards[0].apr, 100); assert.equal(p.cards[0].statement, 31); assert.equal(p.cards[0].name, 'bx/b'); assert.equal(p.settings.years, 40);
});
console.log(n + ' credit checks passed');
