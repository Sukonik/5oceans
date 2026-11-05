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
COLL, total = {}, 0
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
    COLL[name.strip()] = cards
if total != 36:
    sys.exit(f"expected 36 animals, found {total}")

THEMES = [  # slug, label, mode, page, surface, ink, action, glow, cta-text
    ("chalk", "Chalk", "light", "#F4F7F8", "#FFFFFF", "#102D40", "#00638A", "#FF866B", "#FFFFFF"),
    ("limestone", "Limestone", "light", "#F6F3E9", "#FFFDF6", "#22382E", "#376449", "#DAA744", "#FFFFFF"),
    ("pink-granite", "Pink Granite", "light", "#FAF0EF", "#FFFCFB", "#352537", "#83405D", "#E68999", "#FFFFFF"),
    ("quartzite", "Quartzite", "light", "#ECF3FE", "#FCFDFF", "#192F52", "#305498", "#A4AFE6", "#FFFFFF"),
    ("basalt", "Basalt", "dark", "#091624", "#12273A", "#F2F7FD", "#7ECFF1", "#FF906D", "#091624"),
    ("slate", "Slate", "dark", "#17222D", "#21313E", "#F1F5FA", "#A9CAF1", "#FF889D", "#17222D"),
    ("obsidian", "Obsidian", "dark", "#110F1C", "#211B31", "#F5F2FF", "#C2AEFF", "#88E7C2", "#110F1C"),
    ("greenstone", "Greenstone", "dark", "#0B211D", "#17342C", "#ECF8EF", "#88D8B6", "#FFAD66", "#0B211D"),
]
theme_css = "".join(
    f'[data-theme="{t[0]}"]{{color-scheme:{t[2]};--page:{t[3]};--surface:{t[4]};--ink:{t[5]};'
    f'--action:{t[6]};--glow:{t[7]};--cta:{t[8]}}}' for t in THEMES)
theme_rows = "".join(
    f'<label class="opt"><input type="radio" name="theme" value="{t[0]}">'
    f'<span class="sw" style="background:linear-gradient(135deg,{t[3]} 50%,{t[6]} 50%)"></span>'
    f'<span>{t[1]}</span></label>' for t in THEMES)
light_rows = "".join(f"{r}</label>" for r, t in zip(theme_rows.split("</label>"), THEMES) if t[2] == "light")
dark_rows = "".join(f"{r}</label>" for r, t in zip(theme_rows.split("</label>"), THEMES) if t[2] == "dark")

def render(title, prefix, body):
    return f"""<!doctype html><html lang="en" data-theme="chalk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<script>
(function(){{var ids={[t[0] for t in THEMES]!r},t=null;
try{{t=localStorage.getItem('fiveoceans-theme')}}catch(e){{}}
if(ids.indexOf(t)<0)t=matchMedia('(prefers-color-scheme: dark)').matches?'basalt':'chalk';
document.documentElement.dataset.theme=t}})();
</script>
<style>
{theme_css}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--page);color:var(--ink);font:16px/1.5 Inter,system-ui,-apple-system,sans-serif;
  background-image:radial-gradient(60rem 24rem at 85% -8rem,color-mix(in srgb,var(--glow) 22%,transparent),transparent)}}
a{{color:var(--action)}}
header{{position:sticky;top:0;z-index:10;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;justify-content:space-between;
  padding:10px 16px;background:color-mix(in srgb,var(--page) 90%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ink) 15%,transparent)}}
@supports(backdrop-filter:blur(1px)){{header{{backdrop-filter:blur(10px)}}}}
@media(prefers-reduced-transparency:reduce){{header{{background:var(--page);backdrop-filter:none}}}}
.brand{{font-weight:700;font-size:1.15rem;text-decoration:none;color:var(--ink)}}
main{{max-width:1100px;margin:0 auto;padding:24px 16px 48px}}
h1{{font-family:'Inter Tight',Inter,system-ui,sans-serif;font-size:clamp(1.9rem,6vw,3rem);line-height:1.1;margin:.2em 0}}
h2{{margin-top:2rem}}
.btn,summary,input[type=search]{{min-height:44px;font:inherit;color:var(--ink);background:var(--surface);
  border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:10px;padding:8px 14px}}
summary{{display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none}}
summary::-webkit-details-marker{{display:none}}
:focus-visible{{outline:3px solid var(--action);outline-offset:2px}}
.picker{{position:relative}}
.menu{{position:absolute;right:0;margin-top:6px;min-width:220px;max-width:calc(100vw - 32px);background:var(--surface);
  border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:12px;padding:8px 12px;
  box-shadow:0 12px 32px rgb(0 0 0/.25)}}
.menu h4{{margin:8px 0 2px;font-size:.8rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7}}
.opt{{display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer}}
.opt input{{accent-color:var(--action);width:18px;height:18px}}
.sw{{width:22px;height:22px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ink) 40%,transparent)}}
.nav{{display:flex;gap:6px}} .nav a{{padding:10px 12px;border-radius:8px;text-decoration:none;font-weight:600}} .nav a:hover{{background:var(--surface)}}
.fam{{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px;margin:1.5rem 0}}
.big{{display:block;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:14px;padding:20px;text-decoration:none;color:var(--ink)}}
.big h2{{margin:.2em 0}} .big:hover{{border-color:var(--action)}}
.crumb{{font-size:.9rem}}
.search{{flex:1 1 220px;max-width:440px;min-width:0}} input[type=search]{{width:100%}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr));gap:12px}}
.card{{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:12px;padding:4px 16px 8px;
  overflow-wrap:anywhere}}
.card h3{{margin:.8em 0 .2em}} .note{{font-size:.9rem;opacity:.8}}
@media(max-width:640px){{.brand{{flex:1}} .nav{{order:2;width:100%}} .search{{order:3;flex-basis:100%;max-width:none}} .menu{{position:fixed;left:16px;right:16px;top:auto;margin-top:8px}}}}
@media(prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
@media(forced-colors:active){{.card,.menu,.btn,summary{{border:1px solid CanvasText}}}}
</style></head><body>
<header>
<a class="brand" href="{prefix}index.html">🌊 FiveOceans</a>
<nav class="nav" aria-label="Main"><a href="{prefix}seawater/index.html">🧂 Seawater</a><a href="{prefix}freshwater/index.html">🚰 Freshwater</a></nav>
<div class="search"><label for="q" class="sr" hidden>Search</label>
<input id="q" type="search" placeholder="🔎 Search: 457(b), ERS, duplex…" autocomplete="off"></div>
<details class="picker" id="picker"><summary aria-label="Change theme">🎨 Change theme ▾</summary>
<div class="menu" role="radiogroup" aria-label="Theme"><h4>☀️ Light</h4>{light_rows}<h4>🌙 Dark</h4>{dark_rows}</div></details>
</header>
<main>
{body}
<p class="note">📚 <a href="{REPO}COLE_HANDOFF.txt">Handoff</a> ·
<a href="{prefix}index.html">Home</a> ·
<a href="{REPO}Blue-Glass-Development-Plan.md">Blue Glass plan</a> ·
<a href="https://github.com/Sukonik/5oceans">GitHub</a></p>
</main><script>
const q=document.getElementById('q'),pk=document.getElementById('picker');
q.addEventListener('input',()=>{{const v=q.value.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();
document.querySelectorAll('.card').forEach(c=>c.hidden=v&&!c.dataset.s.replace(/[^a-z0-9 ]/g,'').includes(v));
document.querySelectorAll('section').forEach(s=>s.hidden=![...s.querySelectorAll('.card')].some(c=>!c.hidden));}});
const cur=document.documentElement.dataset.theme;
document.querySelectorAll('input[name=theme]').forEach(r=>{{r.checked=r.value===cur;
r.addEventListener('change',()=>{{document.documentElement.dataset.theme=r.value;
try{{localStorage.setItem('fiveoceans-theme',r.value)}}catch(e){{}}}});}});
pk.addEventListener('keydown',e=>{{if(e.key==='Escape'&&pk.open){{pk.open=false;pk.querySelector('summary').focus()}}}});
document.addEventListener('click',e=>{{if(!pk.contains(e.target))pk.open=false}});
</script></body></html>"""

FAMILIES = {
    "seawater": ("🧂", "Seawater", ["CoastalSea", "CentralSea", "DeepSea"],
                 "Shoreline and open-water paths: housing near the coast, income bridges and insurance."),
    "freshwater": ("🚰", "Freshwater", ["Spring", "Lake", "River"],
                   "Spring, lake and river paths: inland water, family and care decisions."),
}
BLURB = {"CoastalSea": "Right-size, rent, and stay near the shore.", "CentralSea": "Mid-water decisions between coast and deep.",
         "DeepSea": "Deeper planning: longer horizons and complex pairings.",
         "Spring": "Starting points near the source.", "Lake": "Calm, steady planning.", "River": "Moving income and benefits downstream."}

def write(path, title, depth, body):
    f = out / path
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(render(title, "../" * depth, body), encoding="utf-8")

def slug(n): return n.lower()

fam_cards = "".join(
    f'<a class="big" href="{k}/index.html"><div>{e}</div><h2>{n}</h2><p>{d}</p>'
    f'<p class="note">{" · ".join(c)}</p></a>' for k, (e, n, c, d) in FAMILIES.items())
write("index.html", "FiveOceans", 0,
      '<h1>Where near the water would you like to live, and when can you afford to work less?</h1>'
      '<p class="note">Planning demo, 36 animal paths. Illustrative only; not financial advice. Nothing you type is stored or sent.</p>'
      f'<div class="fam">{fam_cards}</div>')
for k, (e, n, cs, d) in FAMILIES.items():
    links = "".join(
        f'<a class="big" href="../{slug(c)}/index.html"><div>{EMOJI[c]}</div><h2>{c}</h2>'
        f'<p>{BLURB[c]}</p><p class="note">{len(COLL[c])} animals</p></a>' for c in cs)
    write(f"{k}/index.html", f"{n} | FiveOceans", 1,
          f'<p class="crumb"><a href="../index.html">Home</a> / {n}</p><h1>{e} {n}</h1><p>{d}</p><div class="fam">{links}</div>')
    for c in cs:
        write(f"{slug(c)}/index.html", f"{c} | FiveOceans", 1,
              f'<p class="crumb"><a href="../index.html">Home</a> / <a href="../{k}/index.html">{n}</a> / {c}</p>'
              f'<h1>{EMOJI[c]} {c}</h1><p>{BLURB[c]}</p><div class="grid">{"".join(COLL[c])}</div>')
(out / ".nojekyll").write_text("")
print(f"built {len(list(out.rglob('index.html')))} pages, {total} animals")
