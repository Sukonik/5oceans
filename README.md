# 🌊 FiveOceans

**Where near the water would you like to live, and when can you afford to work less?**

FiveOceans (Five Oceans) is a retirement planner that combines planning tools, trusted resources, and a framework for retirement public-policy development. 🧭

🔗 **Live demo:** https://sukonik.github.io/5oceans/

## 🐠 How it works

Six plan collections, 36 animal "paths", each tied to a real decision and an official source:

| | Collection | Type |
|---|---|---|
| 🏖️ | CoastalSea | 🧂 Seawater |
| 🌊 | CentralSea | 🧂 Seawater |
| 🦑 | DeepSea | 🧂 Seawater |
| 💧 | Spring | 🚰 Freshwater |
| 🏞️ | Lake | 🚰 Freshwater |
| 🐊 | River | 🚰 Freshwater |

Example paths: 🦀 Yeti Crab (457(b) access), 🐬 Pink River Dolphin (NY ERS pension estimates), 🐚 Hermit Crab (rental offsets housing cost).

## 🎨 The three UIs

FiveOceans' interface is built from three named layers, specified in the [Blue Glass development plan](docs/handoff/Blue-Glass-Development-Plan.md) and shown in the [theme board (PDF)](docs/handoff/Blue-Glass-Theme-Board.pdf).

| | UI | What it is | Built with |
|---|---|---|---|
| 🦈 | **Blue Manta Ray UI** | Interaction system: app shell, forms, validation, comparison tables, plus the theme menu, search dialog and mobile drawer | [Mantine](https://github.com/mantinedev/mantine) (layout, forms, tables) + [Radix Primitives](https://github.com/radix-ui/primitives) (menu, dialog, focus) |
| 🪟 | **Sea Glass UI** | Visual treatment: translucent buttons, header search and theme trigger with a thin highlight and soft blur | Scoped CSS, informed by [Glassy UI](https://github.com/alexburlis/glassyui), [Ein UI](https://github.com/einui/einui) and [Vue Web Liquid Glass](https://github.com/mkj0kjay/vue-web-liquid-glass) |
| 💎 | **Blue Glass UI** | The two assembled: glass controls over solid, readable panels for dollar amounts, quotes and eligibility rules | React + TypeScript + Vite (planned) |

### ⭐ Key foundations

- 🧩 **[Mantine](https://github.com/mantinedev/mantine)** is the backbone of Blue Manta Ray UI: responsive layout, theming, form management and financial tables.
- 🧱 **[Radix Primitives](https://github.com/radix-ui/primitives)** supplies the accessible behavior: radio-group theme menu, search dialog and mobile drawer, including dismissal and focus restoration. Use one primitive per interaction and never nest a Mantine modal or menu inside a Radix one.

### 🪨 Eight shore-rock themes

| ☀️ Light | 🌙 Dark |
|---|---|
| **Chalk** (default) | **Basalt** (default) |
| Limestone | Slate |
| Pink Granite | Obsidian |
| Quartzite | Greenstone |

The live demo already includes all eight, with a "Change theme" picker. The choice is saved in the browser only, under its own key and never mixed with financial data. First visits follow the OS light or dark preference.

### 📱 Responsive and accessible by design

- 📐 Checked for no horizontal scroll at 320px, 390px and 1440px; mobile search drops to its own row
- 👆 44px minimum touch targets and visible focus rings
- ⌨️ Escape closes the picker and returns focus to its trigger
- 🧊 Falls back to opaque surfaces when blur, reduced transparency or forced colors apply
- 🐢 Honors reduced motion
- 💵 Money always sits on solid surfaces, never on glass

### 🔗 Design sources

[Mantine](https://github.com/mantinedev/mantine) · [Radix Primitives](https://github.com/radix-ui/primitives) · [Glassy UI](https://github.com/alexburlis/glassyui) · [Ein UI](https://github.com/einui/einui) · [Vue Web Liquid Glass](https://github.com/mkj0kjay/vue-web-liquid-glass) · [GoldenSunLaw theme picker](https://github.com/Sukonik/GoldenSunLaw/blob/main/js/main.js) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Visual direction comes from Nathan's FluxEdit and Pelmatech reference screenshots; ship original or licensed imagery. Upstream code imported later must have its source revision and license notices documented.

## 📚 Docs

Planning handoff in [`docs/handoff/`](docs/handoff/): 💎 [Blue Glass plan](docs/handoff/Blue-Glass-Development-Plan.md) · 🖼️ [Theme board](docs/handoff/Blue-Glass-Theme-Board.pdf) · 📝 [Start here](docs/handoff/COLE_HANDOFF.txt) · 🗺️ [FiveOcean](docs/handoff/FiveOcean.md) · 🧑‍🏫 [Guides](docs/handoff/Guides.md) · 🏛️ [Programs](docs/handoff/Programs.md) · 📈 [Investments](docs/handoff/Investments.md) · 🛡️ [Insurance](docs/handoff/Insurance.md) · 🧾 [Taxes](docs/handoff/Taxes.md) · 🏠 [RealEstate](docs/handoff/RealEstate.md)

## 🚀 GitHub Pages

`.github/workflows/pages.yml` builds `site/` with `scripts/build_site.py` and deploys on every push to `main`. One-time setup: **Settings → Pages → Source: GitHub Actions**.

```bash
python scripts/build_site.py   # then open site/index.html
```

## ⚠️ Disclaimer

Demo values are fictional. Not financial, tax, or legal advice.

## 📄 License

See [LICENSE](LICENSE).
