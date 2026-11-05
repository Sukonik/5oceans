/* FiveOceans Credit Card Tool engine. Pure functions; no DOM, no network. Original code. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CR = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const BUREAUS = ['Equifax', 'Experian', 'TransUnion'];
  const MODELS = ['FICO 8', 'FICO 9', 'FICO 10', 'VantageScore 3.0', 'VantageScore 4.0', 'Other'];
  const BANDS = [ // FICO published ranges
    { label: 'Poor', min: 300, max: 579 }, { label: 'Fair', min: 580, max: 669 }, { label: 'Good', min: 670, max: 739 },
    { label: 'Very good', min: 740, max: 799 }, { label: 'Exceptional', min: 800, max: 850 },
  ];
  const clamp = (x, a, b) => Math.min(Math.max(x, a), b);
  const bandFor = (s) => BANDS.find((b) => s >= b.min && s <= b.max) || null;

  /* ---- scores ---- */
  function latestByBureau(entries) {
    const out = {};
    entries.forEach((e) => { if (!BUREAUS.includes(e.bureau)) return; const o = out[e.bureau]; if (!o || String(e.date) >= String(o.date)) out[e.bureau] = e; });
    return out;
  }
  function scoreSummary(entries) {
    const l = latestByBureau(entries), sc = BUREAUS.filter((b) => l[b]).map((b) => l[b].score).sort((a, b) => a - b);
    if (!sc.length) return null;
    const mid = sc.length === 3 ? sc[1] : null;
    return { latest: l, count: sc.length, low: sc[0], high: sc[sc.length - 1], middle: mid, spread: sc[sc.length - 1] - sc[0], average: Math.round(sc.reduce((a, b) => a + b, 0) / sc.length), complete: sc.length === 3 };
  }
  // HUD Mortgagee Letter 2026-11 / HUD counselor guide: >=580 max financing (96.5% LTV); 500-579 max LTV 90%; <500 not eligible.
  function fhaTier(score) {
    if (score >= 580) return { eligible: true, maxLtv: 96.5, minDown: 3.5, text: 'At 580 or above, FHA allows the maximum loan: about 3.5% down.' };
    if (score >= 500) return { eligible: true, maxLtv: 90, minDown: 10, text: 'From 500 to 579, FHA limits the loan to about 90% of value: about 10% down.' };
    return { eligible: false, maxLtv: 0, minDown: 100, text: 'Below 500, a loan cannot be FHA-insured.' };
  }
  // Pull plausible scores out of pasted text (issuer email, dashboard). Returns [{bureau,score,model}] for the user to confirm.
  function detectScores(text) {
    const t = String(text || '').replace(/\s+/g, ' '), out = [], names = { equifax: 'Equifax', experian: 'Experian', transunion: 'TransUnion', 'trans union': 'TransUnion' };
    let model = 'Other';
    if (/vantage\s*score\s*4/i.test(t)) model = 'VantageScore 4.0'; else if (/vantage\s*score\s*3/i.test(t) || /vantage/i.test(t)) model = 'VantageScore 3.0';
    else if (/fico\s*(score\s*)?9/i.test(t)) model = 'FICO 9'; else if (/fico\s*(score\s*)?10/i.test(t)) model = 'FICO 10'; else if (/fico/i.test(t)) model = 'FICO 8';
    const re = /(equifax|experian|trans\s?union)/gi; let m;
    while ((m = re.exec(t))) {
      const key = m[1].toLowerCase().replace(/\s+/g, ' '), name = names[key] || names[key.replace(' ', '')];
      if (!name || out.some((o) => o.bureau === name)) continue;
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 60).match(/\b([3-8]\d{2})\b/);
      const before = t.slice(Math.max(0, m.index - 30), m.index).match(/\b([3-8]\d{2})\b(?!.*\b[3-8]\d{2}\b)/);
      const val = after ? +after[1] : before ? +before[1] : 0;
      if (val >= 300 && val <= 850) out.push({ bureau: name, score: val, model });
    }
    return out;
  }

  /* ---- cards ---- */
  const monthlyInterest = (c) => (c.balance * c.apr) / 1200;
  const minPayment = (c) => (c.minPay > 0 ? c.minPay : c.balance > 0 ? Math.min(c.balance + monthlyInterest(c), Math.max(25, c.balance * 0.01 + monthlyInterest(c))) : 0);
  function utilization(cards) {
    const lim = cards.reduce((a, c) => a + (c.limit > 0 ? c.limit : 0), 0), bal = cards.reduce((a, c) => a + c.balance, 0);
    return { limit: lim, balance: bal, pct: lim > 0 ? (bal / lim) * 100 : 0, per: cards.map((c) => ({ id: c.id, pct: c.limit > 0 ? (c.balance / c.limit) * 100 : 0 })) };
  }
  // Amount to pay before the statement closes so the reported balance is at or under target % of the limit.
  const payToTarget = (c, targetPct) => Math.max(c.balance - (c.limit * targetPct) / 100, 0);
  function daysUntil(day, today) {
    const t = today ? new Date(today) : new Date(), d = clamp(Math.round(day) || 1, 1, 31);
    for (let m = 0; m < 3; m++) {
      const y = t.getFullYear(), mo = t.getMonth() + m, last = new Date(y, mo + 1, 0).getDate(), dt = new Date(y, mo, Math.min(d, last));
      const diff = Math.round((dt - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 86400000);
      if (diff >= 0) return diff;
    }
    return 0;
  }
  function creditAdvice(cards, summary) {
    const u = utilization(cards), tips = [];
    if (cards.length && u.limit > 0) {
      if (u.pct > 50) tips.push({ level: 'high', text: `Utilization is ${u.pct.toFixed(0)}%. Paying balances down is usually the fastest score lever (amounts owed is about 30% of a FICO score).` });
      else if (u.pct > 30) tips.push({ level: 'mid', text: `Utilization is ${u.pct.toFixed(0)}%. Many lenders look more kindly below 30%, and lower is often better. Pay before each statement date.` });
      else tips.push({ level: 'ok', text: `Utilization is ${u.pct.toFixed(0)}%, a comfortable level. Keep paying in full.` });
      cards.filter((c) => c.limit > 0 && (c.balance / c.limit) * 100 > 50).forEach((c) => tips.push({ level: 'mid', text: `${c.name || 'A card'} is above 50% of its own limit. Single-card utilization counts too.` }));
      cards.filter((c) => c.balance > 0 && c.apr >= 20).forEach((c) => tips.push({ level: 'mid', text: `${c.name || 'A card'} charges ${c.apr}% APR. A balance here costs about ${Math.round(monthlyInterest(c))} dollars a month in interest.` }));
    }
    if (summary && summary.spread >= 40) tips.push({ level: 'mid', text: `Your scores differ by ${summary.spread} points. Bureaus hold different data. Pull each free report and look for accounts or errors that appear at only one.` });
    if (!tips.length) tips.push({ level: 'ok', text: 'Add your cards and scores to see tailored next steps.' });
    return tips;
  }

  /* ---- debt strategy: good vs bad debt for wealth accumulation ---- */
  function afterTaxRate(d, taxRate) { return d.apr * (1 - (d.deductible ? taxRate / 100 : 0)); }
  function classify(d, ret, taxRate) {
    const r = afterTaxRate(d, taxRate);
    if (r > ret) return { kind: 'bad', label: 'Costs more than you are likely to earn', rate: r };
    if (d.asset && r < ret - 1) return { kind: 'good', label: 'Cheap and tied to an asset or income', rate: r };
    return { kind: 'judgment', label: 'Close call. Depends on risk and your goals', rate: r };
  }
  function simulate(debts, o, strategy) {
    const ret = o.ret, r = Math.pow(1 + ret / 100, 1 / 12) - 1, n = Math.round(o.years * 12), tax = o.tax || 0;
    const ds = debts.filter((d) => d.balance > 0).map((d) => ({ ...d, bal: d.balance, min: d.min > 0 ? d.min : Math.max(25, d.balance * 0.01 + (d.balance * d.apr) / 1200), cls: classify(d, ret, tax) }));
    const budget = ds.reduce((a, d) => a + d.min, 0) + o.extra;
    let inv = Math.max(o.invested || 0, 0), interest = 0, debtFreeAt = ds.length ? 0 : 0;
    for (let m = 1; m <= n; m++) {
      let cash = budget;
      ds.forEach((d) => { if (d.bal > 0) { const i = (d.bal * d.apr) / 1200; d.bal += i; interest += i; const p = Math.min(d.min, d.bal); d.bal -= p; cash -= p; } });
      let targets = ds.filter((d) => d.bal > 0.005);
      if (strategy === 'debt-first') targets = targets.sort((a, b) => b.apr - a.apr);
      else if (strategy === 'smart') targets = targets.filter((d) => d.cls.kind === 'bad').sort((a, b) => b.apr - a.apr);
      else targets = [];
      for (const d of targets) { if (cash <= 0) break; const p = Math.min(cash, d.bal); d.bal -= p; cash -= p; }
      inv = inv * (1 + r) + Math.max(cash, 0);
      if (!debtFreeAt && ds.every((d) => d.bal <= 0.005)) debtFreeAt = m;
    }
    const left = ds.reduce((a, d) => a + Math.max(d.bal, 0), 0);
    return { strategy, invested: inv, debtLeft: left, netWorth: inv - left, interest, debtFreeMonths: debtFreeAt || (ds.length ? 0 : 0), monthly: budget };
  }
  function compareStrategies(debts, o) {
    const out = ['debt-first', 'invest-first', 'smart'].map((s) => simulate(debts, o, s));
    const best = out.reduce((a, b) => (b.netWorth > a.netWorth ? b : a));
    return { results: out, best: best.strategy, classes: debts.map((d) => ({ name: d.name, ...classify(d, o.ret, o.tax || 0) })) };
  }

  /* ---- packet (portable file) ---- */
  const num = (x, a, b) => clamp(Number.isFinite(+x) ? +x : 0, a, b);
  const str = (x, n) => String(x == null ? '' : x).replace(/[<>]/g, '').slice(0, n);
  function sanitizePacket(p) {
    if (!p || p.app !== 'fiveoceans-credit' || typeof p !== 'object') throw new Error('not a FiveOceans credit packet');
    const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
    return {
      app: 'fiveoceans-credit', version: 1, savedAt: num(p.savedAt, 0, 8.64e15) || Date.now(),
      scores: arr(p.scores, 60).filter((s) => BUREAUS.includes(s.bureau)).map((s) => ({ id: str(s.id, 24) || String(Math.random()).slice(2), bureau: s.bureau, score: num(s.score, 300, 850), model: MODELS.includes(s.model) ? s.model : 'Other', date: str(s.date, 10), source: str(s.source, 60) })),
      cards: arr(p.cards, 60).map((c) => ({ id: str(c.id, 24) || String(Math.random()).slice(2), name: str(c.name, 40), issuer: str(c.issuer, 40), limit: num(c.limit, 0, 1e7), balance: num(c.balance, 0, 1e7), apr: num(c.apr, 0, 100), statement: num(c.statement, 1, 31), due: num(c.due, 1, 31), fee: num(c.fee, 0, 5000), minPay: num(c.minPay, 0, 1e6), reward: num(c.reward, 0, 20), opened: str(c.opened, 7) })),
      debts: arr(p.debts, 40).map((d) => ({ id: str(d.id, 24) || String(Math.random()).slice(2), name: str(d.name, 40), balance: num(d.balance, 0, 1e8), apr: num(d.apr, 0, 100), min: num(d.min, 0, 1e6), deductible: !!d.deductible, asset: !!d.asset })),
      settings: { extra: num(p.settings && p.settings.extra, 0, 1e6), ret: num(p.settings && p.settings.ret, 0, 30), years: num(p.settings && p.settings.years, 1, 40), tax: num(p.settings && p.settings.tax, 0, 60), invested: num(p.settings && p.settings.invested, 0, 1e9), includeCards: !(p.settings && p.settings.includeCards === false) },
    };
  }
  return { BUREAUS, MODELS, BANDS, bandFor, latestByBureau, scoreSummary, fhaTier, detectScores, monthlyInterest, minPayment, utilization, payToTarget, daysUntil, creditAdvice, afterTaxRate, classify, simulate, compareStrategies, sanitizePacket };
});
