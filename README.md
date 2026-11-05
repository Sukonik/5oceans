<div align="center">

# 🌊 FiveOceans

**Where near the water would you like to live, and when can you afford to work less?**

[![Live site](https://img.shields.io/badge/🌐_live-sukonik.github.io/5oceans-0a6a8f?style=for-the-badge)](https://sukonik.github.io/5oceans/)
[![Deploy](https://img.shields.io/github/actions/workflow/status/Sukonik/5oceans/pages.yml?branch=main&label=pages%20deploy&style=for-the-badge)](https://github.com/Sukonik/5oceans/actions)
![Animals](https://img.shields.io/badge/🐠_animal_paths-36-ff866b?style=for-the-badge)
![Themes](https://img.shields.io/badge/🪨_themes-8-7ecff1?style=for-the-badge)

🧭 A retirement planner with planning tools, trusted resources, and a framework for retirement public-policy development.

</div>

---

## 🗺️ Contents

[🐠 How it works](#-how-it-works) · [🧂 Site map](#-site-map) · [🎨 The three UIs](#-the-three-uis) · [🪟 Sea Glass elements](#-sea-glass-elements) · [🪨 Themes](#-eight-shore-rock-themes) · [📱 Responsive & accessible](#-responsive--accessible) · [📚 Docs](#-docs) · [🚀 Build & deploy](#-build--deploy) · [🏷️ Versions](#️-versions) · [🧭 Roadmap](#-roadmap)

## 🐠 How it works

Six plan collections, 36 animal "paths". Each animal is a branded planning path with a plain-language task, a guide, and a direct official resource. An animal never decides financial eligibility.

| | Collection | Family |
|---|---|---|
| 🏖️ | CoastalSea | 🧂 Seawater |
| 🌊 | CentralSea | 🧂 Seawater |
| 🦑 | DeepSea | 🧂 Seawater |
| 💧 | Spring | 🚰 Freshwater |
| 🏞️ | Lake | 🚰 Freshwater |
| 🐊 | River | 🚰 Freshwater |

**Example paths:** 🦀 Yeti Crab (457(b) access) · 🐬 Pink River Dolphin (NY ERS pension estimates) · 🐚 Hermit Crab (rent offsets housing cost: $3,300 carrying cost, $1,748 net rent, $1,552 left a month, fictional).

## 📚 Resources

Two shelves behind the animal paths, each resource with its own page, an at-a-glance box, the rules that matter, mistakes to avoid and the official sources:

| 💰 Retirement & income (13) | 🏠 Property & housing (10) |
|---|---|
| Governmental 457(b) · 401(k) and 403(b) · Roth IRA · Traditional IRA | Primary home · Vacation or second home · Investment (rental) property |
| NY ERS · NY teachers' pensions (NYSTRS and NYC TRS) · FERS and TSP | Duplex or multi-unit home · Accessory dwelling unit (ADU) · Land and building |
| Social Security · Medicare and health coverage · HSA | Timeshare · Shared ownership · Renting |
| Treasury bills, I bonds and TIPS · Saver's Credit and Match · Solo 401(k) | Waterfront and flood insurance |

Content lives in [`content/resources/`](content/resources/) as one markdown file per resource, with front matter for title, group, icon, summary, related animals, glance facts and sources. Figures for 2026 (contribution limits, income phase-outs, HSA limits) come from IRS and agency pages checked on November 5, 2026; each page links its sources. The six reference guides from the handoff are rendered as on-site pages too, so no link on the live site sends a visitor to GitHub for content.

## 🧂 Site map

Seawater vs Freshwater, with a page for every water body:

| Page | Path |
|---|---|
| 🏠 Home | [`/`](https://sukonik.github.io/5oceans/) |
| 🧂 Seawater | [`/seawater/`](https://sukonik.github.io/5oceans/seawater/) |
| 🚰 Freshwater | [`/freshwater/`](https://sukonik.github.io/5oceans/freshwater/) |
| 🏖️ 🌊 🦑 | [`/coastalsea/`](https://sukonik.github.io/5oceans/coastalsea/) · [`/centralsea/`](https://sukonik.github.io/5oceans/centralsea/) · [`/deepsea/`](https://sukonik.github.io/5oceans/deepsea/) |
| 💧 🏞️ 🐊 | [`/spring/`](https://sukonik.github.io/5oceans/spring/) · [`/lake/`](https://sukonik.github.io/5oceans/lake/) · [`/river/`](https://sukonik.github.io/5oceans/river/) |

| 📚 Resources (23) | [`/resources/`](https://sukonik.github.io/5oceans/resources/), one page each, e.g. [`/resources/governmental-457b/`](https://sukonik.github.io/5oceans/resources/governmental-457b/) · [`/resources/timeshare/`](https://sukonik.github.io/5oceans/resources/timeshare/) |
| 📖 Guides (6) | [`/guides/`](https://sukonik.github.io/5oceans/guides/): decisions, programs, investments, insurance, taxes, real estate |
| 🐠 Animals (36) | `/animals/<name>/`, e.g. [`/animals/hermit-crab/`](https://sukonik.github.io/5oceans/animals/hermit-crab/) · [`/animals/yeti-crab/`](https://sukonik.github.io/5oceans/animals/yeti-crab/) |

Each animal page shows the task, a primary official-source button, the matching decision guide rendered from the handoff docs, the other animals in its water body, and previous/next links. Search (press `/`) finds animals by name, program or guide text: try `457b`, `ERS`, `duplex` or `flood insurance`.

## 🎨 The three UIs

Specified in the [Blue Glass development plan](docs/handoff/Blue-Glass-Development-Plan.md) and shown on the [theme board (PDF)](docs/handoff/Blue-Glass-Theme-Board.pdf).

| | UI | What it is | Built with |
|---|---|---|---|
| 🦈 | **Blue Manta Ray UI** | Interaction system: app shell, forms, validation, comparison tables, plus the theme menu, search dialog and mobile drawer | [Mantine](https://github.com/mantinedev/mantine) (layout, forms, tables) + [Radix Primitives](https://github.com/radix-ui/primitives) (menu, dialog, focus) |
| 🪟 | **Sea Glass UI** | Visual treatment: translucent buttons, search, tabs, stats and dock with a thin highlight and soft blur | Scoped CSS, informed by [Glassy UI](https://github.com/alexburlis/glassyui), [Ein UI](https://github.com/einui/einui), [Vue Web Liquid Glass](https://github.com/mkj0kjay/vue-web-liquid-glass); [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) may be used as needed |
| 💎 | **Blue Glass UI** | The two assembled: glass controls over solid, readable panels for dollar amounts, quotes and eligibility rules | React + TypeScript + Vite (planned) |

### ⭐ Key foundations

- 🧩 **[Mantine](https://github.com/mantinedev/mantine)** is the backbone of Blue Manta Ray UI: responsive layout, theming, form management and financial tables.
- 🧱 **[Radix Primitives](https://github.com/radix-ui/primitives)** supplies the accessible behavior: radio-group theme menu, search dialog and mobile drawer, including dismissal and focus restoration. Use one primitive per interaction and never nest a Mantine modal or menu inside a Radix one.
- 🌬️ **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** is approved for use where it helps, for example when importing Glassy UI or Ein UI components, which assume Tailwind 4. The current static demo uses plain CSS and needs no build step.

## 🪟 Sea Glass elements

What the live demo already ships, in plain CSS:

| Element | Where | Behavior |
|---|---|---|
| 🔘 **Glass pill buttons** | Hero, theme trigger | Frosted fill, inner highlight, light-sweep on hover; the primary button gets an accent glow |
| 🔎 **Glass search** | Header on every page | Pill field with a `/` key hint; press `/` or `Ctrl/Cmd+K` to focus; filters animal cards live |
| 📊 **Glass stat tiles** | Home hero | 36 animal paths · 6 water bodies · 8 themes |
| 🗂️ **Glass segmented tabs** | Water-body pages | Hop between all six water bodies; scrolls sideways on narrow screens |
| 🏷️ **Frosted link chips** | Animal cards | Guide and official-source links |
| 🧭 **Floating glass dock** | Phones (≤720px) | Bottom navigation: Home, Seawater, Fresh, with safe-area padding |
| 🎨 **Theme menu** | Header | Radio list with swatches, grouped Light and Dark |
| 🧊 **Solid result panel** | Home hero | Money stays on a solid surface, never on glass |

Glass is progressive: it falls back to opaque surfaces when `backdrop-filter`, reduced transparency or forced colors apply.

### 🔣 Icons

The site uses minimal 1.75px line icons from [Lucide](https://github.com/lucide-icons/lucide) (ISC license, copy in [`assets/icons/LICENSE-lucide.txt`](assets/icons/LICENSE-lucide.txt)). The 35 icons the site needs are vendored in [`assets/icons/`](assets/icons/) and built into an inline SVG sprite, so there's no icon font or runtime request. They inherit the theme color. To add one, copy its SVG from Lucide into that folder and reference it with `ic("name")` in `scripts/build_site.py`. Each water body and each of the 36 animals has an assigned icon (fish, bird, turtle, shell and so on, grouped by kind).

## 🪨 Eight shore-rock themes

| ☀️ Light | 🌙 Dark |
|---|---|
| **Chalk** (default) | **Basalt** (default) |
| Limestone | Slate |
| Pink Granite | Obsidian |
| Quartzite | Greenstone |

Each theme's palette comes from the plan (Page, Surface, Ink, Action, Glow). The hero's horizon glow is built from the active theme. The choice is saved in the browser only, under its own key and never mixed with financial data. First visits follow the OS light or dark preference, and there's no flash on load.

## 📱 Responsive & accessible

- 📐 Tested at 320, 390, 768, 1024 and 1440px: no horizontal scroll on any page
- 👆 44px minimum touch targets on controls
- ⌨️ Skip link, visible focus rings, Escape closes the theme menu and returns focus
- 🧊 Opaque fallbacks for blur, reduced transparency and forced colors
- 🐢 Honors reduced motion; hover light-sweeps are disabled
- 💵 Contrast pairs from the plan: CTA text 6.7:1 to 10.5:1

## 📚 Docs

Planning handoff in [`docs/handoff/`](docs/handoff/):

💎 [Blue Glass plan](docs/handoff/Blue-Glass-Development-Plan.md) · 🖼️ [Theme board](docs/handoff/Blue-Glass-Theme-Board.pdf) · 📝 [Start here](docs/handoff/COLE_HANDOFF.txt) · 🗺️ [FiveOcean](docs/handoff/FiveOcean.md) · 🧑‍🏫 [Guides](docs/handoff/Guides.md) · 🏛️ [Programs](docs/handoff/Programs.md) · 📈 [Investments](docs/handoff/Investments.md) · 🛡️ [Insurance](docs/handoff/Insurance.md) · 🧾 [Taxes](docs/handoff/Taxes.md) · 🏠 [RealEstate](docs/handoff/RealEstate.md)

### 🔗 Design sources

[Mantine](https://github.com/mantinedev/mantine) · [Radix Primitives](https://github.com/radix-ui/primitives) · [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) · [Lucide icons](https://github.com/lucide-icons/lucide) · [Glassy UI](https://github.com/alexburlis/glassyui) · [Ein UI](https://github.com/einui/einui) · [Vue Web Liquid Glass](https://github.com/mkj0kjay/vue-web-liquid-glass) · [GoldenSunLaw theme picker](https://github.com/Sukonik/GoldenSunLaw/blob/main/js/main.js) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Visual direction comes from Nathan's FluxEdit and Pelmatech reference screenshots; ship original or licensed imagery. Upstream code imported later needs its source revision and license notices documented.

## 🚀 Build & deploy

```bash
python scripts/build_site.py   # reads docs/handoff/FiveOcean.md, writes site/
```

- 🛠️ `scripts/build_site.py` generates 76 static pages and a search index and fails if the roster isn't exactly 36 animals.
- 🚀 `.github/workflows/pages.yml` deploys `site/` on every push to `main`.
- ⚙️ One-time setup: **Settings → Pages → Source: GitHub Actions**.

```text
docs/handoff/      planning handoff and Blue Glass plan
assets/icons/      vendored Lucide SVGs and license
content/resources/ one markdown file per resource page
scripts/           site generator
.github/workflows/ Pages deploy
site/              generated output (not committed)
```

## 🏷️ Versions

| Version | What shipped |
|---|---|
| v0.1 | Handoff docs, emoji README, Pages deploy |
| v0.2 | Eight themes, saved picker, Blue Glass docs |
| v0.3 | Seawater vs Freshwater framework, page per water body |
| v0.4 | Oceanic redesign: hero, glass controls, cleaner cards |
| v0.5 | Sea Glass elements (tabs, stats, dock, key hints), responsive UX pass, expanded README |
| v0.6 | 36 animal pages with guide content, site-wide search |
| v0.7 | Minimal line icons (Lucide) replace emoji across the site |
| v0.8 | Resources hub with 23 resource pages (retirement and property), six on-site guide pages, resource-aware search |

## 🧭 Roadmap

Per the plan, Cole's PRs: 1️⃣ Blue Glass foundation (React, Mantine, Radix) · 2️⃣ catalog and search · 3️⃣ Yeti Crab and Pink River Dolphin routes · 4️⃣ housing and insurance · 5️⃣ atlas and comparison · 6️⃣ launch. WhaleMap stays a later attributed link.

## ⚠️ Disclaimer

Demo values are fictional. Not financial, tax, or legal advice.

## 📄 License

See [LICENSE](LICENSE).
