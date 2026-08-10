# Mochi Production Dashboard

A mobile-friendly web dashboard for managing mochi production, costs, and profit estimation.

## Features

- **Batch-based recipes** — define ingredients per batch with yield (e.g. 200g flour → 8 mochi)
- **Dual profit view** — with and without fixed asset depreciation (per unit & per batch)
- **Multi-product** — mochi (in-house), onigiri & rice crackers (imported)
- **Packaging** — individual wrapper or box of 4
- **Cost tracking** — ingredients, packaging, labor, utilities, marketing
- **Production & sales logs** — compare estimated vs actual revenue
- **Dual currency** — supplies in JPY or CAD, selling in CAD

## Live Demo

**https://tebusuk93-kaye.github.io/mochi/**

The app auto-deploys to GitHub Pages on every push to `main`.

If you see a blank page, go to repo **Settings → Pages** and set:
- **Source:** Deploy from a branch
- **Branch:** `gh-pages` / `/ (root)`

Then wait ~1 minute and refresh.

## Quick Start (local)

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Workflow

1. **Settings** — set JPY→CAD exchange rate
2. **Supplies** — add ingredients & packaging with package size and cost
3. **Assets** — add equipment/reusable packaging with expected lifetime units
4. **Recipes** — define mochi flavors and imported products
5. **Production** — log how many you made, with batch costs
6. **Sales** — record actual sales to compare against estimates
7. **Dashboard** — overview of profit and estimate vs reality

Data is stored locally in your browser (localStorage).

## Build

```bash
npm run build
npm run preview
```
