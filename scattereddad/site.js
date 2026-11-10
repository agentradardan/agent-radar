// Scattered Dad: copy buttons + newsletter signup (posts to /api/subscribe with source=scattereddad).
(function () {
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var el = document.getElementById(b.getAttribute('data-copy')); if (!el) return;
      var t = el.textContent, done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { b.textContent = 'Select & copy'; });
      else { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Press Ctrl+C'; }
    });
  });
  document.querySelectorAll('[data-signup]').forEach(function (f) {
    var m = f.querySelector('.msg'), b = f.querySelector('button');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { m.textContent = 'That email looks off. Try again?'; f.email.focus(); return; }
      m.textContent = 'Signing you up…'; b.disabled = true;
      fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, website: f.website.value, source: 'scattereddad' }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok && d.ok, d: d }; }); })
        .then(function (x) { if (x.ok) { m.textContent = "You're in. Watch your inbox."; f.reset(); } else { m.textContent = (x.d && x.d.error) || 'Something went wrong. Please try again.'; } })
        .catch(function () { m.textContent = 'Network hiccup. Please try again.'; })
        .then(function () { b.disabled = false; });
    });
  });
})();
