const $=s=>document.querySelector(s);let tools=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// featured/sponsored: "featured":{"until":"YYYY-MM-DD"} is active through that date (local time)
const today=new Date().toLocaleDateString('en-CA');
const isFeat=t=>!!(t.featured&&typeof t.featured.until==='string'&&t.featured.until>=today);
const aff=t=>typeof t.affiliateUrl==='string'&&/^https:\/\//.test(t.affiliateUrl)?t.affiliateUrl:'';
const visitRel=t=>aff(t)||isFeat(t)?'sponsored noopener':'noopener';
const SP='<span class="badge b-sp" title="Paid placement">Sponsored</span> ';
let catOrder=[];
// keep category grouping, float active featured tools to the top of their category
const sortFeat=l=>l.map((t,i)=>[t,i]).sort((a,b)=>catOrder.indexOf(a[0].category)-catOrder.indexOf(b[0].category)||isFeat(b[0])-isFeat(a[0])||a[1]-b[1]).map(x=>x[0]);
function renderFeatured(){
 const el=$('#featured');if(!el)return;const f=tools.filter(isFeat);
 el.innerHTML=f.length?f.map(t=>`<a class="fcard" href="/tools/${esc(t.id)}.html">${SP}<strong>${esc(t.name)}</strong><span>${esc(t.description.length>110?t.description.slice(0,109).replace(/\s+\S*$/,'')+'…':t.description)}</span><span class="more">${esc(t.category)} →</span></a>`).join('')
  :'<a class="fcard fph" href="/advertise.html"><strong>Get your tool featured</strong><span>Top of its category plus a spot here for 30 days. Clearly labeled as sponsored.</span><span class="more">Learn more →</span></a>';
}
function render(){
 const q=$('#q').value.toLowerCase().trim(),cat=$('#cat').value,free=$('#free').checked;
 const r=sortFeat(tools.filter(t=>(!cat||t.category===cat)&&(!free||t.free_tier===true)&&
  (!q||[t.name,t.description,t.category,t.tags.join(' ')].join(' ').toLowerCase().includes(q))));
 $('#count').textContent=`${r.length} of ${tools.length} tools`;
 $('#grid').innerHTML=r.map(t=>{
  const b=t.free_tier===true?['b-yes','Free tier']:t.free_tier===false?['b-no','No free tier found']:['b-unk','Free tier unverified'],f=isFeat(t);
  return `<article class="card${f?' featured':''}"><span class="cat">${esc(t.category)}</span>
  <h2><a href="/tools/${esc(t.id)}.html">${esc(t.name)}</a></h2>
  <div>${f?SP:''}<span class="badge ${b[0]}">${b[1]}</span></div>
  <p>${esc(t.description)}</p><p class="price">${esc(t.pricing_summary)}</p>
  <div class="tags">${t.tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
  <a class="pl" href="${esc(aff(t)||t.url)}" target="_blank" rel="${visitRel(t)}">Official site ↗</a> <a class="pl" href="${esc(t.pricing_url)}" target="_blank" rel="noopener">Official pricing ↗</a></article>`}).join('')||'<p>No tools match.</p>';
}
fetch('data/tools.json').then(r=>r.json()).then(d=>{tools=d;catOrder=[...new Set(d.map(t=>t.category))];
 [...new Set(d.map(t=>t.category))].sort().forEach(c=>$('#cat').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
 renderFeatured();render();}).catch(()=>{$('#count').textContent='Failed to load data/tools.json (serve via a local web server, e.g. python3 -m http.server).'});
['input','change'].forEach(e=>document.addEventListener(e,render));
