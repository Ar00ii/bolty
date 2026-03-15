/**
 * ─────────────────────────────────────────────────────────────
 *  BOLTY EXAMPLE AI AGENT — seller negotiation bot
 * ─────────────────────────────────────────────────────────────
 *
 *  HOW TO RUN:
 *
 *  1. Install dependencies:
 *       npm install
 *
 *  2. Start the agent:
 *       node agent.js
 *
 *  3. Expose it to the internet (use ngrok or similar):
 *       npx ngrok http 4000
 *
 *  4. Copy the ngrok URL (e.g. https://abc123.ngrok.io)
 *     and paste it as "negotiation webhook" when publishing
 *     your agent on Bolty:
 *       https://abc123.ngrok.io/negotiate
 *
 * ─────────────────────────────────────────────────────────────
 *  NEGOTIATION RULES (customize these):
 *
 *  - Asking price:   10 SOL  (set in your Bolty listing)
 *  - Floor price:     6 SOL  (set in your Bolty listing)
 *  - Auto-accept:   >= 8 SOL
 *  - Counter-offer: between 6-8 SOL → counter at midpoint
 *  - Reject:        < 6 SOL
 * ─────────────────────────────────────────────────────────────
 */

const http = require('http');

const PORT = 4000;

// ── Agent personality ─────────────────────────────────────────
const AGENT_NAME   = 'TradingBot-X';
const ASKING_PRICE = 10;   // same as your Bolty listing price
const FLOOR_PRICE  =  6;   // same as your Bolty listing minPrice
const CURRENCY     = 'SOL';

// ── Negotiation responses ─────────────────────────────────────

function handleNegotiationStart(body) {
  const { listing, negotiationId } = body;
  const title = listing?.title || AGENT_NAME;

  return {
    reply: `Hello! I'm the automated agent for "${title}". 🤖\n` +
           `Asking price is ${listing?.askingPrice || ASKING_PRICE} ${CURRENCY}. ` +
           `I'm flexible — make me an offer and we'll work something out!`,
    action: 'counter',
  };
}

function handleNegotiationMessage(body) {
  const { listing, proposedPrice, message, history } = body;
  const asking   = listing?.askingPrice || ASKING_PRICE;
  const floor    = listing?.minPrice    || FLOOR_PRICE;
  const offer    = proposedPrice;
  const currency = CURRENCY;

  // No price offered yet — ask for one
  if (offer == null) {
    return {
      reply: `Thanks for reaching out! I'd love to hear your offer. ` +
             `Current asking price is ${asking} ${currency}. What do you have in mind?`,
      action: 'counter',
    };
  }

  // Below floor — reject
  if (offer < floor) {
    return {
      reply: `I appreciate the interest, but ${offer} ${currency} is too low — ` +
             `I can't go below ${floor} ${currency}. Feel free to come back with a better offer!`,
      proposedPrice: floor,
      action: 'reject',
    };
  }

  // At or above 80% of asking — accept
  if (offer >= asking * 0.8) {
    return {
      reply: `Deal! ${offer} ${currency} works for me. ` +
             `The seller will confirm and open a direct chat with you to finalise everything. ✅`,
      proposedPrice: offer,
      action: 'accept',
    };
  }

  // Between floor and 80% — counter at midpoint
  const counter = Math.round(((offer + asking) / 2) * 100) / 100;
  const safeCounter = Math.max(counter, floor);

  return {
    reply: `Hmm, ${offer} ${currency} is a bit low. How about we meet in the middle at ` +
           `${safeCounter} ${currency}? That's a fair price for both of us. 🤝`,
    proposedPrice: safeCounter,
    action: 'counter',
  };
}

// ── HTTP server ───────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', agent: AGENT_NAME }));
    return;
  }

  // Negotiation webhook
  if (req.method === 'POST' && req.url === '/negotiate') {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        const body = JSON.parse(raw);
        const event = body.event;

        console.log(`\n[${new Date().toISOString()}] EVENT: ${event}`);
        if (body.proposedPrice != null) {
          console.log(`  Buyer offer: ${body.proposedPrice} ${CURRENCY}`);
        }
        if (body.message) {
          console.log(`  Message: "${body.message}"`);
        }

        let response;
        if (event === 'negotiation.start') {
          response = handleNegotiationStart(body);
        } else if (event === 'negotiation.message') {
          response = handleNegotiationMessage(body);
        } else {
          response = { reply: 'Unknown event.', action: 'counter' };
        }

        console.log(`  → Action: ${response.action}` +
          (response.proposedPrice != null ? ` | Counter: ${response.proposedPrice} ${CURRENCY}` : ''));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        console.error('Parse error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply: 'Error processing request.', action: 'counter' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('─'.repeat(50));
  console.log(`🤖 ${AGENT_NAME} is running on http://localhost:${PORT}`);
  console.log(`   Negotiation webhook: http://localhost:${PORT}/negotiate`);
  console.log('─'.repeat(50));
  console.log(`   Asking price : ${ASKING_PRICE} ${CURRENCY}`);
  console.log(`   Floor price  : ${FLOOR_PRICE}  ${CURRENCY}`);
  console.log('─'.repeat(50));
  console.log('   Expose with:  npx ngrok http ' + PORT);
  console.log('─'.repeat(50));
});
