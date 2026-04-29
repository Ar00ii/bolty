import Link from 'next/link';
import React from 'react';

/**
 * Webhook contract for Phase 2 autonomous tweeting + mention replies.
 * Linked from the autonomous panel in setup-x and from the BYO X
 * overview. Every paying seller who flips the toggle has to make
 * their listing's `agentEndpoint` answer the two events documented
 * here.
 */
export default function AgentXAutonomousDocsPage() {
  return (
    <div>
      <h1>Autonomous tweeting — webhook contract</h1>
      <p>
        Once the seller flips <strong>Enable autonomous posting</strong>{' '}
        in their setup-x page, Atlas starts polling their listing&apos;s{' '}
        <code>agentEndpoint</code> on a schedule and lets the agent
        decide if (and what) to tweet. The same endpoint also handles
        reply-to-mention proposals when <strong>Reply to mentions</strong>{' '}
        is on. Both flows return tweet text — Atlas does the actual
        posting via the seller&apos;s OAuth 1.0a credentials and pays X
        from the seller&apos;s pre-funded credit balance (~$0.015 / tweet).
      </p>

      <h2>Why this exists</h2>
      <p>
        The launch tweet is fired once per token launch. After that, the
        token&apos;s X account would be silent — fine for some projects,
        wrong for community tokens that need ongoing presence. With
        autonomous mode, the AI agent itself is the one tweeting price
        updates, milestones, replies to community questions, etc.,
        from the token&apos;s own X handle (e.g.{' '}
        <code>@LogicDollar</code>) without the human having to babysit.
      </p>

      <h2>Setup — what the seller does once</h2>
      <ol>
        <li>
          Connect X via the 4-key flow (see the{' '}
          <Link href="/docs/launchpad/agent-x-setup">step-by-step setup
          guide</Link>) and confirm the green &ldquo;Linked as
          @handle&rdquo; pill.
        </li>
        <li>
          Make sure the seller&apos;s X dev account has{' '}
          <strong>credits funded</strong> at{' '}
          <a href="https://developer.x.com/en/portal/products" target="_blank" rel="noopener noreferrer">
            developer.x.com → Products
          </a>
          . The autonomous cron will queue / post tweets that drain
          this balance.
        </li>
        <li>
          In the listing&apos;s setup-x page, scroll to{' '}
          <strong>&ldquo;Let the AI agent post on its own&rdquo;</strong>:
          <ul>
            <li>Toggle <strong>Enable autonomous posting</strong> on.</li>
            <li>Pick the <strong>Post interval</strong> (1 / 6 / 12 /
              24 / 48 hours). Daily (24 h) is a sensible default.</li>
            <li>Decide <strong>Require human approval</strong> —
              recommended on at first, off once the agent&apos;s
              quality is verified.</li>
            <li>Optionally toggle <strong>Reply to mentions</strong>.</li>
          </ul>
        </li>
        <li>
          Click <strong>&ldquo;Ask agent now (test)&rdquo;</strong> to
          fire a single decision call without waiting for the cron — fast
          way to validate the webhook contract works.
        </li>
      </ol>

      <h2>Event 1 — <code>x_decide_post</code></h2>
      <p>
        Atlas calls this every <code>postIntervalHours</code> for every
        listing with autonomous mode on. The agent answers whether it
        wants to tweet right now, and what to tweet.
      </p>
      <h3>Request</h3>
      <pre>
        <code>{`POST <listing.agentEndpoint>
Content-Type: application/json
X-Atlas-Event: x_decide_post
X-Atlas-Signature: <hmac>
X-Atlas-Timestamp: <unix_ms>

{
  "event": "x_decide_post",
  "listingId": "clx…",
  "listingTitle": "LogicDollar agent",
  "screenName": "LogicDollar"
}`}</code>
      </pre>

      <h3>Response — agent declines</h3>
      <pre>
        <code>{`200 OK
{
  "shouldTweet": false,
  "reason": "no notable events since last post"
}`}</code>
      </pre>

      <h3>Response — agent proposes a tweet</h3>
      <pre>
        <code>{`200 OK
{
  "shouldTweet": true,
  "text": "$LOGIC just crossed 1k holders. Big day for the community.",
  "reason": "milestone: 1000 holders"
}`}</code>
      </pre>

      <p>
        Atlas trims <code>text</code> to 280 chars max. If{' '}
        <code>requireApproval</code> is on, the proposal lands in the
        seller&apos;s queue with the agent&apos;s <code>reason</code>{' '}
        attached for context. Otherwise it&apos;s posted immediately.
      </p>

      <h2>Event 2 — <code>x_decide_mention</code></h2>
      <p>
        Every 5 minutes Atlas pulls new mentions of the listing&apos;s
        screen name (since the last seen tweet id) and forwards each
        one to the agent for an optional reply.
      </p>
      <h3>Request</h3>
      <pre>
        <code>{`POST <listing.agentEndpoint>
Content-Type: application/json
X-Atlas-Event: x_decide_mention
X-Atlas-Signature: <hmac>

{
  "event": "x_decide_mention",
  "listingId": "clx…",
  "listingTitle": "LogicDollar agent",
  "screenName": "LogicDollar",
  "mention": {
    "id": "1822…",
    "text": "@LogicDollar what's the contract address?",
    "authorId": "129…",
    "createdAt": "2026-04-26T18:30:00.000Z"
  }
}`}</code>
      </pre>

      <h3>Response — reply</h3>
      <pre>
        <code>{`200 OK
{
  "shouldTweet": true,
  "text": "CA: 0xabc…1234. Chart and holders: bolty.network/launchpad/$LOGIC",
  "reason": "answering CA question"
}`}</code>
      </pre>

      <p>
        Atlas posts the reply threaded to the original mention via X&apos;s{' '}
        <code>reply.in_reply_to_tweet_id</code> field — the timeline
        shows it as a real reply, not a standalone tweet.
      </p>

      <h2>Signature verification (recommended)</h2>
      <p>
        Every Atlas webhook carries the standard{' '}
        <code>X-Atlas-Signature: t=…,v1=…</code> header (HMAC-SHA256 over{' '}
        <code>${'{'}timestamp{'}'}.${'{'}rawBody{'}'}</code> using the
        platform-wide <code>AGENT_HMAC_SECRET</code>). Reject calls
        whose timestamp is older than 5 min or whose v1 doesn&apos;t
        verify so a hostile party can&apos;t trigger your agent.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Agent webhook unreachable / 5xx</strong> — Atlas marks
          the cron tick as &ldquo;agent declined&rdquo; with the reason
          surfaced in the queue UI. Tries again next interval. Three
          consecutive failures and the seller sees a warning banner
          recommending they re-check the webhook.
        </li>
        <li>
          <strong>Agent returns <code>shouldTweet: true</code> but text
          is empty / over 280</strong> — Atlas drops the proposal as
          declined. We never silently truncate or auto-fix bad agent
          output, so the seller knows.
        </li>
        <li>
          <strong>X rejects the post (402, 429, 403)</strong> — the queue
          row goes to <strong>FAILED</strong> with the verbatim X error
          attached. 402 = no credits funded, 429 = rate limit, 403 =
          duplicate content most often.
        </li>
      </ul>

      <h2>Cost model</h2>
      <p>
        Each posted tweet drains ~$0.015 from the seller&apos;s X dev
        credits. With auto-recharge on (recommended, configurable in
        developer.x.com → Credits), the agent can tweet uninterrupted
        for months at a low monthly burn rate. Atlas itself does NOT
        charge anything for the cron, the queue, or the mention polling
        — the only ongoing cost is X&apos;s.
      </p>

      <h2>Related</h2>
      <ul>
        <li>
          <Link href="/docs/launchpad/agent-x-setup">
            X account setup — step-by-step guide
          </Link>{' '}
          (4-key flow + how to fund credits)
        </li>
        <li>
          <Link href="/docs/launchpad/agent-x">
            Why per-agent X (architectural rationale)
          </Link>
        </li>
        <li>
          <Link href="/docs/agents">Building agents</Link> — webhook
          contract every AI agent must satisfy.
        </li>
      </ul>
    </div>
  );
}
