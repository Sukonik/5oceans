// Reads a GitHub issue event, runs Dolphin Sonar on the pasted text, writes a Markdown reply.
// Usage: node scripts/sonar_issue.mjs <event.json> <out.md>
// The issue body is data. It is parsed with regular expressions only and never executed or passed to a shell.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pingLink } from './sonar_fetch.mjs';
const S = createRequire(import.meta.url)('../assets/calc/sonar.js');

const [, , eventPath, outPath] = process.argv;
const ev = JSON.parse(readFileSync(eventPath, 'utf8'));
const body = String(ev.issue?.body || '').slice(0, 60000);
const field = (name) => { const m = body.match(new RegExp('###\\s*' + name + '\\s*\\n+([\\s\\S]*?)(?:\\n###|$)')); const v = m ? m[1].trim() : ''; return /^_No response_$/i.test(v) ? '' : v; };
const url = field('Listing link').slice(0, 500), text = field('Listing text');
const site = process.env.SITE_URL || `https://${(ev.repository?.owner?.login || 'sukonik').toLowerCase()}.github.io/${ev.repository?.name || '5oceans'}/`;

let p = S.parseListing({ url, text, jsonld: '' }), note = '', carryText = text, carryLd = '';
if (url && p.found.length < 3 && process.env.SONAR_FETCH !== '0') {
  const { read } = await pingLink(url);
  if (read.ok) { carryText = (text + '\n' + read.text).trim(); carryLd = read.jsonld || ''; p = S.parseListing({ url, text: carryText, jsonld: carryLd }); note = `I read the link politely (robots.txt allowed it) and found ${p.found.length} facts.`; }
  else note = read.reason;
}
const sug = S.suggestMode(p);
const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
const money = new Set(['price', 'hoaMo', 'commonMo', 'maintMo', 'taxYr', 'rent']);
const b64 = Buffer.from(unescape(encodeURIComponent(JSON.stringify({ u: url, t: carryText.slice(0, 8000), j: carryLd.slice(0, 4000) }))), 'binary').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const link = `${site.replace(/\/?$/, '/')}tools/real-estate/#sonar=${b64}`;

let md = '## Dolphin Sonar\n\n';
if (!p.found.length && !p.address) {
  md += 'I could not detect any listing facts. Paste the part of the listing that shows the price, beds and baths, taxes and fees, and edit this issue or open a new one.\n';
} else {
  md += `${p.address ? `**${p.address}**` : '**Listing**'}${p.site ? ` on ${p.site}` : ''} (${p.found.length} facts found)\n\n`;
  const fmt = (f) => (typeof f.value !== 'number' ? String(f.value) : f.kind === 'money' ? usd(f.value) : f.kind === 'pct' ? `${Math.round(f.value * 10) / 10}%` : f.kind === 'year' ? String(f.value) : Math.round(f.value * 100) / 100);
  for (const g of S.GROUPS) { const rows = p.found.filter((f) => f.group === g); if (!rows.length) continue; md += `**${g}**\n\n| Fact | Value |\n|---|---|\n${rows.map((f) => `| ${f.label} | ${String(fmt(f)).replace(/\|/g, '/')} |`).join('\n')}\n\n`; }
  if (p.insights.length) md += `**What Sonar noticed**\n\n${p.insights.map((x) => `- ${x.text}`).join('\n')}\n\n`;
  md += `Suggested calculator: **${sug}**.\n\n[Open the Real Estate Calculator with these numbers](${link})\n\n`;
  md += 'Check every number against the listing. The calculator link carries these listing facts in the address bar once and then clears them.\n';
}
if (note) md += `\n**Link reader:** ${note}\n`;
md += '\n---\n_Sonar does not fetch listing portals. It reads what was pasted here, plus a polite read of the link when the site allows it. Posted by the Dolphin Sonar action._\n';
writeFileSync(outPath, md);
console.log(`facts: ${p.found.length}, suggested: ${sug}`);
