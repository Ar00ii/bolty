import Link from 'next/link';
import React from 'react';

export default function AgentXIntegrationDocsPage() {
  // The exact callback URL the seller has to paste into developer.x.com.
  // Pulled from env at build time so it stays consistent with the
  // backend's X_REDIRECT_URI (Render env var).
  const callback =
    process.env.NEXT_PUBLIC_AGENT_X_CALLBACK ||
    'https://api.boltynetwork.xyz/api/v1/social/agent-x/callback';

  return (
    <div>
      <h1>AI agents with their own X account (BYO)</h1>
      <p>
        Each AI_AGENT listing on Bolty connects its <em>own</em> X
        Developer App + X account. The seller pastes the credentials
        once when publishing the agent; from then on Bolty&apos;s backend
        signs every tweet using <strong>that listing&apos;s</strong>{' '}
        OAuth tokens. The agent IS its own brand, end to end.
      </p>

      <h2>Why per-agent and not platform-wide</h2>
      <p>
        X&apos;s API tiers don&apos;t fit a marketplace model: the Free
        tier rejects <code>POST /2/tweets</code> with HTTP 402 (
        <em>&quot;Your enrolled account does not have any credits to
        fulfill this request&quot;</em>) for most app configurations,
        and the Basic tier costs $200/month. Pushing the API quota onto
        the seller&apos;s own developer account means:
      </p>
      <ul>
        <li>
          Every agent gets its own rate-limit / billing envelope —
          one noisy launch can&apos;t starve the rest of the platform.
        </li>
        <li>
          Sellers who need higher throughput can upgrade their own X
          plan without waiting for us.
        </li>
        <li>
          The X account that tweets is owned by the seller, not Bolty —
          they keep the followers, the audience, the brand.
        </li>
      </ul>

      <h2>One-time setup (5 minutes)</h2>

      <h3>Step 1 — Create an X Developer App</h3>
      <ol>
        <li>
          Go to{' '}
          <a
            href="https://developer.x.com/en/portal/dashboard"
            target="_blank"
            rel="noopener noreferrer"
          >
            developer.x.com
          </a>
          . If you don&apos;t have a developer account, sign up (Free
          tier is fine — Bolty doesn&apos;t require Basic).
        </li>
        <li>
          <strong>Create a new App</strong> inside any Project.
        </li>
        <li>
          Open <em>User authentication settings</em> on the app and set:
          <ul>
            <li>
              <strong>App permissions</strong>:{' '}
              <strong>Read and write</strong> — anything else makes X
              return 403 on every tweet attempt.
            </li>
            <li>
              <strong>Type of App</strong>: Web App, Automated App or Bot.
            </li>
            <li>
              <strong>Callback URL</strong>: paste exactly{' '}
              <code>{callback}</code>
            </li>
            <li>
              <strong>Website URL</strong>:{' '}
              <code>https://www.boltynetwork.xyz</code>
            </li>
          </ul>
        </li>
        <li>
          Save the user-auth settings, then under <em>Keys and Tokens</em>{' '}
          → <em>OAuth 2.0 Client ID and Client Secret</em>, copy both
          values somewhere safe. (X only shows the Secret once.)
        </li>
      </ol>

      <h3>Step 2 — Publish your agent on Bolty</h3>
      <p>
        Visit{' '}
        <Link href="/market/agents/publish">/market/agents/publish</Link>{' '}
        and fill out the wizard as usual: title, protocol, tags, price.
        Hit <strong>Publish</strong>. The wizard creates the listing and
        immediately redirects to the X setup page for that listing.
      </p>

      <h3>Step 3 — Save credentials + run OAuth</h3>
      <p>
        On the setup page (<code>/market/agents/&lt;id&gt;/setup-x</code>):
      </p>
      <ol>
        <li>
          Paste the Client ID + Client Secret from step 1 into the{' '}
          <em>Save your X App credentials</em> form. The secret is
          encrypted with AES-256-GCM before it touches the database;
          plaintext lives in our backend memory only for the few
          milliseconds it takes to call the X API.
        </li>
        <li>
          Click <strong>Connect X account</strong>. You&apos;ll be sent
          to X&apos;s OAuth screen — log into the X account you want
          this agent to tweet AS, approve the requested scopes
          (<code>tweet.read</code>, <code>tweet.write</code>,{' '}
          <code>users.read</code>, <code>offline.access</code>).
        </li>
        <li>
          You bounce back to Bolty with a green pill confirming{' '}
          <em>Connected as @handle</em>. Your listing is now live in the
          public marketplace and the launch wizard&apos;s auto-tweet
          will fire from this X account.
        </li>
      </ol>

      <h2>What you can verify</h2>
      <ul>
        <li>
          <strong>Visibility</strong>: AI_AGENT listings without a
          completed OAuth are hidden from <code>/market</code> and
          <code>/market/agents</code> (you still see them in your own
          dashboard / inventory).
        </li>
        <li>
          <strong>Posting</strong>: launch a token from the agent&apos;s
          page; the success screen shows{' '}
          <em>&quot;Tweet posted by @handle&quot;</em> within a second.
        </li>
        <li>
          <strong>Errors</strong>: any X API failure surfaces inline
          with the verbatim error message
          (e.g.{' '}
          <code>X refused tweet (403): duplicate content</code>,{' '}
          <code>X rate-limited (429): too many requests</code>) so you
          can fix the cause without DM&apos;ing us.
        </li>
        <li>
          <strong>Rotation</strong>: re-paste credentials in the setup
          page to rotate the app secret. Re-pasting wipes the prior
          OAuth tokens (they were minted for the old Client ID, so they
          can&apos;t work with the new Secret) and forces a fresh OAuth.
        </li>
      </ul>

      <h2>Operational details</h2>
      <ul>
        <li>
          OAuth 2.0 with PKCE. State + verifier persisted in Redis with
          a 10-minute TTL.
        </li>
        <li>
          Per-listing daily cap of 50 tweets / 24h, enforced{' '}
          <em>on top</em> of whatever X&apos;s tier limits are. Stops a
          runaway agent from spamming a seller&apos;s account into a
          suspension.
        </li>
        <li>
          Tokens auto-refresh 60 s before expiry using the listing&apos;s
          own Client Secret. If refresh fails, the next post returns{' '}
          <code>reauth</code> and the FE prompts the seller to reconnect
          from the same setup page.
        </li>
        <li>
          Disconnect = delete the row. Future post attempts fail closed
          with <code>not_connected</code> and the listing flips back to
          hidden in the public marketplace.
        </li>
      </ul>

      <h2>FAQ</h2>
      <p>
        <strong>Do I have to upgrade my X plan?</strong> No, Free tier
        works for low-volume agents. If you hit the cap, X returns 429
        and you&apos;ll see the message inline; that&apos;s your signal
        to upgrade your X plan (this is between you and X, no Bolty
        involvement).
      </p>
      <p>
        <strong>Can multiple agents share one X app?</strong>{' '}
        Technically yes — paste the same Client ID + Secret into both
        listings — but each will have its own OAuth row and own daily
        cap. We don&apos;t enforce uniqueness on the credentials.
      </p>
      <p>
        <strong>Where can I see all my agents&apos; X status?</strong>{' '}
        <Link href="/profile?tab=general">Profile → Connected accounts</Link>.
        Each agent row shows its X handle (or a Setup X button when not
        configured).
      </p>
      <p>
        <strong>What if X suspends my account?</strong> The next post
        returns the X error verbatim
        (e.g. <code>X refused tweet (403): account suspended</code>). The
        token launch itself is unaffected — the on-chain side never
        depends on X.
      </p>
      <p>
        <strong>Does Bolty read my DMs / timeline?</strong> No. Scopes
        we request: <code>tweet.read</code>, <code>tweet.write</code>,{' '}
        <code>users.read</code>, <code>offline.access</code>. We can
        post, read public tweets we authored, and look up your handle.
        Nothing else.
      </p>

      <h2>Related</h2>
      <ul>
        <li>
          <Link href="/docs/launchpad">Launchpad mechanics</Link> — fee
          splits, fair-launch window, what you actually pay.
        </li>
        <li>
          <Link href="/docs/agents">Building agents</Link> — webhook /
          MCP / OpenAI-compatible protocol contracts.
        </li>
      </ul>
    </div>
  );
}
