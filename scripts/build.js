#!/usr/bin/env node
// Static generator: node scripts/build.js
// Reads data/tools.json + data/prompts.json; writes tools/*.html, category/*.html,
// sitemap.xml, robots.txt, llms.txt, and updates marked regions in index.html / vault.html.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.tryagentradar.com'; // canonical host (apex 308-redirects here)
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tools.json'), 'utf8'));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/prompts.json'), 'utf8'));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slugify = s => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const write = (rel, txt) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const cats = [...new Set(tools.map(t => t.category))].sort();
const byCat = c => tools.filter(t => t.category === c);
const toolUrl = t => `${SITE}/tools/${t.id}.html`;
const catUrl = c => `${SITE}/category/${slugify(c)}.html`;
const freeTxt = t => t.free_tier === true ? 'Free tier available' : t.free_tier === false ? 'No free tier found' : 'Free tier unverified';
const freeBadge = t => t.free_tier === true ? ['b-yes', 'Free tier'] : t.free_tier === false ? ['b-no', 'No free tier found'] : ['b-unk', 'Free tier unverified'];
const trunc = (s, n) => s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
const maxDate = tools.map(t => t.verified_on).sort().pop();

// ---- featured / sponsored + affiliate support (optional fields in data/tools.json)
//   "featured": { "until": "YYYY-MM-DD" }  -> sponsored until that date (inclusive)
//   "affiliateUrl": "https://..."           -> used for Visit links, rel="sponsored noopener"
// Featured status is evaluated here at build time AND client-side (app.js / featured.js),
// so an expired listing loses its badge even before the next rebuild.
const TODAY = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD
const PAGES_UPDATED = '2026-10-19'; // lastmod for advertise/disclosure pages
const CONTACT = 'agentradar.dan@gmail.com';
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
for (const t of tools) {
  if (t.featured != null && !(t.featured && isDate(t.featured.until))) throw new Error(`${t.id}: featured must be {"until": "YYYY-MM-DD"}`);
  if (t.affiliateUrl != null && !/^https:\/\/[^\s"<>]+$/.test(t.affiliateUrl)) throw new Error(`${t.id}: affiliateUrl must be an https:// URL`);
}
const isFeatured = t => !!(t.featured && t.featured.until >= TODAY);
const visitUrl = t => t.affiliateUrl || t.url;
const visitRel = t => (t.affiliateUrl || isFeatured(t)) ? 'sponsored noopener' : 'noopener';
const catOrder = [...new Set(tools.map(t => t.category))];
// keep category grouping / original order, but float active featured tools to the top of their category
const sortFeat = list => list.map((t, i) => [t, i]).sort((a, b) => catOrder.indexOf(a[0].category) - catOrder.indexOf(b[0].category) || isFeatured(b[0]) - isFeatured(a[0]) || a[1] - b[1]).map(x => x[0]);
const spBadge = '<span class="badge b-sp" title="Paid placement">Sponsored</span> ';
const featured = tools.filter(isFeatured);
const nAff = tools.filter(t => t.affiliateUrl).length;

const navA = (href, key, label, active) => `<a href="${href}"${active === key ? ' class="active" aria-current="page"' : ''}>${label}</a>`;
const nav = active => `<nav>${navA('/index.html', 'tools', 'Tools directory', active)}${navA('/vault.html', 'vault', 'Prompt Vault', active)}${navA('/advertise.html', 'advertise', 'Advertise', active)}</nav>`;
const head = ({ title, desc, path: p, type = 'website', extra = '' }) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${p}">
<meta property="og:site_name" content="Agent Radar"><meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${SITE}${p}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
${extra}<link rel="stylesheet" href="/style.css">
</head><body>
`;
const header = (active, sub) => `<header><h1><a href="/index.html" class="brand">📡 Agent Radar</a></h1>${nav(active)}<p>${sub}</p></header>\n`;
// shared footer links + disclosure (also injected into index.html / vault.html via <!--footer--> markers)
const footInner = `<a href="/index.html">Tools directory</a> · <a href="/vault.html">Prompt Vault</a> · <a href="/advertise.html">Advertise</a> · <a href="/disclosure.html">Disclosure</a> · <a href="/data/tools.json">tools.json</a> · <a href="/llms.txt">llms.txt</a><p class="disc">Some links are affiliate links; we may earn a commission at no cost to you. Sponsored listings are labeled. <a href="/disclosure.html">Learn more</a>.</p>`;
const footer = `<footer>Pricing changes often — always confirm on the tool's official pricing page. ${footInner}</footer>\n<script src="/featured.js"></script>\n</body></html>\n`;
const crumbs = items => ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: it[1] })) });
const crumbNav = items => `<nav class="crumbs" aria-label="Breadcrumb">${items.map((it, i) => i < items.length - 1 ? `<a href="${it[1].replace(SITE, '')}">${esc(it[0])}</a>` : `<span aria-current="page">${esc(it[0])}</span>`).join(' › ')}</nav>`;

const card = (t, i) => { const b = freeBadge(t), f = isFeatured(t); return `<article class="card${f ? ' featured' : ''}"${f ? ` data-until="${esc(t.featured.until)}"` : ''}${typeof i === 'number' ? ` data-i="${i}"` : ''}><span class="cat">${esc(t.category)}</span>
  <h2><a href="/tools/${esc(t.id)}.html">${esc(t.name)}</a></h2>
  <div>${f ? spBadge : ''}<span class="badge ${b[0]}">${b[1]}</span></div>
  <p>${esc(t.description)}</p><p class="price">${esc(t.pricing_summary)}</p>
  <div class="tags">${t.tags.map(x => `<span>${esc(x)}</span>`).join('')}</div>
  <a class="pl" href="${esc(visitUrl(t))}" target="_blank" rel="${visitRel(t)}">Official site ↗</a> <a class="pl" href="${esc(t.pricing_url)}" target="_blank" rel="noopener">Official pricing ↗</a></article>`; };

// ---- tool pages
function related(t) {
  const score = o => (o.category === t.category ? 10 : 0) + o.tags.filter(x => t.tags.includes(x)).length;
  return tools.filter(o => o.id !== t.id).map(o => [score(o), o]).filter(x => x[0] > 0)
    .sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name)).slice(0, 5).map(x => x[1]);
}
for (const t of tools) {
  const p = `/tools/${t.id}.html`;
  const title = `${t.name} pricing & free tier – ${t.category} | Agent Radar`;
  const desc = trunc(`${t.name}: ${t.description} ${freeTxt(t)}. ${t.pricing_summary}`, 200);
  const rel = related(t);
  const bc = [['Agent Radar', SITE + '/index.html'], [t.category, catUrl(t.category)], [t.name, toolUrl(t)]];
  const sw = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, description: t.description, url: t.url, applicationCategory: t.category, keywords: t.tags.join(', '), mainEntityOfPage: toolUrl(t), dateModified: t.verified_on };
  const b = freeBadge(t), f = isFeatured(t);
  const html = head({ title, desc: desc, path: p, type: 'article', extra: ld(sw) + '\n' + crumbs(bc) + '\n' }) +
    header('tools', 'Pricing details checked on official sites.') + `<main class="page">
${crumbNav(bc)}
<article class="detail${f ? ' featured' : ''}"${f ? ` data-until="${esc(t.featured.until)}"` : ''}>
<span class="cat"><a href="/category/${slugify(t.category)}.html">${esc(t.category)}</a></span>
<h1 class="tool-h">${esc(t.name)}</h1>
<div>${f ? spBadge : ''}<span class="badge ${b[0]}">${b[1]}</span></div>
<p class="lead">${esc(t.description)}</p>
<p class="visit"><a class="btn" href="${esc(visitUrl(t))}" target="_blank" rel="${visitRel(t)}">Visit ${esc(t.name)} ↗</a></p>
${t.affiliateUrl ? `<p class="note aff">Affiliate link: if you sign up through this button we may earn a commission, at no cost to you. It doesn't affect the pricing info shown here. <a href="/disclosure.html">Disclosure</a></p>\n` : ''}${f ? `<p class="note sp-note">Sponsored listing: ${esc(t.name)} paid for a featured placement. Pricing and free-tier details are not affected. <a href="/disclosure.html">Disclosure</a></p>\n` : ''}<dl class="facts">
<dt>Category</dt><dd><a href="/category/${slugify(t.category)}.html">${esc(t.category)}</a></dd>
<dt>Pricing</dt><dd>${esc(t.pricing_summary)}</dd>
<dt>Free tier</dt><dd>${esc(freeTxt(t))}</dd>
<dt>Official website</dt><dd><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url)}</a></dd>
<dt>Official pricing page</dt><dd><a href="${esc(t.pricing_url)}" target="_blank" rel="noopener">${esc(t.pricing_url)}</a></dd>
<dt>Tags</dt><dd class="tags">${t.tags.map(x => `<span>${esc(x)}</span>`).join('')}</dd>
<dt>Last checked</dt><dd><time datetime="${esc(t.verified_on)}">${esc(t.verified_on)}</time></dd>
</dl>
<p class="note">Pricing changes often — confirm on the <a href="${esc(t.pricing_url)}" target="_blank" rel="noopener">official pricing page</a>.</p>
</article>
<section><h2>Related tools</h2><ul class="links">${rel.map(o => `<li><a href="/tools/${o.id}.html">${esc(o.name)}</a> — ${esc(o.category)}</li>`).join('')}</ul>
<p><a href="/category/${slugify(t.category)}.html">All ${esc(t.category)} tools</a> · <a href="/index.html">Full directory</a></p></section>
</main>
` + footer;
  write(p.slice(1), html);
}

// ---- category pages
for (const c of cats) {
  const orig = byCat(c), list = sortFeat(orig), p = `/category/${slugify(c)}.html`;
  const nFree = list.filter(t => t.free_tier === true).length;
  const title = `${c} – ${list.length} AI tools with pricing | Agent Radar`;
  const desc = trunc(`${list.length} ${c} tools with pricing and free-tier details: ${list.map(t => t.name).join(', ')}.`, 300);
  const bc = [['Agent Radar', SITE + '/index.html'], [c, catUrl(c)]];
  const il = { '@context': 'https://schema.org', '@type': 'ItemList', name: `${c} tools`, numberOfItems: list.length, itemListElement: list.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: toolUrl(t), name: t.name })) };
  const cp = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${c} – Agent Radar`, url: SITE + p, description: desc, mainEntity: il };
  write(p.slice(1), head({ title, desc, path: p, extra: ld(cp) + '\n' + crumbs(bc) + '\n' }) +
    header('tools', 'Pricing details checked on official sites.') + `<main>
${crumbNav(bc)}
<h1 class="tool-h">${esc(c)}</h1>
<p class="lead">${list.length} tools in this category; ${nFree} with a verified free tier. Data last checked ${esc(maxDate)}.</p>
<div class="grid" data-featsort>
${list.map(t => card(t, orig.indexOf(t))).join('\n')}
</div>
<p class="note">Other categories: ${cats.filter(x => x !== c).map(x => `<a href="/category/${slugify(x)}.html">${esc(x)}</a>`).join(' · ')}</p>
</main>
` + footer);
}

// ---- marked region helper for index/vault
function inject(file, name, content) {
  const f = path.join(ROOT, file); let s = fs.readFileSync(f, 'utf8');
  const re = new RegExp(`<!--${name}:start-->[\\s\\S]*?<!--${name}:end-->`);
  if (!re.test(s)) throw new Error(`${file} missing marker ${name}`);
  fs.writeFileSync(f, s.replace(re, () => `<!--${name}:start-->${content}<!--${name}:end-->`));
}
inject('index.html', 'grid', '\n' + sortFeat(tools).map(t => card(t)).join('\n') + '\n');
// homepage "Featured" strip (app.js re-renders it client-side from tools.json)
const featPlaceholder = `<a class="fcard fph" href="/advertise.html"><strong>Get your tool featured</strong><span>Top of its category plus a spot here for 30 days. Clearly labeled as sponsored.</span><span class="more">Learn more →</span></a>`;
inject('index.html', 'featured', featured.length ? featured.map(t => `<a class="fcard" href="/tools/${esc(t.id)}.html" data-until="${esc(t.featured.until)}">${spBadge}<strong>${esc(t.name)}</strong><span>${esc(trunc(t.description, 110))}</span><span class="more">${esc(t.category)} →</span></a>`).join('') : featPlaceholder);
inject('index.html', 'footer', footInner);
inject('vault.html', 'footer', footInner);
inject('index.html', 'cats', cats.map(c => `<a href="/category/${slugify(c)}.html">${esc(c)} (${byCat(c).length})</a>`).join(' · '));
const nFreeAll = tools.filter(t => t.free_tier === true).length;
inject('index.html', 'summary', `<div class="sr-only" id="site-summary"><h2>About Agent Radar</h2><p>Agent Radar is a directory of ${tools.length} AI tools across ${cats.length} categories (${cats.join(', ')}). Each entry lists a description, a pricing summary, whether a free tier was found (${nFreeAll} of ${tools.length} have a verified free tier), and links to the tool's official site and pricing page. Data was last checked ${maxDate}. Pricing changes often, so confirm on each tool's official pricing page.</p></div>`);
const pcats = {}; prompts.forEach(p => pcats[p.category] = (pcats[p.category] || 0) + 1);
const pcatTxt = Object.entries(pcats).sort().map(([k, v]) => `${k} (${v})`).join(', ');
inject('vault.html', 'summary', `<div class="sr-only" id="site-summary"><h2>About the Prompt Vault</h2><p>The Agent Radar Prompt Vault contains ${prompts.length} original, copy-ready AI prompts in these categories: ${pcatTxt}. Each prompt has a description, tags, suggested tools and [PLACEHOLDERS] to replace with your own details. Prompts are starting points; review AI output before relying on it.</p></div>`);
inject('vault.html', 'jsonld', ld({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebSite', name: 'Agent Radar', url: SITE + '/' },
  { '@type': 'CollectionPage', name: 'Prompt Vault', url: SITE + '/vault.html', description: `${prompts.length} original, copy-ready AI prompts.`, mainEntity: { '@type': 'ItemList', numberOfItems: prompts.length, itemListElement: prompts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title })) } }] }));
inject('index.html', 'jsonld', ld({ '@context': 'https://schema.org', '@graph': [
  { '@type': 'WebSite', name: 'Agent Radar', url: SITE + '/', description: 'Directory of AI tools with pricing and free-tier details.' },
  { '@type': 'ItemList', name: 'AI tools directory', numberOfItems: tools.length, itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: toolUrl(t), name: t.name })) }] }));

// ---- advertise + disclosure pages
write('advertise.html', head({ title: 'Advertise – feature your AI tool | Agent Radar', desc: 'Feature your AI tool on Agent Radar: top of its category page plus a homepage highlight for 30 days, clearly labeled as sponsored. $100 one-time.', path: '/advertise.html' }) +
  header('advertise', 'Get your AI tool in front of people comparing tools.') + `<main class="page">
<h1 class="tool-h">Feature your tool on Agent Radar</h1>
<p class="lead">A featured spot puts your tool at the top of its category and in the Featured strip on the homepage for 30 days.</p>
<dl class="facts">
<dt>What you get</dt><dd>Top position on your category page and within your category in the directory, plus a card in the homepage “Featured” strip</dd>
<dt>Duration</dt><dd>30 days from the start date we agree on</dd>
<dt>Price</dt><dd>$100 one-time. No subscription, no auto-renewal</dd>
<dt>Labeling</dt><dd>Featured listings carry a visible “Sponsored” badge and their links use <code>rel="sponsored"</code></dd>
</dl>
<h2>Honest note</h2>
<p>Agent Radar is a new site (launched October 2026), so traffic is still small and growing. We'd rather say that up front than oversell it. If you'd like to be an early sponsor, great. If you'd rather wait until there's more traffic, that's fair too.</p>
<h2>What sponsorship doesn't change</h2>
<ul class="links"><li>Pricing summaries and free-tier badges still come from your official pricing page, and we keep them accurate</li><li>Descriptions stay factual. Sponsorship doesn't buy reviews or rankings outside the featured spot</li><li>The tool needs to fit one of our categories. We may decline listings that aren't a good fit</li></ul>
<h2>How to get featured</h2>
<p>For now, email <a href="mailto:${CONTACT}?subject=${encodeURIComponent('Featured listing on Agent Radar')}">${CONTACT}</a> with your tool's name, website and preferred start date. We'll confirm availability and send payment details.</p>
<p class="visit"><a class="btn" href="mailto:${CONTACT}?subject=${encodeURIComponent('Featured listing on Agent Radar')}">Contact ${CONTACT}</a> <a class="btn" id="pay" href="#" target="_blank" rel="noopener" hidden>Pay $100 securely</a></p>
<p class="note">See our <a href="/disclosure.html">disclosure policy</a> for how sponsored listings and affiliate links work.</p>
</main>
<script src="/advertise.js"></script>
` + footer);

write('disclosure.html', head({ title: 'Disclosure – affiliate links & sponsored listings | Agent Radar', desc: 'How Agent Radar makes money: some links are affiliate links and some listings are sponsored. Both are labeled and never change pricing data.', path: '/disclosure.html' }) +
  header('', 'How Agent Radar makes money, and how we keep it honest.') + `<main class="page">
<h1 class="tool-h">Disclosure</h1>
<p class="lead">Agent Radar is free to use. To cover costs, we may earn money in two ways. Both are always disclosed.</p>
<h2>Affiliate links</h2>
<p>Some “Visit” and “Official site” links are affiliate links. If you sign up or buy through one, we may earn a commission at no extra cost to you. These links use <code>rel="sponsored"</code>, and tool pages with an affiliate link show a note next to the button.</p>
<h2>Sponsored listings</h2>
<p>Tool makers can pay for a featured spot: the top of their category and a card in the homepage Featured strip for a fixed period. Featured listings are always marked with a “Sponsored” badge. <a href="/advertise.html">Details on advertising</a>.</p>
<h2>What money doesn't change</h2>
<p>Pricing summaries and free-tier info come from each tool's official site, whether or not the tool is a sponsor or has an affiliate program. Sponsors can't edit their pricing data or buy a better free-tier badge. Pricing changes often, so always confirm on the official pricing page.</p>
<p class="note">At the last update: ${nAff} tool${nAff === 1 ? '' : 's'} with affiliate links and ${featured.length} sponsored listing${featured.length === 1 ? '' : 's'}. Questions: <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
</main>
` + footer);

// ---- sitemap, robots, llms
const urls = [['/', maxDate], ['/index.html', maxDate], ['/vault.html', maxDate], ['/advertise.html', PAGES_UPDATED], ['/disclosure.html', PAGES_UPDATED],
  ...cats.map(c => [`/category/${slugify(c)}.html`, maxDate]), ...tools.map(t => [`/tools/${t.id}.html`, t.verified_on])];
// '/' and '/index.html' are the same page; list only the canonical one used in <link rel=canonical>
const smUrls = urls.filter(u => u[0] !== '/');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls.map(u => `<url><loc>${SITE}${u[0]}</loc><lastmod>${u[1]}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('llms.txt', `# Agent Radar

> Agent Radar is a directory of ${tools.length} AI tools (coding agents, app builders, databases and backends, agent frameworks, LLM APIs, automation) with pricing summaries and free-tier information taken from each tool's official site, plus a Prompt Vault of ${prompts.length} original copy-ready prompts. Data last checked ${maxDate}. Pricing changes often; confirm on the official pricing page.

## Main pages
- [Tools directory](${SITE}/index.html): all ${tools.length} tools
- [Prompt Vault](${SITE}/vault.html): ${prompts.length} prompts
- [Advertise](${SITE}/advertise.html): featured listings (labeled "Sponsored")
- [Disclosure](${SITE}/disclosure.html): affiliate links and sponsored listings policy
- [tools.json](${SITE}/data/tools.json): raw tool data
- [Sitemap](${SITE}/sitemap.xml)

## Categories
${cats.map(c => `- [${c}](${catUrl(c)}): ${byCat(c).length} tools`).join('\n')}

## Tools
${tools.map(t => `- [${t.name}](${toolUrl(t)}): ${t.description} ${freeTxt(t)}.${isFeatured(t) ? ' (Sponsored listing.)' : ''}`).join('\n')}
`);
console.log(`built ${tools.length} tool pages, ${cats.length} category pages, advertise + disclosure, sitemap with ${smUrls.length} URLs; ${featured.length} featured (as of ${TODAY}), ${nAff} affiliate`);
