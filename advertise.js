// Paste a Stripe Payment Link here (e.g. 'https://buy.stripe.com/...') to show the Pay button
// on /advertise.html. While it's empty the button stays hidden. No rebuild needed.
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/aFaeVfb2kf7O92waMt67S00';
(function(){var b=document.getElementById('pay');if(b&&/^https:\/\//.test(STRIPE_PAYMENT_LINK)){b.href=STRIPE_PAYMENT_LINK;b.hidden=false;}})();
