#!/usr/bin/env python3
"""Build the static GitHub Pages demo from docs/handoff/FiveOcean.md."""
import html, re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "docs/handoff/FiveOcean.md").read_text(encoding="utf-8")
out = root / "site"
out.mkdir(exist_ok=True)
REPO = "https://github.com/Sukonik/5oceans/blob/main/docs/handoff/"
EMOJI = {"CoastalSea": "🏖️", "CentralSea": "🌊", "DeepSea": "🦑",
         "Spring": "💧", "Lake": "🏞️", "River": "🐊"}

def inline(t):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    def link(m):
        url = m.group(2)
        if not url.startswith("http"):
            url = REPO + url
        return f'<a href="{url}" rel="noopener">{m.group(1)}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, t)

part = src.split("## Animal directory", 1)[1]
cols = re.split(r"\n## ", "\n" + part)[1:]
sections, total = [], 0
for c in cols:
    name, body = c.split("\n", 1)
    cards = []
    for a in re.split(r"\n### ", "\n" + body)[1:]:
        aname, abody = a.split("\n", 1)
        paras = [p.strip() for p in abody.strip().split("\n\n") if p.strip()]
        cards.append(
            f'<article class="card" data-s="{html.escape((aname + " " + abody).lower())}">'
            f"<h3>{html.escape(aname)}</h3>"
            + "".join(f"<p>{inline(p)}</p>" for p in paras) + "</article>")
    total += len(cards)
    sections.append(f'<section><h2>{EMOJI.get(name.strip(), "🐟")} {html.escape(name.strip())}</h2>'
                    f'<div class="grid">{"".join(cards)}</div></section>')
if total != 36:
    sys.exit(f"expected 36 animals, found {total}")

page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>FiveOceans</title>
<style>
:root{{--bg:#f6fafc;--fg:#12303f;--card:#fff;--ac:#0a6a8f;--bd:#cfe1ea}}
@media(prefers-color-scheme:dark){{:root{{--bg:#0b1a22;--fg:#e2f0f6;--card:#12303f;--ac:#6cc4e3;--bd:#24485a}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}}
main{{max-width:1100px;margin:0 auto;padding:24px 16px}}
a{{color:var(--ac)}} h1{{margin:.2em 0}}
input{{width:100%;box-sizing:border-box;padding:12px;font-size:1rem;border:1px solid var(--bd);border-radius:8px;background:var(--card);color:var(--fg)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}}
.card{{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:4px 16px}}
.card h3{{margin:.8em 0 .2em}} .note{{font-size:.9rem;opacity:.8}}
</style></head><body><main>
<h1>🌊 FiveOceans</h1>
<p>Where near the water would you like to live, and when can you afford to work less?</p>
<p class="note">Planning demo, 36 animal paths. Illustrative only; not financial advice. Nothing you type is stored or sent.</p>
<p><label for="q" class="note">🔎 Search by program or animal, e.g. 457(b), ERS, rental</label>
<input id="q" type="search" placeholder="Search…" autocomplete="off"></p>
{"".join(sections)}
<p class="note">📚 <a href="{REPO}COLE_HANDOFF.txt">Handoff</a> ·
<a href="https://github.com/Sukonik/5oceans">GitHub</a></p>
</main><script>
const q=document.getElementById('q');
q.addEventListener('input',()=>{{const v=q.value.toLowerCase().trim();
document.querySelectorAll('.card').forEach(c=>c.hidden=v&&!c.dataset.s.includes(v));
document.querySelectorAll('section').forEach(s=>s.hidden=![...s.querySelectorAll('.card')].some(c=>!c.hidden));}});
</script></body></html>"""
(out / "index.html").write_text(page, encoding="utf-8")
(out / ".nojekyll").write_text("")
print(f"built site/index.html with {total} animals")
