import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir = mkdtempSync(join(tmpdir(), 'sonar-'));
const run = (body) => {
  const ev = join(dir, 'e.json'), out = join(dir, 'o.md');
  writeFileSync(ev, JSON.stringify({ issue: { body }, repository: { owner: { login: 'Sukonik' }, name: '5oceans' } }));
  execFileSync('node', ['scripts/sonar_issue.mjs', ev, out], { env: { ...process.env, SITE_URL: '' } });
  return readFileSync(out, 'utf8');
};
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('ok', name); };
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
console.log(n + ' sonar-issue checks passed');
