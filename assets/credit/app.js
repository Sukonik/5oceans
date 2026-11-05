/* FiveOceans Credit Card Tool UI. Runs entirely in the browser; nothing is uploaded or saved unless you press Save. */
(function () {
  'use strict';
  var CR = window.CR, KEY = 'fiveoceans-credit';
  var $ = function (id) { return document.getElementById(id); };
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  var money = function (v) { return (v < 0 ? '−' : '') + usd.format(Math.abs(v)); };
  var pct = function (v) { return (Math.round(v * 10) / 10) + '%'; };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function num(v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  var today = new Date().toISOString().slice(0, 10);
  var state = blank(), dirty = false, lastPacket = null, deviceAt = null, tab = 'scores', editing = null;
  function blank() { return { scores: [], cards: [], debts: [], settings: { extra: 500, ret: 7, years: 15, tax: 22, invested: 0, includeCards: true } }; }

  /* ---------- storage ---------- */
  function readDevice() { try { var t = localStorage.getItem(KEY); return t ? CR.sanitizePacket(JSON.parse(t)) : null; } catch (e) { return null; } }
  function saveDevice() {
    try { var p = packet(); localStorage.setItem(KEY, JSON.stringify(p)); deviceAt = p.savedAt; dirty = false; status('Saved to this device.'); } catch (e) { status('This browser blocked saving. Save a packet file instead.'); }
    bar();
  }
  function packet() { return Object.assign({ app: 'fiveoceans-credit', version: 1, savedAt: Date.now() }, JSON.parse(JSON.stringify(state))); }
  function load(p) { state = { scores: p.scores, cards: p.cards, debts: p.debts, settings: p.settings }; dirty = false; renderAll(); }
  function touch() { dirty = true; bar(); }
  function status(t) { var s = $('cc-msg'); if (s) s.textContent = t; }
  function bar() {
    $('st-dev').textContent = deviceAt ? 'saved ' + new Date(deviceAt).toLocaleString() + (dirty ? ' (changes not saved)' : '') : (dirty ? 'not saved' : 'empty');
    $('st-pkt').textContent = lastPacket ? 'file saved ' + new Date(lastPacket).toLocaleString() : 'no file yet';
  }
  function download(name, text) { var a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function savePacket() { var p = packet(); download('fiveoceans-credit-' + today + '.json', JSON.stringify(p, null, 2)); lastPacket = p.savedAt; dirty = false; bar(); status('Packet saved. It is plain text and not encrypted. Keep it private.'); }

  /* ---------- tabs ---------- */
  function setTab(t) {
    tab = t;
    document.querySelectorAll('#cc-tabs button').forEach(function (b) { var on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; b.classList.toggle('on', on); });
    document.querySelectorAll('.cc-panel').forEach(function (p) { p.hidden = p.id !== 'p-' + t; });
    if (location.hash.slice(1) !== t) history.replaceState(null, '', '#' + t);
  }
  function field(id, label, type, value, extra) {
    var w = el('div', 'fld'); w.appendChild(el('label', '', esc(label))).htmlFor = id;
    var inp, wrap = el('div', 'inp');
    if (type === 'select') { inp = el('select'); extra.options.forEach(function (o) { var op = el('option', '', esc(o)); op.value = o; inp.appendChild(op); }); inp.value = value; }
    else { inp = el('input'); inp.type = type === 'date' ? 'date' : 'text'; if (type !== 'date' && type !== 'text') inp.inputMode = 'decimal'; inp.value = value == null ? '' : value; if (extra && extra.max) inp.maxLength = extra.max; if (extra && extra.ph) inp.placeholder = extra.ph; inp.autocomplete = 'off'; }
    inp.id = id;
    if (extra && extra.pre) wrap.appendChild(el('span', 'af pre', extra.pre)); wrap.appendChild(inp); if (extra && extra.suf) wrap.appendChild(el('span', 'af suf', extra.suf));
    w.appendChild(wrap); if (extra && extra.hint) w.appendChild(el('small', '', esc(extra.hint))); return w;
  }
  function chip(score) { var b = CR.bandFor(score); return b ? '<span class="band b-' + b.label.toLowerCase().replace(' ', '') + '">' + b.label + '</span>' : ''; }

  /* ---------- SCORES ---------- */
  function buildScores() {
    var p = $('p-scores'); p.innerHTML = '';
    p.appendChild(el('h2', '', 'Your three scores'));
    p.appendChild(el('p', 'lead', 'Equifax, Experian and TransUnion each keep their own file, so your scores differ. Enter what you have, with the date and the scoring model, and watch it over time.'));
    var f = el('form', 'fields cc-form'); f.onsubmit = function (e) { e.preventDefault(); };
    f.appendChild(field('s-bureau', 'Bureau', 'select', 'Equifax', { options: CR.BUREAUS }));
    f.appendChild(field('s-score', 'Score', 'num', '', { ph: '300 to 850', hint: 'Between 300 and 850' }));
    f.appendChild(field('s-model', 'Scoring model', 'select', 'FICO 8', { options: CR.MODELS, hint: 'Shown next to the score where you found it' }));
    f.appendChild(field('s-date', 'Date', 'date', today));
    f.appendChild(field('s-src', 'Where you got it', 'text', '', { max: 60, ph: 'Card app, bank, bureau site', hint: 'Optional' }));
    var add = el('button', 'glass primary', 'Add score'); add.type = 'button'; add.onclick = function () {
      var s = num($('s-score').value); if (s < 300 || s > 850) { status('A score is between 300 and 850.'); return; }
      state.scores.push({ id: uid(), bureau: $('s-bureau').value, score: Math.round(s), model: $('s-model').value, date: $('s-date').value || today, source: $('s-src').value.trim().slice(0, 60) });
      $('s-score').value = ''; touch(); refreshScores(); status('Score added.');
    };
    f.appendChild(el('div', 'fld fbtn')).appendChild(add); p.appendChild(f);
    var d = el('details', 'detect'); d.innerHTML = '<summary>Paste and detect</summary><p class="subn">Paste text from an issuer email, a card app or a bureau dashboard. Detection runs in your browser; the text is never sent or stored. Check each result before adding it.</p>';
    var ta = el('textarea'); ta.id = 's-paste'; ta.rows = 4; ta.placeholder = 'Example: "Your VantageScore 3.0 from TransUnion is 712. Equifax 705."'; ta.setAttribute('aria-label', 'Text to scan for scores'); d.appendChild(ta);
    var b1 = el('button', 'glass', 'Find scores'); b1.type = 'button'; var out = el('div', '', ''); out.id = 's-found';
    b1.onclick = function () {
      var r = CR.detectScores(ta.value); out.innerHTML = '';
      if (!r.length) { out.appendChild(el('p', 'subn', 'No scores found. Try pasting the part that names the bureau and the number.')); return; }
      out.appendChild(el('p', 'subn', 'Found ' + r.length + ':')); var ul = el('ul', 'plain');
      r.forEach(function (x) { ul.appendChild(el('li', '', '<b>' + esc(x.bureau) + '</b> ' + x.score + ' · ' + esc(x.model))); }); out.appendChild(ul);
      var a = el('button', 'glass primary', 'Add these'); a.type = 'button'; a.onclick = function () { r.forEach(function (x) { state.scores.push({ id: uid(), bureau: x.bureau, score: x.score, model: x.model, date: today, source: 'Pasted text' }); }); ta.value = ''; out.innerHTML = ''; touch(); refreshScores(); status('Added ' + r.length + ' scores.'); };
      out.appendChild(a);
    };
    d.appendChild(b1); d.appendChild(out); p.appendChild(d);
    var sum = el('div', ''); sum.id = 's-summary'; p.appendChild(sum);
    var g = el('section', 'guide'); g.innerHTML = '<h3>Get your three scores</h3><p>A website cannot legitimately pull your scores for you. Credit bureaus release them only to you or to a lender you authorize, and the file holds data that should not pass through a stranger’s server. These routes are free and put you in control:</p><ol class="steps">' +
      '<li><b>Read your full reports first.</b> You can check your report at each of the three bureaus once a week, free, at <a href="https://www.annualcreditreport.com/" rel="noopener">AnnualCreditReport.com</a>, the only site authorized by federal law. Reports show your accounts and history, not usually a score. <a href="https://www.consumerfinance.gov/ask-cfpb/how-do-i-get-a-free-copy-of-my-credit-reports-en-5/" rel="noopener">CFPB: free copies of your reports</a></li>' +
      '<li><b>Find a free score.</b> Many card issuers and banks show a free FICO or VantageScore in the app, often from one bureau. Open each card or bank app you already have and note the bureau, model and date. Different apps show different bureaus, so a few together can cover all three.</li>' +
      '<li><b>Paste it here.</b> Use Paste and detect above, or type each score with its model and date. Compare like with like: a FICO 8 and a VantageScore 3.0 can differ by many points.</li>' +
      '<li><b>Protect your files.</b> Freezing your credit is free at all three bureaus under federal law, and you can lift it when you apply for credit. <a href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-credit-freeze-or-security-freeze-on-my-credit-report-en-1341/" rel="noopener">CFPB: credit freezes</a></li></ol>' +
      '<p class="subn">What counts in a FICO score: payment history about 35%, amounts owed about 30%, length of history about 15%, new credit about 10% and credit mix about 10%. <a href="https://www.myfico.com/credit-education/whats-in-your-credit-score" rel="noopener">myFICO</a></p>';
    p.appendChild(g);
    var adv = el('div', ''); adv.id = 's-advice'; p.appendChild(adv);
  }
  function refreshScores() {
    var s = CR.scoreSummary(state.scores), box = $('s-summary'); box.innerHTML = '';
    if (!s) { box.appendChild(el('p', 'subn', 'No scores yet.')); } else {
      var tiles = el('div', 'tiles3');
      CR.BUREAUS.forEach(function (b) { var e = s.latest[b]; tiles.appendChild(el('div', 'stile', '<span class="k">' + b + '</span>' + (e ? '<strong>' + e.score + '</strong>' + chip(e.score) + '<small>' + esc(e.model) + ' · ' + esc(e.date) + '</small>' : '<strong class="dim">–</strong><small>Add a score</small>'))); });
      box.appendChild(tiles);
      var rows = [['Lowest', s.low], ['Middle', s.middle == null ? '–' : s.middle], ['Highest', s.high], ['Spread', s.spread + ' points']];
      var t = el('table', 'rt'); t.innerHTML = '<caption class="sr">Score summary</caption><tbody>' + rows.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody>';
      box.appendChild(t);
      if (!s.complete) box.appendChild(el('div', 'callout', 'Add the missing bureau to see your middle score. Lenders on a mortgage commonly look at the middle of three scores.'));
      var base = s.middle != null ? s.middle : s.low, ft = CR.fhaTier(base);
      box.appendChild(el('div', 'callout', '<b>Mortgage check (FHA).</b> At ' + base + ': ' + esc(ft.text) + ' Other loan types and lenders set their own minimums, and lenders add other tests. <a href="https://www.hud.gov/sites/default/files/hudclips/documents/2026-11hsgml.pdf" rel="noopener">HUD Mortgagee Letter 2026-11</a> · <a href="../tools/real-estate/index.html#home">Run the home numbers</a>'));
    }
    if (state.scores.length) {
      var h = el('details', 'hist'); h.innerHTML = '<summary>History (' + state.scores.length + ')</summary>';
      var tb = el('div', 'tw'), tt = el('table', 'rt cmpt'); tt.innerHTML = '<thead><tr><th scope="col">Date</th><th scope="col">Bureau</th><th scope="col">Score</th><th scope="col">Model</th><th scope="col"><span class="sr">Remove</span></th></tr></thead>';
      var body = el('tbody');
      state.scores.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).forEach(function (e) {
        var tr = el('tr'); tr.innerHTML = '<td>' + esc(e.date) + '</td><td>' + e.bureau + '</td><td>' + e.score + '</td><td>' + esc(e.model) + '</td>'; var td = el('td'), x = el('button', 'sbtn', 'Remove'); x.type = 'button';
        x.onclick = function () { state.scores = state.scores.filter(function (z) { return z.id !== e.id; }); touch(); refreshScores(); }; td.appendChild(x); tr.appendChild(td); body.appendChild(tr);
      });
      tt.appendChild(body); tb.appendChild(tt); h.appendChild(tb); box.appendChild(h);
    }
    var adv = $('s-advice'); adv.innerHTML = '';
    var tips = CR.creditAdvice(state.cards, s); adv.appendChild(el('h3', '', 'Next steps'));
    tips.forEach(function (t) { adv.appendChild(el('div', 'callout ' + t.level, esc(t.text))); });
  }

  /* ---------- CARDS ---------- */
  var CARDF = [['name', 'Nickname', 'text', '', { max: 40, ph: 'e.g. Travel card', hint: 'Never enter card numbers' }], ['issuer', 'Issuer', 'text', '', { max: 40, ph: 'Optional' }],
    ['limit', 'Credit limit', 'num', '', { pre: '$' }], ['balance', 'Current balance', 'num', '', { pre: '$' }], ['apr', 'APR', 'num', '', { suf: '%' }],
    ['statement', 'Statement closes', 'num', '', { suf: 'day', hint: 'Day of the month' }], ['due', 'Payment due', 'num', '', { suf: 'day', hint: 'Day of the month' }],
    ['minPay', 'Minimum payment', 'num', '', { pre: '$', hint: 'Leave blank to estimate' }], ['fee', 'Annual fee', 'num', '', { pre: '$' }], ['reward', 'Rewards rate', 'num', '', { suf: '%', hint: 'Cash back' }], ['opened', 'Opened', 'text', '', { max: 7, ph: 'YYYY-MM', hint: 'Optional' }]];
  function buildCards() {
    var p = $('p-cards'); p.innerHTML = '';
    p.appendChild(el('h2', '', 'Your cards'));
    p.appendChild(el('p', 'lead', 'Keep a simple ledger: limit, balance, APR and the two dates that matter. The statement date decides what gets reported. The due date decides whether you pay interest and fees.'));
    var f = el('form', 'fields cc-form'); f.id = 'c-form'; f.onsubmit = function (e) { e.preventDefault(); };
    CARDF.forEach(function (d) { f.appendChild(field('c-' + d[0], d[1], d[2], d[3], d[4])); });
    var save = el('button', 'glass primary', 'Add card'); save.type = 'button'; save.id = 'c-save';
    var cancel = el('button', 'glass', 'Cancel edit'); cancel.type = 'button'; cancel.id = 'c-cancel'; cancel.hidden = true;
    save.onclick = function () {
      var c = { id: editing || uid() }; CARDF.forEach(function (d) { var v = $('c-' + d[0]).value; c[d[0]] = (d[2] === 'num') ? num(v) : v.trim().slice(0, d[4].max || 40); });
      if (!c.name) c.name = 'Card ' + (state.cards.length + 1); c.statement = Math.min(Math.max(Math.round(c.statement) || 1, 1), 31); c.due = Math.min(Math.max(Math.round(c.due) || 1, 1), 31);
      if (editing) state.cards = state.cards.map(function (z) { return z.id === editing ? c : z; }); else state.cards.push(c);
      editing = null; f.reset(); save.textContent = 'Add card'; cancel.hidden = true; touch(); refreshCards(); status('Card saved.');
    };
    cancel.onclick = function () { editing = null; f.reset(); save.textContent = 'Add card'; cancel.hidden = true; };
    var bw = el('div', 'fld fbtn'); bw.appendChild(save); bw.appendChild(cancel); f.appendChild(bw); p.appendChild(f);
    var sum = el('div', ''); sum.id = 'c-summary'; p.appendChild(sum);
  }
  function refreshCards() {
    var box = $('c-summary'); box.innerHTML = '';
    if (!state.cards.length) { box.appendChild(el('p', 'subn', 'No cards yet. Add one above.')); refreshScores(); return; }
    var u = CR.utilization(state.cards), interest = state.cards.reduce(function (a, c) { return a + CR.monthlyInterest(c); }, 0), fees = state.cards.reduce(function (a, c) { return a + c.fee; }, 0);
    var hl = el('div', 'hl'); hl.innerHTML = '<span class="hl-k">Overall utilization</span><strong class="hl-v">' + pct(u.pct) + '</strong><span class="hl-n">' + money(u.balance) + ' owed of ' + money(u.limit) + ' in limits</span>'; box.appendChild(hl);
    var t = el('table', 'rt'); t.innerHTML = '<caption class="sr">Card totals</caption><tbody><tr><th scope="row">Interest if you carry balances<small>Per month at current APRs</small></th><td class="' + (interest > 0 ? 'neg' : '') + '">' + money(interest) + '</td></tr><tr><th scope="row">Annual fees</th><td>' + money(fees) + '</td></tr></tbody>'; box.appendChild(t);
    var tg = el('div', 'fld tgt'); tg.innerHTML = '<label for="c-target">Target utilization on each statement</label><div class="inp"><input id="c-target" type="text" inputmode="decimal" value="9"><span class="af suf">%</span></div><small>Cards report the balance on the statement date. Paying down before it closes lowers what gets reported. Many lenders like under 30%; lower is often better.</small>';
    box.appendChild(tg);
    var plan = el('div', ''); plan.id = 'c-plan'; box.appendChild(plan);
    tg.querySelector('input').addEventListener('input', renderPlan); renderPlan();
    var list = el('div', 'cardlist'); box.appendChild(el('h3', '', 'Cards'));
    state.cards.forEach(function (c) {
      var uu = c.limit > 0 ? (c.balance / c.limit) * 100 : 0, it = el('article', 'ccard');
      it.innerHTML = '<div class="ch"><b>' + esc(c.name) + '</b><span>' + esc(c.issuer) + '</span></div><div class="ub" role="img" aria-label="Utilization ' + pct(uu) + '"><i style="width:' + Math.min(uu, 100) + '%" class="' + (uu > 50 ? 'hi' : uu > 30 ? 'md' : 'lo') + '"></i></div>' +
        '<p class="cm">' + money(c.balance) + ' of ' + money(c.limit) + ' · ' + pct(uu) + ' · ' + c.apr + '% APR</p><p class="cm">Statement day ' + c.statement + ' · due day ' + c.due + (c.fee ? ' · fee ' + money(c.fee) : '') + (c.reward ? ' · ' + c.reward + '% back' : '') + '</p>';
      var act = el('div', 'act'), e = el('button', 'sbtn', 'Edit'), x = el('button', 'sbtn', 'Delete'); e.type = x.type = 'button';
      e.onclick = function () { editing = c.id; CARDF.forEach(function (d) { $('c-' + d[0]).value = c[d[0]] || (d[2] === 'num' ? '' : ''); }); $('c-save').textContent = 'Save card'; $('c-cancel').hidden = false; $('c-form').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
      x.onclick = function () { state.cards = state.cards.filter(function (z) { return z.id !== c.id; }); touch(); refreshCards(); };
      act.appendChild(e); act.appendChild(x); it.appendChild(act); list.appendChild(it);
    });
    box.appendChild(list); refreshScores();
  }
  function renderPlan() {
    var tg = num(($('c-target') || { value: 9 }).value), box = $('c-plan'); if (!box) return; box.innerHTML = '';
    var rows = state.cards.filter(function (c) { return c.limit > 0; }).map(function (c) { return { c: c, pay: CR.payToTarget(c, tg), d: CR.daysUntil(c.statement) }; }).sort(function (a, b) { return a.d - b.d; });
    var t = el('div', 'tw'), tt = el('table', 'rt cmpt'); tt.innerHTML = '<caption class="sr">Pay before the statement closes</caption><thead><tr><th scope="col">Card</th><th scope="col">Statement closes</th><th scope="col">Pay before then</th></tr></thead>';
    var b = el('tbody'); rows.forEach(function (r) { var tr = el('tr'); tr.innerHTML = '<td>' + esc(r.c.name) + '</td><td>in ' + r.d + ' day' + (r.d === 1 ? '' : 's') + '</td><td>' + (r.pay > 0 ? '<b>' + money(r.pay) + '</b>' : 'Nothing needed') + '</td>'; b.appendChild(tr); });
    tt.appendChild(b); t.appendChild(tt); box.appendChild(el('h3', '', 'Pay before the statement closes')); box.appendChild(t);
    var due = state.cards.slice().sort(function (a, b) { return CR.daysUntil(a.due) - CR.daysUntil(b.due); });
    var dd = el('div', 'tw'), dt = el('table', 'rt cmpt'); dt.innerHTML = '<caption class="sr">Due dates</caption><thead><tr><th scope="col">Card</th><th scope="col">Payment due</th><th scope="col">Minimum</th></tr></thead>';
    var db = el('tbody'); due.forEach(function (c) { var k = CR.daysUntil(c.due), tr = el('tr'); tr.innerHTML = '<td>' + esc(c.name) + '</td><td>in ' + k + ' day' + (k === 1 ? '' : 's') + ' (day ' + c.due + ')</td><td>' + money(CR.minPayment(c)) + '</td>'; db.appendChild(tr); });
    dt.appendChild(db); dd.appendChild(dt); box.appendChild(el('h3', '', 'Payments due soonest')); box.appendChild(dd);
    box.appendChild(el('div', 'callout', 'Pay at least the minimum by the due date every time. A late payment is the most damaging item on a credit report. Autopay for the minimum is a safe floor.'));
  }

  /* ---------- STRATEGY ---------- */
  function buildStrategy() {
    var p = $('p-strategy'); p.innerHTML = '';
    p.appendChild(el('h2', '', 'Good debt, bad debt and your wealth'));
    p.appendChild(el('p', 'lead', 'Debt that costs more than you can reliably earn is a drag. Debt that is cheap and buys an asset or income can be a tool. Enter your debts and an investment return you would be comfortable counting on, and compare three ways to use the same monthly money.'));
    var s = state.settings, f = el('form', 'fields cc-form'); f.onsubmit = function (e) { e.preventDefault(); };
    [['x-extra', 'Extra money each month', s.extra, { pre: '$', hint: 'On top of all minimum payments' }], ['x-ret', 'Investment return', s.ret, { suf: '%', hint: 'Per year, after fees and tax. Be modest.' }],
      ['x-years', 'Years to look ahead', s.years, { suf: 'years' }], ['x-tax', 'Your tax rate', s.tax, { suf: '%', hint: 'Used only if a debt’s interest is deductible' }], ['x-inv', 'Invested today', s.invested, { pre: '$' }]]
      .forEach(function (d) { var w = field(d[0], d[1], 'num', d[2], d[3]); f.appendChild(w); w.querySelector('input').addEventListener('input', function () { readSettings(); touch(); refreshStrategy(); }); });
    var lab = el('label', 'chk'); lab.innerHTML = '<input type="checkbox" id="x-cards"> Include the balances from my cards tab'; f.appendChild(lab); p.appendChild(f);
    $('x-cards').checked = s.includeCards; $('x-cards').addEventListener('change', function () { readSettings(); touch(); refreshStrategy(); });
    p.appendChild(el('h3', '', 'Other debts'));
    var df = el('form', 'fields cc-form'); df.onsubmit = function (e) { e.preventDefault(); };
    [['d-name', 'Name', 'text', '', { max: 40, ph: 'Mortgage, car, student loan' }], ['d-bal', 'Balance', 'num', '', { pre: '$' }], ['d-apr', 'Interest rate', 'num', '', { suf: '%' }], ['d-min', 'Monthly payment', 'num', '', { pre: '$', hint: 'Leave blank to estimate' }]].forEach(function (d) { df.appendChild(field(d[0], d[1], d[2], d[3], d[4])); });
    var c1 = el('label', 'chk'); c1.innerHTML = '<input type="checkbox" id="d-ded"> Interest is tax-deductible'; var c2 = el('label', 'chk'); c2.innerHTML = '<input type="checkbox" id="d-asset"> Buys an asset or income (home, rental, business)'; df.appendChild(c1); df.appendChild(c2);
    var add = el('button', 'glass primary', 'Add debt'); add.type = 'button'; add.onclick = function () {
      var d = { id: uid(), name: $('d-name').value.trim().slice(0, 40) || 'Debt ' + (state.debts.length + 1), balance: num($('d-bal').value), apr: num($('d-apr').value), min: num($('d-min').value), deductible: $('d-ded').checked, asset: $('d-asset').checked };
      if (d.balance <= 0) { status('Enter a balance above zero.'); return; } state.debts.push(d); df.reset(); touch(); refreshStrategy();
    };
    df.appendChild(el('div', 'fld fbtn')).appendChild(add); p.appendChild(df);
    var out = el('div', ''); out.id = 'x-out'; p.appendChild(out);
  }
  function readSettings() { var s = state.settings; s.extra = num($('x-extra').value); s.ret = num($('x-ret').value); s.years = Math.min(Math.max(num($('x-years').value) || 1, 1), 40); s.tax = num($('x-tax').value); s.invested = num($('x-inv').value); s.includeCards = $('x-cards').checked; }
  function allDebts() {
    var ds = state.debts.map(function (d) { return d; });
    if (state.settings.includeCards) state.cards.filter(function (c) { return c.balance > 0; }).forEach(function (c) { ds.push({ id: c.id, name: c.name + ' (card)', balance: c.balance, apr: c.apr, min: c.minPay, deductible: false, asset: false }); });
    return ds;
  }
  var NAMES = { 'debt-first': 'Pay debt first', 'invest-first': 'Invest first', 'smart': 'Smart split' };
  var BLURB = { 'debt-first': 'Every spare dollar goes to the highest-rate debt, then to investing.', 'invest-first': 'Minimums only on debt. Spare money is invested.', 'smart': 'Spare money attacks debt that costs more than your expected return, and invests the rest.' };
  function refreshStrategy() {
    var box = $('x-out'); box.innerHTML = ''; var ds = allDebts(), s = state.settings;
    if (!ds.length) { box.appendChild(el('p', 'subn', 'No debts to analyse. Add one above or add cards with balances.')); return; }
    var r = CR.compareStrategies(ds, s);
    box.appendChild(el('h3', '', 'Which debts are working against you'));
    var t = el('div', 'tw'), tt = el('table', 'rt cmpt'); tt.innerHTML = '<caption class="sr">Debt classification</caption><thead><tr><th scope="col">Debt</th><th scope="col">Balance</th><th scope="col">Effective rate</th><th scope="col">Verdict</th><th scope="col"><span class="sr">Remove</span></th></tr></thead>';
    var b = el('tbody'); ds.forEach(function (d, i) {
      var c = r.classes[i], tr = el('tr'); tr.innerHTML = '<td>' + esc(d.name) + '</td><td>' + money(d.balance) + '</td><td>' + pct(c.rate) + '</td><td><span class="vd v-' + c.kind + '">' + (c.kind === 'bad' ? 'Bad debt' : c.kind === 'good' ? 'Good debt' : 'Judgment call') + '</span><small>' + esc(c.label) + '</small></td>';
      var td = el('td'); if (state.debts.some(function (z) { return z.id === d.id; })) { var x = el('button', 'sbtn', 'Remove'); x.type = 'button'; x.onclick = function () { state.debts = state.debts.filter(function (z) { return z.id !== d.id; }); touch(); refreshStrategy(); }; td.appendChild(x); } tr.appendChild(td); b.appendChild(tr);
    }); tt.appendChild(b); t.appendChild(tt); box.appendChild(t);
    box.appendChild(el('h3', '', 'Three ways to use the same money'));
    var max = Math.max.apply(null, r.results.map(function (x) { return Math.max(x.netWorth, 1); })), grid = el('div', 'strats');
    r.results.forEach(function (x) {
      var best = x.strategy === r.best, c = el('article', 'strat' + (best ? ' best' : ''));
      c.innerHTML = (best ? '<span class="flag">Highest net worth</span>' : '') + '<h4>' + NAMES[x.strategy] + '</h4><p class="subn">' + BLURB[x.strategy] + '</p><strong class="big-n">' + money(x.netWorth) + '</strong><small>Net worth in ' + s.years + ' years</small>' +
        '<div class="ub"><i class="lo" style="width:' + Math.max(0, Math.min(100, (x.netWorth / max) * 100)) + '%"></i></div>' +
        '<dl><dt>Invested</dt><dd>' + money(x.invested) + '</dd><dt>Debt left</dt><dd>' + money(x.debtLeft) + '</dd><dt>Interest paid</dt><dd>' + money(x.interest) + '</dd><dt>Debt-free</dt><dd>' + (x.debtFreeMonths ? Math.floor(x.debtFreeMonths / 12) + ' yr ' + (x.debtFreeMonths % 12) + ' mo' : (x.debtLeft > 0.5 ? 'Not in this period' : 'Already')) + '</dd></dl>';
      grid.appendChild(c);
    }); box.appendChild(grid);
    var bad = r.classes.filter(function (c) { return c.kind === 'bad'; }).length;
    box.appendChild(el('div', 'callout', bad ? '<b>Reading this.</b> ' + bad + ' of your debts cost more than the ' + s.ret + '% you expect to earn. Paying those off is a guaranteed return equal to their rate. Cheaper, asset-backed debt can stay while you invest.' : '<b>Reading this.</b> None of your debts cost more than your expected return, so investing the extra can come out ahead, if you can stomach the risk and the return you assumed is realistic.'));
    ['Take any employer match first. It is an immediate return no debt payoff beats.', 'Keep an emergency fund before aggressive moves. A surprise bill on a card undoes the plan.', 'Investment returns are not guaranteed; debt payments are. A lower assumed return favours paying debt.', 'Never carry a card balance to chase rewards. The interest outweighs them.', 'Good debt is still debt. Leverage magnifies losses as well as gains. Keep payments you could carry if income dropped.'].forEach(function (g) { var l = el('p', 'guard', esc(g)); box.appendChild(l); });
  }

  /* ---------- PACKET ---------- */
  function buildPacket() {
    var p = $('p-packet'); p.innerHTML = '<h2>Your packet</h2><p class="lead">Your credit information is a small file that you own. There are no accounts and no servers. Open it on any device to continue where you left off.</p>' +
      '<div class="tw"><table class="rt cmpt"><thead><tr><th scope="col">Word</th><th scope="col">What it means</th></tr></thead><tbody>' +
      '<tr><td><b>Packet</b></td><td>A file with your scores, cards, debts and settings. It is plain JSON and <b>not encrypted</b>, so keep it private.</td></tr>' +
      '<tr><td><b>Device</b></td><td>A copy this browser remembers when you press Save to device. Browsers can clear site data, so it is <b>not a backup</b>, and it does not sync between devices.</td></tr>' +
      '<tr><td><b>Never</b></td><td>Nothing here is uploaded. Calculations run in your browser. Do not enter card numbers, Social Security numbers or passwords.</td></tr></tbody></table></div>';
    var row = el('div', 'tools-row');
    [['Save packet file', savePacket, 'primary'], ['Save to device', saveDevice, ''], ['Clear this device', function () { try { localStorage.removeItem(KEY); } catch (e) {} deviceAt = null; bar(); status('Device copy removed.'); }, ''], ['Start over', function () { if (confirm('Clear everything on this page? Your saved packet file and device copy are not changed until you save.')) { state = blank(); dirty = true; renderAll(); } }, '']].forEach(function (b) {
      var x = el('button', 'glass ' + b[2], b[0]); x.type = 'button'; x.onclick = b[1]; row.appendChild(x); });
    var imp = el('label', 'glass', 'Open a packet'); imp.htmlFor = 'pk-file'; imp.style.cursor = 'pointer'; row.appendChild(imp);
    var fi = el('input', 'sr'); fi.type = 'file'; fi.id = 'pk-file'; fi.accept = 'application/json,.json';
    fi.onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var pk = CR.sanitizePacket(JSON.parse(r.result)); var has = state.scores.length || state.cards.length || state.debts.length; if (has && !confirm('Replace what is on this page with the packet?')) return; load(pk); lastPacket = pk.savedAt; bar(); status('Packet opened: ' + pk.scores.length + ' scores, ' + pk.cards.length + ' cards, ' + pk.debts.length + ' debts.'); } catch (x) { status('That is not a FiveOceans credit packet.'); } e.target.value = ''; };
      r.readAsText(f);
    };
    row.appendChild(fi); p.appendChild(row);
  }

  function renderAll() { refreshScores(); refreshCards(); buildStrategy(); refreshStrategy(); bar(); }
  function init() {
    var tabs = $('cc-tabs');
    [['scores', 'Scores'], ['cards', 'Cards'], ['strategy', 'Debt strategy'], ['packet', 'Packet']].forEach(function (t) {
      var b = el('button', '', t[1]); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = t[0]; b.id = 'tab-' + t[0]; b.setAttribute('aria-controls', 'p-' + t[0]);
      b.onclick = function () { setTab(t[0]); }; b.onkeydown = function (e) { var ks = ['scores', 'cards', 'strategy', 'packet'], i = ks.indexOf(t[0]); if (e.key === 'ArrowRight') { setTab(ks[(i + 1) % 4]); $('tab-' + tab).focus(); } else if (e.key === 'ArrowLeft') { setTab(ks[(i + 3) % 4]); $('tab-' + tab).focus(); } };
      tabs.appendChild(b);
    });
    var dev = readDevice();
    buildScores(); buildCards(); buildStrategy(); buildPacket();
    if (dev) { deviceAt = dev.savedAt; var ban = $('cc-banner'); ban.hidden = false; $('cc-continue').onclick = function () { load(dev); ban.hidden = true; status('Opened the copy saved on this device.'); }; }
    renderAll(); var h = location.hash.slice(1); setTab(['scores', 'cards', 'strategy', 'packet'].indexOf(h) >= 0 ? h : 'scores');
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  }
  document.addEventListener('DOMContentLoaded', init);
})();
