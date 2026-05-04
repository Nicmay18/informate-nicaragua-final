// CONSOLIDATED API - All endpoints in one file for Vercel Hobby (12 function limit)
const crypto = require('crypto');

// Stripe keys from env or fallback
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

let stripe;
try {
  stripe = require('stripe')(STRIPE_SECRET_KEY);
} catch(e) {
  console.log('Stripe not available');
}

// A/B Testing Config
const EXPERIMENTS = {
  paywall_position: {
    id: 'exp_paywall_pos_001',
    variants: [
      { id: 'control', weight: 0.33, config: { scroll_threshold: 30, preview_paragraphs: 2 } },
      { id: 'early', weight: 0.33, config: { scroll_threshold: 15, preview_paragraphs: 1 } },
      { id: 'late', weight: 0.34, config: { scroll_threshold: 60, preview_paragraphs: 4 } }
    ]
  },
  cta_button: {
    id: 'exp_cta_001',
    variants: [
      { id: 'control', weight: 0.5, config: { text: 'Suscribirse Ahora', color: 'primary', urgency: false } },
      { id: 'urgency', weight: 0.5, config: { text: 'Oferta Limitada - 50% OFF', color: 'danger', urgency: true, countdown: true } }
    ]
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { pathname } = new URL(req.url, `https://${req.headers.host}`);
  const path = pathname.replace('/api/', '').replace('/api', '');
  
  try {
    // Route to appropriate handler
    if (path === 'health' || path === '' || path === 'index') {
      return await healthHandler(req, res);
    }
    if (path.startsWith('gifts')) {
      return await giftsHandler(req, res, path);
    }
    if (path.startsWith('experiments')) {
      return await experimentsHandler(req, res, path);
    }
    if (path.startsWith('subscription')) {
      return await subscriptionHandler(req, res, path);
    }
    if (path === 'create-checkout-session') {
      return await checkoutHandler(req, res);
    }
    if (path === 'webhooks/stripe') {
      return await webhookHandler(req, res);
    }
    
    return res.status(404).json({ error: 'Endpoint not found', path });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// Health Check
async function healthHandler(req, res) {
  return res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: ['gifts', 'experiments', 'subscription', 'checkout']
  });
}

// Gifts Handler
async function giftsHandler(req, res, path) {
  const action = req.query.action || path.split('/')[1];
  
  switch(action) {
    case 'create':
    case 'create-gift':
      return createGift(req, res);
    case 'claim':
    case 'claim-gift':
      return claimGift(req, res);
    case 'verify':
      return verifyGift(req, res);
    case 'stats':
      return giftStats(req, res);
    default:
      return res.json({ endpoint: 'gifts', actions: ['create', 'claim', 'verify', 'stats'] });
  }
}

async function createGift(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { sender_id, article_id } = req.body;
  const giftToken = crypto.randomBytes(32).toString('hex');
  const shortCode = giftToken.substring(0, 8).toUpperCase();
  
  return res.json({
    success: true,
    gift_url: `https://nicaraguainformate.com/regalo/${shortCode}`,
    short_code: shortCode,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    remaining_gifts: 9
  });
}

async function claimGift(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { short_code } = req.body;
  
  return res.json({
    success: true,
    article_id: 'mock-article-id',
    article_title: 'Artículo de Regalo',
    access_token: 'mock-token-123',
    sender_message: '¡Disfruta este artículo!'
  });
}

async function verifyGift(req, res) {
  const { code } = req.query;
  return res.json({ valid: true, short_code: code, remaining_claims: 1 });
}

async function giftStats(req, res) {
  return res.json({ total_gifts: 15, gifts_remaining: 9, conversion_rate: 0.80 });
}

// Experiments Handler
async function experimentsHandler(req, res, path) {
  const action = req.query.action || path.split('/')[1];
  
  switch(action) {
    case 'assign':
    case 'assign-variant':
      return assignVariant(req, res);
    case 'convert':
    case 'conversion':
      return recordConversion(req, res);
    case 'results':
      return getResults(req, res);
    default:
      return res.json({ endpoint: 'experiments', actions: ['assign', 'convert', 'results'] });
  }
}

async function assignVariant(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET required' });
  const { experiment_id, user_id } = req.query;
  
  const experiment = EXPERIMENTS[experiment_id];
  if (!experiment) return res.status(404).json({ error: 'Experiment not found' });
  
  const hash = crypto.createHash('md5').update(`${experiment_id}:${user_id}`).digest('hex');
  const hashInt = parseInt(hash.substring(0, 8), 16);
  const normalized = hashInt / 0xFFFFFFFF;
  
  let cumulative = 0;
  let selectedVariant = experiment.variants[0];
  
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (normalized <= cumulative) {
      selectedVariant = variant;
      break;
    }
  }
  
  return res.json({ experiment_id: experiment.id, variant: selectedVariant });
}

async function recordConversion(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { experiment_id, variant_id, user_id, conversion_type } = req.body;
  console.log('📊 Conversion:', { experiment_id, variant_id, user_id, conversion_type });
  return res.json({ success: true });
}

async function getResults(req, res) {
  return res.json({ status: 'running', total_participants: 1250, confidence: 0.95 });
}

// Subscription Handler
async function subscriptionHandler(req, res, path) {
  const action = req.query.action || path.split('/')[1];
  
  switch(action) {
    case 'checkout':
      return checkoutHandler(req, res);
    case 'status':
      return getStatus(req, res);
    case 'webhook':
      return webhookHandler(req, res);
    default:
      return res.json({ endpoint: 'subscription', actions: ['checkout', 'status'] });
  }
}

async function checkoutHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { tier, price_id, success_url, cancel_url, user_email } = req.body;
  
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      customer_email: user_email,
      subscription_data: {
        trial_period_days: tier === 'pro' ? 7 : 0,
        metadata: { tier, source: 'web_app' }
      }
    });
    
    return res.json({ sessionId: session.id, publishableKey: STRIPE_PUBLISHABLE_KEY });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStatus(req, res) {
  return res.json({ tier: 'free', status: 'inactive', features: ['ads', '5_articles_month'] });
}

async function webhookHandler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log('🔔 Webhook:', event.type);
  return res.json({ received: true });
}
