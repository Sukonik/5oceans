/* FiveOceans Real Estate Calculator UI. Everything runs in the browser; nothing is sent anywhere. */
(function () {
  'use strict';
  var RE = window.RE, $ = function (id) { return document.getElementById(id); };
  var KEY = 'fiveoceans-re-scenarios', cur = null, vals = {}, saved = [];
  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmt(v, kind) {
    if (!isFinite(v)) return '-';
    var neg = v < 0, a = Math.abs(v), s;
    if (kind === 'pct') s = (Math.round(a * 10) / 10).toLocaleString('en-US') + '%';
    else if (kind === 'x') s = a.toFixed(2) + 'x';
    else if (kind === 'months') s = Math.round(a).toLocaleString('en-US') + ' months';
    else if (kind === 'num') s = (Math.round(a * 10) / 10).toLocaleString('en-US');
    else s = usd.format(a);
    return (neg ? '−' : '') + s;
  }
  function parse(t) { var n = parseFloat(String(t).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function load() { try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(saved)) saved = []; } catch (e) { saved = []; } }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { note('This browser blocked saving. Export a file instead.'); } }
  function note(t) { var n = $('scn-msg'); if (n) { n.textContent = t; } }

  function buildModes() {
    var box = $('modes'), groups = {}, order = [];
    Object.keys(RE.MODES).forEach(function (id) { var m = RE.MODES[id]; if (!groups[m.group]) { groups[m.group] = []; order.push(m.group); } groups[m.group].push(m); });
    order.forEach(function (g) {
      var wrap = el('div', 'mgroup'); wrap.appendChild(el('p', 'mlabel', esc(g)));
      var row = el('div', 'mrow'); row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', g);
      groups[g].forEach(function (m) {
        var b = el('button', 'mbtn', esc(m.label)); b.type = 'button'; b.setAttribute('role', 'radio'); b.dataset.mode = m.id; b.setAttribute('aria-checked', 'false');
        b.addEventListener('click', function () { setMode(m.id); }); row.appendChild(b);
      });
      wrap.appendChild(row); box.appendChild(wrap);
    });
  }
  function setMode(id, values) {
    if (!RE.MODES[id]) id = 'home';
    cur = RE.MODES[id]; vals = Object.assign(RE.defaults(cur), values || {});
    document.querySelectorAll('.mbtn').forEach(function (b) { var on = b.dataset.mode === id; b.setAttribute('aria-checked', on); b.classList.toggle('on', on); });
    $('mode-title').textContent = cur.label; $('mode-blurb').textContent = cur.blurb;
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
    $('ex-btn').hidden = !cur.example;
    buildFields(); render(); renderScenarios();
  }
  function buildFields() {
    var f = $('fields'); f.innerHTML = '';
    cur.fields.forEach(function (fd) {
      var id = 'f-' + fd.id, w = el('div', 'fld'), l = el('label', '', esc(fd.label)); l.htmlFor = id;
      var wrap = el('div', 'inp'), hint = el('small', '', esc(fd.hint || '')); hint.id = id + '-h';
      if (fd.kind === 'select') {
        var sel = el('select'); sel.id = id; sel.setAttribute('aria-describedby', id + '-h');
        fd.options.forEach(function (o, i) { var op = el('option', '', esc(o)); op.value = String(i); sel.appendChild(op); });
        sel.value = String(vals[fd.id] | 0);
        sel.addEventListener('change', function () {
          vals[fd.id] = +sel.value;
          if (fd.id === 'program' && RE.PROGRAMS && RE.PROGRAMS[vals.program] && cur.fields.some(function (x) { return x.id === 'downPct'; })) { vals.downPct = RE.PROGRAMS[vals.program].down; buildFields(); $('f-program').focus(); }
          render();
        });
        wrap.appendChild(sel); w.appendChild(l); w.appendChild(wrap); w.appendChild(hint); f.appendChild(w); return;
      }
      var i = el('input'); i.id = id; i.type = 'text'; i.inputMode = 'decimal'; i.autocomplete = 'off'; i.value = String(vals[fd.id]);
      i.dataset.f = fd.id; i.setAttribute('aria-describedby', id + '-h');
      var pre = fd.kind === 'money' ? '$' : '', suf = fd.kind === 'pct' ? '%' : (fd.unit || '');
      if (pre) wrap.appendChild(el('span', 'af pre', pre)); wrap.appendChild(i); if (suf) wrap.appendChild(el('span', 'af suf', esc(suf)));
      i.addEventListener('input', function () { vals[fd.id] = parse(i.value); render(); });
      i.addEventListener('blur', function () { i.value = String(vals[fd.id]); });
      w.appendChild(l); w.appendChild(wrap); w.appendChild(hint);
      f.appendChild(w);
    });
  }
  function render() {
    var out = cur.compute(vals), box = $('results'); box.innerHTML = '';
    var hl = el('div', 'hl'); hl.appendChild(el('span', 'hl-k', esc(out.headline.k))); hl.appendChild(el('strong', 'hl-v', fmt(out.headline.v, out.headline.kind)));
    if (out.headline.note) hl.appendChild(el('span', 'hl-n', esc(out.headline.note))); box.appendChild(hl);
    var tb = el('table', 'rt'); tb.innerHTML = '<caption class="sr">Results</caption>';
    var body = el('tbody');
    out.rows.forEach(function (r) {
      var tr = el('tr', r.strong ? 'strong' : ''); tr.innerHTML = '<th scope="row">' + esc(r.k) + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</th><td class="' + (r.v < 0 ? 'neg' : '') + '">' + fmt(r.v, r.kind) + '</td>';
      body.appendChild(tr);
    });
    tb.appendChild(body); box.appendChild(tb);
    (out.warn || []).forEach(function (w) { box.appendChild(el('div', 'callout', esc(w))); });
    var st = RE.stressTests(cur.id, vals);
    if (st.length) {
      var s = el('div', 'sub'); s.appendChild(el('h3', '', 'Stress test'));
      s.appendChild(el('p', 'subn', 'What happens to ' + esc(out.keyLabel.toLowerCase()) + ' if one thing goes wrong. Base: <strong>' + fmt(out.key, 'money') + '</strong>.'));
      var t = el('table', 'rt st'); t.innerHTML = '<tbody></tbody>';
      st.forEach(function (x) {
        var worse = cur.higherIsBetter ? x.delta < 0 : x.delta > 0, tr = el('tr');
        tr.innerHTML = '<th scope="row">' + esc(x.label) + '</th><td>' + fmt(x.value, 'money') + '<small class="' + (worse ? 'neg' : 'pos') + '">' + (x.delta >= 0 ? '+' : '−') + usd.format(Math.abs(x.delta)) + '</small></td>';
        t.firstChild.appendChild(tr);
      });
      s.appendChild(t); box.appendChild(s);
    }
    var sn = RE.sensitivity(cur.id, vals);
    if (sn) {
      var d = el('div', 'sub'); d.appendChild(el('h3', '', 'Vacancy and rate grid'));
      d.appendChild(el('p', 'subn', esc(out.keyLabel) + ' at different vacancy and interest rates.'));
      var g = el('div', 'tw'), tt = el('table', 'rt grid'), h = '<thead><tr><th scope="col">Vacancy</th>';
      sn.rates.forEach(function (r) { h += '<th scope="col">' + (Math.round(r * 100) / 100) + '% rate</th>'; }); h += '</tr></thead><tbody>';
      sn.vac.forEach(function (vc, i) { h += '<tr><th scope="row">' + (Math.round(vc * 10) / 10) + '%</th>'; sn.grid[i].forEach(function (x, j) { h += '<td' + (i === 0 && j === 1 ? ' class="base"' : '') + '>' + fmt(x, 'money') + '</td>'; }); h += '</tr>'; });
      tt.innerHTML = h + '</tbody>'; g.appendChild(tt); d.appendChild(g); box.appendChild(d);
    }
    box.dataset.summary = out.headline.k + ': ' + fmt(out.headline.v, out.headline.kind) + '\n' + out.rows.map(function (r) { return r.k + ': ' + fmt(r.v, r.kind); }).join('\n');
  }

  /* ---- scenarios ---- */
  function renderScenarios() {
    var box = $('scn-list'); box.innerHTML = '';
    if (!saved.length) { box.appendChild(el('p', 'subn', 'No saved scenarios yet. Save one to compare it later. Nothing leaves this browser.')); $('cmp').innerHTML = ''; return; }
    saved.forEach(function (sc, i) {
      var m = RE.MODES[sc.mode]; if (!m) return;
      var li = el('div', 'sc');
      li.innerHTML = '<label class="scl"><input type="checkbox" data-i="' + i + '"> <span><b>' + esc(sc.name) + '</b><small>' + esc(m.label) + ' · ' + esc(new Date(sc.at).toLocaleDateString()) + '</small></span></label>';
      var b1 = el('button', 'sbtn', 'Open'), b2 = el('button', 'sbtn', 'Delete'); b1.type = b2.type = 'button';
      b1.addEventListener('click', function () { setMode(sc.mode, sc.values); window.scrollTo({ top: $('calc-top').offsetTop - 80, behavior: 'smooth' }); });
      b2.addEventListener('click', function () { saved.splice(i, 1); store(); renderScenarios(); });
      li.appendChild(b1); li.appendChild(b2); box.appendChild(li);
    });
    box.querySelectorAll('input[type=checkbox]').forEach(function (c) { c.addEventListener('change', compare); });
    compare();
  }
  function compare() {
    var picks = Array.prototype.slice.call(document.querySelectorAll('#scn-list input:checked')).map(function (c) { return saved[+c.dataset.i]; }).slice(0, 3), box = $('cmp');
    box.innerHTML = ''; if (picks.length < 2) { if (picks.length) box.appendChild(el('p', 'subn', 'Select a second scenario to compare.')); return; }
    var outs = picks.map(function (p) { return RE.MODES[p.mode].compute(Object.assign(RE.defaults(RE.MODES[p.mode]), p.values)); });
    var h = '<thead><tr><th scope="col">Measure</th>' + picks.map(function (p) { return '<th scope="col">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr class="strong"><th scope="row">Headline</th>' + outs.map(function (o) { return '<td>' + esc(o.headline.k) + '<br>' + fmt(o.headline.v, o.headline.kind) + '</td>'; }).join('') + '</tr>';
    var same = picks.every(function (p) { return p.mode === picks[0].mode; });
    if (same) {
      outs[0].rows.forEach(function (r, i) { h += '<tr><th scope="row">' + esc(r.k) + '</th>' + outs.map(function (o) { return '<td>' + fmt(o.rows[i].v, o.rows[i].kind) + '</td>'; }).join('') + '</tr>'; });
      var m = RE.MODES[picks[0].mode], changed = m.fields.filter(function (f) { return picks.some(function (p) { return (p.values[f.id] != null ? p.values[f.id] : f.def) !== (picks[0].values[f.id] != null ? picks[0].values[f.id] : f.def); }); });
      h += '<tr><th scope="row">What changed</th><td colspan="' + picks.length + '">' + (changed.length ? changed.map(function (f) { return esc(f.label) + ': ' + picks.map(function (p) { return p.values[f.id] != null ? p.values[f.id] : f.def; }).join(' / '); }).join('; ') : 'Same inputs') + '</td></tr>';
    }
    var t = el('table', 'rt cmpt'); t.innerHTML = h + '</tbody>'; var w = el('div', 'tw'); w.appendChild(t); box.appendChild(w);
    if (!same) box.appendChild(el('p', 'subn', 'These use different calculators, so only the headline numbers are shown.'));
  }
  function download(name, text) { var a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }


  /* ---------- Dolphin Sonar ---------- */
  var SN = window.SONAR, snPing = null;
  function snFmt(f) {
    var v = f.value, k = f.kind;
    if (typeof v !== 'number') return esc(v);
    if (k === 'money') return usd.format(v);
    if (k === 'pct') return (Math.round(v * 100) / 100) + '%';
    if (k === 'year') return String(v);
    if (k === 'int') return Math.round(v).toLocaleString('en-US');
    return (Math.round(v * 100) / 100).toLocaleString('en-US');
  }
  function snRender(p, auto) {
    var box = $('sn-out'); box.innerHTML = ''; snPing = p;
    if (!p.found.length && !p.address) { box.appendChild(el('div', 'callout', 'Nothing detected. Paste the part of the listing that shows the price, beds and baths, taxes and fees. Include the link too if you have it.')); return; }
    var head = p.address ? esc(p.address) : 'Listing', site = p.site ? ' on ' + esc(p.site) : '';
    var groups = {}; p.found.forEach(function (f) { groups[f.group] = (groups[f.group] || 0) + 1; });
    box.appendChild(el('p', 'sn-head', '<b>' + head + '</b>' + site + (p.listingId ? ' <small>ID ' + esc(p.listingId) + '</small>' : '') + '<br><small>' + p.found.length + ' facts found in ' + Object.keys(groups).length + ' categories</small>'));
    if (p.insights && p.insights.length) {
      var ins = el('div', 'sn-ins'); ins.appendChild(el('h3', '', 'What Sonar noticed'));
      p.insights.forEach(function (i) { ins.appendChild(el('div', 'callout' + (i.tone === 'warn' ? ' high' : i.tone === 'good' ? ' ok' : ''), esc(i.text))); });
      box.appendChild(ins);
    }
    var open = { 'Price and payment': 1, 'Monthly costs': 1, 'Property': 1 };
    SN.GROUPS.forEach(function (g) {
      var rows = p.found.filter(function (f) { return f.group === g; }); if (!rows.length) return;
      var d = el('details', 'sn-grp'); if (open[g]) d.open = true;
      d.innerHTML = '<summary>' + esc(g) + ' <span class="cnt">' + rows.length + '</span></summary><table class="rt"><caption class="sr">' + esc(g) + '</caption><tbody>' + rows.map(function (f) { return '<tr><th scope="row">' + esc(f.label) + '</th><td>' + snFmt(f) + '</td></tr>'; }).join('') + '</tbody></table>';
      box.appendChild(d);
    });
    var row = el('div', 'sn-row'), lab = el('label', '', 'Send to'), sel = el('select'); sel.id = 'sn-mode'; lab.htmlFor = 'sn-mode';
    var sug = SN.suggestMode(p);
    Object.keys(RE.MODES).forEach(function (id) { var o = el('option', '', esc(RE.MODES[id].label)); o.value = id; if (id === sug) o.selected = true; sel.appendChild(o); });
    var go = el('button', 'glass primary', 'Fill the calculator'); go.type = 'button';
    go.onclick = function () { snApply(sel.value); };
    row.appendChild(lab); row.appendChild(sel); row.appendChild(go); box.appendChild(row);
    box.appendChild(el('p', 'subn', 'Suggested calculator: <b>' + esc(RE.MODES[sug].label) + '</b>. Check every number against the listing. Nothing was fetched or sent anywhere, and agent names and contact details are never read.'));
    if (auto) snApply(sug);
  }
  function snApply(modeId) {
    var m = RE.MODES[modeId], ids = m.fields.map(function (f) { return f.id; }), v = SN.toValues(snPing, modeId, ids), keys = Object.keys(v);
    setMode(modeId, v);
    var nm = $('scn-name'); if (nm && snPing.address) nm.value = snPing.address.slice(0, 60);
    var names = m.fields.filter(function (f) { return v[f.id] != null; }).map(function (f) { return f.label; });
    var msg = $('sn-msg'); msg.textContent = keys.length ? 'Filled ' + names.join(', ') + '. Everything else is still a default: set your rate, down payment and other costs.' : 'Nothing could be mapped to this calculator. Try another one.';
    var top = $('calc-top'); if (top && top.scrollIntoView) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function snInit() {
    if (!$('sonar') || !SN) return false;
    $('sn-bm').href = SN.bookmarkletSource(location.origin + location.pathname);
    $('sn-go').addEventListener('click', function () { snRender(SN.parseListing({ url: $('sn-url').value.trim(), text: $('sn-text').value }), false); });
    $('sn-clear').addEventListener('click', function () { $('sn-url').value = ''; $('sn-text').value = ''; $('sn-out').innerHTML = ''; $('sn-msg').textContent = ''; snPing = null; });
    var d = SN.decodeHash(location.hash);
    if (d) {
      history.replaceState(null, '', location.pathname);
      $('sn-url').value = d.url; $('sn-text').value = d.text.slice(0, 4000);
      snRender(SN.parseListing(d), true); return true;
    }
    return false;
  }

  function init() {
    load(); buildModes(); var sonarApplied = snInit();
    $('save-btn').addEventListener('click', function () {
      var name = $('scn-name').value.trim() || (cur.label + ' ' + (saved.length + 1));
      saved.unshift({ id: String(Date.now()), name: name, mode: cur.id, values: Object.assign({}, vals), at: Date.now() }); saved = saved.slice(0, 12);
      store(); $('scn-name').value = ''; note('Saved "' + name + '" on this device.'); renderScenarios();
    });
    $('reset-btn').addEventListener('click', function () { setMode(cur.id); });
    $('ex-btn').addEventListener('click', function () { setMode(cur.id, cur.example); });
    $('copy-btn').addEventListener('click', function () {
      var t = cur.label + '\n' + $('results').dataset.summary + '\n\nIllustrative estimate from FiveOceans. Not advice.';
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { note('Results copied.'); }, function () { note('Copy is blocked in this browser.'); });
    });
    $('export-btn').addEventListener('click', function () { download('fiveoceans-scenarios.json', JSON.stringify({ app: 'fiveoceans-real-estate', version: 1, scenarios: saved }, null, 2)); });
    $('import-file').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () {
        try {
          var d = JSON.parse(r.result), n = 0;
          if (d.app !== 'fiveoceans-real-estate' || !Array.isArray(d.scenarios)) throw 0;
          d.scenarios.forEach(function (s) { if (RE.MODES[s.mode] && s.values && typeof s.values === 'object') { var v = {}; Object.keys(s.values).forEach(function (k) { if (typeof s.values[k] === 'number') v[k] = s.values[k]; }); saved.push({ id: String(Date.now() + n), name: String(s.name || 'Imported').slice(0, 60), mode: s.mode, values: v, at: s.at || Date.now() }); n++; } });
          saved = saved.slice(0, 12); store(); renderScenarios(); note('Imported ' + n + ' scenario' + (n === 1 ? '' : 's') + '.');
        } catch (x) { note('That file is not a FiveOceans scenario file.'); }
        e.target.value = '';
      }; r.readAsText(f);
    });
    window.addEventListener('hashchange', function () { var id = location.hash.slice(1); if (RE.MODES[id] && (!cur || cur.id !== id)) setMode(id); });
    if (!sonarApplied) setMode(RE.MODES[location.hash.slice(1)] ? location.hash.slice(1) : 'home'); else renderScenarios();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
