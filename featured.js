// Client-side expiry for static pages: listings whose featured "until" date (YYYY-MM-DD, inclusive)
// has passed lose their Sponsored badge and drop back to their normal position, even before a rebuild.
(function(){var today=new Date().toLocaleDateString('en-CA');
document.querySelectorAll('[data-until]').forEach(function(el){if(el.getAttribute('data-until')>=today)return;
 el.querySelectorAll('.b-sp,.sp-note').forEach(function(x){x.remove()});el.classList.remove('featured');el.removeAttribute('data-until');});
document.querySelectorAll('[data-featsort]').forEach(function(g){var c=[].slice.call(g.children);
 c.sort(function(a,b){return (b.classList.contains('featured')-a.classList.contains('featured'))||(+a.getAttribute('data-i')-+b.getAttribute('data-i'))});
 c.forEach(function(x){g.appendChild(x)});});})();
