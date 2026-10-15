const $=s=>document.querySelector(s);let tools=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const q=$('#q').value.toLowerCase().trim(),cat=$('#cat').value,free=$('#free').checked;
 const r=tools.filter(t=>(!cat||t.category===cat)&&(!free||t.free_tier===true)&&
  (!q||[t.name,t.description,t.category,t.tags.join(' ')].join(' ').toLowerCase().includes(q)));
 $('#count').textContent=`${r.length} of ${tools.length} tools`;
 $('#grid').innerHTML=r.map(t=>{
  const b=t.free_tier===true?['b-yes','Free tier']:t.free_tier===false?['b-no','No free tier found']:['b-unk','Free tier unverified'];
  return `<article class="card"><span class="cat">${esc(t.category)}</span>
  <h2><a href="/tools/${esc(t.id)}.html">${esc(t.name)}</a></h2>
  <div><span class="badge ${b[0]}">${b[1]}</span></div>
  <p>${esc(t.description)}</p><p class="price">${esc(t.pricing_summary)}</p>
  <div class="tags">${t.tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
  <a class="pl" href="${esc(t.url)}" target="_blank" rel="noopener">Official site ↗</a> <a class="pl" href="${esc(t.pricing_url)}" target="_blank" rel="noopener">Official pricing ↗</a></article>`}).join('')||'<p>No tools match.</p>';
}
fetch('data/tools.json').then(r=>r.json()).then(d=>{tools=d;
 [...new Set(d.map(t=>t.category))].sort().forEach(c=>$('#cat').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
 render();}).catch(()=>{$('#count').textContent='Failed to load data/tools.json (serve via a local web server, e.g. python3 -m http.server).'});
['input','change'].forEach(e=>document.addEventListener(e,render));
