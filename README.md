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

| 💰 Retirement & income (13) · 💳 Credit & debt (5) | 🏠 Property & housing (10) |
|---|---|
| Governmental 457(b) · 401(k) and 403(b) · Roth IRA · Traditional IRA | Primary home · Vacation or second home · Investment (rental) property |
| NY ERS · NY teachers' pensions (NYSTRS and NYC TRS) · FERS and TSP | Duplex or multi-unit home · Accessory dwelling unit (ADU) · Land and building |
| Social Security · Medicare and health coverage · HSA | Timeshare · Shared ownership · Renting |
| Treasury bills, I bonds and TIPS · Saver's Credit and Match · Solo 401(k) | Waterfront and flood insurance |

### 🏷️ Animal tags

Every animal carries tags that link straight to its resource pages, for example 🐚 Hermit Crab: *Primary home (with rental) · Duplex · ADU · Investment property · Flood insurance*, and 🐒 Spider Monkey: *457(b) · ERS · Medicare · HSA*. Tags show on animal cards and animal pages, and tag names are searchable (try `primary home` or `457b ers`). Each resource page lists the animals that use it. Tags come from one editable file, [`content/animal-tags.txt`](content/animal-tags.txt): `slug: resource, resource=Custom label, ...`.

Content lives in [`content/resources/`](content/resources/) as one markdown file per resource, with front matter for title, group, icon, summary, related animals, glance facts and sources. Figures for 2026 (contribution limits, income phase-outs, HSA limits) come from IRS and agency pages checked on November 5, 2026; each page links its sources. The six reference guides from the handoff are rendered as on-site pages too, so no link on the live site sends a visitor to GitHub for content.

## 🧮 Tools

Every tool runs in your browser, saves nothing unless you press a button, and has a build-out roadmap in GitHub Issues. Start at the tracker: **[#11 Tools roadmap](https://github.com/Sukonik/5oceans/issues/11)**.

| Tool | Page | What it does | Roadmap |
|---|---|---|---|
| 🏠 **Real Estate Calculator** | [`/tools/real-estate/`](https://sukonik.github.io/5oceans/tools/real-estate/) | 14 calculators: **Home** · **Home with a rental** · **Condo** · **Co-op** · **House hacker** · **Vacation home** (IRS 14-day test) · **Land and build** · **Investment property** · **Pure rental income** · **House flipper** · **Renter + business + investments** · **Influencer house** · **Hacker house** · **Music producer mansion**. Stress tests, vacancy-and-rate grid, saved scenarios, compare, export and import. | [#12](https://github.com/Sukonik/5oceans/issues/12) |
| 🐬 **Dolphin Sonar** | top of the Real Estate Calculator | Fills the calculator from a listing link plus the listing text. See below. | [#15](https://github.com/Sukonik/5oceans/issues/15) · [licensed data #16](https://github.com/Sukonik/5oceans/issues/16) · [open data #17](https://github.com/Sukonik/5oceans/issues/17) |
| 🏦 **Savings Bridge** | [`/tools/savings-bridge/`](https://sukonik.github.io/5oceans/tools/savings-bridge/) | Monthly deposits to a balance at the day you stop working, the monthly draw it supports, and the deposit that closes a gap before a pension starts. | [#13](https://github.com/Sukonik/5oceans/issues/13) |
| 💳 **Credit Card Tool** | [`/credit/`](https://sukonik.github.io/5oceans/credit/) | Your three scores, cards, good-vs-bad debt strategy and a private packet. See below. | [#14](https://github.com/Sukonik/5oceans/issues/14) |
| 🏡 **Funding the house** | planned (v0.13) | Mortgages, grants and assistance programs tied into the calculator. | [#18](https://github.com/Sukonik/5oceans/issues/18) |

**Tools menu.** Every tool is reachable from the **Tools** item in the main navigation: a themed bubble dropdown (desktop: opens on hover or click, pins on click, closes on Esc or an outside click; arrow keys, Home and End move through it) that becomes a bubble above the bottom dock on phones. Add a tool by adding a row to `TOOLS_MENU` in `scripts/build_site.py`. The idea follows [responsive-dropdown-menu-2](https://github.com/bedimcode/responsive-dropdown-menu-2) (MIT); the code is original and keyboard accessible.

The calculator and bridge engine is pure JavaScript in [`assets/calc/engine.js`](assets/calc/engine.js), tested by [`tests/calc.test.mjs`](tests/calc.test.mjs) against the handbook fixtures ($1,552 owner cost, $29,040 bad year, $83,669 savings balance, $181,847 needed). CI runs every test before each deploy.

Formulas are standard and written for this site. Ideas came from [Rental Property Deal Analyzer](https://github.com/berkcankapusuzoglu/Rental-Property-Deal-Analyzer) (MIT), [DealFlowPro MCP server](https://github.com/jbechtel-97/dealflowpro-mcp-server) (MIT), [RealEstateInvestmentCal](https://github.com/moonnstarr/RealEstateInvestmentCal), [real-estate-calculations](https://github.com/biegehydra/real-estate-calculations) (AGPL, so no code was copied) and the saved-scenario and stress-test approach of [Payout Lab](https://github.com/Sukonik/payout-lab).

### 🐬 Dolphin Sonar: listing link data extractor

Ping a listing and the calculator fills itself. Five ways in:

1. **Link:** paste a Redfin, Zillow or StreetEasy link. The address, city, state, ZIP, unit and listing ID are read from the link.
2. **Text:** paste the listing page text. Price, beds, baths, square feet, year built, HOA, common charges, co-op maintenance, property tax, rent estimate, units and property type are detected in your browser. Sonar suggests a calculator (house, condo, co-op, multi-family, land) and fills the numbers it found.
3. **Bookmarklet** (desktop): drag it to your bookmarks bar; on a listing page you have open, click it. It sends the visible facts to the calculator once, in the address bar, then clears them.
4. **GitHub issue:** open a **Dolphin Sonar ping** issue ([form](https://github.com/Sukonik/5oceans/issues/new?template=sonar-listing.yml)), paste the link and text, and the Dolphin Sonar action replies with the detected facts and a calculator link. The issue body is treated as data only.

5. **Polite link reader** (CLI and issue bot): `node scripts/sonar_fetch.mjs <url>` reads one link and runs it through Sonar. It is built to be a good web citizen: it **obeys robots.txt**, identifies itself (`FiveOceansSonar/1.0`), reads one URL at a time with a pause between requests, refuses private network addresses, and **stops at the first refusal** (HTTP 401, 403, 429, 503 or a bot check) without trying to get around it. It **refuses listing portals** whose terms generally forbid automated access (Zillow, Redfin, StreetEasy, Realtor.com, Trulia, Homes.com, Apartments.com, LoopNet, Compass, Craigslist, OneKey MLS and similar). So it works on pages that allow it, such as an agent's own site, a county page, or the [fictional sample listing](https://sukonik.github.io/5oceans/tools/real-estate/sample-listing/). The issue bot uses it automatically when you give a link without text.

**Tools we looked at.** [Scrapling](https://github.com/D4Vinci/Scrapling) advertises getting past anti-bot protections; we do not use that on any site that is trying to keep bots out. [AutoScraper](https://github.com/alirezamika/autoscraper) and [mlscraper](https://github.com/lorey/mlscraper) learn extraction rules from examples and are good candidates for pages that allow reading ([#15](https://github.com/Sukonik/5oceans/issues/15)). [Galer](https://github.com/dwisiswant0/galer) extracts URLs through Chrome and is not needed here.

**Why the big portals are not scraped.** A browser cannot fetch those pages from another site, and Redfin, Zillow and StreetEasy block automated reads; their terms are reported to forbid scraping, and Zillow has acted against scrapers. MLS data is licensed too: OneKey MLS (New York) delivers data through MLS Grid to brokers and registered vendors, and IDX is a display permission, not a general license. So Sonar reads only what you give it. Real listing feeds (a licensed OneKey partnership, or your own API key) and open public data (flood zone, HUD rents, tax lots) are planned in [#16](https://github.com/Sukonik/5oceans/issues/16) and [#17](https://github.com/Sukonik/5oceans/issues/17). Engine: [`assets/calc/sonar.js`](assets/calc/sonar.js); tests: [`tests/sonar.test.mjs`](tests/sonar.test.mjs) and [`tests/sonar_issue.test.mjs`](tests/sonar_issue.test.mjs).

## 💳 Credit Card Tool

Roadmap: [#14](https://github.com/Sukonik/5oceans/issues/14). A top-level tab, [`/credit/`](https://sukonik.github.io/5oceans/credit/), for finding and building credit and using debt well. It works like [Payout Lab](https://github.com/Sukonik/payout-lab): **your information is a small file you own**. There are no accounts and no servers.

| Tab | What it does |
|---|---|
| **Scores** | Record your three scores (Equifax, Experian, TransUnion) with the model and date; see lowest, middle, highest and spread; an FHA mortgage check from HUD's current tiers; history; next steps. **Paste and detect** reads scores out of an issuer email or dashboard text, in your browser, for you to confirm. A guide to the free routes: weekly reports at AnnualCreditReport.com, free issuer scores, free freezes. |
| **Cards** | A private ledger of limits, balances, APR, statement and due days, fees and rewards. Overall and per-card utilization, how much to pay before each statement closes to reach a target utilization, due dates soonest first, interest if you carry a balance. |
| **Debt strategy** | Classifies each debt as bad (costs more than your expected return), good (cheap and tied to an asset or income) or a judgment call, then compares three ways to use the same monthly money over your chosen years: **pay debt first**, **invest first**, or a **smart split**. Shows net worth, interest paid and debt-free date. |
| **Packet** | Save a packet file (`.json`, plain text, **not encrypted**), save a copy to this device, open a packet on any device. Nothing is saved unless you press a button. |

**Why it cannot pull your three scores automatically.** Bureaus release scores only to you or to a lender you authorize, through a contracted reseller and a server. A static, private site cannot do that legitimately, and the file should not pass through a stranger's server. The tool instead makes the free routes easy and keeps the data on your device. A future bureau integration would need a licensed vendor, explicit consent and a backend, and would be a separate decision.

The credit engine is [`assets/credit/engine.js`](assets/credit/engine.js), tested by [`tests/credit.test.mjs`](tests/credit.test.mjs) (FICO bands, FHA tiers, three-score summary, utilization, strategy cases, packet validation). Five new resource pages cover **Credit scores**, **Credit reports, disputes and freezes**, **Credit cards and utilization**, **Good debt and bad debt** and **Paying off debt**.

## 🧂 Site map

Seawater vs Freshwater, with a page for every water body:

| Page | Path |
|---|---|
| 🏠 Home | [`/`](https://sukonik.github.io/5oceans/) |
| 🧂 Seawater | [`/seawater/`](https://sukonik.github.io/5oceans/seawater/) |
| 🚰 Freshwater | [`/freshwater/`](https://sukonik.github.io/5oceans/freshwater/) |
| 🏖️ 🌊 🦑 | [`/coastalsea/`](https://sukonik.github.io/5oceans/coastalsea/) · [`/centralsea/`](https://sukonik.github.io/5oceans/centralsea/) · [`/deepsea/`](https://sukonik.github.io/5oceans/deepsea/) |
| 💧 🏞️ 🐊 | [`/spring/`](https://sukonik.github.io/5oceans/spring/) · [`/lake/`](https://sukonik.github.io/5oceans/lake/) · [`/river/`](https://sukonik.github.io/5oceans/river/) |

| 💳 Credit Card Tool | [`/credit/`](https://sukonik.github.io/5oceans/credit/) |
| 🧮 Tools (3 pages) + 🐬 Dolphin Sonar | [`/tools/`](https://sukonik.github.io/5oceans/tools/), [`/tools/real-estate/`](https://sukonik.github.io/5oceans/tools/real-estate/), [`/tools/savings-bridge/`](https://sukonik.github.io/5oceans/tools/savings-bridge/) |
| 📚 Resources (28) | [`/resources/`](https://sukonik.github.io/5oceans/resources/), one page each, e.g. [`/resources/governmental-457b/`](https://sukonik.github.io/5oceans/resources/governmental-457b/) · [`/resources/timeshare/`](https://sukonik.github.io/5oceans/resources/timeshare/) |
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

- 🛠️ `scripts/build_site.py` generates 85 static pages and a search index and fails if the roster isn't exactly 36 animals.
- 🚀 `.github/workflows/pages.yml` deploys `site/` on every push to `main`.
- ⚙️ One-time setup: **Settings → Pages → Source: GitHub Actions**.

```text
docs/handoff/      planning handoff and Blue Glass plan
assets/icons/      vendored Lucide SVGs and license
assets/calc/       calculator engine and UI scripts
tests/             calculator, credit, Sonar and link-reader tests (node tests/*.test.mjs)
scripts/           site builder, Sonar issue bot and polite link reader
.github/ISSUE_TEMPLATE/  Dolphin Sonar ping issue form
assets/credit/     credit tool engine and UI scripts
content/resources/ one markdown file per resource page
content/animal-tags.txt  which resources each animal is tagged with
scripts/           site generator
.github/workflows/ Pages deploy and Dolphin Sonar issue reply
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
| v0.9 | Resource tags on every animal card and page, searchable, driven by `content/animal-tags.txt` |
| v0.10 | Tools menu, 14-mode Real Estate Calculator, Savings Bridge, saved scenarios, text/table/button responsive pass |
| v0.11 | Credit Card Tool (scores, cards, debt strategy, packet), five credit and debt resource pages, nav and dock refresh |
| v0.12 | Dolphin Sonar listing link data extractor (paste, bookmarklet, GitHub issue action), tool roadmaps in Issues |
| v0.13 | Dolphin Sonar polite link reader (robots.txt, portal refusal, SSRF guard), fictional sample listing |
| v0.14 | Tools menu: themed bubble dropdown on desktop, bubble above the dock on phones |

## 🧭 Roadmap

Per the plan, Cole's PRs: 1️⃣ Blue Glass foundation (React, Mantine, Radix) · 2️⃣ catalog and search · 3️⃣ Yeti Crab and Pink River Dolphin routes · 4️⃣ housing and insurance · 5️⃣ atlas and comparison · 6️⃣ launch. WhaleMap stays a later attributed link.

## ⚠️ Disclaimer

Demo values are fictional. Not financial, tax, or legal advice.

## 📄 License

See [LICENSE](LICENSE).
