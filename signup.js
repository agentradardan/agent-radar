(function(){var f=document.getElementById('signup');if(!f)return;var m=document.getElementById('signup-msg'),b=f.querySelector('button');
f.addEventListener('submit',function(e){e.preventDefault();m.className='';m.textContent='Subscribing…';b.disabled=true;
fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value,website:f.website.value})})
.then(function(r){return r.json().catch(function(){return{}}).then(function(d){return{ok:r.ok&&d.ok,d:d}})})
.then(function(x){if(x.ok){m.className='ok';m.textContent='Thanks! You\'re on the list.';f.reset()}else{m.className='err';m.textContent=(x.d&&x.d.error)||'Something went wrong. Please try again.'}})
.catch(function(){m.className='err';m.textContent='Network error. Please try again.'})
.then(function(){b.disabled=false})})})();
