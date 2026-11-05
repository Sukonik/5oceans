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


def card(aname, abody):
    paras = [p.strip() for p in abody.strip().split("\n\n") if p.strip()]
    m = re.match(r"\*\*(.+?)\.?\*\*\s*(.*)", paras[0], re.S)
    task, desc = (m.group(1), m.group(2)) if m else ("", paras[0])
    links = ""
    if len(paras) > 1:
        parts = [x.strip() for x in paras[-1].split("·")]
        links = "".join(f"<span>{inline(x)}</span>" for x in parts)
    return (f'<article class="card" data-s="{html.escape((aname + " " + abody).lower())}">'
            f'<p class="eyebrow">{html.escape(task)}</p><h3>{html.escape(aname)}</h3>'
            f'<p class="desc">{inline(desc)}</p><div class="chips">{links}</div></article>')


part = src.split("## Animal directory", 1)[1]
cols = re.split(r"\n## ", "\n" + part)[1:]
COLL, total = {}, 0
for c in cols:
    name, body = c.split("\n", 1)
    cards = [card(*a.split("\n", 1)) for a in re.split(r"\n### ", "\n" + body)[1:]]
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
    f'--action:{t[6]};--glow:{t[7]};--cta:{t[8]};--wash:{"26%" if t[2] == "light" else "42%"};'
    f'--wash2:{"16%" if t[2] == "light" else "30%"}}}' for t in THEMES)


def rows(mode):
    return "".join(
        f'<label class="opt"><input type="radio" name="theme" value="{t[0]}">'
        f'<span class="sw" style="background:linear-gradient(135deg,{t[3]} 50%,{t[6]} 50%)"></span>'
        f'<span>{t[1]}</span></label>' for t in THEMES if t[2] == mode)


CSS = theme_css + """
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--page);color:var(--ink);font:16px/1.6 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--action)}
:focus-visible{outline:3px solid var(--action);outline-offset:3px;border-radius:6px}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
/* header */
header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--page) 88%,transparent);
  border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
@supports(backdrop-filter:blur(1px)){header{backdrop-filter:blur(12px) saturate(1.3)}}
@media(prefers-reduced-transparency:reduce){header{background:var(--page);backdrop-filter:none}}
.bar{display:flex;align-items:center;gap:12px;min-height:64px;flex-wrap:wrap;padding-block:8px}
.brand{white-space:nowrap;min-height:44px;display:flex;align-items:center;gap:8px;font-weight:700;letter-spacing:-.01em;text-decoration:none;color:var(--ink);font-size:1.1rem}
.nav{display:flex;gap:2px;margin-left:12px}
.nav a{padding:8px 14px;border-radius:999px;text-decoration:none;color:var(--ink);font-weight:500;font-size:.95rem;opacity:.85}
.nav a:hover,.nav a[aria-current]{background:color-mix(in srgb,var(--ink) 8%,transparent);opacity:1}
.spacer{flex:1}
/* sea glass controls */
.glass{min-height:44px;display:inline-flex;align-items:center;gap:8px;font:inherit;font-size:.95rem;color:var(--ink);cursor:pointer;text-decoration:none;
  background:linear-gradient(180deg,color-mix(in srgb,var(--surface) 92%,transparent),color-mix(in srgb,var(--surface) 80%,transparent));
  border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);border-radius:999px;padding:8px 18px;
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 55%,transparent),0 1px 2px rgb(0 0 0/.08);transition:transform .15s,box-shadow .15s}
@supports(backdrop-filter:blur(1px)){.glass{backdrop-filter:blur(10px)}}
.glass:hover{transform:translateY(-1px);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 60%,transparent),0 6px 16px rgb(0 0 0/.12)}
.glass.primary{background:var(--action);color:var(--cta);border-color:transparent;font-weight:600;
  box-shadow:inset 0 1px 0 rgb(255 255 255/.35),0 6px 18px color-mix(in srgb,var(--action) 40%,transparent)}
.search{flex:0 1 300px;position:relative}
.search input{width:100%;min-height:44px;font:inherit;font-size:.95rem;color:var(--ink);padding:8px 16px 8px 40px;border-radius:999px;
  background:color-mix(in srgb,var(--surface) 88%,transparent);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 50%,transparent)}
.search input::placeholder{color:color-mix(in srgb,var(--ink) 55%,transparent)}
.search::before{content:"⌕";position:absolute;left:15px;top:50%;transform:translateY(-52%);font-size:1.2rem;opacity:.6;pointer-events:none}
/* picker */
.picker{position:relative;z-index:5}
summary.glass{list-style:none} summary::-webkit-details-marker{display:none}
.menu{z-index:40;position:absolute;right:0;top:calc(100% + 8px);width:240px;max-width:calc(100vw - 40px);background:var(--surface);
  border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);border-radius:18px;padding:8px 14px 12px;box-shadow:0 20px 50px rgb(0 0 0/.28)}
.menu h4{margin:10px 0 2px;font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;opacity:.65}
.opt{display:flex;align-items:center;gap:12px;min-height:44px;cursor:pointer;border-radius:10px;padding:0 6px}
.opt:hover{background:color-mix(in srgb,var(--ink) 7%,transparent)}
.opt input{accent-color:var(--action);width:18px;height:18px;margin:0}
.sw{width:24px;height:24px;border-radius:50%;border:1px solid color-mix(in srgb,var(--ink) 35%,transparent)}
/* hero */
.hero{position:relative;overflow:hidden;isolation:isolate;
  background:radial-gradient(60% 55% at 50% 118%,color-mix(in srgb,var(--glow) var(--wash),transparent),transparent 70%),
  radial-gradient(90% 70% at 50% 100%,color-mix(in srgb,var(--action) var(--wash2),transparent),transparent 72%),var(--page)}
.hero .wrap{display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:center;padding-block:72px 96px}
.hero.compact .wrap{grid-template-columns:1fr;padding-block:40px 56px}
.kicker{display:inline-flex;gap:8px;align-items:center;font-size:.85rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--action)}
h1{font-family:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;font-weight:400;letter-spacing:-.02em;
  font-size:clamp(2.2rem,5.6vw,4rem);line-height:1.06;margin:.3em 0 .4em;text-wrap:balance}
h1 em{font-style:italic;color:var(--action)}
.lede{font-size:clamp(1rem,2vw,1.2rem);max-width:56ch;opacity:.85;margin:0 0 28px}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.panel{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:22px;padding:22px;
  box-shadow:0 30px 60px -20px rgb(0 0 0/.35),inset 0 1px 0 color-mix(in srgb,#fff 40%,transparent)}
.panel .tag{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.panel h2{font:600 1.1rem/1.3 inherit;margin:.4em 0 1em}
.big-n{font-family:"Iowan Old Style",Georgia,serif;font-size:2.8rem;line-height:1;margin:0;color:var(--action)}
.row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent);font-variant-numeric:tabular-nums}
.small{font-size:.8rem;opacity:.7;margin:.8em 0 0}
/* sections */
main{padding-bottom:56px}
.section{padding-block:48px 0}
.section>h2{font-family:"Iowan Old Style",Georgia,serif;font-weight:400;font-size:clamp(1.5rem,3vw,2.1rem);margin:0 0 6px;letter-spacing:-.01em}
.section>p{margin:0 0 22px;opacity:.8;max-width:60ch}
.fam{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:18px}
.big{position:relative;display:flex;flex-direction:column;gap:6px;overflow:hidden;background:var(--surface);color:var(--ink);text-decoration:none;
  border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);border-radius:22px;padding:26px;transition:transform .2s,box-shadow .2s,border-color .2s}
.big::after{content:"";position:absolute;inset:auto -20% -60% -20%;height:70%;pointer-events:none;
  background:radial-gradient(closest-side,color-mix(in srgb,var(--glow) 28%,transparent),transparent)}
.big:hover{transform:translateY(-3px);border-color:var(--action);box-shadow:0 18px 40px -12px rgb(0 0 0/.3)}
.big .ico{font-size:2rem}
.big h2,.big h3{font-family:"Iowan Old Style",Georgia,serif;font-weight:400;font-size:1.7rem;margin:.1em 0;letter-spacing:-.01em}
.big p{margin:0;opacity:.8}
.big .meta{margin-top:10px;font-size:.85rem;font-weight:600;color:var(--action)}
.crumb{font-size:.9rem;opacity:.8;margin:0 0 10px}
.crumb a{color:inherit}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:16px}
.card{display:flex;flex-direction:column;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);
  border-radius:18px;padding:22px;overflow-wrap:anywhere;transition:transform .2s,box-shadow .2s,border-color .2s}
.card:hover{transform:translateY(-2px);border-color:color-mix(in srgb,var(--action) 55%,transparent);box-shadow:0 14px 30px -14px rgb(0 0 0/.35)}
.card h3{font-family:"Iowan Old Style",Georgia,serif;font-weight:400;font-size:1.45rem;margin:.1em 0 .4em;letter-spacing:-.01em}
.eyebrow{margin:0;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--action)}
.desc{margin:0 0 16px;font-size:.95rem;opacity:.88}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.chips span{font-size:.82rem}
.chips a{display:inline-block;padding:5px 12px;border-radius:999px;text-decoration:none;
  background:color-mix(in srgb,var(--action) 11%,transparent);border:1px solid color-mix(in srgb,var(--action) 25%,transparent)}
.chips a:hover{background:color-mix(in srgb,var(--action) 20%,transparent)}
.empty{display:none;opacity:.7}
footer{border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent);padding-block:28px;font-size:.9rem}
footer .wrap{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between}
footer p{margin:0;opacity:.8}

/* Sea Glass UI elements */
.skip{position:absolute;left:12px;top:-60px;z-index:50;padding:10px 16px}
.skip:focus{top:10px}
.glass{position:relative;overflow:hidden}
.glass::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:linear-gradient(115deg,transparent 35%,color-mix(in srgb,#fff 38%,transparent) 50%,transparent 65%);
  transform:translateX(-120%);transition:transform .7s}
.glass:hover::after{transform:translateX(120%)}
kbd.glass-key{margin-left:auto;font:600 .72rem/1 inherit;padding:4px 7px;border-radius:7px;opacity:.7;
  background:color-mix(in srgb,var(--ink) 8%,transparent);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}
.search input{padding-right:42px}
.search kbd{position:absolute;right:12px;top:50%;transform:translateY(-50%);font:600 .72rem/1 inherit;padding:4px 7px;border-radius:7px;opacity:.7;
  background:color-mix(in srgb,var(--ink) 8%,transparent);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);pointer-events:none}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:26px 0 0;padding:0;list-style:none}
.stats li{display:flex;flex-direction:column;padding:10px 18px;border-radius:16px;
  background:color-mix(in srgb,var(--surface) 70%,transparent);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 45%,transparent)}
@supports(backdrop-filter:blur(1px)){.stats li{backdrop-filter:blur(10px)}}
.stats b{font:400 1.6rem/1.1 "Iowan Old Style",Georgia,serif;color:var(--action)}
.stats span{font-size:.78rem;opacity:.75}
.tabs{display:inline-flex;gap:2px;padding:4px;border-radius:999px;max-width:100%;overflow-x:auto;scrollbar-width:none;
  background:color-mix(in srgb,var(--surface) 75%,transparent);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 45%,transparent)}
.tabs::-webkit-scrollbar{display:none}
@supports(backdrop-filter:blur(1px)){.tabs{backdrop-filter:blur(10px)}}
.tabs a{white-space:nowrap;min-height:40px;display:inline-flex;align-items:center;padding:0 16px;border-radius:999px;text-decoration:none;color:var(--ink);font-size:.92rem;font-weight:500}
.tabs a:hover{background:color-mix(in srgb,var(--ink) 8%,transparent)}
.tabs a[aria-current]{background:var(--action);color:var(--cta);font-weight:600;box-shadow:0 4px 12px color-mix(in srgb,var(--action) 40%,transparent)}
.hero .tabs{margin-top:22px}
.wave{display:block;width:100%;height:36px;margin-top:-1px;color:var(--page)}
.chips a{backdrop-filter:blur(6px)}
.dock{display:none}
/* responsive */
@media(max-width:860px){.hero .wrap{grid-template-columns:1fr;padding-block:48px 64px;gap:32px}}
@media(max-width:720px){.bar{gap:8px;min-height:56px}.brand{flex:1 0 auto}.nav{display:none}.search{order:4;flex:1 1 100%}.search kbd{display:none}
  .menu{width:min(280px,calc(100vw - 32px));max-height:min(70vh,520px);overflow-y:auto}.picker .lbl{display:none}
  body{padding-bottom:84px}.wrap{padding-inline:16px}.hero .wrap{padding-block:36px 56px}
  .dock{display:flex;position:fixed;z-index:30;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));gap:2px;padding:6px;border-radius:999px;
    background:color-mix(in srgb,var(--surface) 86%,transparent);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);
    box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 50%,transparent),0 14px 34px rgb(0 0 0/.3)}
  @supports(backdrop-filter:blur(1px)){.dock{backdrop-filter:blur(14px) saturate(1.4)}}
  .dock a{flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-radius:999px;text-decoration:none;color:var(--ink);font-size:.72rem;font-weight:600}
  .dock a span{font-size:1.25rem;line-height:1}.dock a[aria-current]{background:var(--action);color:var(--cta)}
  .stats li{flex:1 1 calc(33% - 10px);padding:10px 12px}.cta .glass{flex:1 1 100%;justify-content:center}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){.card,.menu,.glass,.big,.panel{border:1px solid CanvasText}}
"""

JS = """
const q=document.getElementById('q'),pk=document.getElementById('picker');
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();
q.addEventListener('input',()=>{const v=norm(q.value);let any=false;
document.querySelectorAll('.card').forEach(c=>{const h=!!v&&!norm(c.dataset.s).includes(v);c.hidden=h;if(!h)any=true});
const e=document.getElementById('empty');if(e)e.style.display=!any&&v?'block':'none';});
const cur=document.documentElement.dataset.theme;
document.querySelectorAll('input[name=theme]').forEach(r=>{r.checked=r.value===cur;
r.addEventListener('change',()=>{document.documentElement.dataset.theme=r.value;
try{localStorage.setItem('fiveoceans-theme',r.value)}catch(e){}});});
pk.addEventListener('keydown',e=>{if(e.key==='Escape'&&pk.open){pk.open=false;pk.querySelector('summary').focus()}});
document.addEventListener('click',e=>{if(!pk.contains(e.target))pk.open=false});
document.addEventListener('keydown',e=>{const t=e.target.tagName;if((e.key==='/'||(e.key==='k'&&(e.ctrlKey||e.metaKey)))&&t!=='INPUT'&&t!=='TEXTAREA'){e.preventDefault();q.focus()}});
"""


def render(title, prefix, body, hero="", cur=""):
    ids = [t[0] for t in THEMES]
    ac = lambda k: ' aria-current="page"' if cur == k else ""
    return f"""<!doctype html><html lang="en" data-theme="chalk"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="FiveOceans: when can you afford to work less near the water? A planning demo.">
<title>{title}</title>
<script>(function(){{var ids={ids!r},t=null;try{{t=localStorage.getItem('fiveoceans-theme')}}catch(e){{}}
if(ids.indexOf(t)<0)t=matchMedia('(prefers-color-scheme: dark)').matches?'basalt':'chalk';
document.documentElement.dataset.theme=t}})();</script>
<style>{CSS}</style></head><body>
<a class="glass skip" href="#main">Skip to content</a>
<header><div class="wrap bar">
<a class="brand" href="{prefix}index.html">🌊 FiveOceans</a>
<nav class="nav" aria-label="Main"><a href="{prefix}seawater/index.html"{ac("seawater")}>Seawater</a><a href="{prefix}freshwater/index.html"{ac("freshwater")}>Freshwater</a></nav>
<span class="spacer"></span>
<div class="search"><label for="q" hidden>Search</label><input id="q" type="search" placeholder="Search 457(b), ERS…" autocomplete="off"><kbd aria-hidden="true">/</kbd></div>
<details class="picker" id="picker"><summary class="glass" aria-label="Change theme">🎨 <span class="lbl">Change theme</span> ▾</summary>
<div class="menu" role="radiogroup" aria-label="Theme"><h4>Light</h4>{rows("light")}<h4>Dark</h4>{rows("dark")}</div></details>
</div></header>
{hero}
<main id="main"><div class="wrap">{body}</div></main>
<footer><div class="wrap"><p>🌊 FiveOceans · planning demo, fictional figures, not financial advice. Nothing you type is stored or sent.</p>
<p><a href="{REPO}COLE_HANDOFF.txt">Handoff</a> · <a href="{REPO}Blue-Glass-Development-Plan.md">Blue Glass plan</a> · <a href="https://github.com/Sukonik/5oceans">GitHub</a></p></div></footer>
<nav class="dock" aria-label="Quick">
<a href="{prefix}index.html"{ac("home")}><span>🏠</span>Home</a>
<a href="{prefix}seawater/index.html"{ac("seawater")}><span>🧂</span>Seawater</a>
<a href="{prefix}freshwater/index.html"{ac("freshwater")}><span>🚰</span>Fresh</a>
</nav>
<script>{JS}</script></body></html>"""


FAMILIES = {
    "seawater": ("🧂", "Seawater", ["CoastalSea", "CentralSea", "DeepSea"],
                 "Shoreline and open-water paths: housing near the coast, income bridges and insurance."),
    "freshwater": ("🚰", "Freshwater", ["Spring", "Lake", "River"],
                   "Spring, lake and river paths: inland water, family and care decisions."),
}
BLURB = {"CoastalSea": "Right-size, rent, and stay near the shore.", "CentralSea": "Mid-water decisions between coast and deep.",
         "DeepSea": "Deeper planning: longer horizons and complex pairings.",
         "Spring": "Starting points near the source.", "Lake": "Calm, steady planning.",
         "River": "Moving income and benefits downstream."}


def write(path, title, depth, body, hero="", cur=""):
    f = out / path
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(render(title, "../" * depth, body, hero, cur), encoding="utf-8")


def slug(n):
    return n.lower()


def coll_card(prefix, c):
    return (f'<a class="big" href="{prefix}{slug(c)}/index.html"><span class="ico">{EMOJI[c]}</span><h3>{c}</h3>'
            f'<p>{BLURB[c]}</p><span class="meta">{len(COLL[c])} animals →</span></a>')


def page_hero(crumb, emoji, h, lede, extra=""):
    return (f'<section class="hero compact"><div class="wrap"><div><p class="crumb">{crumb}</p>'
            f'<span class="kicker">{emoji} FiveOceans</span><h1>{h}</h1><p class="lede">{lede}</p>{extra}</div></div></section>')


home_hero = """<section class="hero"><div class="wrap"><div>
<span class="kicker">🌊 Retirement planning, near the water</span>
<h1>Where near the water would you like to live, and <em>when can you afford to work less?</em></h1>
<p class="lede">Thirty-six animal paths, each tied to a real decision and an official source. Start with salt water or fresh.</p>
<ul class="stats"><li><b>36</b><span>animal paths</span></li><li><b>6</b><span>water bodies</span></li><li><b>8</b><span>shore-rock themes</span></li></ul>
<div class="cta" style="margin-top:26px"><a class="glass primary" href="seawater/index.html">🧂 Explore Seawater</a><a class="glass" href="freshwater/index.html">🚰 Explore Freshwater</a></div></div>
<aside class="panel" aria-label="Sample result"><span class="tag">🐚 Hermit Crab · fictional example</span>
<h2>Could a tenant pay part of my housing cost?</h2>
<p class="big-n">$1,552<span style="font-size:1rem;font-family:inherit;color:var(--ink);opacity:.7"> /month</span></p>
<p class="small" style="margin-top:4px">what the owner still pays after rent</p>
<div class="row"><span>Carrying cost</span><span>$3,300</span></div>
<div class="row"><span>Rent after vacancy &amp; management</span><span>−$1,748</span></div>
<p class="small">Illustrative numbers. Before income tax.</p></aside></div></section>"""

fam_cards = "".join(
    f'<a class="big" href="{k}/index.html"><span class="ico">{e}</span><h2>{n}</h2><p>{d}</p>'
    f'<span class="meta">{" · ".join(c)} →</span></a>' for k, (e, n, c, d) in FAMILIES.items())
def tabs(prefix, here):
    allc = [c for _, (_, _, cs, _) in FAMILIES.items() for c in cs]
    return '<nav class="tabs" aria-label="Water bodies">' + "".join(
        f'<a href="{prefix}{slug(c)}/index.html"' + (' aria-current="page"' if c == here else "") + f'>{EMOJI[c]} {c}</a>' for c in allc) + '</nav>'


write("index.html", "FiveOceans", 0,
      f'<section class="section"><h2>Choose your water</h2><p>Six collections, six animals each. Every one links to a guide and a direct official resource.</p>'
      f'<div class="fam">{fam_cards}</div></section>', home_hero, "home")

for k, (e, n, cs, d) in FAMILIES.items():
    write(f"{k}/index.html", f"{n} | FiveOceans", 1,
          f'<section class="section"><div class="fam">{"".join(coll_card("../", c) for c in cs)}</div></section>',
          page_hero(f'<a href="../index.html">Home</a> / {n}', e, f"{n} paths", d), k)
    for c in cs:
        write(f"{slug(c)}/index.html", f"{c} | FiveOceans", 1,
              f'<section class="section"><div class="grid">{"".join(COLL[c])}</div>'
              f'<p class="empty" id="empty">No animals here match that search.</p></section>',
              page_hero(f'<a href="../index.html">Home</a> / <a href="../{k}/index.html">{n}</a> / {c}',
                        EMOJI[c], f"{c}", BLURB[c], tabs("../", c)), k)
(out / ".nojekyll").write_text("")
print(f"built {len(list(out.rglob('index.html')))} pages, {total} animals")
