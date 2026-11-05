# FiveOceans site development plan for Cole

Design and delivery handoff · November 5, 2026  
Start here for the build. Use [FiveOcean.md](FiveOcean.md) for the approved 36 animals and their proposed retirement decisions. Open the [theme and control board](Blue-Glass-Theme-Board.pdf) beside this plan.

## The first release

A visitor in Long Beach types “457b,” opens Yeti Crab, compares leaving work at 45 with staying on reduced hours, sees the first month their cash falls short, and finds the official plan rules. A second visitor types “rent out a duplex,” opens Hermit Crab and sees what they would still pay for housing after vacancy, insurance and maintenance. These two journeys are the release tests for search, navigation, data, accessibility and visual design.

Nathan specified the two UI systems, their names, the GoldenSunLaw picker direction and eight shore-rock themes. The palettes, defaults, component ownership, budgets and PR sequence below are proposed implementation decisions. The plan assumes a static GitHub Pages project and US financial programs with New York examples. Public city guides can expand internationally as their local data is verified.

## Blue Glass UI architecture

**Blue Manta Ray UI** combines Mantine and Radix into one interaction system. **Sea Glass UI** supplies the visual treatment for selected controls. **Blue Glass UI** is the assembled FiveOceans interface. For the first release, keep all three in the site repository, with one React application, one token registry and one keyboard/focus owner per control.

| Part | Owner | Contract for Cole |
|---|---|---|
| App shell, grid, type, form fields, validation and comparison tables | Blue Manta Ray / Mantine Core and Form | Inputs retain native labels, unit descriptions and error relationships. Render real table headers, tabular numerals and stable column widths. Prefer native elements or existing Mantine controls. |
| Theme picker, modal search and mobile navigation drawer | Blue Manta Ray / Radix Dropdown Menu and Dialog | Use radio items for the eight themes and a dialog for each modal surface. One primitive controls open state, dismissal, overlay, keyboard handling and focus restoration. A single overlay controller prevents competing dialogs. |
| Glass action button, header search trigger, theme trigger, search frame | Sea Glass | Style the actual button/input or its noninteractive wrapper. A Radix trigger with asChild receives one ref-forwarding button. Decorative layers use pointer-events:none. Focus, validation, label and accessible name stay with the semantic control. |
| Results, currency, charts, city quotes, sources and primary comparisons | Blue Glass composition | Solid panel under the data. Buttons may have a frosted edge. Use text and symbols as well as color for shortfalls and surpluses. Charts expose the same values in a table. |
| Tokens, fonts, overlays and portals | Blue Glass provider | One root data-theme and matching light/dark color scheme. Synchronize Mantine's scheme and tokens before paint. Radix portals inherit root variables. Use a shared layer order for header, scrim, dialog and toast. |

Suggested build: React + TypeScript + Vite, scoped CSS and CSS custom properties. Pin compatible versions and commit the lockfile. Use Mantine's CSS once, followed by the project token and component layers. Add Radix packages only for the interactions assigned above. Build the two or three small glass treatments in scoped CSS first. Document any chosen upstream component, source revision, local edits and accompanying third-party notices before importing its code.

## Source-to-decision notes

| Reference inspected | Borrow | Boundary |
|---|---|---|
| [Mantine](https://github.com/mantinedev/mantine) | Core, responsive layout, theming and form management | Keep calculations in pure domain functions independent of React and form state. |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Radio menu behavior and dialog focus management | Use one primitive per interaction. Avoid nesting a Mantine modal or menu inside a Radix equivalent. |
| [GoldenSunLaw picker implementation](https://github.com/Sukonik/GoldenSunLaw/blob/main/js/main.js), [startup config](https://github.com/Sukonik/GoldenSunLaw/blob/main/js/site-config.js), [responsive CSS](https://github.com/Sukonik/GoldenSunLaw/blob/main/css/site.css) | Visible Change Theme trigger, swatches and labels, selected state, root theme attribute, persisted choice and focus return. CSS includes narrow-screen handling and reduced-motion treatment. | Port the pattern to React. Give FiveOceans its own storage key and eight-theme registry. The source theme list is a better implementation reference than the shorter palette description in the README. |
| [Glassy UI](https://github.com/alexburlis/glassyui) | Layered button edge, restrained highlight, tint and hover state | The registry copies source and dependencies; its documented quick start assumes React 19 and Tailwind 4. Review a single button in isolation before importing. |
| [Ein UI](https://github.com/einui/einui) | Inspect the liquid-glass treatment on Radix-based controls for hover, focus and selected states | Its registry uses React and Tailwind; its docs site uses Next.js. Reuse the interaction or visual idea without importing the docs application. |
| [Vue Web Liquid Glass](https://github.com/mkj0kjay/vue-web-liquid-glass) | Study its searchbox silhouette and shallow edge refraction | Its author calls the effects experimental and Chrome-specific. Keep the React search field and CSS baseline; reserve SVG distortion for an optional measured experiment. |

## Visual direction from Nathan’s references

**FluxEdit, IMG_2675.** The hero concentrates electric blue around one warm cantaloupe glow against a midnight field. A thin serif headline and small controls create the hierarchy. Borrow that composition for the editorial homepage: a single shore-horizon gradient at the edge of the hero, one optional display-serif headline, and two genuinely useful exits, “Build a plan” and “Explore places.”

**Pelmatech, IMG_2676.** The left-aligned headline stays readable while a soft cyan/pink image and a compact translucent panel supply depth. Borrow the alignment and panel scale on city pages. Put a short comparison summary on a tinted surface beside the city image. Move the summary below the image on a phone.

**Color plans, IMG_2677–2683.** The later boards pair deep blue with pink, forest with orange or yellow, and indigo with mint. Use these as accent relationships across the shore themes. Reserve pink, coral and orange highlights for editorial imagery or small details. Use fixed semantic roles for warning, loss, success and selection. The screenshots are supplied review references; ship original or licensed visuals.

**Type and rhythm.** Use Inter for controls and body, Inter Tight for section titles, and test a locally hosted editorial serif only on the homepage. Proposed defaults: 16–18px body, 1.5 line height, 65-character prose measure, 8px spacing rhythm, and 44px minimum touch targets. Keep the hero compact enough that the first planning action is visible on a phone. UI benefit estimates and source dates take precedence over decorative imagery.

## Eight shore-rock themes

Use these five hex tokens as the source palette. Page and Surface are opaque. Ink is primary text. Action is the button fill and link color on an opaque panel. Glow is decorative. White text on light-theme actions and Page-colored text on dark-theme actions are the proposed pairs. The [theme board](Blue-Glass-Theme-Board.pdf) shows the same fictional Hermit Crab result eight times.

| Theme | Mode | Page | Surface | Ink | Action | Glow | CTA text contrast |
|---|---|---|---|---|---|---|---:|
| Chalk | light | `#F4F7F8` | `#FFFFFF` | `#102D40` | `#00638A` | `#FF866B` | 6.7:1 |
| Limestone | light | `#F6F3E9` | `#FFFDF6` | `#22382E` | `#376449` | `#DAA744` | 6.8:1 |
| Pink Granite | light | `#FAF0EF` | `#FFFCFB` | `#352537` | `#83405D` | `#E68999` | 7.4:1 |
| Quartzite | light | `#ECF3FE` | `#FCFDFF` | `#192F52` | `#305498` | `#A4AFE6` | 7.4:1 |
| Basalt | dark | `#091624` | `#12273A` | `#F2F7FD` | `#7ECFF1` | `#FF906D` | 10.5:1 |
| Slate | dark | `#17222D` | `#21313E` | `#F1F5FA` | `#A9CAF1` | `#FF889D` | 9.5:1 |
| Obsidian | dark | `#110F1C` | `#211B31` | `#F5F2FF` | `#C2AEFF` | `#88E7C2` | 9.7:1 |
| Greenstone | dark | `#0B211D` | `#17342C` | `#ECF8EF` | `#88D8B6` | `#FFAD66` | 10.0:1 |

**Theme behavior.** On a first visit use Chalk for light preference and Basalt for dark. An explicit pick wins across visits. Read and validate the saved slug against the eight IDs before paint; handle denied storage and invalid values. Honor OS changes only until the user picks a theme. Theme choice may be persisted independently from scenario saving. No financial data belongs in the theme key.

**Picker.** Desktop header has a swatch, “Change theme” and chevron. In the open dropdown, group four named radio choices under Light and four under Dark. Each row has a swatch, readable name and a visible check for the selected rock. Support arrows, Home/End, typeahead, Enter/Space and Escape with return focus. On phones place the picker in the single navigation drawer. Use an inline radio group in the open drawer so the user navigates one focus region at a time. Applying a theme updates the active row and the page immediately without clearing form input.

**Glass recipe.** Start with an opaque tinted surface. Where supported, enhance the header search and secondary action buttons with an 86–94% tinted fill, a 1px inner highlight and up to 10px backdrop blur. Keep the input text region and floating results panel opaque. Use static hue and edge highlights instead of pointer-following filters. In forced colors use system colors, borders and native focus; in reduced motion disable decorative transitions; where reduced transparency is requested or blur is unavailable, serve the opaque baseline. The board’s contrast ratios apply to flat CTA samples. Verify rendered, composited controls against both light and dark imagery.

## Site map and navigation contract

| Destination | First useful action | Content and behavior |
|---|---|---|
| Home | Build a plan or Explore places | Show a single example that connects a place to a decision. A prominent search field accepts “pension,” “duplex” or an animal name. |
| Plans | Pick a life decision or filter the roster | Seawater: CoastalSea, CentralSea, DeepSea. Freshwater: Spring, Lake, River. Six animals per collection, 36 unique IDs. Each card pairs the animal with its financial task. |
| Animal detail | Start an available calculator or read the decision guide | Explain who it fits, one primary opportunity, relevant official source and the next action. Distinguish a guide-only entry from an interactive tool in the catalog. |
| Planner and Compare | Compare two routes using the same assumptions | Keep earnings, spending, eligibility, first pension, Social Security and insurance dates visible. Offer a plain-language result, monthly timeline, evidence labels and links. |
| Map and Cities | Locate a community or search the city directory | Offer the city list before loading a map. Start with Long Beach, NY. Estuary, lagoon and delta are local features. Expose neighborhood-level comparisons and editable quotes. |
| Sea, Spring, Lake and River | Browse by water body, then city | These destination pages link to applicable plans in any family. Expand the 150-seas catalog only as sourced destination entries are available. |
| Guides | Search by program, vehicle or question | Publish Guides, Insurance, Programs, Investments, Taxes and Real Estate. Each entry links back to relevant animals and carries the source owner and review date. |

Wide layout: Home, Plans, Map, Cities, Water Bodies and Guides, followed by Search and Change theme. Switch to the single mobile menu whenever labels and controls would overlap. Start testing near GoldenSunLaw’s 640px and 920px transitions; keep the actual collapse point content-driven. On a 320px screen prioritize brand, search and menu. The drawer contains destination links and the same eight theme choices. Avoid horizontal scrolling in controls, provide a stacked comparison view and keep the result summary reachable without traversing the entire input form.

## Search that understands the planning question

Use one compact, build-time search index of public content: animal names, subtitles, collection, synonyms, programs, resource labels, city and water-body names. Rank exact name/program first, followed by alias, title prefix, then description. Normalize punctuation so “457b” and “457(b)” match. Financial amounts and user-entered addresses stay outside the index. Load the dialog/index on demand; a normal Search page provides a shareable public-content path. The home field, header button and Ctrl/Cmd+K lead to the same search experience. Suppress the shortcut when it would interrupt normal text entry.

Show groups for Plans, Programs and Places, with a short explanation per result. Use a labeled text field and ordinary focusable result links in a dialog; Tab, Shift+Tab and Enter should work. Only implement arrow-key result selection if the corresponding combobox/listbox semantics and assistive-technology tests are delivered together. For zero results provide a clear-query button and a route to Guides.

| Query fixture | Required result |
|---|---|
| 457b | Governmental 457(b) explainer with Yeti Crab for withdrawals and Largemouth Bass for contributions |
| ERS | New York ERS explainer with Pink River Dolphin for comparing service paths |
| buy a duplex / rent out a unit | Hermit Crab and the Real Estate worked example |
| flood insurance | Insurance guide, Peacock Flounder or Red Cushion Sea Star |
| Long Beach | City entry, geographic qualifier and link to the same housing comparison |
| rhesus macaque | Rhesus Macaque Monkey under Spring |

## Content, calculations and release engineering

Keep separate records for animals, opportunities, sources, cities and water bodies. Link them by stable IDs; changing the display name of an opportunity should not break existing animal routes. Each source record carries owner, jurisdiction, URL and review date. Each city figure distinguishes Statement, Quote, Estimate and Unknown. Keep the retirement model in a framework-independent module. Model recurring cash, one-time costs and eligibility events by month. Provide tests for zero returns, unknown coverage, vacancy, part-time work with the same employer, negative cash flow and distinct pension/Social Security start dates.

Choose project-base-safe static URLs for GitHub Pages. Preferred option: generate real directory index files for catalog, guide and city detail URLs, then hydrate only interactive features. Use the configured project base for assets, internal links and search results. Test a direct reload of a nested city, plan and guide URL on a Pages-equivalent static server, including its 404. Document the deployment method, live version and rollback tag in the README. Store only fictional scenarios publicly; keep inputs in browser memory by default and require an explicit choice to save a scenario locally. Include a clear-local-data action when persistence ships.

## PR sequence for Cole

| PR / milestone | Deliverable | Merge evidence |
|---|---|---|
| 1 · Blue Glass foundation | Static Pages shell, provider, eight themes, picker, one search surface, one form and one opaque result card. | Theme survives reload, keyboard dismissal restores focus, no theme flash, 320px and wide layouts pass, and the same value is readable in all eight themes. Attach Chalk and Basalt captures. |
| 2 · Public catalog and search | Generate 36 animal routes, six collections, six guides, and the local search index. | CI checks exact roster and unique IDs, links, official-source fields and six query fixtures. Guide-only and working calculators have distinct calls to action. |
| 3 · First working retirement routes | Yeti Crab age-45 bridge and Pink River Dolphin ERS comparison using visitor-supplied official estimates. | $600 end-of-month for ten years at 3% real yields about $83,669. Reduced hours and separation produce distinct access prompts. Pension at 63 and Social Security at 67 expose the 48-month interval. |
| 4 · Housing and insurance | Hermit Crab rent-offset model, Long Beach pilot, quote sources, no-loan route and bad-year scenario. | On the handoff’s fixture, $3,300 carrying cost less $1,748 net rent leaves $1,552/month before tax. A no-rent month, delayed completion and higher flood costs materially change the result. |
| 5 · Atlas and comparison | City pages, list-based map alternative, water-body routes and a two-scenario comparison. | Same finances can compare two places; geography never determines program eligibility. Map code loads on request, a failed map still leaves a working city list. |
| 6 · Launch and expansion | Review source dates, test devices, publish version notes and confirm production Pages URL before announcement. | Recheck all deep links on Pages. Link each published version from README. Extend geographic coverage and calculators in reviewable batches. WhaleMap remains a later attributed link or separately agreed integration. |

**First ticket.** Open one foundation PR for Cole’s design review: a responsive header, theme picker, search trigger, Yeti Crab input and Hermit Crab result. Show each screen in Chalk and Basalt, plus a contact sheet of all eight. The handoff is a plan for that PR; the prototype and GitHub production site are separate deliverables.

## Acceptance checklist

- At 320, 390, 768, 1024 and 1440px, financial numbers, radios, labels and buttons remain fully visible. Check reflow at 200% zoom and 400% on a sufficiently wide viewport. Test Safari/iOS and Chrome/Android in addition to desktop.
- Test keyboard, VoiceOver or NVDA, target size, scroll locking, focus restoration, visible focus in dark/light, and readable validation messages. Aim for WCAG 2.2 AA. Check normal text at 4.5:1, large text and required control boundaries at 3:1 where applicable. Record actual rendered states including focus rings, portal surfaces and glass over imagery. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Proposed mobile budgets: first-route JS ≤180 KB gzip excluding the on-demand atlas; LCP ≤2.5s and CLS ≤0.1 on the agreed mobile test profile. Track interaction responsiveness with INP ≤200ms at the 75th percentile when enough field data exists; measure search opening, typing and theme switching in lab before launch. If a glass effect drops frames during scrolling on the test phone, ship the opaque treatment.
- Launch review includes sources, redirects, stale estimates, absence of personal data in URLs/logs, empty/invalid storage, offline visual fallback, search with zero results and full operation without backdrop-filter. Keep site version, measured budgets and tested browsers with the release notes.
