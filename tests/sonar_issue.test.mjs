import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'sonar-'));
import http from 'node:http';
const run = (body, env = {}) => {
  const ev = join(dir, 'e.json'), out = join(dir, 'o.md');
  writeFileSync(ev, JSON.stringify({ issue: { body }, repository: { owner: { login: 'Sukonik' }, name: '5oceans' } }));
  execFileSync('node', ['scripts/sonar_issue.mjs', ev, out], { env: { ...process.env, SITE_URL: '', ...env } });
  return readFileSync(out, 'utf8');
};
let n = 0; const pending = []; const ok = (name, fn) => { const r = fn(); if (r && r.then) pending.push(r.then(() => { n++; console.log('ok', name); })); else { n++; console.log('ok', name); } };
ok('replies with facts and a calculator link', () => {
  const md = run('### Listing link\n\nhttps://www.redfin.com/NY/Long-Beach/123-Ocean-Blvd-11561/home/12345678\n\n### Listing text\n\nListed price: $875,000\n3 beds 2.5 baths 1,850 sq ft\nProperty taxes: $11,400 / yr\nHOA fee $85 / month');
  assert.match(md, /123 Ocean Blvd, Long Beach, NY, 11561/); assert.match(md, /\$875,000/); assert.match(md, /\$11,400/);
  assert.match(md, /https:\/\/sukonik\.github\.io\/5oceans\/tools\/real-estate\/#sonar=[A-Za-z0-9_-]+/); assert.match(md, /Suggested calculator: \*\*home\*\*/);
});
ok('handles no facts and empty fields', () => {
  assert.match(run('### Listing link\n\n_No response_\n\n### Listing text\n\nhello there'), /could not detect/);
  assert.match(run(''), /could not detect/);
});
ok('hostile text is treated as data', () => {
  const md = run('### Listing text\n\n$(rm -rf /) `id` <script>alert(1)</script> Price: $500,000 2 bd');
  assert.match(md, /\$500,000/);
});
ok('a listing portal link is refused with a clear reason, not fetched', () => {
  const md = run('### Listing link\n\nhttps://www.zillow.com/homedetails/123-Ocean-Blvd-Long-Beach-NY-11561/12345678_zpid/\n\n### Listing text\n\n_No response_');
  assert.match(md, /listing portal whose terms generally forbid automated access/); assert.match(md, /123 Ocean Blvd/);
});
ok('reads a permitted link when no text is pasted', async () => {
  const srv = http.createServer((q, r) => { if (q.url === '/robots.txt') { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': 'text/html' }); r.end('<html><body><h1>Price: $512,000</h1><p>2 beds 1 bath 900 sq ft</p><p>Property taxes: $6,200 / yr</p></body></html>'); });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res));
  const link = `http://127.0.0.1:${srv.address().port}/home`;
  const { spawn } = await import('node:child_process');
  const md = await new Promise((resolve) => { const ev = join(dir, 'e2.json'), out = join(dir, 'o2.md'); writeFileSync(ev, JSON.stringify({ issue: { body: `### Listing link\n\n${link}\n\n### Listing text\n\n_No response_` }, repository: { name: '5oceans', owner: { login: 'Sukonik' } } }));
    const c = spawn('node', ['scripts/sonar_issue.mjs', ev, out], { env: { ...process.env, SONAR_ALLOW_PRIVATE: '1' } }); c.on('close', () => resolve(readFileSync(out, 'utf8'))); });
  srv.close();
  assert.match(md, /\$512,000/); assert.match(md, /read the link politely/);
  const code = md.match(/#sonar=([A-Za-z0-9_-]+)/)[1];
  const S = (await import('node:module')).createRequire(import.meta.url)('../assets/calc/sonar.js');
  const back = S.decodeHash('#sonar=' + code); assert.match(back.text, /512,000/); assert.match(back.text, /6,200/);
  assert.doesNotMatch(md, /never fetches/);
});
await Promise.all(pending);
console.log(n + ' sonar-issue checks passed');
