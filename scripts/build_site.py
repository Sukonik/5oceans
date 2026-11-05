#!/usr/bin/env python3
"""Build the static GitHub Pages demo from docs/handoff/FiveOcean.md."""
import html, json, re, shutil, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "docs/handoff/FiveOcean.md").read_text(encoding="utf-8")
out = root / "site"
out.mkdir(exist_ok=True)
REPO = "https://github.com/Sukonik/5oceans/blob/main/docs/handoff/"
ICON_DIR = root / "assets/icons"
ICONS = {}
for f in sorted(ICON_DIR.glob("*.svg")):
    m = re.search(r"<svg[^>]*>(.*)</svg>", f.read_text(encoding="utf-8"), re.S)
    ICONS[f.stem] = m.group(1).strip()
SPRITE = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
          + "".join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items()) + "</defs></svg>")


def ic(name, cls=""):
    assert name in ICONS, name
    return f'<svg class="ic {cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


EMOJI = {"CoastalSea": ic("tree-palm"), "CentralSea": ic("sailboat"), "DeepSea": ic("anchor"),
         "Spring": ic("droplet"), "Lake": ic("mountain"), "River": ic("waves-arrow-down")}
ANIMAL_ICON = {
    "hermit-crab": "shell", "sea-lion": "paw-print", "royal-tern": "bird", "green-sea-turtle": "turtle",
    "peacock-flounder": "fish", "red-cushion-sea-star": "sparkle", "blue-whale": "fish", "giant-squid": "bubbles",
    "giant-manta-ray": "fish-symbol", "wandering-albatross": "bird", "sailfish": "fish", "great-white-shark": "fish",
    "yeti-crab": "shrimp", "goblin-shark": "fish", "colossal-squid": "bubbles", "dumbo-octopus": "bubbles",
    "sea-pig": "worm", "black-seadevil": "fishing-hook", "rhesus-macaque-monkey": "paw-print",
    "west-indian-manatee": "fish-symbol", "black-bear": "paw-print", "bobcat": "cat", "alligator": "worm",
    "largemouth-bass": "fish", "painted-turtle": "turtle", "common-loon": "bird", "hippopotamus": "paw-print",
    "swan": "bird", "pike": "fish", "capybara": "rat", "giant-otter": "squirrel", "scarlet-ibis": "bird",
    "pink-river-dolphin": "fish", "green-anaconda": "worm", "electric-eel": "zap", "spider-monkey": "paw-print",
}


def slugify(h):
    h = re.sub(r"[^\w\s-]", "", h.lower())
    return re.sub(r"\s", "-", h.strip())


def norm(t):
    return re.sub(r"[^a-z0-9 ]", "", t.lower()).strip()


GUIDE_SLUG = {"Guides.md": "guides", "Insurance.md": "insurance", "Programs.md": "programs",
              "Investments.md": "investments", "Taxes.md": "taxes", "RealEstate.md": "real-estate"}
GUIDE_ICON = {"guides": "book-open", "insurance": "umbrella", "programs": "landmark",
              "investments": "coins", "taxes": "receipt", "real-estate": "house"}

# --- guides: slug -> (title, markdown body) per file
GUIDES = {}
for f in (root / "docs/handoff").glob("*.md"):
    if f.name == "FiveOcean.md" or f.name.startswith("Blue"):
        continue
    lines = f.read_text(encoding="utf-8").splitlines()
    heads = [(i, len(m.group(1)), m.group(2)) for i, l in enumerate(lines) if (m := re.match(r"(#{2,4}) (.+)", l))]
    secs = {}
    for n, (i, lvl, title) in enumerate(heads):
        end = len(lines)
        for j, l2, _ in heads[n + 1:]:
            if l2 <= lvl:
                end = j
                break
        secs[slugify(title)] = (title, "\n".join(lines[i + 1:end]))
    GUIDES[f.name] = secs

# --- animals
part = src.split("## Animal directory", 1)[1]
cols = re.split(r"\n## ", "\n" + part)[1:]
COLL, ANIMALS, BY_SLUG = {}, [], {}
for c in cols:
    name, body = c.split("\n", 1)
    COLL[name.strip()] = []
    for a_ in re.split(r"\n### ", "\n" + body)[1:]:
        aname, abody = a_.split("\n", 1)
        paras = [x.strip() for x in abody.strip().split("\n\n") if x.strip()]
        m = re.match(r"\*\*(.+?)\.?\*\*\s*(.*)", paras[0], re.S)
        task, desc = (m.group(1), m.group(2)) if m else ("", paras[0])
        links = re.findall(r"\[([^\]]+)\]\(([^)]+)\)", paras[-1]) if len(paras) > 1 else []
        an = dict(name=aname.strip(), slug=slugify(aname), coll=name.strip(), task=task, desc=desc, links=links)
        ANIMALS.append(an)
        COLL[name.strip()].append(an)
        BY_SLUG[an["slug"]] = an
total = len(ANIMALS)
if total != 36 or len(BY_SLUG) != 36:
    sys.exit(f"expected 36 unique animals, found {total}/{len(BY_SLUG)}")


def inline(t, prefix=""):
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*([^*\n]+?)\*(?![\w*])", r"<em>\1</em>", t)

    def link(m):
        label, url = m.group(1), html.unescape(m.group(2))
        if url.startswith("http"):
            return f'<a href="{html.escape(url)}" rel="noopener">{label}</a>'
        f_, _, anchor = url.partition("#")
        if url.startswith("resource:"):
            return f'<a href="{prefix}resources/{url[9:]}/index.html">{label}</a>'
        if url.startswith("page:"):
            return f'<a href="{prefix}{url[5:]}">{label}</a>'
        if url.startswith("animal:"):
            return f'<a href="{prefix}animals/{url[7:]}/index.html">{label}</a>'
        if f_ in GUIDE_SLUG:
            return f'<a href="{prefix}guides/{GUIDE_SLUG[f_]}/index.html' + (f'#{anchor}' if anchor else '') + f'">{label}</a>'
        if f_ == "FiveOcean.md" and anchor in BY_SLUG:
            return f'<a href="{prefix}animals/{anchor}/index.html">{label}</a>'
        return f'<a href="{REPO}{url}" rel="noopener">{label}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, t)


def md_block(text, prefix, heads=False):
    out, lines, i = [], text.strip().splitlines(), 0
    li = re.compile(r"(- |\d+\. )")
    while i < len(lines):
        l = lines[i]
        if l.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(lines[i]); i += 1
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            head, bodyr = cells[0], cells[2:]
            out.append('<div class="tablewrap"><table><thead><tr>' + "".join(f"<th>{inline(c, prefix)}</th>" for c in head)
                       + "</tr></thead><tbody>" + "".join("<tr>" + "".join(f'<td data-label="{html.escape(head[i].replace("**", "") if i < len(head) else "")}">{inline(c, prefix)}</td>' for i, c in enumerate(r)) + "</tr>" for r in bodyr)
                       + "</tbody></table></div>")
        elif li.match(l):
            items = []
            while i < len(lines) and li.match(lines[i]):
                items.append(li.sub("", lines[i], 1)); i += 1
            out.append("<ul>" + "".join(f"<li>{inline(x, prefix)}</li>" for x in items) + "</ul>")
        elif not l.strip():
            i += 1
        elif l.startswith("> "):
            buf = []
            while i < len(lines) and lines[i].startswith(">"):
                buf.append(lines[i].lstrip("> ").rstrip()); i += 1
            out.append(f'<aside class="callout">{inline(" ".join(buf), prefix)}</aside>')
        elif l.startswith("#"):
            hm = re.match(r"(#+) (.+)", l)
            lvl = len(hm.group(1)); txt = hm.group(2)
            if heads and lvl in (2, 3):
                out.append(f'<h{lvl} id="{slugify(txt)}">{html.escape(txt)}</h{lvl}>')
            else:
                out.append(f"<h4>{html.escape(txt)}</h4>")
            i += 1
        else:
            para = []
            while i < len(lines) and lines[i].strip() and not lines[i].startswith(("|", "#", "> ")) and not li.match(lines[i]):
                para.append(lines[i]); i += 1
            out.append(f"<p>{inline(' '.join(para), prefix)}</p>")
    return "".join(out)



# --- resources (content/resources/*.md)
RESOURCES = []
for f in sorted((root / "content/resources").glob("*.md")):
    raw = f.read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S)
    meta, body = m.group(1), m.group(2)
    d, key = {"glance": [], "sources": []}, None
    for line in meta.splitlines():
        if re.match(r"^[a-z]+:", line):
            key, _, val = line.partition(":")
            if key not in ("glance", "sources"):
                d[key] = val.strip()
        elif line.startswith("- ") and key in ("glance", "sources"):
            a_, _, b_ = line[2:].partition("|")
            d[key].append((a_.strip(), b_.strip()))
    d["slug"] = f.stem
    d["animals"] = [x.strip() for x in d.get("animals", "").split(",") if x.strip()]
    d["related"] = [x.strip() for x in d.get("related", "").split(",") if x.strip()]
    d["body"] = body
    for a_ in d["animals"]:
        assert a_ in BY_SLUG, (f.name, a_)
    RESOURCES.append(d)
RES = {r["slug"]: r for r in RESOURCES}
for r in RESOURCES:
    for x in r["related"]:
        assert x in RES, (r["slug"], x)
    assert r["icon"] in ICONS, (r["slug"], r["icon"])
RES_GROUPS = {"retirement": ("Retirement & income", "landmark",
                             "Plans, pensions and accounts: what they are, who can use them, when the money is accessible, and what they cost in tax."),
              "credit": ("Credit & debt", "wallet", "Scores, reports, cards and debt: how credit works, how to protect and build it, and how to use debt without letting it use you."),
              "property": ("Property & housing", "house",
                           "Home, vacation home, rental, land, timeshare and more: what each one costs, earns and risks.")}
ANIMAL_TAGS = {}
for line in (root / "content/animal-tags.txt").read_text(encoding="utf-8").splitlines():
    if not line.strip() or line.startswith("#"):
        continue
    k, _, v = line.partition(":")
    items = []
    for it in v.split(","):
        rs, _, lab = it.strip().partition("=")
        assert rs in RES, (k, rs)
        items.append((rs, lab or RES[rs]["title"]))
    assert k.strip() in BY_SLUG, k
    ANIMAL_TAGS[k.strip()] = items
assert set(ANIMAL_TAGS) == set(BY_SLUG), set(BY_SLUG) - set(ANIMAL_TAGS)
ANIMAL_RES = {}
for r in RESOURCES:
    r["animals"] = [a_ for a_, tg in ANIMAL_TAGS.items() if any(x == r["slug"] for x, _ in tg)]
for a_, tg in ANIMAL_TAGS.items():
    ANIMAL_RES[a_] = [RES[x] for x, _ in tg]


def tags_html(slug, prefix, big=False):
    return (f'<div class="tags{" lg" if big else ""}">' + "".join(
        f'<a class="tag" href="{prefix}resources/{x}/index.html">{ic(RES[x]["icon"])}{html.escape(lab)}</a>'
        for x, lab in ANIMAL_TAGS[slug]) + "</div>")


def short(t, n=72):
    if len(t) <= n:
        return t
    return t[:n].rsplit(" ", 1)[0].rstrip(",;:") + "…"


def tile(href, icon, name, sub=""):
    return (f'<li><a class="tile" href="{href}"><span class="aico">{ic(icon)}</span><span><b>{html.escape(name)}</b>'
            f'<small>{html.escape(sub)}</small></span></a></li>')


def inline_href(url, prefix):
    f_, _, anchor = url.partition("#")
    return f"{prefix}guides/{GUIDE_SLUG[f_]}/index.html" + (f"#{anchor}" if anchor else "") if f_ in GUIDE_SLUG else REPO + url


def card_html(a, prefix):
    chips = "".join(f'<span>{inline(f"[{l}]({u})", prefix)}</span>' for l, u in a["links"])
    return (f'<article class="card"><span class="aico">{ic(ANIMAL_ICON[a["slug"]])}</span><p class="eyebrow">{html.escape(a["task"])}</p>'
            f'<h3><a class="stretch" href="{prefix}animals/{a["slug"]}/index.html">{html.escape(a["name"])}</a></h3>'
            f'<p class="desc">{inline(a["desc"], prefix)}</p>{tags_html(a["slug"], prefix)}<div class="chips">{chips}</div></article>')


def guide_text(a):
    gl = next((u for _, u in a["links"] if not u.startswith("http")), None)
    if not gl:
        return ""
    f_, _, anc = gl.partition("#")
    sec = GUIDES.get(f_, {}).get(anc)
    return f"{sec[0]} {sec[1]}" if sec else ""


def words(t):
    return " ".join(sorted(set(norm(re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)).split())))


INDEX = [dict(n=a["name"], t=a["task"], c=a["coll"], u=f'animals/{a["slug"]}/index.html',
              s=words(" ".join([a["name"], a["task"], a["desc"], a["coll"]] + [l for l, _ in a["links"]] + [lab for _, lab in ANIMAL_TAGS.get(a["slug"], [])] + [guide_text(a)])))
         for a in ANIMALS]


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
    f'--wash2:{"16%" if t[2] == "light" else "30%"};--neg:{"#b3261e" if t[2] == "light" else "#ff9a8f"};'
    f'--pos:{"#1b6b3a" if t[2] == "light" else "#8be0a7"}}}' for t in THEMES)


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
.search>.ic{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:18px;height:18px;opacity:.6;pointer-events:none}
.ic{width:1.15em;height:1.15em;flex:none;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;vertical-align:-.2em}
.kicker .ic{width:1.1em;height:1.1em}
.big .ico{display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:14px;color:var(--action);
  background:color-mix(in srgb,var(--action) 12%,transparent);border:1px solid color-mix(in srgb,var(--action) 24%,transparent)}
.big .ico .ic{width:24px;height:24px}
.aico{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border-radius:12px;margin-bottom:12px;color:var(--action);
  background:color-mix(in srgb,var(--action) 12%,transparent);border:1px solid color-mix(in srgb,var(--action) 22%,transparent)}
.aico .ic{width:22px;height:22px}
.tabs a .ic{width:1.05em;height:1.05em;margin-right:6px}
.dock a .ic{width:22px;height:22px}
.glass .ic{width:1.1em;height:1.1em}
.chev{margin-left:2px;opacity:.7}
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

/* animal pages, results */
.card{position:relative}
.card h3 a.stretch{color:inherit;text-decoration:none}
.card h3 a.stretch::after{content:"";position:absolute;inset:0;border-radius:inherit}
.chips{position:relative;z-index:1}
.results{position:absolute;left:0;right:0;top:calc(100% + 8px);z-index:45;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);
  border-radius:18px;padding:6px;box-shadow:0 20px 50px rgb(0 0 0/.3);max-height:70vh;overflow-y:auto;min-width:min(340px,calc(100vw - 32px))}
.results a{display:flex;flex-direction:column;padding:10px 14px;border-radius:12px;text-decoration:none;color:var(--ink);min-height:44px}
.results a:hover,.results a:focus-visible{background:color-mix(in srgb,var(--action) 12%,transparent)}
.results a b{font-weight:600}.results a span{font-size:.8rem;opacity:.7}
.results p{margin:0;padding:12px 14px;opacity:.75;font-size:.9rem}
.prose{max-width:76ch;overflow-wrap:anywhere}
.prose p,.prose li{margin:0 0 1em}.prose ul{padding-left:1.2em;margin:0 0 1em}
.prose h4{margin:1.6em 0 .4em;font-size:1rem}
.tablewrap{overflow-x:auto;margin:0 0 1.4em;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:14px;background:var(--surface)}
.prose table{border-collapse:collapse;width:100%;min-width:560px;font-size:.92rem;font-variant-numeric:tabular-nums}
.prose th,.prose td{padding:10px 14px;text-align:left;vertical-align:top;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
.prose th{font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;opacity:.75}
.prose tr:last-child td{border-bottom:0}
.pager{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:40px}
.pager a{flex:1 1 220px}
.pager .next{justify-content:flex-end;text-align:right}
.src{margin-top:8px;font-size:.9rem}

/* tags */
.tags{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px;position:relative;z-index:1}
.tag{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:3px 10px;border-radius:999px;font-size:.78rem;font-weight:600;text-decoration:none;color:var(--ink);
  background:color-mix(in srgb,var(--surface) 80%,transparent);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 40%,transparent);transition:border-color .15s,background .15s}
.tag:hover{border-color:var(--action);background:color-mix(in srgb,var(--action) 12%,transparent)}
.tag .ic{width:.95em;height:.95em;color:var(--action)}
.tags.lg{margin:4px 0 22px;gap:8px}.tags.lg .tag{min-height:40px;padding:6px 14px;font-size:.9rem}
/* resources */
.rgrid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:48px;align-items:start}
.rside{position:sticky;top:88px;display:grid;gap:16px}
.box{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:18px;padding:18px 20px}
.box h2{font:700 .75rem/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:0 0 10px}
.gl{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent);font-size:.92rem}
.gl:first-of-type{border-top:0}.gl span{opacity:.8}.gl b{font-variant-numeric:tabular-nums;text-align:right}
.srcs{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.srcs a{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;margin:0 -10px;border-radius:10px;text-decoration:none;font-size:.92rem}
.srcs a:hover{background:color-mix(in srgb,var(--action) 10%,transparent)}.srcs .ic{margin-top:.25em}
.stamp{font-size:.8rem;opacity:.7;margin:10px 0 0}
.callout{border-left:3px solid var(--action);background:color-mix(in srgb,var(--action) 9%,transparent);padding:12px 16px;border-radius:0 12px 12px 0;margin:0 0 1.2em}
.prose h2{font-family:"Iowan Old Style",Georgia,serif;font-weight:400;font-size:1.6rem;margin:1.8em 0 .5em;letter-spacing:-.01em;scroll-margin-top:84px}
.prose h2:first-child{margin-top:0}
.prose h3{font-size:1.05rem;margin:1.4em 0 .3em;scroll-margin-top:84px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px;margin:0;padding:0;list-style:none}
.tile{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:14px;text-decoration:none;color:var(--ink);min-height:56px;
  background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);transition:border-color .2s,transform .2s}
.tile:hover{border-color:var(--action);transform:translateY(-1px)}
.tile .aico{margin:0;flex:none;width:36px;height:36px}.tile b{display:block;font-weight:600;line-height:1.25}.tile small{display:block;opacity:.7;line-height:1.3}
.rsec{scroll-margin-top:84px}
.disclaim{font-size:.85rem;opacity:.75;margin-top:36px;max-width:72ch}
@media(max-width:960px){.rgrid{grid-template-columns:minmax(0,1fr);gap:28px}.rside{position:static;order:-1}}

/* ux pass: type, tables, buttons */
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{font-size:clamp(1rem,.96rem + .2vw,1.0625rem)}
p,li{text-wrap:pretty}
h1,h2,h3{text-wrap:balance}
h2{font-size:clamp(1.35rem,1.1rem + 1.1vw,2rem)}
.lede{line-height:1.55}
.glass{white-space:normal;text-align:center;line-height:1.25;padding:10px clamp(14px,3vw,20px)}
.cta{gap:10px}
.tablewrap{-webkit-overflow-scrolling:touch}
.prose td:first-child{font-weight:600}
@media(max-width:640px){
  .cta .glass,.hero .cta .glass{flex:1 1 100%;justify-content:center}
  .prose .tablewrap{border:0;background:transparent;overflow:visible}
  .prose table,.prose thead,.prose tbody,.prose tr,.prose td{display:block;width:100%;min-width:0}
  .prose thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
  .prose tr{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:14px;padding:6px 14px;margin:0 0 10px}
  .prose td{border:0!important;padding:8px 0}
  .prose td+td{border-top:1px solid color-mix(in srgb,var(--ink) 9%,transparent)!important}
  .prose td::before{content:attr(data-label);display:block;font-size:.7rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;opacity:.65;margin-bottom:2px}
  .prose td:first-child{font-size:1.02rem}
  .prose td:first-child::before{display:none}
}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* calculator */
.calc{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,420px);gap:36px;align-items:start}
.calc-res{position:sticky;top:88px;max-height:calc(100vh - 104px);overflow-y:auto;padding-right:2px}
.mgroup{margin:0 0 14px}.mlabel{margin:0 0 6px;font:700 .72rem/1 Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;opacity:.65}
.mrow{display:flex;flex-wrap:wrap;gap:8px}
.mbtn,.sbtn{min-height:44px;padding:8px 16px;border-radius:999px;font:inherit;font-size:.92rem;color:var(--ink);cursor:pointer;line-height:1.2;
  background:color-mix(in srgb,var(--surface) 85%,transparent);border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 40%,transparent)}
.mbtn:hover,.sbtn:hover{border-color:var(--action)}
.mbtn.on{background:var(--action);color:var(--cta);border-color:transparent;font-weight:600}
#mode-title{margin:1.2em 0 .2em}#mode-blurb{margin:0 0 14px;max-width:62ch;opacity:.85}
.tools-row{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}
.fields{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));gap:14px 16px}
.fld label{display:block;font-weight:600;font-size:.9rem;margin-bottom:4px}
.inp{display:flex;align-items:center;min-height:44px;border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:12px;background:var(--surface);overflow:hidden}
.inp:focus-within{outline:3px solid var(--action);outline-offset:1px}
.inp input{flex:1;min-width:0;border:0;background:transparent;font:inherit;color:var(--ink);padding:10px 12px;outline:none;font-variant-numeric:tabular-nums}
.af{padding:0 4px 0 12px;opacity:.7;white-space:nowrap}.af.suf{padding:0 12px 0 0;font-size:.85rem}
.fld small{display:block;font-size:.78rem;opacity:.7;margin-top:3px;line-height:1.3}
.hl{display:grid;gap:2px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:18px;padding:16px 20px;margin-bottom:12px}
.hl-k{font-size:.85rem;opacity:.75}.hl-v{font:400 clamp(2rem,6vw,2.7rem)/1.1 "Iowan Old Style",Georgia,serif;color:var(--action);overflow-wrap:anywhere}.hl-n{font-size:.82rem;opacity:.75}
.rt{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.rt tr{border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}.rt tr:first-child{border-top:0}
.rt th[scope=row]{text-align:left;font-weight:500;padding:9px 12px 9px 0;vertical-align:top}
.rt th small{display:block;font-weight:400;opacity:.7;font-size:.76rem;line-height:1.3}
.rt td{text-align:right;font-weight:600;padding:9px 0;vertical-align:top}
.rt tr.strong th,.rt tr.strong td{font-weight:700}
.rt td small{display:block;font-size:.76rem;font-weight:500}
.neg{color:var(--neg)}.pos{color:var(--pos)}
.sub{margin-top:22px}.sub h3{margin:0 0 4px;font-size:1.05rem}.subn{margin:0 0 8px;font-size:.88rem;opacity:.8}
.tw{position:relative;overflow-x:auto;border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);border-radius:14px;background:var(--surface);padding:4px 12px}
.rt.grid th,.rt.grid td{padding:9px 8px;text-align:right;white-space:nowrap}.rt.grid th[scope=row],.rt.grid th:first-child{text-align:left}.rt.grid td.base{color:var(--action)}
.rt.cmpt th,.rt.cmpt td{padding:9px 10px;text-align:right}.rt.cmpt th:first-child{text-align:left;white-space:normal;min-width:130px}
.scn{margin-top:44px}
.scn .row{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.scn .row .inp{flex:1 1 220px}
.sc{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0;border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
.scl{flex:1 1 220px;display:flex;gap:10px;align-items:center;cursor:pointer;min-height:44px}.scl input{width:20px;height:20px;accent-color:var(--action)}
.scl small{display:block;opacity:.7;font-size:.8rem}
.msg{min-height:1.4em;font-size:.88rem;color:var(--action)}
@media(max-width:960px){.calc{grid-template-columns:minmax(0,1fr);gap:24px}.calc-res{position:static;max-height:none;overflow:visible}}

/* credit tool */
.tabs button{white-space:nowrap;min-height:44px;display:inline-flex;align-items:center;padding:0 18px;border-radius:999px;border:0;background:transparent;color:var(--ink);font:inherit;font-size:.92rem;font-weight:500;cursor:pointer}
.tabs button:hover{background:color-mix(in srgb,var(--ink) 8%,transparent)}
.tabs button.on{background:var(--action);color:var(--cta);font-weight:600;box-shadow:0 4px 12px color-mix(in srgb,var(--action) 40%,transparent)}
.statusbar{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;font-size:.85rem;padding:10px 14px;border-radius:14px;margin:0 0 16px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.statusbar b{font-weight:600}
.banner{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:14px;margin:0 0 16px;background:color-mix(in srgb,var(--action) 12%,transparent);border:1px solid color-mix(in srgb,var(--action) 30%,transparent)}
.banner[hidden]{display:none}
.cc-panel{padding-top:20px}.cc-panel[hidden]{display:none}
.cc-panel h2{margin:0 0 6px;font-family:"Iowan Old Style",Georgia,serif;font-weight:400}
.cc-panel h3{margin:28px 0 8px;font-size:1.1rem}
.lead{max-width:66ch;margin:0 0 16px;opacity:.88}
.cc-form{margin:0 0 14px}.fbtn{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
select,textarea{font:inherit;color:var(--ink);background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:12px;min-height:44px;padding:10px 12px;width:100%}
.inp select{border:0;border-radius:0;background:transparent;outline:none}
textarea{display:block;margin:0 0 8px;resize:vertical}
.detect,.hist{margin:0 0 16px;padding:12px 16px;border-radius:14px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.detect summary,.hist summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center;background:none;border:0;padding:0}
.chk{display:flex;gap:10px;align-items:center;min-height:44px;cursor:pointer;font-size:.92rem}.chk input{width:20px;height:20px;accent-color:var(--action);flex:none}
.plain{margin:0 0 10px;padding-left:1.2em}
.tiles3{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:10px;margin:0 0 14px}
.stile{display:grid;gap:4px;padding:16px;border-radius:16px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.stile .k{font-size:.78rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;opacity:.7}
.stile strong{font:400 2.4rem/1 "Iowan Old Style",Georgia,serif;color:var(--action)}.stile .dim{opacity:.4}.stile small{opacity:.7}
.band{display:inline-block;width:max-content;padding:2px 10px;border-radius:999px;font-size:.75rem;font-weight:700;background:color-mix(in srgb,var(--ink) 10%,transparent)}
.b-poor{background:color-mix(in srgb,var(--neg) 18%,transparent);color:var(--neg)}.b-fair{background:color-mix(in srgb,#d97706 18%,transparent)}
.b-good,.b-verygood,.b-exceptional{background:color-mix(in srgb,var(--pos) 18%,transparent);color:var(--pos)}
.guide{margin:24px 0 0;padding:18px 20px;border-radius:18px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.guide h3{margin:0 0 8px}.steps{padding-left:1.3em;margin:0 0 12px}.steps li{margin:0 0 10px}
.callout.high{border-left-color:var(--neg)}.callout.ok{border-left-color:var(--pos)}
.cardlist{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}
.ccard{padding:16px;border-radius:16px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.ccard .ch{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.ccard .ch span{opacity:.7;font-size:.85rem}
.ub{height:8px;border-radius:99px;background:color-mix(in srgb,var(--ink) 12%,transparent);overflow:hidden;margin:6px 0 8px}
.ub i{display:block;height:100%;border-radius:99px}.ub i.lo{background:var(--pos)}.ub i.md{background:#d97706}.ub i.hi{background:var(--neg)}
.cm{margin:0 0 4px;font-size:.88rem;font-variant-numeric:tabular-nums}.act{display:flex;gap:8px;margin-top:10px}
.tgt{max-width:360px;margin:16px 0}
.strats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px;margin:0 0 14px}
.strat{position:relative;padding:18px;border-radius:18px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);display:grid;gap:4px;align-content:start}
.strat.best{border-color:var(--action);box-shadow:0 0 0 1px var(--action)}.strat h4{margin:0;font-size:1.05rem}
.flag{position:absolute;top:-10px;right:14px;background:var(--action);color:var(--cta);padding:2px 10px;border-radius:99px;font-size:.72rem;font-weight:700}
.big-n{font:400 2rem/1.1 "Iowan Old Style",Georgia,serif;color:var(--action);overflow-wrap:anywhere}
.strat dl{display:grid;grid-template-columns:1fr auto;gap:4px 10px;margin:8px 0 0;font-size:.88rem}.strat dt{opacity:.75}.strat dd{margin:0;font-weight:600;text-align:right;font-variant-numeric:tabular-nums}
.vd{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.75rem;font-weight:700}
.v-bad{background:color-mix(in srgb,var(--neg) 18%,transparent);color:var(--neg)}.v-good{background:color-mix(in srgb,var(--pos) 18%,transparent);color:var(--pos)}.v-judgment{background:color-mix(in srgb,var(--ink) 10%,transparent)}
.rt td small{display:block;opacity:.7;font-weight:400;text-align:left}
.guard{margin:0 0 8px;padding-left:14px;border-left:2px solid color-mix(in srgb,var(--ink) 20%,transparent);font-size:.92rem}
.nav a{padding:8px 11px}
.picker .lbl{display:none}.search{flex:0 1 210px}

/* sonar */
.sonar{margin:0 0 36px;padding:20px 22px;border-radius:20px;background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 14%,transparent);
  box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 35%,transparent)}
.sonar h2{margin:0 0 6px;font-family:"Iowan Old Style",Georgia,serif;font-weight:400;display:flex;gap:10px;align-items:center}
.sonar h2 .ic{color:var(--action)}
.sn-head{margin:14px 0 6px}.sn-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0}
.sn-row select{flex:1 1 220px;max-width:340px}.sn-row label{font-weight:600;font-size:.9rem}
.bk{margin:14px 0 0}.bk summary{cursor:pointer;font-weight:600;min-height:44px;display:flex;align-items:center;background:none;border:0;padding:0}
/* responsive */
@media(max-width:860px){.hero .wrap{grid-template-columns:1fr;padding-block:48px 64px;gap:32px}}
@media(max-width:1100px){.bar{gap:8px;min-height:56px}.brand{flex:1 0 auto}.nav{display:none}.search{order:4;flex:1 1 100%}.search kbd{display:none}
  .menu{width:min(280px,calc(100vw - 32px));max-height:min(70vh,520px);overflow-y:auto}.picker .lbl{display:none}
  body{padding-bottom:84px}.wrap{padding-inline:16px}.hero .wrap{padding-block:36px 56px}
  .dock{display:flex;position:fixed;z-index:30;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));gap:2px;padding:6px;border-radius:999px;
    background:color-mix(in srgb,var(--surface) 86%,transparent);border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);
    box-shadow:inset 0 1px 0 color-mix(in srgb,#fff 50%,transparent),0 14px 34px rgb(0 0 0/.3)}
  @supports(backdrop-filter:blur(1px)){.dock{backdrop-filter:blur(14px) saturate(1.4)}}
  .dock a{flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border-radius:999px;text-decoration:none;color:var(--ink);font-size:.72rem;font-weight:600}
  .dock a[aria-current]{background:var(--action);color:var(--cta)}
  .stats li{flex:1 1 calc(33% - 10px);padding:10px 12px}.cta .glass{flex:1 1 100%;justify-content:center}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
@media(forced-colors:active){.card,.menu,.glass,.big,.panel{border:1px solid CanvasText}}
"""

JS = """
const q=document.getElementById('q'),pk=document.getElementById('picker'),res=document.getElementById('results');
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();
const sc=(a,v)=>{const n=norm(a.n);return (n.includes(v)?100:0)+(n.startsWith(v)?50:0)+(a.c==='Resource'?10:a.c==='Guide'?5:0)};
let INDEX=null;
const load=()=>INDEX?Promise.resolve(INDEX):fetch(P+'search-index.json').then(r=>r.json()).then(d=>INDEX=d);
q.addEventListener('focus',load);
q.addEventListener('input',()=>{const v=norm(q.value);if(!v){res.hidden=true;return}
load().then(()=>{if(norm(q.value)!==v)return;const tk=v.split(' ');
const hits=INDEX.filter(a=>tk.every(t=>(' '+a.s).includes(' '+t))).sort((a,b)=>sc(b,v)-sc(a,v)).slice(0,8);
res.innerHTML=hits.length?hits.map(a=>'<a href="'+P+a.u+'"><b>'+a.n+'</b><span>'+a.t+' \\u00b7 '+a.c+'</span></a>').join(''):'<p>No match. Try \\u201c457b\\u201d, \\u201cERS\\u201d or \\u201cduplex\\u201d.</p>';res.hidden=false})});
q.addEventListener('keydown',e=>{if(e.key==='Enter'){const a=res.querySelector('a');if(a)location.href=a.href}
if(e.key==='Escape'){q.value='';res.hidden=true}});
const cur=document.documentElement.dataset.theme;
document.querySelectorAll('input[name=theme]').forEach(r=>{r.checked=r.value===cur;
r.addEventListener('change',()=>{document.documentElement.dataset.theme=r.value;
try{localStorage.setItem('fiveoceans-theme',r.value)}catch(e){}});});
pk.addEventListener('keydown',e=>{if(e.key==='Escape'&&pk.open){pk.open=false;pk.querySelector('summary').focus()}});
document.addEventListener('click',e=>{if(!pk.contains(e.target))pk.open=false;if(!e.target.closest('.search'))res.hidden=true});
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
{SPRITE}
<a class="glass skip" href="#main">Skip to content</a>
<header><div class="wrap bar">
<a class="brand" href="{prefix}index.html">{ic("waves-horizontal")} FiveOceans</a>
<nav class="nav" aria-label="Main"><a href="{prefix}seawater/index.html"{ac("seawater")}>Seawater</a><a href="{prefix}freshwater/index.html"{ac("freshwater")}>Freshwater</a><a href="{prefix}resources/index.html"{ac("resources")}>Resources</a><a href="{prefix}tools/index.html"{ac("tools")}>Tools</a><a href="{prefix}credit/index.html"{ac("credit")}>Credit Card Tool</a></nav>
<span class="spacer"></span>
<div class="search"><label for="q" hidden>Search</label>{ic("search")}<input id="q" type="search" placeholder="Search…" autocomplete="off"><kbd aria-hidden="true">/</kbd><div class="results" id="results" hidden aria-live="polite"></div></div>
<details class="picker" id="picker"><summary class="glass" aria-label="Change theme">{ic("palette")} <span class="lbl">Change theme</span> {ic("chevron-down","chev")}</summary>
<div class="menu" role="radiogroup" aria-label="Theme"><h4>Light</h4>{rows("light")}<h4>Dark</h4>{rows("dark")}</div></details>
</div></header>
{hero}
<main id="main"><div class="wrap">{body}</div></main>
<footer><div class="wrap"><p>FiveOceans · planning demo, fictional figures, not financial advice. Nothing you type is stored or sent.</p>
<p><a href="{REPO}COLE_HANDOFF.txt">Handoff</a> · <a href="{REPO}Blue-Glass-Development-Plan.md">Blue Glass plan</a> · <a href="https://github.com/Sukonik/5oceans">GitHub</a></p></div></footer>
<nav class="dock" aria-label="Quick">
<a href="{prefix}index.html"{ac("home")}>{ic("house")}<span>Home</span></a>
<a href="{prefix}index.html#water"{"" if cur not in ("seawater","freshwater") else ' aria-current="page"'}>{ic("waves-horizontal")}<span>Water</span></a>
<a href="{prefix}resources/index.html"{ac("resources")}>{ic("landmark")}<span>Resources</span></a>
<a href="{prefix}tools/index.html"{ac("tools")}>{ic("calculator")}<span>Tools</span></a>
<a href="{prefix}credit/index.html"{ac("credit")}>{ic("wallet")}<span>Credit</span></a>
</nav>
<script>const P={prefix!r};{JS}</script></body></html>"""


FAMILIES = {
    "seawater": (ic("waves-horizontal"), "Seawater", ["CoastalSea", "CentralSea", "DeepSea"],
                 "Shoreline and open-water paths: housing near the coast, income bridges and insurance."),
    "freshwater": (ic("droplets"), "Freshwater", ["Spring", "Lake", "River"],
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
            f'<p>{BLURB[c]}</p><span class="meta">{len(COLL[c])} animals {ic("arrow-right")}</span></a>')


def page_hero(crumb, emoji, h, lede, extra=""):
    return (f'<section class="hero compact"><div class="wrap"><div><p class="crumb">{crumb}</p>'
            f'<span class="kicker">{emoji} FiveOceans</span><h1>{h}</h1><p class="lede">{lede}</p>{extra}</div></div></section>')


ICWAVE, ICDROP, ICSHELL = ic("waves-horizontal"), ic("droplets"), ic("shell")
home_hero = f"""<section class="hero"><div class="wrap"><div>
<span class="kicker">{ICWAVE} Retirement planning, near the water</span>
<h1>Where near the water would you like to live, and <em>when can you afford to work less?</em></h1>
<p class="lede">Thirty-six animal paths, each tied to a real decision and an official source. Start with salt water or fresh.</p>
<ul class="stats"><li><b>36</b><span>animal paths</span></li><li><b>6</b><span>water bodies</span></li><li><b>8</b><span>shore-rock themes</span></li></ul>
<div class="cta" style="margin-top:26px"><a class="glass primary" href="seawater/index.html">{ICWAVE} Explore Seawater</a><a class="glass" href="freshwater/index.html">{ICDROP} Explore Freshwater</a></div></div>
<aside class="panel" aria-label="Sample result"><span class="tag">{ICSHELL} Hermit Crab · fictional example</span>
<h2>Could a tenant pay part of my housing cost?</h2>
<p class="big-n">$1,552<span style="font-size:1rem;font-family:inherit;color:var(--ink);opacity:.7"> /month</span></p>
<p class="small" style="margin-top:4px">what the owner still pays after rent</p>
<div class="row"><span>Carrying cost</span><span>$3,300</span></div>
<div class="row"><span>Rent after vacancy &amp; management</span><span>−$1,748</span></div>
<p class="small">Illustrative numbers. Before income tax.</p></aside></div></section>"""

fam_cards = "".join(
    f'<a class="big" href="{k}/index.html"><span class="ico">{e}</span><h2>{n}</h2><p>{d}</p>'
    f'<span class="meta">{" · ".join(c)} {ic("arrow-right")}</span></a>' for k, (e, n, c, d) in FAMILIES.items())
def tabs(prefix, here):
    allc = [c for _, (_, _, cs, _) in FAMILIES.items() for c in cs]
    return '<nav class="tabs" aria-label="Water bodies">' + "".join(
        f'<a href="{prefix}{slug(c)}/index.html"' + (' aria-current="page"' if c == here else "") + f'>{EMOJI[c]} {c}</a>' for c in allc) + '</nav>'


write("index.html", "FiveOceans", 0,
      f'<section class="section" id="water"><h2>Choose your water</h2><p>Six collections, six animals each. Every one links to a guide and a direct official resource.</p>'
      f'<div class="fam">{fam_cards}</div></section>'
      f'<section class="section"><h2>Explore the resources</h2><p>Two shelves behind every path: money plans and property.</p><div class="fam">'
      + "".join(f'<a class="big" href="resources/index.html#{k}"><span class="ico">{ic(v[1])}</span><h3>{v[0]}</h3><p>{v[2]}</p>'
                f'<span class="meta">{sum(1 for r in RESOURCES if r["group"] == k)} guides {ic("arrow-right")}</span></a>' for k, v in RES_GROUPS.items())
      + '</div></section>'
      + f'<section class="section"><h2>Run the numbers</h2><p>Simple calculators that work in your browser.</p><div class="fam">'
      + f'<a class="big" href="tools/real-estate/index.html"><span class="ico">{ic("calculator")}</span><h3>Real Estate Calculator</h3><p>Home, rental, condo, co-op, land, flipper, income houses and more.</p><span class="meta">14 calculators {ic("arrow-right")}</span></a>'
      + f'<a class="big" href="tools/savings-bridge/index.html"><span class="ico">{ic("piggy-bank")}</span><h3>Savings Bridge</h3><p>Will your savings carry you to your first pension payment?</p><span class="meta">Open the tool {ic("arrow-right")}</span></a>'
      + f'<a class="big" href="credit/index.html"><span class="ico">{ic("wallet")}</span><h3>Credit Card Tool</h3><p>Track your three scores, manage cards in a private packet and see how debt shapes wealth.</p><span class="meta">Open the tool {ic("arrow-right")}</span></a>'
      + '</div></section>', home_hero, "home")

for k, (e, n, cs, d) in FAMILIES.items():
    write(f"{k}/index.html", f"{n} | FiveOceans", 1,
          f'<section class="section"><div class="fam">{"".join(coll_card("../", c) for c in cs)}</div></section>',
          page_hero(f'<a href="../index.html">Home</a> / {n}', e, f"{n} paths", d), k)
    for c in cs:
        write(f"{slug(c)}/index.html", f"{c} | FiveOceans", 1,
              f'<section class="section"><div class="grid">{"".join(card_html(a, "../") for a in COLL[c])}</div></section>',
              page_hero(f'<a href="../index.html">Home</a> / <a href="../{k}/index.html">{n}</a> / {c}',
                        EMOJI[c], f"{c}", BLURB[c], tabs("../", c)), k)

SRC_FAM = {c: k for k, (_, _, cs, _) in FAMILIES.items() for c in cs}
for i, a in enumerate(ANIMALS):
    fam = SRC_FAM[a["coll"]]
    famn = FAMILIES[fam][1]
    srcs = [(l, u) for l, u in a["links"] if u.startswith("http")]
    gl = next(((l, u) for l, u in a["links"] if not u.startswith("http")), None)
    sec = None
    if gl:
        f_, _, anc = gl[1].partition("#")
        sec = GUIDES.get(f_, {}).get(anc)
    btns = "".join(
        f'<a class="glass{" primary" if n == 0 else ""}" href="{html.escape(u)}" rel="noopener">{html.escape(l)} {ic("arrow-up-right")}</a>'
        for n, (l, u) in enumerate(srcs))
    if sec:
        btns += f'<a class="glass" href="#guide">Read the guide {ic("arrow-down")}</a>'
    crumb = (f'<a href="../../index.html">Home</a> / <a href="../../{fam}/index.html">{famn}</a> / '
             f'<a href="../../{slug(a["coll"])}/index.html">{a["coll"]}</a> / {html.escape(a["name"])}')
    hero = (f'<section class="hero compact"><div class="wrap"><div><p class="crumb">{crumb}</p>'
            f'<span class="kicker">{ic(ANIMAL_ICON[a["slug"]])} {html.escape(a["task"])}</span><h1>{html.escape(a["name"])}</h1>'
            f'<p class="lede">{inline(a["desc"], "../../")}</p>{tags_html(a["slug"], "../../", True)}<div class="cta">{btns}</div></div></div></section>')
    body = ""
    if a["slug"] in ANIMAL_RES:
        body += ('<section class="section"><h2>Resources for this path</h2><ul class="tiles">'
                 + "".join(tile(f'../../resources/{r_["slug"]}/index.html', r_["icon"], r_["title"], short(r_["summary"])) for r_ in ANIMAL_RES[a["slug"]]) + "</ul></section>")
    if sec:
        body += (f'<section class="section" id="guide"><h2>{html.escape(sec[0])}</h2><div class="prose">{md_block(sec[1], "../../")}</div>'
                 f'<p class="src"><a href="{inline_href(gl[1], "../../")}">Open the full guide {ic("arrow-right")}</a></p></section>')
    sib = [x for x in COLL[a["coll"]] if x is not a]
    body += (f'<section class="section"><h2>More in {a["coll"]}</h2><div class="grid">'
             f'{"".join(card_html(x, "../../") for x in sib)}</div></section>')
    prv, nxt = ANIMALS[i - 1], ANIMALS[(i + 1) % len(ANIMALS)]
    body += ('<nav class="pager" aria-label="Animals">'
             f'<a class="glass" href="../{prv["slug"]}/index.html">{ic("arrow-left")} {html.escape(prv["name"])}</a>'
             f'<a class="glass next" href="../{nxt["slug"]}/index.html">{html.escape(nxt["name"])} {ic("arrow-right")}</a></nav>')
    write(f'animals/{a["slug"]}/index.html', f'{a["name"]} | FiveOceans', 2, body, hero, fam)

# ---------------- resources, guides ----------------
def rcard(r, prefix):
    g = r["glance"][0] if r["glance"] else None
    n_a = len(r["animals"])
    chip = (f'<div class="chips"><span>{html.escape(g[0])}: <strong>{html.escape(g[1])}</strong></span>' if g else '<div class="chips">') + (f'<span>{n_a} animal path{"s" if n_a != 1 else ""}</span>' if n_a else "") + "</div>"
    return (f'<article class="card"><span class="aico">{ic(r["icon"])}</span>'
            f'<h3><a class="stretch" href="{prefix}resources/{r["slug"]}/index.html">{html.escape(r["title"])}</a></h3>'
            f'<p class="desc">{html.escape(r["summary"])}</p>{chip}</article>')


STAMP = "Checked against official sources on November 5, 2026. Rules and limits change; confirm with the plan, agency or a licensed professional."
DISCLAIM = ('<p class="disclaim">General information for planning, not financial, tax, legal or insurance advice. '
            'Figures in worked examples are fictional.</p>')

for r in RESOURCES:
    grp = RES_GROUPS[r["group"]]
    srcs = r["sources"]
    btns = "".join(
        f'<a class="glass{" primary" if n == 0 else ""}" href="{html.escape(u)}" rel="noopener">{html.escape(l)} {ic("arrow-up-right")}</a>'
        for n, (l, u) in enumerate(srcs[:2]))
    if r.get("calc"):
        btns += f'<a class="glass" href="../../tools/real-estate/index.html#{r["calc"]}">{ic("calculator")} Run the numbers</a>'
    if r.get("tool") == "credit":
        btns += f'<a class="glass" href="../../credit/index.html">{ic("wallet")} Credit Card Tool</a>'
    if r.get("bridge"):
        btns += f'<a class="glass" href="../../tools/savings-bridge/index.html">{ic("calculator")} Savings bridge</a>'
    crumb = (f'<a href="../../index.html">Home</a> / <a href="../index.html">Resources</a> / '
             f'<a href="../index.html#{r["group"]}">{grp[0]}</a> / {html.escape(r["title"])}')
    hero = (f'<section class="hero compact"><div class="wrap"><div><p class="crumb">{crumb}</p>'
            f'<span class="kicker">{ic(r["icon"])} {grp[0]}</span><h1>{html.escape(r["title"])}</h1>'
            f'<p class="lede">{html.escape(r["summary"])}</p><div class="cta">{btns}</div></div></div></section>')
    gl = ""
    if r["glance"]:
        gl = '<div class="box"><h2>At a glance</h2>' + "".join(
            f'<div class="gl"><span>{html.escape(a_)}</span><b>{inline(b_, "../../")}</b></div>' for a_, b_ in r["glance"]) + "</div>"
    sl = ('<div class="box"><h2>Official sources</h2><ul class="srcs">' + "".join(
        f'<li><a href="{html.escape(u)}" rel="noopener">{ic("arrow-up-right")}<span>{html.escape(l)}</span></a></li>' for l, u in srcs)
          + f'</ul><p class="stamp">{STAMP}</p></div>')
    main = f'<div class="prose">{md_block(r["body"], "../../", heads=True)}</div>'
    if r["animals"]:
        main += ('<section class="rsec" style="margin-top:40px"><h2 style="font-family:Iowan Old Style,Georgia,serif;font-weight:400">Animal paths that use this</h2><ul class="tiles">'
                 + "".join(tile(f'../../animals/{a_}/index.html', ANIMAL_ICON[a_], BY_SLUG[a_]["name"], BY_SLUG[a_]["task"]) for a_ in r["animals"]) + "</ul></section>")
    if r["related"]:
        main += ('<section class="rsec" style="margin-top:32px"><h2 style="font-family:Iowan Old Style,Georgia,serif;font-weight:400">Related resources</h2><ul class="tiles">'
                 + "".join(tile(f'../{x}/index.html', RES[x]["icon"], RES[x]["title"], short(RES[x]["summary"])) for x in r["related"]) + "</ul></section>")
    main += DISCLAIM
    body = f'<div class="section"><div class="rgrid"><div>{main}</div><aside class="rside">{gl}{sl}</aside></div></div>'
    write(f'resources/{r["slug"]}/index.html', f'{r["title"]} | FiveOceans', 2, body, hero, "resources")

# guide pages
GUIDE_FILES = {v: k for k, v in GUIDE_SLUG.items()}
GUIDE_GROUP = {"guides": "retirement", "insurance": "property", "programs": "retirement",
               "investments": "retirement", "taxes": "retirement", "real-estate": "property"}
GUIDE_META = {}
for slugg, fn in GUIDE_FILES.items():
    raw = (root / "docs/handoff" / fn).read_text(encoding="utf-8")
    title = re.match(r"# (.+)", raw).group(1)
    rest = raw.split("\n", 1)[1]
    first = next((x for x in rest.split("\n\n") if x.strip() and not x.startswith("#") and not x.startswith("|")), "")
    GUIDE_META[slugg] = (title, re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", first.strip())[:240])
    toc = "".join(f'<li><a href="#{slugify(h)}">{html.escape(h)}</a></li>' for h in re.findall(r"^## (.+)$", rest, re.M))
    grp = GUIDE_GROUP[slugg]
    rel = [r for r in RESOURCES if r["group"] == grp]
    crumb = f'<a href="../../index.html">Home</a> / <a href="../index.html">Guides</a> / {html.escape(title)}'
    hero = (f'<section class="hero compact"><div class="wrap"><div><p class="crumb">{crumb}</p>'
            f'<span class="kicker">{ic(GUIDE_ICON[slugg])} Reference guide</span><h1>{html.escape(title)}</h1>'
            f'<p class="lede">{html.escape(GUIDE_META[slugg][1])}</p></div></div></section>')
    side = (f'<div class="box"><h2>On this page</h2><ul class="srcs">{toc}</ul></div>'
            f'<div class="box"><h2>Resources</h2><ul class="srcs"><li><a href="../../resources/index.html#{grp}">{ic("arrow-right")}<span>{RES_GROUPS[grp][0]}</span></a></li></ul></div>')
    main = (f'<div class="prose">{md_block(rest, "../../", heads=True)}</div>' + DISCLAIM)
    body = f'<div class="section"><div class="rgrid"><div>{main}</div><aside class="rside">{side}</aside></div></div>'
    write(f"guides/{slugg}/index.html", f"{title} | FiveOceans", 2, body, hero, "resources")

gcards = "".join(
    f'<article class="card"><span class="aico">{ic(GUIDE_ICON[k])}</span><h3><a class="stretch" href="{k}/index.html">{html.escape(GUIDE_META[k][0])}</a></h3>'
    f'<p class="desc">{html.escape(GUIDE_META[k][1][:150])}…</p></article>' for k in GUIDE_FILES)
write("guides/index.html", "Reference guides | FiveOceans", 1,
      f'<section class="section"><div class="grid">{gcards}</div></section>',
      page_hero('<a href="../index.html">Home</a> / Guides', ic("book-open"), "Reference guides",
                "Six reference guides behind the animal paths: decisions, programs, investments, insurance, taxes and real estate."), "resources")

# resources hub
tabs_h = ('<nav class="tabs" aria-label="Resource sections">'
          + "".join(f'<a href="#{k}">{ic(v[1])} {v[0]}</a>' for k, v in RES_GROUPS.items())
          + f'<a href="#guides">{ic("book-open")} Guides</a></nav>')
sections_h = ""
for k, (title_, icn, blurb) in RES_GROUPS.items():
    rs = [r for r in RESOURCES if r["group"] == k]
    sections_h += (f'<section class="section rsec" id="{k}"><h2>{title_}</h2><p>{blurb}</p>'
                   f'<div class="grid">{"".join(rcard(r, "../") for r in rs)}</div></section>')
sections_h += (f'<section class="section rsec" id="guides"><h2>Reference guides</h2><p>The full guides the animal paths draw on.</p>'
               f'<div class="grid">{"".join(f"""<article class="card"><span class="aico">{ic(GUIDE_ICON[k])}</span><h3><a class="stretch" href="../guides/{k}/index.html">{html.escape(GUIDE_META[k][0])}</a></h3><p class="desc">{html.escape(GUIDE_META[k][1][:140])}…</p></article>""" for k in GUIDE_FILES)}</div></section>')
write("resources/index.html", "Resources | FiveOceans", 1, sections_h,
      page_hero('<a href="../index.html">Home</a> / Resources', ic("landmark"), "Resources",
                "Every plan, account and property type behind the animal paths, with eligibility, access rules, costs and the official source.", tabs_h), "resources")

# search index additions
for r in RESOURCES:
    INDEX.append(dict(n=r["title"], t=r["summary"], c="Resource", u=f'resources/{r["slug"]}/index.html',
                      s=words(" ".join([r["title"], r["summary"], r["body"]] + [a_ + " " + b_ for a_, b_ in r["glance"]]))))
for k, fn in GUIDE_FILES.items():
    INDEX.append(dict(n=GUIDE_META[k][0], t="Reference guide", c="Guide", u=f"guides/{k}/index.html",
                      s=words((root / "docs/handoff" / fn).read_text(encoding="utf-8"))))

# ---------------- tools ----------------
shutil.copytree(root / "assets/calc", out / "assets/calc", dirs_exist_ok=True)
sys.path.insert(0, str(root / "scripts"))
MODE_LIST = json.loads((root / "assets/calc/modes.json").read_text(encoding="utf-8"))
TOOLS = [
    ("real-estate", "Real Estate Calculator", "calculator",
     "Fourteen calculators in one, with Dolphin Sonar to fill them from a listing: home, home with a rental, condo, co-op, house hacker, vacation home, land, investment property, pure rental income, flipper, renter, and three income-house types."),
    ("savings-bridge", "Savings Bridge", "piggy-bank",
     "How much a monthly deposit grows by the day you stop working, what monthly draw it supports, and the deposit needed to close a gap before your pension starts."),
]
TOOL_ICON = {t[0]: t[2] for t in TOOLS}
TOOL_NOTE = ("Illustrative estimates. Nothing you type is sent anywhere or stored unless you press Save. "
             "Not financial, tax or legal advice.")
calc_credit = ("<p class=\"disclaim\">The formulas (loan payments, cap rate, cash-on-cash, DSCR, gross rent multiplier, break-even occupancy, the 70% rule and the IRS "
               "14-day vacation-home test) are standard and written for this site. Design ideas came from "
               "<a href=\"https://github.com/berkcankapusuzoglu/Rental-Property-Deal-Analyzer\" rel=\"noopener\">Rental Property Deal Analyzer</a> (MIT), "
               "<a href=\"https://github.com/jbechtel-97/dealflowpro-mcp-server\" rel=\"noopener\">DealFlowPro MCP server</a> (MIT), "
               "<a href=\"https://github.com/moonnstarr/RealEstateInvestmentCal\" rel=\"noopener\">RealEstateInvestmentCal</a> and "
               "<a href=\"https://github.com/biegehydra/real-estate-calculations\" rel=\"noopener\">real-estate-calculations</a> (AGPL; no code copied), "
               "and the saved-scenario and stress-test approach from <a href=\"https://github.com/Sukonik/payout-lab\" rel=\"noopener\">Payout Lab</a>.</p>")

mode_chips = "".join(f'<span>{html.escape(m["label"])}</span>' for m in MODE_LIST)
tool_cards = f'<article class="card"><span class="aico">{ic("wallet")}</span><h3><a class="stretch" href="../credit/index.html">Credit Card Tool</a></h3><p class="desc">Record your three credit scores, keep your cards in a private packet, and compare good and bad debt for wealth building.</p></article>' + "".join(
    f'<article class="card"><span class="aico">{ic(ic_)}</span><h3><a class="stretch" href="{sl}/index.html">{html.escape(t)}</a></h3>'
    f'<p class="desc">{html.escape(d)}</p>' + (f'<div class="chips">{mode_chips}</div>' if sl == "real-estate" else "") + "</article>"
    for sl, t, ic_, d in TOOLS)
write("tools/index.html", "Tools | FiveOceans", 1,
      f'<section class="section"><div class="grid">{tool_cards}</div><p class="disclaim">{TOOL_NOTE}</p></section>',
      page_hero('<a href="../index.html">Home</a> / Tools', ic("calculator"), "Tools",
                "Simple calculators that run in your browser. Pick a tool, change the numbers and see the result at once."), "tools")

def group_modes():
    gs = {}
    for m in MODE_LIST:
        gs.setdefault(m["group"], []).append(m)
    return gs

SONAR_ISSUE = "https://github.com/Sukonik/5oceans/issues/15"
calc_body = f""""""
calc_body = f"""<section class="sonar" id="sonar" aria-labelledby="sn-h"><h2 id="sn-h">{ic("search")} Dolphin Sonar</h2>
<p class="lead">Ping a listing to fill the calculator. Paste a link from Redfin, Zillow or StreetEasy, and paste the listing text (select the page, copy, paste). Sonar reads the address from the link and the price, taxes, fees and details from the text, right here in your browser.</p>
<div class="fields"><div class="fld"><label for="sn-url">Listing link</label><div class="inp"><input id="sn-url" type="url" inputmode="url" autocomplete="off" placeholder="https://www.redfin.com/..." maxlength="500"></div><small>Optional. Gives the address and listing ID.</small></div></div>
<div class="fld" style="margin-top:12px"><label for="sn-text">Listing text</label><textarea id="sn-text" rows="5" maxlength="60000" placeholder="Paste the listing page text here: price, beds and baths, taxes, HOA or maintenance, year built..."></textarea></div>
<div class="tools-row"><button type="button" class="glass primary" id="sn-go">{ic("search")} Ping</button><button type="button" class="glass" id="sn-clear">{ic("rotate-ccw")} Clear</button></div>
<div id="sn-out" aria-live="polite"></div><p class="msg" id="sn-msg" role="status"></p>
<details class="bk"><summary>One-click bookmarklet (desktop browsers)</summary>
<p class="subn">Drag this to your bookmarks bar. On a listing page you have open, click it: it sends what is on your screen to this calculator. It runs in your browser and the site is not contacted. If a listing site blocks bookmarklets, use paste instead.</p>
<p><a class="glass" id="sn-bm" href="#" draggable="true">{ic("search")} Dolphin Sonar</a></p></details>
<p class="subn">Sonar never fetches a page. Listing sites block automated reads and their terms generally forbid scraping, and MLS data is licensed. See the <a href="{SONAR_ISSUE}" rel="noopener">Dolphin Sonar roadmap</a> for licensed and open-data options.</p></section>
<div class="calc" id="calc-top"><div class="calc-main">
<div id="modes" class="modes" aria-label="Choose a calculator"></div>
<h2 id="mode-title"></h2><p id="mode-blurb"></p>
<div class="tools-row">
<button type="button" class="glass" id="ex-btn" hidden>{ic("sliders-horizontal")} Load the handbook example</button>
<button type="button" class="glass" id="reset-btn">{ic("rotate-ccw")} Reset</button>
<button type="button" class="glass" id="copy-btn">{ic("copy")} Copy results</button>
<a class="glass" href="#results" id="jump">{ic("arrow-down")} Jump to results</a></div>
<form id="fields" class="fields" onsubmit="return false" aria-label="Inputs"></form>
</div>
<aside class="calc-res" aria-live="polite" aria-label="Results"><div id="results"></div></aside></div>
<section class="scn" aria-labelledby="scn-h"><h2 id="scn-h">Saved scenarios</h2>
<p class="subn">Save a scenario to this browser, compare up to three, or move them as a file. Nothing is uploaded.</p>
<div class="row"><div class="inp"><input id="scn-name" type="text" placeholder="Name this scenario" aria-label="Scenario name" maxlength="60"></div>
<button type="button" class="glass primary" id="save-btn">{ic("save")} Save</button>
<button type="button" class="glass" id="export-btn">{ic("download")} Export file</button>
<label class="glass" for="import-file" style="cursor:pointer">{ic("upload")} Import file</label>
<input id="import-file" type="file" accept="application/json,.json" class="sr"></div>
<p class="msg" id="scn-msg" role="status"></p>
<div id="scn-list"></div><div id="cmp"></div></section>
{calc_credit}<p class="disclaim">{TOOL_NOTE}</p>
<script src="../../assets/calc/engine.js"></script><script src="../../assets/calc/sonar.js"></script><script src="../../assets/calc/app.js"></script>"""
write("tools/real-estate/index.html", "Real Estate Calculator | FiveOceans", 2, f'<section class="section">{calc_body}</section>',
      page_hero('<a href="../../index.html">Home</a> / <a href="../index.html">Tools</a> / Real Estate Calculator', ic("calculator"), "Real Estate Calculator",
                "Fourteen ways to own, rent or flip a place, each with its own numbers, stress tests and saved scenarios."), "tools")

bridge_body = f"""<div class="calc" id="calc-top"><div class="calc-main">
<p class="subn" style="max-width:62ch">Save a little each month while you work, then draw it down to bridge the years before a pension or Social Security starts. Defaults use the handbook example.</p>
<div class="tools-row"><button type="button" class="glass" id="b-reset">{ic("rotate-ccw")} Reset</button>
<a class="glass" href="#b-results">{ic("arrow-down")} Jump to results</a></div>
<form id="b-fields" class="fields" onsubmit="return false" aria-label="Inputs"></form></div>
<aside class="calc-res" aria-live="polite" aria-label="Results"><div id="b-results"></div></aside></div>
<p class="disclaim">{TOOL_NOTE} See <a href="../../resources/governmental-457b/index.html">Governmental 457(b)</a>, <a href="../../resources/roth-ira/index.html">Roth IRA</a> and <a href="../../resources/treasuries/index.html">Treasury bills</a> for where bridge money can live.</p>
<script src="../../assets/calc/engine.js"></script><script src="../../assets/calc/bridge.js"></script>"""
write("tools/savings-bridge/index.html", "Savings Bridge | FiveOceans", 2, f'<section class="section">{bridge_body}</section>',
      page_hero('<a href="../../index.html">Home</a> / <a href="../index.html">Tools</a> / Savings Bridge', ic("piggy-bank"), "Savings Bridge",
                "Will your savings carry you from the day you stop working to the day your pension starts?"), "tools")
for sl, t, ic_, d in TOOLS:
    INDEX.append(dict(n=t, t="Tool", c="Tool", u=f"tools/{sl}/index.html", s=words(t + " " + d + " calculator mortgage rent")))
for m in MODE_LIST:
    INDEX.append(dict(n=m["label"] + " calculator", t=m["blurb"][:90], c="Tool", u=f'tools/real-estate/index.html#{m["id"]}', s=words(m["label"] + " " + m["blurb"] + " calculator")))

# ---------------- credit card tool ----------------
credit_body = f"""<div id="credit-app">
<div class="banner" id="cc-banner" hidden><span>A copy of your information is saved on this device.</span><button type="button" class="glass primary" id="cc-continue">Continue where I left off</button></div>
<div class="statusbar" aria-label="Where your data is"><span>Device: <b id="st-dev">empty</b></span><span>Packet: <b id="st-pkt">no file yet</b></span><span id="cc-msg" role="status" class="msg" style="margin-left:auto"></span></div>
<nav class="tabs" id="cc-tabs" role="tablist" aria-label="Credit Card Tool sections"></nav>
<section class="cc-panel" id="p-scores" role="tabpanel" aria-labelledby="tab-scores"></section>
<section class="cc-panel" id="p-cards" role="tabpanel" aria-labelledby="tab-cards" hidden></section>
<section class="cc-panel" id="p-strategy" role="tabpanel" aria-labelledby="tab-strategy" hidden></section>
<section class="cc-panel" id="p-packet" role="tabpanel" aria-labelledby="tab-packet" hidden></section></div>
<p class="disclaim">{TOOL_NOTE} Nothing you enter is uploaded; do not enter card numbers, Social Security numbers or passwords. Credit scoring models and lender rules change; these are educational estimates, and a bureau or lender decides your actual score and terms. Learn more: <a href="../resources/credit-scores/index.html">Credit scores</a> · <a href="../resources/good-vs-bad-debt/index.html">Good debt and bad debt</a>. The saved-packet idea follows <a href="https://github.com/Sukonik/payout-lab" rel="noopener">Payout Lab</a>.</p>
<script src="../assets/credit/engine.js"></script><script src="../assets/credit/app.js"></script>"""
shutil.copytree(root / "assets/credit", out / "assets/credit", dirs_exist_ok=True)
write("credit/index.html", "Credit Card Tool | FiveOceans", 1, f'<section class="section">{credit_body}</section>',
      page_hero('<a href="../index.html">Home</a> / Credit Card Tool', ic("wallet"), "Credit Card Tool",
                "Find and build your credit, keep your cards in a packet you own, and see how good and bad debt change your wealth."), "credit")
INDEX.append(dict(n="Dolphin Sonar", t="Tool", c="Tool", u="tools/real-estate/index.html#sonar", s=words("dolphin sonar listing link redfin zillow streeteasy paste import data extractor bookmarklet")))
INDEX.append(dict(n="Credit Card Tool", t="Tool", c="Tool", u="credit/index.html", s=words("credit card tool credit score three scores equifax experian transunion utilization debt payoff avalanche snowball good debt bad debt packet")))

(out / "search-index.json").write_text(json.dumps(INDEX, separators=(",", ":")), encoding="utf-8")
(out / ".nojekyll").write_text("")
print(f"built {len(list(out.rglob('index.html')))} pages, {total} animals")
