// Structural checks on the built site (run after `python scripts/build_site.py`). No dependencies.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
const root = new URL('../site/', import.meta.url).pathname;
if (!existsSync(root)) { console.log('site/ not built; skipping'); process.exit(0); }
const pages = []; (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === 'index.html') pages.push(p); } })(root);
const html = new Map(pages.map((p) => [normalize(p), readFileSync(p, 'utf8')]));
const strip = (t) => t.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<svg[\s\S]*?<\/svg>/gi, '');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };
const rel = (p) => p.replace(root, '');

ok('every page has one h1, one main, a header, a footer and a skip link', () => {
  for (const [p, t] of html) { const s = strip(t); assert.equal((s.match(/<h1[\s>]/g) || []).length, 1, rel(p) + ' h1'); assert.equal((s.match(/<main[\s>]/g) || []).length, 1, rel(p) + ' main'); assert.ok(/<header[\s>]/.test(s) && /<footer[\s>]/.test(s), rel(p)); assert.ok(/href="#main"/.test(s), rel(p) + ' skip'); }
});
ok('no duplicate ids in the static markup', () => {
  for (const [p, t] of html) { const ids = [...strip(t).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]), d = ids.filter((x, i) => ids.indexOf(x) !== i); assert.deepEqual(d, [], rel(p)); }
});
ok('the hero sits inside the main landmark', () => {
  for (const [p, t] of html) { const s = strip(t), m = s.indexOf('<main'), h = s.indexOf('class="hero'); if (h >= 0) assert.ok(h > m, rel(p)); }
});
ok('heading levels never skip downward', () => {
  for (const [p, t] of html) { let prev = 0; for (const m of strip(t).matchAll(/<h([1-6])[\s>]/g)) { const l = +m[1]; assert.ok(prev === 0 || l <= prev + 1, `${rel(p)} jumps h${prev} to h${l}`); prev = l; } }
});
ok('no aside landmarks are nested inside main', () => {
  for (const [p, t] of html) { const s = strip(t), m = s.indexOf('<main'), e = s.indexOf('</main>'); assert.ok(!/<aside[\s>]/.test(s.slice(m, e)), rel(p)); }
});
ok('internal links and anchors resolve', () => {
  let bad = [];
  for (const [p, t] of html) for (const m of strip(t).matchAll(/href="([^"]+)"/g)) {
    const h = m[1]; if (/^(https?:|mailto:|javascript:)/.test(h)) continue; const [path, anc] = h.split('#');
    let tgt = path ? normalize(join(dirname(p), path)) : p; if (existsSync(tgt) && statSync(tgt).isDirectory()) tgt = join(tgt, 'index.html');
    if (!html.has(tgt) && !existsSync(tgt)) { bad.push(rel(p) + ' -> ' + h); continue; }
    if (anc && html.has(tgt) && !tgt.endsWith('tools/real-estate/index.html') && !tgt.endsWith('credit/index.html') && !html.get(tgt).includes(`id="${anc}"`)) bad.push(rel(p) + ' -> ' + h);
  }
  assert.deepEqual(bad.slice(0, 5), []);
});
ok('menus mark the current section, and never Home on another page', () => {
  const want = (r) => r === 'index.html' ? 'Home' : r.startsWith('water/') || /^(seawater|freshwater|coastalsea|centralsea|deepsea|spring|lake|river)\//.test(r) || r.startsWith('animals/') ? 'Water' : r.startsWith('resources/') || r.startsWith('guides/') ? 'Resources' : r.startsWith('tools/') || r.startsWith('credit/') ? 'Tools' : r.startsWith('maps/') ? 'Maps' : null;
  for (const [p, t] of html) {
    const r = rel(p), dock = (t.match(/<nav class="dock"[\s\S]*?<\/nav>/) || [''])[0], w = want(r); if (!w) continue;
    const cur = [...dock.matchAll(/<(?:a|button)[^>]*aria-current="page"[^>]*>(?:<svg[\s\S]*?<\/svg>)?(?:<span>)?([A-Za-z]+)/g)].map((m) => m[1]).filter((x) => ['Home', 'Water', 'Resources', 'Tools', 'Maps'].includes(x));
    assert.deepEqual(cur, [w], `${r}: dock highlights ${cur} not ${w}`);
  }
});
ok('search results and calculator results use different ids', () => {
  const t = html.get(normalize(join(root, 'tools/real-estate/index.html'))); assert.equal((t.match(/id="results"/g) || []).length, 1); assert.ok(t.includes('id="search-results"'));
});
console.log(n + ' site checks passed');
