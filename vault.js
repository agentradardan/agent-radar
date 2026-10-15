const $=s=>document.querySelector(s);let prompts=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hl=s=>esc(s).replace(/\[([^\]\n]+)\]/g,'<mark>[$1]</mark>');
function render(){
 const q=$('#q').value.toLowerCase().trim(),cat=$('#cat').value;
 const r=prompts.filter(p=>(!cat||p.category===cat)&&(!q||[p.title,p.description,p.category,p.prompt,p.tags.join(' '),p.suggested_tools.join(' ')].join(' ').toLowerCase().includes(q)));
 $('#count').textContent=`${r.length} of ${prompts.length} prompts`;
 $('#grid').innerHTML=r.map(p=>`<article class="card" data-id="${esc(p.id)}"><span class="cat">${esc(p.category)}</span>
 <h2>${esc(p.title)}</h2><p>${esc(p.description)}</p>
 <details><summary>View prompt</summary><pre class="prompt">${hl(p.prompt)}</pre></details>
 <div class="tags">${p.tags.map(x=>`<span>${esc(x)}</span>`).join('')}</div>
 <p class="price">Works with: ${p.suggested_tools.map(esc).join(', ')}</p>
 <button class="copy" type="button">Copy prompt</button></article>`).join('')||'<p>No prompts match.</p>';
}
async function copy(text){
 try{await navigator.clipboard.writeText(text);return true}catch(e){
  const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
  let ok=false;try{ok=document.execCommand('copy')}catch(_){}t.remove();return ok}
}
document.addEventListener('click',async e=>{
 const b=e.target.closest('button.copy');if(!b)return;
 const p=prompts.find(x=>x.id===b.closest('.card').dataset.id);
 const ok=await copy(p.prompt);b.textContent=ok?'Copied ✓':'Copy failed';
 setTimeout(()=>{b.textContent='Copy prompt'},1500);
});
fetch('data/prompts.json').then(r=>r.json()).then(d=>{prompts=d;
 [...new Set(d.map(p=>p.category))].sort().forEach(c=>$('#cat').insertAdjacentHTML('beforeend',`<option>${esc(c)}</option>`));
 render();}).catch(()=>{$('#count').textContent='Failed to load data/prompts.json (serve via a local web server, e.g. python3 -m http.server).'});
['input','change'].forEach(e=>document.addEventListener(e,render));
