// Reads a GitHub issue event, runs Dolphin Sonar on the pasted text, writes a Markdown reply.
// Usage: node scripts/sonar_issue.mjs <event.json> <out.md>
// The issue body is data. It is parsed with regular expressions only and never executed or passed to a shell.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('../assets/calc/sonar.js');

const [, , eventPath, outPath] = process.argv;
const ev = JSON.parse(readFileSync(eventPath, 'utf8'));
const body = String(ev.issue?.body || '').slice(0, 60000);
const field = (name) => { const m = body.match(new RegExp('###\\s*' + name + '\\s*\\n+([\\s\\S]*?)(?:\\n###|$)')); const v = m ? m[1].trim() : ''; return /^_No response_$/i.test(v) ? '' : v; };
const url = field('Listing link').slice(0, 500), text = field('Listing text');
const site = process.env.SITE_URL || `https://${(ev.repository?.owner?.login || 'sukonik').toLowerCase()}.github.io/${ev.repository?.name || '5oceans'}/`;

const p = S.parseListing({ url, text, jsonld: '' });
const sug = S.suggestMode(p);
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
const money = new Set(['price', 'hoaMo', 'commonMo', 'maintMo', 'taxYr', 'rent']);
const b64 = Buffer.from(unescape(encodeURIComponent(JSON.stringify({ u: url, t: text.slice(0, 8000), j: '' }))), 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const link = `${site.replace(/\/?$/, '/')}tools/real-estate/#sonar=${b64}`;

let md = '## Dolphin Sonar\n\n';
if (!p.found.length && !p.address) {
  md += 'I could not detect any listing facts. Paste the part of the listing that shows the price, beds and baths, taxes and fees, and edit this issue or open a new one.\n';
} else {
  md += `${p.address ? `**${p.address}**` : '**Listing**'}${p.site ? ` on ${p.site}` : ''}\n\n| Fact | Value |\n|---|---|\n`;
  md += p.found.map((f) => `| ${f.label} | ${money.has(f.key) ? usd(f.value) : f.value} |`).join('\n') + '\n\n';
  md += `Suggested calculator: **${sug}**.\n\n[Open the Real Estate Calculator with these numbers](${link})\n\n`;
  md += 'Check every number against the listing. The calculator link carries the pasted text in the address bar once and then clears it.\n';
}
md += '\n---\n_Sonar never fetches a listing page. It reads only what was pasted here. Posted by the Dolphin Sonar action._\n';
writeFileSync(outPath, md);
console.log(`facts: ${p.found.length}, suggested: ${sug}`);
