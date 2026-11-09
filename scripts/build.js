#!/usr/bin/env node
// Static generator: node scripts/build.js
// Reads data/tools.json + data/prompts.json + data/compare.json; writes tools/*.html, category/*.html, compare/*.html, best/*.html,
// sitemap.xml, robots.txt, llms.txt, and updates marked regions in index.html / vault.html.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.tryagentradar.com'; // canonical host (apex 308-redirects here)
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tools.json'), 'utf8'));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/prompts.json'), 'utf8'));
// comparison ("/compare/<slug>.html") and best-of ("/best/<slug>.html") pages; see data/compare.json
const guides = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/compare.json'), 'utf8'));
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
const LEGAL_UPDATED = '2026-11-09'; // lastmod for terms/privacy/refunds/disclaimer pages
const LEGAL_UPDATED_TXT = 'November 9, 2026';
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
for (const t of tools) {
  if (t.featured != null && !(t.featured && isDate(t.featured.until))) throw new Error(`${t.id}: featured must be {"until": "YYYY-MM-DD"}`);
  if (t.affiliateUrl != null && !/^https:\/\/[^\s"<>]+$/.test(t.affiliateUrl)) throw new Error(`${t.id}: affiliateUrl must be an https:// URL`);
}
// ---- ADHD section (/adhd/). Tools tagged "adhd" carry "adhd": { "struggles": [...], "helps": "..." }
const ADHD_HUB = '/adhd/', ADHD_GROK = '/adhd/grok-bot.html', ADHD_UPDATED = '2026-11-09';
const STRUGGLES = [
  ['planning', 'Planning & time blindness', 'Seeing the shape of the day, guessing how long things take, and fitting tasks into real time.',
    "In our view: try a free visual planner (Tiimo's or Structured's free version) before paying for an auto-scheduler. Motion and Sunsama make more sense once you know you'll stick with a daily planning habit."],
  ['start', 'Getting started on tasks', 'Breaking a task that feels too big into a first step small enough to begin.',
    "In our view: Goblin Tools' Magic ToDo is the lowest-effort place to start, because the website needs no account."],
  ['focus', 'Focus sessions', 'Setting up a block of time to work on one thing, with sound or another person to anchor it.',
    'In our view: the Focusmate free plan (3 sessions a week) is enough to find out whether working alongside someone helps you.'],
  ['capture', 'Capturing thoughts (brain dump)', 'Getting ideas and to-dos out of your head quickly, before they slip away.',
    'In our view: the best capture tool is the one already on your phone. Voice capture (Todoist Ramble or ChatGPT voice) skips the typing step.'],
  ['reminders', 'Reminders & routines', 'Nudges at the right moment and repeatable routines, so fewer things depend on memory.',
    'In our view: a few well-timed reminders beat a flood of them. Set up one daily routine before adding more.'],
  ['admin', 'Email & admin', 'Inbox overload, replies and paperwork-style tasks that pile up.',
    'In our view: AI help with email works best as drafts you review and send yourself, not messages sent for you.'],
];
const STRUGGLE_IDS = STRUGGLES.map(x => x[0]);
const adhdTools = tools.filter(t => t.tags.includes('adhd'));
for (const t of adhdTools) {
  if (!t.adhd || !Array.isArray(t.adhd.struggles) || !t.adhd.struggles.length || !t.adhd.helps) throw new Error(`${t.id}: adhd tools need adhd.struggles and adhd.helps`);
  for (const x of t.adhd.struggles) if (!STRUGGLE_IDS.includes(x)) throw new Error(`${t.id}: unknown struggle ${x}`);
}
const ADHD_DISC = `<aside class="note adhd-disc" role="note"><strong>Not medical advice.</strong> Agent Radar reviews software. Nothing here diagnoses, treats or cures ADHD or any other condition, and these tools are not a substitute for care from a qualified clinician. If you have questions about ADHD, symptoms or treatment, talk to a doctor or other licensed professional.</aside>`;
const REVIEW_NOTE = `<p class="note">Video review from Dan (who runs Agent Radar and has ADHD): coming soon. Until it's posted, this page lists only facts from the tool's official site, plus clearly labeled opinions.</p>`;
const struggleName = id => STRUGGLES.find(x => x[0] === id)[1];
const GUIDE_FIELDS = ['slug', 'type', 'title', 'h1', 'description', 'category', 'tools', 'updated', 'answer', 'rows', 'pick', 'faqs'];
for (const g of guides) {
  for (const k of GUIDE_FIELDS) if (g[k] == null) throw new Error(`compare.json ${g.slug || '?'}: missing ${k}`);
  if (!['compare', 'best'].includes(g.type)) throw new Error(`${g.slug}: type must be compare or best`);
  if (!/^[a-z0-9-]+$/.test(g.slug) || !isDate(g.updated)) throw new Error(`${g.slug}: bad slug or updated date`);
  for (const r of g.rows) {
    if (!tools.some(t => t.id === r.id)) throw new Error(`${g.slug}: unknown tool ${r.id}`);
    if (!/^https:\/\/[^\s"<>]+$/.test(r.source || '')) throw new Error(`${g.slug}/${r.id}: source must be an https:// URL`);
  }
  if (g.faqs.length < 3 || g.faqs.length > 4) throw new Error(`${g.slug}: needs 3-4 FAQs`);
  for (const x of g.extraSources || []) if (!x.label || !/^https:\/\/[^\s"<>]+$/.test(x.url || '')) throw new Error(`${g.slug}: extraSources need a label and an https:// url`);
}
const guidePath = g => `/${g.type}/${g.slug}.html`;
const guidesFor = id => guides.filter(g => g.tools.includes(id));
const guidesForCat = c => guides.filter(g => g.category === c || g.tools.some(id => (tools.find(t => t.id === id) || {}).category === c));
const guideLinks = list => list.map(g => `<li><a href="${guidePath(g)}">${esc(g.h1)}</a></li>`).join('');
const isFeatured = t => !!(t.featured && t.featured.until >= TODAY);
const visitUrl = t => t.affiliateUrl || t.url;
const visitRel = t => (t.affiliateUrl || isFeatured(t)) ? 'sponsored noopener' : 'noopener';
const catOrder = [...new Set(tools.map(t => t.category))];
// keep category grouping / original order, but float active featured tools to the top of their category
const sortFeat = list => list.map((t, i) => [t, i]).sort((a, b) => catOrder.indexOf(a[0].category) - catOrder.indexOf(b[0].category) || isFeatured(b[0]) - isFeatured(a[0]) || a[1] - b[1]).map(x => x[0]);
const spBadge = '<span class="badge b-sp" title="Paid placement">Sponsored</span> ';
const featured = tools.filter(isFeatured);
const nAff = tools.filter(t => t.affiliateUrl).length;

// The homepage's canonical URL is "/" (what visitors and Google land on), not "/index.html".
// Use HOME for every internal link, breadcrumb, sitemap and llms.txt entry so all signals agree.
const HOME = '/';
const navA = (href, key, label, active) => `<a href="${href}"${active === key ? ' class="active" aria-current="page"' : ''}>${label}</a>`;
const nav = active => `<nav>${navA(HOME, 'tools', 'Tools directory', active)}${navA(ADHD_HUB, 'adhd', 'ADHD tools', active)}${navA('/vault.html', 'vault', 'Prompt Vault', active)}${navA('/advertise.html', 'advertise', 'Advertise', active)}</nav>`;
// Vercel Web Analytics (static-site snippet). Added to every generated page via head(), and
// ensured in hand-written pages by ensureAnalytics() below (idempotent, no duplicates).
const ANALYTICS = `<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>`;
function ensureAnalytics(file) {
  const f = path.join(ROOT, file); const s = fs.readFileSync(f, 'utf8');
  if (s.includes('/_vercel/insights/script.js')) return;
  if (!s.includes('</head>')) throw new Error(`${file} missing </head>`);
  fs.writeFileSync(f, s.replace('</head>', () => ANALYTICS + '\n</head>'));
}
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
${ANALYTICS}
</head><body>
`;
const header = (active, sub) => `<header><h1><a href="${HOME}" class="brand">📡 Agent Radar</a></h1>${nav(active)}<p>${sub}</p></header>\n`;
// shared footer links + disclosure (also injected into index.html / vault.html via <!--footer--> markers)
const footInner = `<a href="${HOME}">Tools directory</a> · <a href="/adhd/">ADHD tools</a> · <a href="/vault.html">Prompt Vault</a> · <a href="/advertise.html">Advertise</a> · <a href="/disclosure.html">Disclosure</a> · <a href="/data/tools.json">tools.json</a> · <a href="/llms.txt">llms.txt</a><p class="legal"><a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/refunds.html">Refunds</a> · <a href="/disclaimer.html">Disclaimer</a></p><p class="disc">Some links are affiliate links; we may earn a commission at no cost to you. Sponsored listings are labeled. <a href="/disclosure.html">Learn more</a>.</p>`;
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
  const bc = [['Agent Radar', SITE + HOME], [t.category, catUrl(t.category)], [t.name, toolUrl(t)]];
  const sw = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, description: t.description, url: t.url, applicationCategory: t.category, keywords: t.tags.join(', '), mainEntityOfPage: toolUrl(t), dateModified: t.verified_on };
  const b = freeBadge(t), f = isFeatured(t);
  const adhdSec = t.adhd ? `<section class="adhd"><h2>For ADHD-related struggles</h2>
<div class="sr-only" id="page-summary"><h2>Summary</h2><p>${esc(`${t.name} is listed in the Agent Radar ADHD section under: ${t.adhd.struggles.map(struggleName).join(', ')}. ${t.adhd.helps} Pricing: ${t.pricing_summary} Checked ${t.verified_on} on the official site. Not medical advice; software does not treat ADHD.`)}</p></div>
<p>Listed under: ${t.adhd.struggles.map(x => `<a href="${ADHD_HUB}#${x}">${esc(struggleName(x))}</a>`).join(' · ')}</p>
<p>${esc(t.adhd.helps)}</p>
${REVIEW_NOTE}
${ADHD_DISC}
<p><a href="${ADHD_HUB}">All ADHD tools</a> · <a href="${ADHD_GROK}">How a Grok Bot assistant can help</a></p></section>
` : '';
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
${adhdSec}${guidesFor(t.id).length ? `<section><h2>Comparisons</h2><ul class="links">${guideLinks(guidesFor(t.id))}</ul></section>\n` : ''}<section><h2>Related tools</h2><ul class="links">${rel.map(o => `<li><a href="/tools/${o.id}.html">${esc(o.name)}</a> — ${esc(o.category)}</li>`).join('')}</ul>
<p><a href="/category/${slugify(t.category)}.html">All ${esc(t.category)} tools</a> · <a href="${HOME}">Full directory</a></p></section>
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
  const bc = [['Agent Radar', SITE + HOME], [c, catUrl(c)]];
  const il = { '@context': 'https://schema.org', '@type': 'ItemList', name: `${c} tools`, numberOfItems: list.length, itemListElement: list.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: toolUrl(t), name: t.name })) };
  const cp = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${c} – Agent Radar`, url: SITE + p, description: desc, mainEntity: il };
  write(p.slice(1), head({ title, desc, path: p, extra: ld(cp) + '\n' + crumbs(bc) + '\n' }) +
    header('tools', 'Pricing details checked on official sites.') + `<main>
${crumbNav(bc)}
<h1 class="tool-h">${esc(c)}</h1>
<p class="lead">${list.length} tools in this category; ${nFree} with a verified free tier. Data last checked ${esc(maxDate)}.</p>
${list.some(t => t.adhd) ? `<p>These tools are also organized by struggle in our <a href="${ADHD_HUB}">ADHD tools section</a>.</p>\n${ADHD_DISC}\n` : ''}<div class="grid" data-featsort>
${list.map(t => card(t, orig.indexOf(t))).join('\n')}
</div>
${guidesForCat(c).length ? `<section><h2>Comparisons &amp; guides</h2><ul class="links">${guideLinks(guidesForCat(c))}</ul></section>\n` : ''}<p class="note">Other categories: ${cats.filter(x => x !== c).map(x => `<a href="/category/${slugify(x)}.html">${esc(x)}</a>`).join(' · ')}</p>
</main>
` + footer);
}

// ---- comparison + best-of pages (data/compare.json)
const fmtMonth = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtDay = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
for (const g of guides) {
  const p = guidePath(g), url = SITE + p, asOf = fmtMonth(g.updated);
  const rowTools = g.rows.map(r => [r, tools.find(t => t.id === r.id)]);
  const bc = [['Agent Radar', SITE + HOME], [g.category, catUrl(g.category)], [g.h1, url]];
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };
  const art = { '@context': 'https://schema.org', '@type': 'Article', headline: g.h1, description: g.description, url, dateModified: g.updated, author: { '@type': 'Organization', name: 'Agent Radar' }, about: rowTools.map(([, t]) => ({ '@type': 'SoftwareApplication', name: t.name, url: t.url })) };
  const summary = `${g.answer} Tools covered: ${rowTools.map(([r, t]) => `${t.name} (${r.price})`).join('; ')}. Prices as of ${asOf} from each vendor's official pricing page; check the vendor's site for current pricing.`;
  const others = guides.filter(o => o !== g && o.tools.some(id => g.tools.includes(id)));
  const html = head({ title: `${g.title} | Agent Radar`, desc: g.description, path: p, type: 'article', extra: ld(art) + '\n' + ld(faq) + '\n' + crumbs(bc) + '\n' }) +
    header('tools', 'Comparisons built from official pricing pages.') + `<main class="page wide">
${crumbNav(bc)}
<article class="guide">
<h1 class="tool-h">${esc(g.h1)}</h1>
<p class="note">Updated <time datetime="${esc(g.updated)}">${esc(fmtDay(g.updated))}</time>. Prices and limits are as of ${esc(asOf)}, taken from each vendor's official pricing page (linked below). Check the vendor's site for current pricing.</p>
<div class="sr-only" id="page-summary"><h2>Summary</h2><p>${esc(summary)}</p></div>
<p class="lead">${esc(g.answer)}</p>
<h2>At a glance</h2>
<div class="tbl"><table class="cmp">
<thead><tr><th scope="col">Tool</th><th scope="col">Price / free tier (as of ${esc(asOf)})</th><th scope="col">Best for</th><th scope="col">Key strength</th><th scope="col">Key drawback</th></tr></thead>
<tbody>
${rowTools.map(([r, t]) => `<tr><th scope="row"><a href="/tools/${esc(t.id)}.html">${esc(t.name)}</a></th><td>${esc(r.price)} <a class="src" href="${esc(r.source)}" target="_blank" rel="noopener">Source</a> <span class="asof">(as of ${esc(asOf)})</span></td><td>${esc(r.bestFor)}</td><td>${esc(r.strength)}</td><td>${esc(r.drawback)}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="note">Check the vendor's site for current pricing. Plans and limits change often. Statements marked “In our view” are our opinions, not facts about the products; see our <a href="/disclaimer.html">Disclaimer</a>.</p>
<h2>Which should you pick?</h2>
<ul class="links">${g.pick.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
<h2>FAQ</h2>
${g.faqs.map(f => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`).join('\n')}
<h2>Sources</h2>
<ul class="links">${rowTools.map(([r, t]) => `<li>${esc(t.name)}: <a href="${esc(r.source)}" target="_blank" rel="noopener">${esc(r.source)}</a> (fetched ${esc(fmtDay(g.updated))})</li>`).join('')}${(g.extraSources || []).map(x => `<li>${esc(x.label)}: <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.url)}</a> (fetched ${esc(fmtDay(g.updated))})</li>`).join('')}</ul>
<p class="visit">${rowTools.map(([, t]) => `<a class="btn" href="${esc(visitUrl(t))}" target="_blank" rel="${visitRel(t)}">Visit ${esc(t.name)} ↗</a>`).join(' ')}</p>
${rowTools.some(([, t]) => t.affiliateUrl) ? `<p class="note aff">Some Visit buttons above are affiliate links: we may earn a commission at no cost to you. It doesn't affect this comparison. <a href="/disclosure.html">Disclosure</a></p>\n` : ''}</article>
<section><h2>Tool pages</h2><ul class="links">${rowTools.map(([, t]) => `<li><a href="/tools/${esc(t.id)}.html">${esc(t.name)} pricing &amp; free tier</a></li>`).join('')}</ul>
${others.length ? `<h2>More comparisons</h2><ul class="links">${guideLinks(others)}</ul>\n` : ''}<p><a href="/category/${slugify(g.category)}.html">All ${esc(g.category)} tools</a> · <a href="${HOME}">Full directory</a></p></section>
</main>
` + footer;
  write(p.slice(1), html);
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
<dt>Price</dt><dd>$100 one-time. No subscription, no auto-renewal. By paying you agree to our <a href="/terms.html#sponsored">Terms</a> and <a href="/refunds.html">Refund policy</a></dd>
<dt>Labeling</dt><dd>Featured listings carry a visible “Sponsored” badge and their links use <code>rel="sponsored"</code></dd>
</dl>
<h2>Honest note</h2>
<p>Agent Radar is a new site (launched October 2026), so traffic is still small and growing. We'd rather say that up front than oversell it. If you'd like to be an early sponsor, great. If you'd rather wait until there's more traffic, that's fair too.</p>
<h2>What sponsorship doesn't change</h2>
<ul class="links"><li>Pricing summaries and free-tier badges still come from your official pricing page, and we keep them accurate</li><li>Descriptions stay factual. Sponsorship doesn't buy reviews or rankings outside the featured spot</li><li>The tool needs to fit one of our categories. We may decline listings that aren't a good fit</li></ul>
<h2>How to get featured</h2>
<p>For now, email <a href="mailto:${CONTACT}?subject=${encodeURIComponent('Featured listing on Agent Radar')}">${CONTACT}</a> with your tool's name, website and preferred start date. We'll confirm availability and send payment details.</p>
<p class="visit"><a class="btn" href="mailto:${CONTACT}?subject=${encodeURIComponent('Featured listing on Agent Radar')}">Contact ${CONTACT}</a> <a class="btn" id="pay" href="#" target="_blank" rel="noopener" hidden>Pay $100 securely</a></p>
<p class="note">By paying you agree to our <a href="/terms.html#sponsored">Terms</a> and <a href="/refunds.html">Refund policy</a>. See our <a href="/disclosure.html">disclosure policy</a> for how sponsored listings and affiliate links work.</p>
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

// ---- terms, privacy, refunds, disclaimer (plain-English policies)
const mail = `<a href="mailto:${CONTACT}">${CONTACT}</a>`;
const updated = `<p class="note">Last updated: <time datetime="${LEGAL_UPDATED}">${LEGAL_UPDATED_TXT}</time></p>`;
const legalPage = (file, title, desc, sub, h1, body) => write(file, head({ title, desc, path: '/' + file }) +
  header('', sub) + `<main class="page">
<h1 class="tool-h">${h1}</h1>
${updated}
${body.trim()}
</main>
` + footer);

legalPage('terms.html', 'Terms of Use | Agent Radar', 'The terms for using Agent Radar, including the tools directory, Prompt Vault, newsletter and sponsored listings.',
  'The ground rules for using Agent Radar.', 'Terms of Use', `
<p class="lead">Agent Radar (tryagentradar.com) is a small independent website run by Dan, a sole proprietor based in Florida, USA (“we”, “us”). By using the site, the Prompt Vault, the newsletter or buying a sponsored listing, you agree to these terms. If you don't agree, please don't use the site.</p>
<h2>The site is provided as-is</h2>
<p>Agent Radar is a free directory of AI tools with pricing summaries, free-tier info and copy-ready prompts. We try hard to keep it accurate, but tools change their pricing, plans and features often. Information on the site may be incomplete, inaccurate or out of date. Always confirm details on the tool's official website before you rely on them or buy anything.</p>
<p>The site and everything on it are provided “as is” and “as available”, without warranties of any kind, express or implied, including warranties of accuracy, fitness for a particular purpose, merchantability or non-infringement. We don't promise that the site will always be available or error-free.</p>
<h2>Limitation of liability</h2>
<p>To the fullest extent allowed by law, we aren't liable for any indirect, incidental, special or consequential damages, or for lost profits, data or business, arising from your use of the site, the information on it, or any third-party tool you find through it. If we are found liable for anything, our total liability is limited to the greater of the amount you paid us in the 12 months before the claim, or $100.</p>
<h2>Third-party tools and links</h2>
<p>Agent Radar lists and links to tools and websites run by other companies. Listing or linking to a tool doesn't mean we endorse it, and we aren't responsible for its content, products, pricing, privacy practices or availability. Your use of any third-party tool is governed by that company's own terms and policies. Some links are affiliate links and some listings are sponsored; see our <a href="/disclosure.html">Disclosure</a>.</p>
<h2>Prompts and AI output</h2>
<p>Prompts in the Prompt Vault are starting points. You're free to copy and use them in your own work. You're responsible for reviewing anything an AI tool produces before relying on it.</p>
<h2>Using the site</h2>
<p>Please don't: break the law using the site; try to disrupt, overload or gain unauthorized access to the site or its systems; scrape it in a way that harms its performance; sign up other people for the newsletter without their permission; or misrepresent your affiliation with Agent Radar. We may block access for anyone who does.</p>
<h2 id="sponsored">Sponsored (featured) listings</h2>
<ul class="links">
<li>A featured listing is a paid placement: your tool appears at the top of its category and in the homepage Featured strip for the agreed period (currently 30 days). See <a href="/advertise.html">Advertise</a> for current details and price.</li>
<li>Placement only. We don't guarantee any amount of traffic, clicks, sign-ups, sales or other results.</li>
<li>Featured listings are always labeled “Sponsored”, and their links use <code>rel="sponsored"</code>. This label can't be removed.</li>
<li>Sponsorship doesn't change pricing summaries, free-tier info or descriptions, which stay based on the tool's official site.</li>
<li>We may decline or remove any listing that is illegal, misleading, harmful, or not a fit for the site. Refunds work as described in our <a href="/refunds.html">Refund policy</a>.</li>
<li>Payments are one-time and processed by Stripe. Nothing renews automatically.</li>
<li>You confirm you have the right to promote the tool and that any information you give us is accurate.</li>
</ul>
<h2>Intellectual property</h2>
<p>The original text, summaries, prompts and design of Agent Radar belong to us. Tool names, product names, logos and trademarks belong to their respective owners and are used only to identify the tools. Their use doesn't imply any affiliation with or endorsement by those owners. If you believe something on the site infringes your rights, email ${mail} and we'll look into it promptly.</p>
<h2>Governing law</h2>
<p>These terms are governed by the laws of the State of Florida, USA, without regard to its conflict-of-law rules. Any dispute will be handled in the state or federal courts located in Florida.</p>
<h2>Changes to these terms</h2>
<p>We may update these terms from time to time. When we do, we'll change the “Last updated” date above. Continuing to use the site after a change means you accept the updated terms. Changes don't affect a sponsored listing you already paid for.</p>
<h2>Contact</h2>
<p>Questions about these terms: ${mail}.</p>
<p class="note">See also: <a href="/privacy.html">Privacy policy</a> · <a href="/refunds.html">Refund policy</a> · <a href="/disclaimer.html">Disclaimer</a> · <a href="/disclosure.html">Disclosure</a></p>`);

legalPage('privacy.html', 'Privacy Policy | Agent Radar', 'What Agent Radar collects (just your email if you subscribe), how it is used, who processes it, and how to unsubscribe or ask for deletion.',
  "What we collect, and what we don't.", 'Privacy Policy', `
<p class="lead">Agent Radar is run by Dan, a sole proprietor in Florida, USA. We collect as little as possible. You can browse the directory and the Prompt Vault without an account and without giving us any personal information.</p>
<h2>What we collect</h2>
<ul class="links">
<li><strong>Newsletter:</strong> if you subscribe, we collect your email address. That's the only thing the signup form asks for.</li>
<li><strong>Sponsored listings:</strong> if you buy a featured listing, we receive your name, email and the details you send us about your tool. Payments are processed by Stripe. We never see or store your full card details.</li>
<li><strong>Emails you send us:</strong> if you email us, we keep the message so we can reply.</li>
<li><strong>Server logs:</strong> our hosting provider, Vercel, automatically processes standard technical data such as IP address, browser type and the pages requested, to deliver the site and keep it secure.</li>
<li><strong>Analytics:</strong> we use Vercel Web Analytics, a privacy-friendly service that doesn't use cookies and collects aggregated page-view data.</li>
</ul>
<p>We don't use advertising trackers or tracking cookies.</p>
<h2>How we use it</h2>
<p>We use your email only to send the Agent Radar newsletter and related messages (like the welcome email). We use sponsor details only to set up, run and bill the featured listing and to keep business records. Technical data is used to run, secure and improve the site.</p>
<h2>Who processes it</h2>
<p>We rely on a few service providers, each with its own privacy policy:</p>
<ul class="links">
<li><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel</a>: website hosting, server logs and Web Analytics</li>
<li><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener">Resend</a>: storing the newsletter list and sending emails</li>
<li><a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe</a>: processing payments for featured listings</li>
</ul>
<h2>We don't sell your data</h2>
<p>We don't sell, rent or trade your personal information, and we don't share it with anyone except the service providers above, or when required by law.</p>
<h2>Unsubscribing and deletion</h2>
<p>Every newsletter email has an unsubscribe link. Click it and you won't get any more newsletters. To have your email address deleted completely, or to ask what we hold about you, email ${mail} and we'll handle it promptly. We keep payment and business records as long as tax and accounting rules require.</p>
<h2>Children</h2>
<p>Agent Radar is not directed at children under 13, and we don't knowingly collect personal information from them. If you think a child has given us their email, contact us and we'll delete it.</p>
<h2>Changes</h2>
<p>If we change this policy, we'll update the “Last updated” date above. If a change is significant, we'll mention it in the newsletter.</p>
<h2>Contact</h2>
<p>Privacy questions or requests: ${mail}.</p>
<p class="note">See also: <a href="/terms.html">Terms of Use</a> · <a href="/refunds.html">Refund policy</a> · <a href="/disclaimer.html">Disclaimer</a></p>`);

legalPage('refunds.html', 'Refund Policy – featured listings | Agent Radar', 'Refund policy for Agent Radar featured (sponsored) listings: full refund before the listing goes live, no auto-renewal.',
  'Refunds for featured listings.', 'Refund Policy', `
<p class="lead">This policy covers paid featured (sponsored) listings. Everything else on Agent Radar, including the directory, Prompt Vault and newsletter, is free.</p>
<h2>Before your listing goes live</h2>
<p>If you change your mind before your featured listing goes live, you'll get a full refund. Just email us.</p>
<h2>After your listing goes live</h2>
<p>Once the listing is live, the payment is non-refundable, with one exception: if we remove your listing early for reasons not caused by you (for example, we stop offering featured listings), we may give a pro-rated refund for the unused days, at our discretion.</p>
<p>If we remove a listing because it breaks our <a href="/terms.html#sponsored">Terms</a> (for example, it is illegal or misleading), no refund is due.</p>
<h2>No auto-renewal</h2>
<p>Featured listings are a one-time payment for a fixed period. Nothing renews or charges you again automatically. If you want another period, you buy it separately.</p>
<h2>How to request a refund</h2>
<p>Email ${mail} from the address you used to buy the listing, with your tool's name and the date you paid. Approved refunds go back to your original payment method through Stripe. Your bank may take several business days to show it.</p>
<p class="note">See also: <a href="/terms.html">Terms of Use</a> · <a href="/advertise.html">Advertise</a> · <a href="/disclosure.html">Disclosure</a></p>`);

legalPage('disclaimer.html', 'Disclaimer | Agent Radar', 'Agent Radar is editorially independent. Our takes are opinions, pricing changes often, and nothing here is professional advice.',
  "How to read what's on Agent Radar.", 'Disclaimer', `
<p class="lead">Agent Radar is an independent directory run by one person. Here's how to read what you find on it.</p>
<h2>Editorial independence</h2>
<p>We decide which tools to list and what to say about them. Tool makers can't pay to change their pricing summary, free-tier badge or description, and sponsorship doesn't buy a review or a better ranking outside the clearly labeled featured spot.</p>
<h2>Opinions are opinions</h2>
<p>Any verdicts, recommendations or comparisons on the site are our honest opinions, based on our own research at the time, and are labeled as such. They aren't statements of fact about a product, and your experience may differ.</p>
<h2>Information changes</h2>
<p>Pricing, plans, free tiers and features of AI tools change often, sometimes weekly. Each tool page shows when it was last checked. Always verify details with the vendor on its official website before you sign up, buy or make a decision.</p>
<h2>Affiliate links and sponsored listings</h2>
<p>Some links are affiliate links: if you sign up through them we may earn a commission, at no extra cost to you. Some listings are paid placements and always carry a “Sponsored” label. Neither affects the pricing or free-tier info we show. Full details: <a href="/disclosure.html">Disclosure</a>.</p>
<h2>Not professional advice</h2>
<p>Nothing on Agent Radar, including the Prompt Vault, the ADHD section and the newsletter, is medical, legal, financial, tax, security or other professional advice. Our ADHD pages review software that may help with everyday organization and focus. They don't diagnose, treat or cure ADHD or any other condition, and they don't cover diagnosis or treatment. Talk to a qualified clinician about your health. Review AI output and talk to a qualified professional before relying on it for important decisions.</p>
<h2>Trademarks</h2>
<p>Tool names and trademarks belong to their owners and are used only to identify the tools. Listing a tool doesn't mean its maker endorses or is affiliated with Agent Radar.</p>
<p class="note">Questions: ${mail}. See also: <a href="/terms.html">Terms of Use</a> · <a href="/privacy.html">Privacy policy</a></p>`);

// ---- ADHD hub (/adhd/index.html) and Grok Bot page (/adhd/grok-bot.html)
{
  const p = ADHD_HUB, url = SITE + p;
  const h1 = 'AI tools that help with focus: tested by a dad with ADHD';
  const desc = `${adhdTools.length} AI and productivity tools for people with ADHD, organized by struggle: planning and time blindness, getting started, focus sessions, brain dumps, reminders, and email. Prices checked on official sites. Not medical advice.`;
  const bc = [['Agent Radar', SITE + HOME], ['ADHD tools', url]];
  const nFree = adhdTools.filter(t => t.free_tier === true).length;
  const summary = `The Agent Radar ADHD section lists ${adhdTools.length} software tools (${nFree} with a free plan) that may help with everyday organization and focus, organized by struggle: ${STRUGGLES.map(x => `${x[1]}: ${adhdTools.filter(t => t.adhd.struggles.includes(x[0])).map(t => t.name).join(', ')}`).join('; ')}. Pricing was checked on each tool's official site on ${ADHD_UPDATED}. Dan, who runs Agent Radar, has ADHD and plans video reviews; until those are posted, entries contain only facts from official sites plus labeled opinions. This is not medical advice: the tools do not diagnose, treat or cure ADHD. There are no affiliate links in this section.`;
  const il = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, url, description: desc, dateModified: ADHD_UPDATED, mainEntity: { '@type': 'ItemList', numberOfItems: adhdTools.length, itemListElement: adhdTools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: toolUrl(t), name: t.name })) } };
  const row = t => { const b = freeBadge(t); return `<tr><th scope="row"><a href="/tools/${esc(t.id)}.html">${esc(t.name)}</a></th><td>${esc(t.adhd.helps)}</td><td><span class="badge ${b[0]}">${b[1]}</span> ${esc(t.pricing_summary)} <a class="src" href="${esc(t.pricing_url)}" target="_blank" rel="noopener">Source</a></td></tr>`; };
  write('adhd/index.html', head({ title: 'AI tools for ADHD: focus, planning & brain dumps | Agent Radar', desc, path: p, extra: ld(il) + '\n' + crumbs(bc) + '\n' }) +
    header('adhd', 'Software that may help with focus and organization. Not medical advice.') + `<main class="page wide">
${crumbNav(bc)}
<article class="guide">
<h1 class="tool-h">${esc(h1)}</h1>
<div class="sr-only" id="page-summary"><h2>Summary</h2><p>${esc(summary)}</p></div>
<p class="lead">Dan, who runs Agent Radar, has ADHD. This section collects AI and productivity tools that may help with the everyday stuff: planning the day, starting tasks, staying on one thing, and not losing ideas. It's organized by struggle, not by brand.</p>
${ADHD_DISC}
<p class="note">Updated <time datetime="${ADHD_UPDATED}">${esc(fmtDay(ADHD_UPDATED))}</time>. Prices and free plans come from each tool's official site (linked as "Source"). Video reviews from Dan are coming soon; until they're posted, nothing here claims hands-on testing. Statements starting with "In our view" are opinions. There are no affiliate links in this section; if we add any later, they'll be labeled. See our <a href="/disclosure.html">Disclosure</a>.</p>
<h2>Jump to a struggle</h2>
<ul class="links">${STRUGGLES.map(x => `<li><a href="#${x[0]}">${esc(x[1])}</a> (${adhdTools.filter(t => t.adhd.struggles.includes(x[0])).length} tools)</li>`).join('')}<li><a href="${ADHD_GROK}">How a Grok Bot assistant can help with ADHD</a></li></ul>
${STRUGGLES.map(x => `<section id="${x[0]}"><h2>${esc(x[1])}</h2>
<p>${esc(x[2])}</p>
<div class="tbl"><table class="cmp"><thead><tr><th scope="col">Tool</th><th scope="col">How it can help</th><th scope="col">Price / free plan (checked ${esc(fmtMonth(ADHD_UPDATED))})</th></tr></thead>
<tbody>
${adhdTools.filter(t => t.adhd.struggles.includes(x[0])).map(row).join('\n')}
</tbody></table></div>
<p class="note">${esc(x[3])}</p></section>`).join('\n')}
<h2>Using an AI assistant for the rest</h2>
<p>A general AI assistant can cover several struggles at once: reminders, brain dumps, weekly reviews and appointment prep. We wrote setup recipes for one option: <a href="${ADHD_GROK}">How a Grok Bot assistant can help with ADHD</a>.</p>
<h2>How we pick and check tools</h2>
<ul class="links"><li>Each tool's price and free plan come from its official site, with the date we checked. If we can't confirm a price, we say so or leave the tool out.</li><li>Descriptions are written by us in plain language. We don't copy vendor text or use their logos.</li><li>No tool paid to be listed here. Sponsored listings anywhere on Agent Radar are always labeled.</li><li>We don't list or promote diagnosis or treatment services; this section covers everyday software only.</li></ul>
<p class="note">Pricing changes often. Confirm on the official pricing page before you sign up.</p>
</article>
</main>
` + footer);
}
{
  const p = ADHD_GROK, url = SITE + p;
  const h1 = 'How a Grok Bot assistant can help with ADHD';
  const desc = 'Practical Grok Bot setup recipes for people with ADHD: morning routine reminders, brain dump to task list, weekly review, appointment prep and body-doubling style check-ins. Not medical advice.';
  const bc = [['Agent Radar', SITE + HOME], ['ADHD tools', SITE + ADHD_HUB], [h1, url]];
  const recipes = [
    ['morning', 'Morning routine reminders', 'A short checklist at the same time every weekday, so the routine is not something you have to remember.',
      'Every weekday at 7:00 AM, send me my morning checklist: [TAKE KEYS, WALLET, PHONE CHARGER; KIDS\' BACKPACKS; ANYTHING ELSE]. Then list today\'s calendar events with the time I need to leave for each. End by asking me which one thing matters most today. Keep it under 10 lines.',
      'Grok Bot turns a repeated request into a routine that runs on the schedule you set. Check the routine\'s schedule and your time zone after you create it.'],
    ['brain-dump', 'Brain dump to task list', 'Say or type everything on your mind in one messy message, and get back a short, sorted list.',
      'Here is my brain dump: [EVERYTHING ON YOUR MIND, IN ANY ORDER]. Sort it into Today, This week, Later and Not mine. For each Today item, give me one tiny first step that takes under 5 minutes. Don\'t add anything I didn\'t say. Keep it short.',
      'You can send a voice note instead of typing. If you use a to-do app such as Todoist or Notion and have connected it, you can ask the Bot to add the Today items there.'],
    ['weekly', 'Weekly review', 'A Sunday look at the week ahead, so Monday doesn\'t arrive as a surprise.',
      'Every Sunday at 6:00 PM, read my Google Calendar for the coming week. Flag clashes, packed days and early starts. List anything I told you I would do this week. Then send me a short plan for Monday with no more than 3 priorities. Don\'t create, move or cancel any event without asking me.',
      'This needs Google Calendar connected. Grok Bot\'s own docs describe a very similar Sunday-evening calendar routine.'],
    ['appointments', 'Appointment prep', 'The evening before, a list of what\'s coming tomorrow and what to bring, so nothing gets missed at the door.',
      'Every evening at 8:00 PM, look at tomorrow\'s calendar. For each appointment, tell me the time, when I need to leave, what to bring (paperwork, ID, payment) and any questions I wrote down for it. If something has no address or details, flag it. Don\'t change any event.',
      'Keep sensitive details out of the reminder text if other people can see your phone. You decide what you share with the Bot.'],
    ['check-ins', 'Body-doubling style check-ins', 'Short check-in messages during a work block, to help you notice when you have drifted.',
      'Today from 1:00 PM to 3:00 PM, check in with me every 30 minutes. Ask in one line what I\'m working on and whether I\'m still on it. If I say I drifted, ask me for the next tiny step and nothing else. Stop at 3:00 PM.',
      'These are messages from an AI, not a live person. If you want a real person working alongside you, see Focusmate in our tool list.'],
  ];
  const summary = `Grok Bot is an AI assistant that can chat, take voice notes, connect to apps such as Gmail and Google Calendar, and run repeated tasks as scheduled routines. This page gives ${recipes.length} copy-ready setup recipes for people with ADHD: ${recipes.map(r => r[1]).join(', ')}. Each recipe keeps the user in control: the Bot drafts and reminds, and changes to calendars or emails wait for approval. Not medical advice: Grok Bot is not a clinician and does not diagnose or treat ADHD.`;
  const art = { '@context': 'https://schema.org', '@type': 'Article', headline: h1, description: desc, url, dateModified: ADHD_UPDATED, author: { '@type': 'Organization', name: 'Agent Radar' } };
  write('adhd/grok-bot.html', head({ title: `${h1} | Agent Radar`, desc, path: p, type: 'article', extra: ld(art) + '\n' + crumbs(bc) + '\n' }) +
    header('adhd', 'Setup recipes for an AI assistant. Not medical advice.') + `<main class="page wide">
${crumbNav(bc)}
<article class="guide">
<h1 class="tool-h">${esc(h1)}</h1>
<div class="sr-only" id="page-summary"><h2>Summary</h2><p>${esc(summary)}</p></div>
<p class="lead">A lot of ADHD friction is remembering: the routine, the appointment, the thing you said you'd do. An AI assistant that can send you messages on a schedule can carry some of that load. Here are five setups for Grok Bot that you can copy and adjust.</p>
${ADHD_DISC}
<p class="note">Updated <time datetime="${ADHD_UPDATED}">${esc(fmtDay(ADHD_UPDATED))}</time>. Grok Bot is one option. Other assistants with scheduled tasks or reminders can run similar recipes; for example, ChatGPT lists scheduled tasks on its paid plans (<a href="https://chatgpt.com/pricing" target="_blank" rel="noopener">source</a>). Agent Radar itself is run with help from Grok Bot, and no one paid for this page. Dan's video walkthroughs are coming soon.</p>
<h2>What Grok Bot can do (from its docs)</h2>
<ul class="links"><li>Chat by text, voice note or voice call, on desktop, mobile, Slack or X.</li><li>Connect apps you already use, such as Gmail, Google Calendar, Notion, Slack and Google Drive.</li><li>Turn a task you ask for repeatedly into a routine that runs on a schedule you set.</li><li>Remember your preferences, so you don't have to re-explain your setup.</li><li>Draft emails and messages and leave them for you to approve and send.</li></ul>
<p class="note">Source: <a href="https://docs.x.ai/grok-bot/overview" target="_blank" rel="noopener">Grok Bot overview (official docs)</a>, checked ${esc(fmtDay(ADHD_UPDATED))}. Features and plans can change; check the docs for current details.</p>
<h2>Five setup recipes</h2>
<p>Replace anything in [BRACKETS] with your own details, then send it to your Bot. For the scheduled ones, ask it to make the task a routine and check the saved schedule.</p>
${recipes.map((r, i) => `<section id="${r[0]}"><h3>${i + 1}. ${esc(r[1])}</h3>
<p>${esc(r[2])}</p>
<pre class="prompt">${esc(r[3])}</pre>
<p class="note">${esc(r[4])}</p></section>`).join('\n')}
<h2>Good habits for any AI assistant</h2>
<ul class="links"><li>Start with one recipe. Add another only after the first one sticks for a week or two.</li><li>Keep "ask me before sending, booking or changing anything" in your instructions.</li><li>Double-check important dates and times. AI assistants can make mistakes.</li><li>Think about what you share. Avoid pasting health records, passwords or financial account numbers into any chat.</li><li>An assistant can remind and organize. It isn't a doctor, coach or therapist.</li></ul>
<p class="note">In our view: reminders and brain-dump sorting are the easiest wins to start with, because they take two minutes to set up and need no new app.</p>
<p><a href="${ADHD_HUB}">Back to all ADHD tools</a></p>
</article>
</main>
` + footer);
}

// ---- sitemap, robots, llms
const urls = [[HOME, maxDate], ['/vault.html', maxDate], ['/advertise.html', PAGES_UPDATED], ['/disclosure.html', PAGES_UPDATED],
  ['/terms.html', LEGAL_UPDATED], ['/privacy.html', LEGAL_UPDATED], ['/refunds.html', LEGAL_UPDATED], ['/disclaimer.html', LEGAL_UPDATED],
  [ADHD_HUB, ADHD_UPDATED], [ADHD_GROK, ADHD_UPDATED], ...cats.map(c => [`/category/${slugify(c)}.html`, maxDate]), ...guides.map(g => [guidePath(g), g.updated]), ...tools.map(t => [`/tools/${t.id}.html`, t.verified_on])];
// '/' and '/index.html' serve the same page; only the canonical '/' is listed (matches <link rel=canonical> in index.html)
const smUrls = urls;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${smUrls.map(u => `<url><loc>${SITE}${u[0]}</loc><lastmod>${u[1]}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nUser-agent: GPTBot\nAllow: /\n\nUser-agent: ClaudeBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('llms.txt', `# Agent Radar

> Agent Radar is a directory of ${tools.length} AI tools (coding agents, app builders, databases and backends, hosting and deployment, agent frameworks, LLM APIs, automation, focus and planning) with pricing summaries and free-tier information taken from each tool's official site, plus a Prompt Vault of ${prompts.length} original copy-ready prompts. Data last checked ${maxDate}. Pricing changes often; confirm on the official pricing page.

## Main pages
- [Tools directory](${SITE}${HOME}): all ${tools.length} tools
- [Prompt Vault](${SITE}/vault.html): ${prompts.length} prompts
- [Advertise](${SITE}/advertise.html): featured listings (labeled "Sponsored")
- [Disclosure](${SITE}/disclosure.html): affiliate links and sponsored listings policy
- [Terms of Use](${SITE}/terms.html), [Privacy](${SITE}/privacy.html), [Refunds](${SITE}/refunds.html), [Disclaimer](${SITE}/disclaimer.html)
- [tools.json](${SITE}/data/tools.json): raw tool data
- [Sitemap](${SITE}/sitemap.xml)

## ADHD section
- [AI tools that help with focus, by struggle](${SITE}${ADHD_HUB}): ${adhdTools.length} planning, focus, capture, reminder and email tools for people with ADHD, organized by struggle. Not medical advice; the tools don't treat ADHD.
- [How a Grok Bot assistant can help with ADHD](${SITE}${ADHD_GROK}): setup recipes for morning reminders, brain dumps, weekly reviews, appointment prep and check-ins.
${STRUGGLES.map(x => `- ${x[1]} (${SITE}${ADHD_HUB}#${x[0]}): ${adhdTools.filter(t => t.adhd.struggles.includes(x[0])).map(t => t.name).join(', ')}`).join('\n')}

## Categories
${cats.map(c => `- [${c}](${catUrl(c)}): ${byCat(c).length} tools`).join('\n')}

## Comparisons and guides
${guides.map(g => `- [${g.h1}](${SITE}${guidePath(g)}): ${g.description}`).join('\n')}

## Tools
${tools.map(t => `- [${t.name}](${toolUrl(t)}): ${t.description} ${freeTxt(t)}.${isFeatured(t) ? ' (Sponsored listing.)' : ''}`).join('\n')}
`);
console.log(`built ${tools.length} tool pages (${adhdTools.length} ADHD), ADHD hub + Grok Bot page, ${cats.length} category pages, ${guides.length} compare/best pages, advertise + disclosure + 4 policy pages, sitemap with ${smUrls.length} URLs; ${featured.length} featured (as of ${TODAY}), ${nAff} affiliate`);

// ---- ensure Vercel Web Analytics on every HTML page (hand-written pages included)
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) walk(rel); else if (e.name.endsWith('.html')) ensureAnalytics(rel);
  }
})('');
