// GET ?e=email&t=token -> confirm page; POST (button or mail-client one-click) -> marks contact unsubscribed in Resend.
const { verify } = require('./_welcome');
const page = (res, code, title, msg, form) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0f1115;color:#e8eaee;font-family:system-ui,-apple-system,Segoe UI,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;">
<div style="max-width:420px;margin:20px;background:#181b22;border:1px solid #2a2f3a;border-radius:16px;padding:32px;text-align:center;">
<h1 style="margin:0 0 12px;font-size:22px;">${title}</h1><p style="color:#9aa3b2;line-height:1.5">${msg}</p>${form || ''}
<p><a href="https://tryagentradar.com" style="color:#8ab4ff">Back to Agent Radar</a></p></div></body></html>`);
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  const key = process.env.RESEND_API_KEY, aud = process.env.RESEND_AUDIENCE_ID;
  const q = req.query || {};
  const email = String(q.e || '').trim().toLowerCase(), t = q.t;
  if (!key || !aud) return page(res, 500, 'Not configured', 'Please try again later.');
  if (!email || email.length > 320 || !verify(email, t, key)) return page(res, 400, 'Invalid link', 'This unsubscribe link is not valid.');
  if (req.method === 'GET') {
    return page(res, 200, 'Unsubscribe?', `Stop emails to <b>${esc(email)}</b>?`,
      `<form method="POST" action="/api/unsubscribe?e=${encodeURIComponent(email)}&t=${esc(t)}"><button style="background:#8ab4ff;color:#0f1115;border:0;border-radius:10px;padding:12px 24px;font-size:15px;font-weight:700;cursor:pointer">Yes, unsubscribe</button></form>`);
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return page(res, 405, 'Method not allowed', ''); }
  try {
    const r = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(aud)}/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ unsubscribed: true }),
    });
    if (!r.ok && r.status !== 404) { console.error('resend status', r.status); return page(res, 502, 'Something went wrong', 'Please try again later.'); }
    return page(res, 200, "You're unsubscribed", 'You will no longer receive emails from Agent Radar.');
  } catch { console.error('resend fetch failed'); return page(res, 502, 'Something went wrong', 'Please try again later.'); }
};
