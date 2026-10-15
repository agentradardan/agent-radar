# Agent Radar

A directory of AI tools (coding agents, app builders, databases/backends, agent frameworks, LLM APIs, automation). Plain HTML/CSS/JS — no build step, no dependencies, mobile-friendly.

## Features
- Search by name, description, category or tag
- Category filter
- "Free tier only" filter (only tools with a verified free tier)

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
Not deployed yet. Any static host works (GitHub Pages, Vercel, Netlify): serve the repo root.
