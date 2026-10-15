// Shared helpers: unsubscribe token (HMAC derived from RESEND_API_KEY) + welcome email content.
const crypto = require('crypto');
const SITE = 'https://tryagentradar.com';

const token = (email, key) =>
  crypto.createHmac('sha256', key).update('agent-radar-unsub:' + email).digest('hex').slice(0, 40);
const verify = (email, t, key) => {
  const a = Buffer.from(token(email, key)), b = Buffer.from(String(t || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const unsubUrl = (email, key) => `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${token(email, key)}`;

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const btn = (href, label, primary) => `
<td align="center" class="stack" style="padding:6px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
    <td align="center" bgcolor="${primary ? '#8ab4ff' : '#242936'}" style="border-radius:10px;${primary ? '' : 'border:1px solid #3a4152;'}">
      <a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:700;color:${primary ? '#0f1115' : '#e8eaee'};text-decoration:none;border-radius:10px;">${label}</a>
    </td></tr></table>
</td>`;
const item = (icon, title, text) => `
<tr><td valign="top" width="44" style="padding:10px 0;font-size:24px;line-height:28px;font-family:${FONT};">${icon}</td>
<td valign="top" style="padding:10px 0;font-family:${FONT};">
  <div style="font-size:16px;font-weight:700;color:#e8eaee;line-height:22px;">${title}</div>
  <div style="font-size:14px;color:#9aa3b2;line-height:21px;">${text}</div>
</td></tr>`;

function welcomeHtml(unsub) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>Welcome to Agent Radar</title>
<style>@media only screen and (max-width:620px){.wrap{width:100%!important}.pad{padding:24px 20px!important}.stack{display:block!important;width:100%!important}.h1{font-size:26px!important}}</style>
</head>
<body style="margin:0;padding:0;background:#0f1115;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0f1115;">You're on the radar. New AI tools, pricing changes and fresh prompts, straight to your inbox.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1115" style="background:#0f1115;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">
  <tr><td align="center" style="padding:8px 0 22px;font-family:${FONT};">
    <span style="font-size:22px;font-weight:800;letter-spacing:.5px;color:#e8eaee;"><span style="color:#8ab4ff;">&#9673;</span>&nbsp;Agent Radar</span>
  </td></tr>
  <tr><td class="pad" bgcolor="#181b22" style="background:#181b22;border:1px solid #2a2f3a;border-radius:16px;padding:36px 36px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="font-family:${FONT};">
        <div style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6ee79a;background:#12361f;border-radius:99px;padding:4px 12px;">You're subscribed</div>
        <h1 class="h1" style="margin:16px 0 10px;font-size:30px;line-height:36px;color:#ffffff;font-family:${FONT};">Welcome aboard &#128075;</h1>
        <p style="margin:0 0 22px;font-size:16px;line-height:25px;color:#c9cfda;">Thanks for joining Agent Radar. We keep an eye on the fast-moving AI tool world so you don't have to, and we'll only email you when there's something worth your time.</p>
      </td></tr>
      <tr><td style="font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9aa3b2;padding-bottom:4px;">What to expect</td></tr>
      <tr><td>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${item('&#128752;', 'New AI tools', 'Fresh launches and hidden gems, with a quick take on what each is good for.')}
          ${item('&#128176;', 'Pricing &amp; free-tier changes', 'Know the moment a tool changes its plans or its free tier, before it surprises you.')}
          ${item('&#9997;&#65039;', 'Fresh prompts', 'Tested, copy-paste prompts added to the Prompt Vault.')}
        </table>
      </td></tr>
      <tr><td style="padding:22px 0 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          ${btn(SITE, 'Browse the radar', true)}
          ${btn(SITE + '/vault.html', 'Open the Prompt Vault', false)}
        </tr></table>
      </td></tr>
    </table>
  </td></tr>
  <tr><td align="center" style="padding:24px 20px 8px;font-family:${FONT};font-size:12px;line-height:19px;color:#7d8696;">
    You're receiving this because you signed up at <a href="${SITE}" style="color:#8ab4ff;text-decoration:none;">tryagentradar.com</a>.<br>
    Not for you? <a href="${unsub}" style="color:#8ab4ff;text-decoration:underline;">Unsubscribe</a> any time, no hard feelings.
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function welcomeText(unsub) {
  return `Welcome to Agent Radar!

Thanks for joining. We keep an eye on the fast-moving AI tool world so you don't have to, and we'll only email you when there's something worth your time.

What to expect:
- New AI tools: fresh launches and hidden gems, with a quick take on each.
- Pricing & free-tier changes: know when a tool changes its plans.
- Fresh prompts: tested, copy-paste prompts in the Prompt Vault.

Browse the radar: ${SITE}
Open the Prompt Vault: ${SITE}/vault.html

You're receiving this because you signed up at tryagentradar.com.
Unsubscribe any time: ${unsub}
`;
}

module.exports = { token, verify, unsubUrl, welcomeHtml, welcomeText };
