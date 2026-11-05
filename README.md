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

## 📚 Docs

Planning handoff in [`docs/handoff/`](docs/handoff/): 📝 [Start here](docs/handoff/COLE_HANDOFF.txt) · 🗺️ [FiveOcean](docs/handoff/FiveOcean.md) · 🧑‍🏫 [Guides](docs/handoff/Guides.md) · 🏛️ [Programs](docs/handoff/Programs.md) · 📈 [Investments](docs/handoff/Investments.md) · 🛡️ [Insurance](docs/handoff/Insurance.md) · 🧾 [Taxes](docs/handoff/Taxes.md) · 🏠 [RealEstate](docs/handoff/RealEstate.md)

## 🚀 GitHub Pages

`.github/workflows/pages.yml` builds `site/` with `scripts/build_site.py` and deploys on every push to `main`. One-time setup: **Settings → Pages → Source: GitHub Actions**.

```bash
python scripts/build_site.py   # then open site/index.html
```

## ⚠️ Disclaimer

Demo values are fictional. Not financial, tax, or legal advice.

## 📄 License

See [LICENSE](LICENSE).
