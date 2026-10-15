// Vercel serverless function: POST {email, website(honeypot)} -> adds contact to Resend audience.
const hits = new Map(); // best-effort per-instance rate limit
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, body) => res.status(code).send(JSON.stringify(body));
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { ok: false, error: 'Method not allowed' }); }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Honeypot: bots fill the hidden field; pretend success.
  if (body.website) return send(200, { ok: true });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  if (recent.length >= 5) return send(429, { ok: false, error: 'Too many requests, try again in a minute.' });
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 1000) hits.clear();

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) return send(400, { ok: false, error: 'Please enter a valid email address.' });

  const key = process.env.RESEND_API_KEY, aud = process.env.RESEND_AUDIENCE_ID;
  if (!key || !aud) return send(500, { ok: false, error: 'Signup is not configured yet.' });

  try {
    const r = await fetch(`https://api.resend.com/audiences/${encodeURIComponent(aud)}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false }),
    });
    if (!r.ok) { console.error('resend status', r.status); return send(502, { ok: false, error: 'Could not subscribe right now. Please try again later.' }); }
    return send(200, { ok: true });
  } catch (e) {
    console.error('resend fetch failed');
    return send(502, { ok: false, error: 'Could not subscribe right now. Please try again later.' });
  }
};
