# Agent Radar

A directory of AI tools (coding agents, app builders, databases/backends, agent frameworks, LLM APIs, automation). Plain HTML/CSS/JS — no build step, no dependencies, mobile-friendly.

## Features
- Search by name, description, category or tag
- Category filter
- "Free tier only" filter (only tools with a verified free tier)

## Prompt Vault
`vault.html` — ~30 original, copy-ready prompts with search, category filter and a Copy button per prompt. Data lives in `data/prompts.json`: `id, title, category, description, prompt, tags, suggested_tools` (tool names match `data/tools.json`). Placeholders are written as `[LIKE_THIS]`. To contribute, add an entry to that file with a unique `id`.

## Run locally
```
python3 -m http.server 8000
# open http://localhost:8000
```
(`fetch` needs HTTP, so opening index.html via file:// won't load the data.)

## Data
`data/tools.json` — each entry: `id, name, url, category, description, pricing_summary, free_tier (true/false/null), pricing_url, tags, verified_on`.
- Pricing was read from each tool's official site on 2026-10-15. `free_tier: null` means it could not be verified. Pricing changes often; re-check before relying on it.
- Open-source licenses were taken from the projects' GitHub repos.

## Contributing
Add an entry to `data/tools.json` with a verified URL and pricing link. Never include unverified claims.

## Deploy
Canonical site: https://www.tryagentradar.com (apex 308-redirects to www). Any static host works: serve the repo root.

## SEO build
`node scripts/build.js` (no dependencies) regenerates `tools/<id>.html`, `category/<slug>.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, and the marked `<!--...:start/end-->` regions in `index.html` / `vault.html` (static tool list, JSON-LD, summary). Re-run and commit after editing `data/tools.json` or `data/prompts.json`.
