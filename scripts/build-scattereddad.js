#!/usr/bin/env node
// Static generator for the Scattered Dad site: node scripts/build-scattereddad.js
// Writes scattereddad/*.html + style.css, site.js, favicon.svg, sitemap.xml, robots.txt, llms.txt, 404.html.
// Served at https://scattereddad.com via host-based `routes` in vercel.json (files live under /scattereddad/).
// Tool facts come from data/tools.json (tools tagged "adhd"). og.png is a committed, original image.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'scattereddad');
const SITE = 'https://scattereddad.com';
const UPDATED = '2026-11-09', UPDATED_TXT = 'November 9, 2026';
const CONTACT = 'agentradar.dan@gmail.com';
const V = '4'; // asset cache-buster
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tools.json'), 'utf8')).filter(t => t.tags.includes('adhd'));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const write = (rel, txt) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const NAV = [['/start-here', 'Start here'], ['/tools', 'Tools'], ['/grok-bot-for-adhd', 'Grok Bot'], ['/videos', 'Videos'], ['/about', 'About']];
const navLinks = cur => NAV.map(([h, l]) => `<a href="${h}"${cur === h ? ' aria-current="page"' : ''}>${l}</a>`).join('');
const LOGO = `<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" fill="#F26B1D"/><path d="M8 11h7M19 8l5 3M7 20l4-3M22 17h5M12 26h10" stroke="#0E0F11" stroke-width="3" stroke-linecap="square"/></svg>`;
const DISC = `<strong>Not medical, mental-health or nutrition advice.</strong> This is one dad's personal experience. Talk to a qualified professional about ADHD care or weight management. Some links may earn me a commission someday; if they do, they'll be labeled right next to the link.`;

function page({ p, title, desc, body, cur, type = 'website', jsonld = '', bodyClass = '' }) {
  const url = SITE + p;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="Scattered Dad"><meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Scattered Dad: scattered brain, still showing up.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${SITE}/og.png">
<meta name="theme-color" content="#0E0F11">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/anton.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css?v=${V}">
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>
<script defer src="/site.js?v=${V}"></script>
${jsonld}</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap bar">
<a class="logo" href="/" aria-label="Scattered Dad home">${LOGO}<span>Scattered<b>Dad</b></span></a>
<nav class="main" aria-label="Main">${navLinks(cur)}</nav>
<a class="btn p sm hdr-cta" href="/newsletter">Newsletter</a>
<details class="menu"><summary>Menu</summary><nav aria-label="Mobile">${navLinks(cur)}<a href="/newsletter">Newsletter</a></nav></details>
</div></header>
<main id="main">
${body}
</main>
<footer><div class="wrap">
<p class="disc">${DISC}</p>
<nav aria-label="Footer"><a href="/about">About</a><a href="/newsletter">Newsletter</a><a href="/affiliate-disclosure">Affiliate disclosure</a><a href="/disclaimer">Disclaimer</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav>
<p class="fine">&copy; 2026 Scattered Dad. Run by Dan, one guy in Florida with a lot of tabs open.</p>
</div></footer>
</body></html>
`;
}

// ---- hero art: scattered to-dos pulled into one task (original SVG)
function art() {
  const frags = [[16, 24, -7, 'KEYS?'], [300, 14, 5, 'DENTIST 3PM'], [10, 128, 4, '47 UNREAD'], [352, 118, -6, 'GYM 6AM'], [6, 330, -4, 'CAR INSPECTION'], [290, 372, 6, 'TUITION FORM'], [168, 4, 2, 'LUNCH $'], [150, 404, -5, 'CALL MOM'], [356, 306, 3, 'MEAL PREP'], [4, 232, -3, 'BILLS']];
  let lines = '', g = '';
  for (const [x, y, r, l] of frags) {
    const w = l.length * 9.5 + 26, cx = x + w / 2, cy = y + 18;
    lines += `<path d="M${cx.toFixed(0)} ${cy} Q ${((cx + 240) / 2 + 20).toFixed(0)} ${((cy + 228) / 2 - 20).toFixed(0)} 240 228" stroke="#F26B1D" stroke-opacity=".7" stroke-width="2" stroke-dasharray="3 7" fill="none"/>`;
    g += `<g transform="translate(${x} ${y}) rotate(${r} ${(w / 2).toFixed(0)} 18)" class="frag"><rect width="${w.toFixed(0)}" height="36" fill="#1E2126" stroke="#2A2D33" stroke-width="1.5"/><text x="13" y="23" fill="#A9AAAE" font-size="13.5" font-weight="700" letter-spacing="1.6" font-family="Inter, system-ui, sans-serif">${l}</text></g>`;
  }
  return `<svg viewBox="0 0 480 450" role="img" aria-labelledby="artT"><title id="artT">Ten scattered to-dos, from keys to tuition forms, pulled into one clear task: today, one thing.</title>${lines}${g}
<g transform="translate(110 168)"><rect x="8" y="8" width="260" height="120" fill="none" stroke="#F26B1D" stroke-width="2"/><rect width="260" height="120" fill="#F26B1D"/><text x="20" y="34" fill="#0E0F11" font-size="14" font-weight="800" letter-spacing="3" font-family="Inter, system-ui, sans-serif">TODAY</text><text x="20" y="96" fill="#0E0F11" font-size="50" font-family="Anton, Impact, sans-serif" letter-spacing="1" textLength="222" lengthAdjust="spacingAndGlyphs">ONE THING.</text></g></svg>`;
}
const pageHead = (eyebrow, h1, lede) => `<div class="phead"><div class="wrap"><p class="eyebrow">${eyebrow}</p><h1 class="h1 sm">${h1}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div></div>`;
const signupForm = (id = 'signup') => `<form class="signup" data-signup novalidate>
<label for="${id}-email">Email address</label>
<div class="row"><input id="${id}-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@email.com" required><button type="submit">Count me in</button></div>
<div class="hp" aria-hidden="true"><label for="${id}-web">Leave this empty</label><input id="${id}-web" name="website" tabindex="-1" autocomplete="off"></div>
<p class="msg" role="status" aria-live="polite"></p>
<small>No spam. Unsubscribe with one click. See the <a href="/privacy">privacy policy</a>.</small>
</form>`;

// ---------- HOME
const home = `<div class="hero"><div class="wrap">
<div class="htext"><p class="eyebrow">New channel. Starting now.</p>
<h1 class="h1">Scattered brain. <em>Still showing up.</em></h1>
<p class="lede">48. Divorced dad. ADHD brain. Twin daughters heading to college. I'm documenting the messy rebuild: <strong>systems, weight loss, and the AI tools that keep the lights on.</strong></p>
<div class="ctas"><a class="btn p" href="/start-here">Start here</a><a class="btn g" href="/videos">Videos: coming soon</a></div></div>
<!-- DAN PHOTO SLOT: when Dan supplies a real photo, save it as scattereddad/assets/dan.jpg and replace this figure's SVG with
     <img src="/assets/dan.jpg" alt="Dan, the Scattered Dad" width="960" height="900" fetchpriority="high"> (keep the figure). -->
<figure class="photo-slot" data-photo-slot="hero">${art()}</figure>
</div></div>
<div class="wrap stats" role="list">
<div class="stat" role="listitem"><strong>48</strong><small>Years in</small></div>
<div class="stat" role="listitem"><strong>2</strong><small>Daughters. College, fall '27</small></div>
<div class="stat" role="listitem"><strong>1</strong><small>Brain that won't sit still</small></div>
<div class="stat" role="listitem"><strong>0</strong><small>Miracle claims</small></div></div>
<section><div class="wrap"><h2 class="h2">Pick a lane</h2><p class="sub">Three ways in. No 40-tab rabbit hole required.</p>
<div class="cards">
<a class="card" href="/videos"><span class="num">01 / Videos</span><h3>Watch the rebuild</h3><p>On camera, no polish: ADHD days, dad logistics and the scale. The first videos are coming soon.</p><span class="tag">Coming soon</span><span class="go">See what's planned &rarr;</span></a>
<a class="card" href="/tools"><span class="num">02 / Tools</span><h3>Tools that help me focus</h3><p>Planners, focus timers and brain-dump apps, sorted by the problem they help with. Prices checked on official sites.</p><span class="go">Browse the tools &rarr;</span></a>
<a class="card" href="/grok-bot-for-adhd"><span class="num">03 / Grok Bot</span><h3>Bot setups you can copy</h3><p>Five copy-paste setups: morning checklist, brain-dump sorter, Sunday review and more. You stay in charge.</p><span class="go">Get the setups &rarr;</span></a>
</div></div></section>
<section class="tight"><div class="wrap"><h2 class="h2">The rules here</h2><p class="sub">What you'll get from me, and what you won't.</p>
<div class="split"><div class="box yes"><h3>You'll get</h3><ul><li>What I actually tried, and how it went</li><li>Honest prices, checked on the official site</li><li>Short pages. Headings you can skim.</li><li>Paid links labeled, right next to the link</li></ul></div>
<div class="box no"><h3>You won't get</h3><ul><li>Medical advice. I'm a dad, not a doctor.</li><li>"Cure your ADHD" or "fix your brain" talk</li><li>Weight-loss promises. My results are just mine.</li><li>Shame. We all lose the keys.</li></ul></div></div></div></section>
<section class="tight"><div class="wrap narrow"><div class="one"><p class="eyebrow">Today's one thing</p><h2 class="h2">Empty your head in 2 minutes</h2>
<p>Open any AI chat and paste this. Then do the first tiny step it gives you. That's the whole assignment.</p>
<div class="prompt"><pre id="p-home">Here's my brain dump: [EVERYTHING ON YOUR MIND]. Sort it into Today, This week and Later. For each Today item, give me one first step that takes under 5 minutes. Don't add anything I didn't say.</pre><button class="copy" type="button" data-copy="p-home">Copy</button></div></div></div></section>
<div class="band"><div class="wrap narrow"><h2 class="h2">Get the short version</h2><p>One email when there's something worth your time: new videos, what's working and what I quit.</p>${signupForm('home')}</div></div>`;

// ---------- ABOUT
const about = pageHead('About', 'Hi. I\'m Dan.', 'Divorced dad, ADHD brain, 48 years in. This is where I figure it out out loud.') + `<div class="wrap narrow prose">
<div class="tldr"><strong>TL;DR</strong><ul><li>48, divorced, ADHD, twin daughters heading to college in fall 2027.</li><li>I'm starting an on-camera channel about all of it, including my weight loss.</li><li>This site is the home base: videos, tools that help me focus, and Grok Bot setups.</li><li>I'm not a doctor, therapist or dietitian. Nothing here is medical advice.</li></ul></div>
<h2>The short story</h2>
<p>I have ADHD. I'm divorced. My twin daughters head off to college in fall 2027, which is coming up faster than my brain is comfortable with.</p>
<p>For a long time my "system" was remembering things. That works great until it doesn't. Missed forms. Forgotten calls. A car inspection sticker from a different era.</p>
<p>So I'm rebuilding. Systems instead of willpower. Tools instead of guilt. And I'm doing it on camera, because if I'm going to lose the keys anyway, I might as well get a video out of it.</p>
<h2>What the channel covers</h2>
<ul><li><strong>ADHD, day to day.</strong> The tools, routines and workarounds I try, and which ones survive past week two.</li><li><strong>Divorced-dad life.</strong> Logistics, two calendars, college prep, and being there for my girls.</li><li><strong>My weight loss.</strong> My own numbers and what I'm doing. Those are my results, not a prediction or a promise for anyone else.</li><li><strong>AI that keeps the lights on.</strong> Including the Grok Bot setups I use to stay on track.</li></ul>
<h2>What this isn't</h2>
<ul><li>It isn't medical, mental-health or nutrition advice. I share what I do; talk to a qualified professional about yours.</li><li>It isn't a place for medication or prescription talk. That's between you and your doctor.</li><li>It isn't a guru thing. No "hack your brain," no "cure," no before-and-after miracles.</li></ul>
<h2>How I keep it honest</h2>
<ul><li>If I haven't tried a tool on camera yet, the page says so.</li><li>Prices come from the tool's official site, with the date I checked.</li><li>If I ever earn money from a link, it says "Paid link" right next to it. See the <a href="/affiliate-disclosure">affiliate disclosure</a>.</li></ul>
<!-- DAN PHOTO SLOT (about): optional second photo here, e.g. <img src="/assets/dan-about.jpg" alt="..." width="720" height="480" loading="lazy"> -->
<p class="cta-row"><a class="btn p" href="/start-here">Start here</a><a class="btn g" href="/newsletter">Get the newsletter</a></p>
</div>`;

// ---------- START HERE
const start = pageHead('Start here', 'New here? Do these three things.', 'Not thirty. Three. In order. Then go live your life.') + `<div class="wrap narrow prose">
<ol class="steps">
<li><span class="n">1</span><div><h2>Meet the guy</h2><p>Read the <a href="/about">two-minute about page</a>. The first videos are coming soon; when they're up, the <a href="/videos">videos page</a> will list them in watch order.</p></div></li>
<li><span class="n">2</span><div><h2>Try one free thing</h2><p>Pick the problem that's loudest today:</p><ul><li><strong>Can't start:</strong> Goblin Tools' Magic ToDo breaks a task into tiny steps. The website is free and needs no account.</li><li><strong>Head too full:</strong> use the <a href="/grok-bot-for-adhd#brain-dump">brain-dump recipe</a> in any AI chat.</li><li><strong>Can't see the day:</strong> try the free version of a visual planner like Tiimo or Structured.</li></ul><p>Just one. More tools are on the <a href="/tools">tools page</a> when you're ready.</p></div></li>
<li><span class="n">3</span><div><h2>Get the short version</h2><p>Join the newsletter. One email when there's something worth your time.</p>${signupForm('start')}</div></li>
</ol>
<p class="note">Not medical advice. These are tools and habits, not treatment. If you have questions about ADHD, talk to a doctor or other licensed professional.</p>
</div>`;

// ---------- TOOLS
const LANES = [
  ['planning', "Can't see the day", 'Time blindness is real. These planners put the day in front of you so you can see what actually fits.', "Where I'd start: a free visual planner (Tiimo or Structured) before paying for an auto-scheduler."],
  ['start', "Can't get started", 'When a task feels like a wall, these break it into a first step small enough to actually take.', "Where I'd start: Goblin Tools. Free website, no account, no excuses."],
  ['focus', "Can't stay on it", 'Focus sessions with a real person or the right sound, so the next 25 minutes go to one thing.', "Where I'd start: Focusmate's free plan (3 sessions a week) to see if working next to someone helps."],
  ['capture', "Head's too full", 'Get it out of your head and into one place, fast, before it evaporates.', "Where I'd start: whatever's already on your phone. Voice capture beats typing."],
];
const LABELS = { planning: 'Planning', start: 'Getting started', focus: 'Focus', capture: 'Brain dump', reminders: 'Reminders', admin: 'Email & admin' };
const AFF_SLOTS = ['sunsama', 'motion', 'akiflow', 'reclaim', 'saner-ai'];
const toolCard = t => `<article class="tool" id="${t.id}"${AFF_SLOTS.includes(t.id) ? ' data-affiliate-slot' : ''}>
<header><h3>${esc(t.name)}</h3><span class="badge ${t.free_tier === true ? 'yes' : 'no'}">${t.free_tier === true ? 'Free plan' : t.free_tier === false ? 'No free plan' : 'Free plan unverified'}</span></header>
<p>${esc(t.description)}</p>
<p class="why"><strong>Why it might help:</strong> ${esc(t.adhd.helps)}</p>
<p class="price"><strong>Price:</strong> ${esc(t.pricing_summary)} <span class="checked">Checked ${fmtDate(t.verified_on)} on the <a href="${esc(t.pricing_url)}" rel="noopener" target="_blank">official pricing page<span class="sr"> (opens in a new tab)</span></a>.</span></p>
<p class="also">${t.adhd.struggles.map(s => `<span class="tag">${LABELS[s]}</span>`).join('')}</p>
<p class="status">My video review: <strong>not yet</strong>. Coming.</p>
<a class="btn g sm" href="${esc(t.url)}" rel="noopener" target="_blank">Official site<span class="sr"> for ${esc(t.name)} (opens in a new tab)</span> &rarr;</a>
</article>`;
const toolsBody = pageHead('Tools', 'Tools that help me focus', "Sorted by the problem, not the brand. Facts come from each tool's official site. Opinions are labeled as mine.") + `<div class="wrap">
<div class="narrow-l"><div class="tldr"><strong>TL;DR</strong><ul><li>${tools.length} tools, grouped by what you're stuck on.</li><li>Start with one free option. Add a paid one only after a habit sticks.</li><li>I haven't reviewed these on camera yet. Reviews are coming, and this page will say which ones I keep.</li><li>No paid links on this page right now. If that changes, they'll say "Paid link" right next to them.</li></ul></div>
<nav class="chips" aria-label="Jump to a problem">${LANES.map(l => `<a href="#${l[0]}">${l[1]}</a>`).join('')}</nav></div>
${LANES.map(([id, h, d, pick]) => { const list = tools.filter(t => t.adhd.struggles[0] === id); return `<section class="lane" id="${id}" aria-labelledby="${id}-h"><h2 class="h2" id="${id}-h">${h}</h2><p class="sub">${d}</p><p class="pick"><span>My take</span>${pick}</p><div class="tools">${list.map(toolCard).join('')}</div></section>`; }).join('')}
<p class="note">Not medical advice. These are productivity tools, not treatment, and they don't diagnose or treat ADHD or anything else. Prices change often; always confirm on the official site before you buy.</p>
</div>`;

// ---------- GROK BOT
const RECIPES = [
  ['morning', 'Morning checklist', 'Same checklist, same time, every weekday. The routine stops being something I have to remember.', 'Every weekday at 7:00 AM, send me my morning checklist: [KEYS, WALLET, PHONE CHARGER; ANYTHING ELSE]. Then list today\'s calendar events with the time I need to leave for each. End by asking me which one thing matters most today. Keep it under 10 lines.', 'Ask the Bot to make it a routine, then check the saved schedule and your time zone.'],
  ['brain-dump', 'Brain dump sorter', 'Dump everything in one messy message (voice note works). Get back a short, sorted list.', 'Here is my brain dump: [EVERYTHING ON YOUR MIND, IN ANY ORDER]. Sort it into Today, This week, Later and Not mine. For each Today item, give me one tiny first step that takes under 5 minutes. Don\'t add anything I didn\'t say. Keep it short.', 'If you\'ve connected a to-do app like Todoist or Notion, you can ask it to add the Today items there.'],
  ['sunday', 'Sunday review', 'A Sunday look at the week, so Monday doesn\'t ambush me.', 'Every Sunday at 6:00 PM, read my Google Calendar for the coming week. Flag clashes, packed days and early starts. List anything I told you I would do this week. Then send me a short plan for Monday with no more than 3 priorities. Don\'t create, move or cancel any event without asking me.', 'Needs Google Calendar connected. With two households, this is where pickup clashes show up early.'],
  ['appointments', 'Appointment prep', 'The night before: what\'s tomorrow, when to leave and what to bring.', 'Every evening at 8:00 PM, look at tomorrow\'s calendar. For each appointment, tell me the time, when I need to leave, what to bring (paperwork, ID, payment) and any questions I wrote down for it. If something has no address or details, flag it. Don\'t change any event.', 'Keep sensitive details out of reminder text if other people can see your phone.'],
  ['check-ins', 'Work-block check-ins', 'Short check-ins during a work block, so I notice when I\'ve drifted.', 'Today from 1:00 PM to 3:00 PM, check in with me every 30 minutes. Ask in one line what I\'m working on and whether I\'m still on it. If I say I drifted, ask me for the next tiny step and nothing else. Stop at 3:00 PM.', 'These are messages from an AI, not a person. If you want a real person working alongside you, see Focusmate on the tools page.'],
];
const grok = pageHead('Grok Bot', 'Grok Bot setups for a scattered brain', 'Copy-paste setups that carry some of the remembering for me. Life systems, not treatment.') + `<div class="wrap narrow prose">
<div class="tldr"><strong>TL;DR</strong><ul><li>Grok Bot is an AI assistant that can chat, take voice notes, connect apps like Gmail and Google Calendar, and run scheduled routines.</li><li>Below: 5 setups I'm starting with. Copy one, swap the [BRACKETS], send it.</li><li>The Bot drafts and reminds. Anything that changes your calendar or sends email waits for your OK.</li><li>I use Grok Bot to help run this site. Nobody paid for this page, and there are no paid links on it.</li></ul></div>
<h2>Why bother</h2>
<p>A lot of my ADHD friction is remembering. The routine. The appointment. The thing I said I'd do. An assistant that messages me on a schedule carries some of that load, so my brain doesn't have to.</p>
<p>These are the setups I'm starting with. I'll report back on video about which ones stick and which ones I mute by Thursday.</p>
<h2>What it can do</h2>
<ul><li>Chat by text, voice note or voice call, on desktop, mobile, Slack or X.</li><li>Connect apps you already use, like Gmail, Google Calendar, Notion and Google Drive.</li><li>Turn something you ask for often into a routine on a schedule.</li><li>Remember your preferences, so you don't re-explain your setup.</li><li>Draft emails and messages for you to approve and send.</li></ul>
<p class="src">Source: <a href="https://docs.x.ai/grok-bot/overview" rel="noopener" target="_blank">Grok Bot overview (official docs)<span class="sr"> (opens in a new tab)</span></a>, checked ${UPDATED_TXT}. Features and plans can change.</p>
<h2>The five setups</h2>
<p>Replace anything in [BRACKETS] with your details. For the scheduled ones, ask the Bot to make it a routine.</p>
${RECIPES.map(([id, h, d, pr, tip], i) => `<div class="recipe" id="${id}"><p class="eyebrow">Setup ${i + 1}</p><h3>${h}</h3><p>${d}</p><div class="prompt"><pre id="p-${id}">${esc(pr)}</pre><button class="copy" type="button" data-copy="p-${id}">Copy</button></div><p class="tip"><strong>Tip:</strong> ${esc(tip)}</p></div>`).join('')}
<h2>House rules for any AI assistant</h2>
<ul><li>Start with one setup. Add another only after the first one sticks for a week or two.</li><li>Keep "ask me before sending, booking or changing anything" in your instructions.</li><li>Double-check important dates and times. AI makes mistakes.</li><li>Don't paste health records, passwords or account numbers into any chat.</li><li>It can remind and organize. It isn't a doctor, coach or therapist.</li></ul>
<p class="note">Not medical advice. Grok Bot isn't a clinician and doesn't diagnose or treat ADHD. Other assistants with reminders or scheduled tasks can run similar setups.</p>
</div>`;

// ---------- VIDEOS
const SERIES = [['Tool test-drives', 'I try one focus or planning tool for real, on camera, and tell you if it survived past week two.'], ['Dad logistics', 'Two households, one calendar, college prep for two. The systems that keep it from falling apart.'], ['The weight log', 'My weight-loss journey, my numbers, my meals. Not a program. Not a promise. Just what I do.'], ['Grok Bot setups', 'Screen-share walkthroughs of the setups on this site, and what I changed after living with them.']];
const videos = pageHead('Videos', 'First videos are coming soon.', "I'm not going to pretend there's a back catalog. Here's what's planned.") + `<div class="wrap">
<div class="cards four">${SERIES.map(([h, d], i) => `<div class="card static"><span class="num">Series ${String(i + 1).padStart(2, '0')}</span><h3>${h}</h3><p>${d}</p><span class="tag">Planned</span></div>`).join('')}</div>
<div class="narrow-l"><div class="box mt"><h3>Where to watch</h3><p>Channel links go here the day they're live. Want a heads-up when the first one drops?</p><a class="btn p" href="/newsletter">Get the newsletter</a></div>
<p class="note">Anything I say on camera is personal experience, not medical, mental-health or nutrition advice. If a video ever includes a paid link or sponsor, I'll say so in the video and at the top of the description.</p></div>
</div>`;

// ---------- NEWSLETTER
const newsletter = pageHead('Newsletter', 'Get the short version.', 'One email when there\'s something worth your time.') + `<div class="wrap narrow prose">
<ul class="checks"><li>New videos, when they're up</li><li>What's working for me, and what I quit</li><li>One tool or setup worth trying, at most</li></ul>
${signupForm('nl')}
<p>No set schedule yet; probably weekly-ish once the channel is rolling. No spam, ever, and every email has a one-click unsubscribe. Your email is used only for this newsletter. Details in the <a href="/privacy">privacy policy</a>.</p>
</div>`;

// ---------- LEGAL
const legal = (eyebrow, h1, inner) => pageHead(eyebrow, h1, `Last updated: ${UPDATED_TXT}`) + `<div class="wrap narrow prose legal">${inner}</div>`;
const disclosure = legal('Affiliate disclosure', 'How this site makes money', `
<p>Scattered Dad is run by Dan, a sole proprietor in Florida, USA. This page explains any "material connection" I have to the products I talk about, in plain English.</p>
<h2>Right now</h2><p>As of the date above, there are <strong>no affiliate links and no sponsors</strong> on this site. Nobody has paid me to mention anything here.</p>
<h2>If that changes</h2><ul><li>Some links may become affiliate links. If you buy through one, I may earn a commission at no extra cost to you.</li><li>Every paid link will be labeled <strong>"Paid link"</strong> right next to it, not just on this page.</li><li>If a company sponsors a video or gives me something free to try, I'll say so in the video itself and near the top of the description.</li><li>Money doesn't buy a good review. Prices and facts come from the official site; opinions are labeled as mine.</li></ul>
<h2>Tools I use</h2><p>I use Grok Bot to help run this site. That's a tool I use, not a paid relationship.</p>
<h2>Questions</h2><p>Email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>`);
const disclaimer = legal('Disclaimer', 'The fine print, in plain English', `
<h2>Not medical advice</h2><p>Everything on Scattered Dad, including videos, pages, emails and setups, is personal experience and general information. It is <strong>not medical, mental-health, psychological or nutrition advice</strong>, and it isn't a substitute for care from a qualified professional. I'm not a doctor, therapist, coach or dietitian.</p>
<p>Nothing here diagnoses, treats, cures or prevents ADHD or any other condition. If you have questions about ADHD, symptoms, medication or treatment, talk to a doctor or other licensed professional. I don't discuss or recommend medications or prescribing services.</p>
<h2>Weight loss</h2><p>When I share my weight-loss journey, those are <strong>my own results</strong>. They aren't typical, and they aren't a promise or prediction of what anyone else will experience. Talk to a qualified professional before changing your diet or exercise.</p>
<h2>Tools and AI</h2><p>Tools listed here are productivity software, not treatment. Prices and features change; always confirm on the official site. AI assistants can make mistakes, so double-check anything important, and think about what personal information you share with them.</p>
<h2>In a crisis</h2><p>If you're in crisis or thinking about harming yourself, call or text 988 (Suicide &amp; Crisis Lifeline, US) or call 911.</p>
<h2>No warranties</h2><p>This site is provided as-is. See the <a href="/terms">terms of use</a>.</p>`);
const privacy = legal('Privacy', 'What I collect, and what I don\'t', `
<p>Scattered Dad (scattereddad.com) is run by Dan, a sole proprietor in Florida, USA. I collect as little as possible. You can read everything here without an account.</p>
<h2>What I collect</h2><ul><li><strong>Newsletter:</strong> if you sign up, your email address. That's all the form asks for.</li><li><strong>Emails you send me:</strong> I keep them so I can reply.</li><li><strong>Server logs:</strong> my host, Vercel, processes standard technical data (like IP address, browser type and pages requested) to deliver and secure the site.</li><li><strong>Analytics:</strong> Vercel Web Analytics, which doesn't use cookies and reports aggregated page views.</li></ul>
<p>No advertising trackers. No tracking cookies.</p>
<h2>How it's used</h2><p>Your email is used only to send the Scattered Dad newsletter. It's kept on its own list, separate from any other project.</p>
<h2>Who processes it</h2><ul><li><a href="https://vercel.com/legal/privacy-policy" rel="noopener">Vercel</a>: hosting, server logs and Web Analytics</li><li><a href="https://resend.com/legal/privacy-policy" rel="noopener">Resend</a>: storing the newsletter list and sending emails</li></ul>
<h2>I don't sell your data</h2><p>I don't sell, rent or trade personal information, and I don't share it except with the providers above or when the law requires it.</p>
<h2>Unsubscribing and deletion</h2><p>Every newsletter email has an unsubscribe link. To have your email deleted completely, or to ask what I hold about you, email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
<h2>Children</h2><p>This site isn't directed at children under 13, and I don't knowingly collect their information. If you think a child gave me their email, contact me and I'll delete it.</p>
<h2>Changes</h2><p>If this policy changes, I'll update the date above.</p>`);
const terms = legal('Terms', 'Terms of use', `
<p>Scattered Dad (scattereddad.com) is a small independent website run by Dan, a sole proprietor in Florida, USA ("I", "me"). By using the site or the newsletter, you agree to these terms. If you don't agree, please don't use the site.</p>
<h2>Personal experience, not advice</h2><p>The site shares personal experience and general information. It isn't medical, mental-health, nutrition, legal or financial advice. See the <a href="/disclaimer">disclaimer</a>.</p>
<h2>Provided as-is</h2><p>I try to keep things accurate, but tools change their prices and features often, and information may be incomplete or out of date. The site is provided "as is" and "as available", without warranties of any kind, express or implied.</p>
<h2>Limitation of liability</h2><p>To the fullest extent allowed by law, I'm not liable for any indirect, incidental, special or consequential damages arising from your use of the site, its information or any third-party tool you find through it. If I'm found liable for anything, my total liability is limited to $100.</p>
<h2>Third-party tools and links</h2><p>The site links to tools and sites run by other companies. A link isn't an endorsement, and those companies' own terms and policies apply. See the <a href="/affiliate-disclosure">affiliate disclosure</a>.</p>
<h2>Prompts and setups</h2><p>You're free to copy and use the prompts and setups here. You're responsible for reviewing anything an AI tool produces before relying on it.</p>
<h2>Using the site</h2><p>Please don't break the law using the site, try to disrupt or gain unauthorized access to it, scrape it in a way that harms performance, or sign other people up for the newsletter without permission.</p>
<h2>Intellectual property</h2><p>The original text, artwork and design of Scattered Dad belong to me. Tool names and trademarks belong to their owners and are used only to identify the tools; no affiliation or endorsement is implied. If you think something here infringes your rights, email <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
<h2>Governing law</h2><p>These terms are governed by the laws of the State of Florida, USA. Any dispute will be handled in the state or federal courts located in Florida.</p>
<h2>Changes</h2><p>I may update these terms; the date above will change when I do. Continuing to use the site means you accept the updated terms.</p>
<h2>Contact</h2><p><a href="mailto:${CONTACT}">${CONTACT}</a></p>`);
const notFound = pageHead('404', 'Lost the page. Classic.', 'Happens to the best of us. Usually with keys.') + `<div class="wrap narrow prose"><p class="cta-row"><a class="btn p" href="/">Go home</a><a class="btn g" href="/start-here">Start here</a></p></div>`;

const PAGES = [
  { p: '/', file: 'index.html', title: 'Scattered Dad: ADHD, divorced-dad life and the tools that keep me on track', desc: "Dan, 48, divorced dad with an ADHD brain, documenting the rebuild: systems, weight loss and the AI tools that help me focus. Not medical advice.", body: home, cur: '/', bodyClass: 'home',
    jsonld: ld({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: 'Scattered Dad', url: SITE + '/' }, { '@type': 'Person', name: 'Dan', url: SITE + '/about', description: '48-year-old divorced dad with ADHD documenting systems, weight loss and AI tools on camera.' }] }) },
  { p: '/about', title: "About Dan | Scattered Dad", desc: "Divorced dad, ADHD brain, twin daughters heading to college. What the Scattered Dad channel covers, and what it isn't.", body: about, cur: '/about', type: 'profile' },
  { p: '/start-here', title: 'Start here | Scattered Dad', desc: 'New to Scattered Dad? Three steps: meet Dan, try one free tool, get the newsletter.', body: start, cur: '/start-here' },
  { p: '/tools', title: 'Tools that help me focus (ADHD-friendly planners & apps) | Scattered Dad', desc: `${tools.length} planners, focus and brain-dump tools sorted by the problem they help with, with prices checked on official sites. Not medical advice.`, body: toolsBody, cur: '/tools' },
  { p: '/grok-bot-for-adhd', title: 'Grok Bot setups for ADHD: 5 copy-paste routines | Scattered Dad', desc: 'Five copy-paste Grok Bot setups for a scattered brain: morning checklist, brain-dump sorter, Sunday review, appointment prep and check-ins. Not medical advice.', body: grok, cur: '/grok-bot-for-adhd', type: 'article' },
  { p: '/videos', title: 'Videos | Scattered Dad', desc: 'The Scattered Dad channel: tool test-drives, dad logistics, the weight log and Grok Bot setups. First videos coming soon.', body: videos, cur: '/videos' },
  { p: '/newsletter', title: 'Newsletter | Scattered Dad', desc: "Get the short version: new videos, what's working and what I quit. No spam, one-click unsubscribe.", body: newsletter, cur: '/newsletter' },
  { p: '/affiliate-disclosure', title: 'Affiliate disclosure | Scattered Dad', desc: 'How Scattered Dad makes money, and how paid links and sponsors are labeled.', body: disclosure },
  { p: '/disclaimer', title: 'Disclaimer | Scattered Dad', desc: "Scattered Dad is personal experience, not medical, mental-health or nutrition advice. Weight-loss results are Dan's own.", body: disclaimer },
  { p: '/privacy', title: 'Privacy policy | Scattered Dad', desc: 'What Scattered Dad collects (your email, if you sign up) and what it doesn\'t.', body: privacy },
  { p: '/terms', title: 'Terms of use | Scattered Dad', desc: 'The ground rules for using scattereddad.com.', body: terms },
];
for (const pg of PAGES) write(pg.file || pg.p.slice(1) + '.html', page(pg));
write('404.html', page({ p: '/404', title: 'Page not found | Scattered Dad', desc: 'That page wandered off.', body: notFound }).replace('<link rel="canonical" href="https://scattereddad.com/404">', '<meta name="robots" content="noindex">'));

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(pg => `<url><loc>${SITE}${pg.p}</loc><lastmod>${UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`);
write('llms.txt', `# Scattered Dad

> Home base for Dan's on-camera channel: a 48-year-old divorced dad with ADHD documenting systems, weight loss and the AI tools that help him focus. Personal experience only; not medical, mental-health or nutrition advice.

Dan's twin daughters head to college in fall 2027. The site lists ADHD-friendly productivity tools (non-medical) sorted by problem, with prices checked on official sites on ${UPDATED_TXT}, plus copy-paste Grok Bot setups. There are currently no affiliate links or sponsors. Video reviews are coming; tools have not yet been reviewed on camera.

## Pages
${PAGES.map(pg => `- [${pg.title.replace(/ \| Scattered Dad$/, '')}](${SITE}${pg.p}): ${pg.desc}`).join('\n')}

## Tools listed
${tools.map(t => `- ${t.name} (${t.url}): ${t.description} Price: ${t.pricing_summary} (checked ${t.verified_on})`).join('\n')}
`);
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34"><rect width="34" height="34" rx="3" fill="#F26B1D"/><path d="M8 11h7M19 8l5 3M7 20l4-3M22 17h5M12 26h10" stroke="#0E0F11" stroke-width="3" stroke-linecap="square"/></svg>\n`);
console.log(`scattereddad: ${PAGES.length} pages + 404, ${tools.length} tools`);
