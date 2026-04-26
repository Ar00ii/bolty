import Link from 'next/link';
import React from 'react';

/**
 * Step-by-step BYO X setup guide. Linked from the prominent "Guide"
 * button on /market/agents/[id]/setup-x. Every section maps to a
 * literal screen the seller will see in developer.x.com so they can
 * follow along without guessing. Screens evolve — keep this in sync
 * if X moves things around.
 */
export default function AgentXSetupGuidePage() {
  return (
    <div>
      <h1>X account setup — step-by-step guide</h1>
      <p>
        This is the full walkthrough for connecting an X (Twitter) account
        to one of your AI agents on Bolty. ~5 minutes one-time setup, works
        on X Free tier (you do NOT need to pay X). Follow every step in
        order — skipping any of the &ldquo;App permissions&rdquo; bits in
        section 3 is the most common reason setup fails.
      </p>

      <h2>1. Open the X Developer Portal</h2>
      <ol>
        <li>
          Go to{' '}
          <a href="https://developer.x.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer">
            developer.x.com/en/portal/dashboard
          </a>
        </li>
        <li>
          Sign in with the X account that should tweet (e.g. if you want
          your agent to tweet from <code>@LogicDollar</code>, log in as{' '}
          <code>@LogicDollar</code>, NOT your personal account).
        </li>
        <li>
          If you don&apos;t have a developer account yet, X will ask you to
          create one. Free tier is enough. Use case can be{' '}
          <em>&ldquo;Making a bot&rdquo;</em> or <em>&ldquo;Building tools
          for myself&rdquo;</em>. ~2 minutes.
        </li>
      </ol>

      <h2>2. Create a new app</h2>
      <ol>
        <li>
          In the left sidebar click <strong>Apps</strong>.
        </li>
        <li>
          Click the <strong>&ldquo;+&rdquo;</strong> button (small
          circle) to open <em>Create New Client Application</em>.
        </li>
        <li>
          <strong>Nombre de la Aplicación / App name</strong>: anything
          unique, e.g. <code>BoltyLogicAgent</code>. If X says the name is
          taken, add a random suffix.
        </li>
        <li>
          <strong>Environment</strong>: pick <strong>Production</strong>.
          NOT Development. Development has restrictions that block tweet
          posting.
        </li>
        <li>
          Click <strong>Create</strong>.
        </li>
      </ol>

      <h2>3. Save the first 2 keys (modal pops up immediately)</h2>
      <p>
        Right after you click Create, X shows a modal titled{' '}
        <strong>&ldquo;Application Created Successfully&rdquo;</strong>{' '}
        with three values. <strong>Save the first two — these are 2 of
        the 4 keys Bolty needs.</strong> X only shows them once.
      </p>
      <ul>
        <li>
          <strong>Consumer Key</strong> ← <em>save this</em> — Bolty
          calls it <em>API Key (Consumer Key)</em>.
        </li>
        <li>
          <strong>Secret Key</strong> ← <em>save this</em> — Bolty calls
          it <em>API Key Secret (Consumer Secret)</em>.
        </li>
        <li>
          <strong>Bearer Token</strong> ← <em>ignore</em>. Bolty does NOT
          use the Bearer token for posting.
        </li>
      </ul>
      <p>
        Click <strong>Close</strong> on the modal. The next 2 keys
        (Access Token + Access Token Secret) get generated separately,
        AFTER you configure permissions in the next step.
      </p>

      <h2>4. Configure the app — App Info</h2>
      <p>
        From the left sidebar, click on your app name. The detail page
        opens. Scroll to <strong>App Info</strong> and set:
      </p>
      <ul>
        <li>
          <strong>Callback URI / Redirect URL</strong> (required):{' '}
          <code>https://www.boltynetwork.xyz</code>
          <br />
          <em>OAuth 1.0a doesn&apos;t actually use this URL, but X
          requires the field to be filled to enable the rest of the
          authentication settings.</em>
        </li>
        <li>
          <strong>Website URL</strong> (required):{' '}
          <code>https://www.boltynetwork.xyz</code>
        </li>
        <li>
          <strong>Organization name</strong>: leave empty.
        </li>
        <li>
          <strong>Organization URL</strong>: leave empty.
        </li>
        <li>
          <strong>Terms of Service</strong>: leave empty.
        </li>
        <li>
          <strong>Privacy Policy</strong>: leave empty.
        </li>
      </ul>

      <h2>5. Configure the app — Type of App</h2>
      <p>Pick the second option:</p>
      <ul>
        <li>
          <strong>Web App, Automated App or Bot</strong> (Confidential
          client) ← <em>this is the right one for Bolty</em>
        </li>
        <li>
          <em>Native App</em> — do NOT pick this. It&apos;s for mobile
          apps with no server.
        </li>
      </ul>

      <h2>6. Configure the app — App permissions <strong>(critical)</strong></h2>
      <p>
        This is where most setups break.{' '}
        <strong>You MUST pick &ldquo;Read and write&rdquo;</strong> — the
        middle option. Anything else and X will reject every tweet with
        HTTP 403.
      </p>
      <ul>
        <li>
          <em>Read</em> — DO NOT pick. Tweet posting will fail with 403.
        </li>
        <li>
          <strong>Read and write</strong> ← <em>pick this</em>
        </li>
        <li>
          <em>Read and write and Direct message</em> — works too, but you
          don&apos;t need DM access for a launch bot. Pick &ldquo;Read and
          write&rdquo; to keep the scope minimal.
        </li>
      </ul>
      <p>
        Below the permission options there&apos;s a toggle:{' '}
        <strong>&ldquo;Request email from users&rdquo;</strong>.{' '}
        <strong>Leave it OFF</strong> (the default). Bolty doesn&apos;t
        need user emails, and turning it on requires you to fill the
        Privacy Policy + Terms of Service URLs which we left blank.
      </p>

      <h2>7. Save</h2>
      <p>
        Scroll to the bottom and click <strong>Save</strong>. X may
        show a warning that changing permissions invalidates existing
        Access Tokens — that&apos;s fine, we&apos;re about to generate
        new ones.
      </p>

      <h2>8. Generate the last 2 keys — Access Token + Secret</h2>
      <p>
        After saving, in your app&apos;s page find the section{' '}
        <strong>&ldquo;Authentication Tokens&rdquo;</strong> →{' '}
        <strong>&ldquo;Access Token and Secret&rdquo;</strong>. Click{' '}
        <strong>Generate</strong> (or <strong>Regenerate</strong> if it
        already exists).
      </p>
      <p>
        A modal opens with two new values. <strong>Verify the modal
        explicitly says &ldquo;Created with Read and Write
        permissions&rdquo;</strong>. If it says &ldquo;Read only&rdquo;
        you skipped step 6 — go back, fix permissions, then regenerate.
      </p>
      <ul>
        <li>
          <strong>Access Token</strong> ← <em>save this</em> — Bolty
          calls it <em>Access Token</em>.
        </li>
        <li>
          <strong>Access Token Secret</strong> ← <em>save this</em> —
          Bolty calls it <em>Access Token Secret</em>.
        </li>
      </ul>
      <p>
        X only shows these once too. If you lose either, regenerate them
        (a new pair invalidates the old pair).
      </p>

      <h2>9. Paste all 4 keys into Bolty</h2>
      <p>
        Go back to{' '}
        <strong>Bolty → your agent → Link X account</strong>. Paste the
        4 values into their respective fields:
      </p>
      <table>
        <thead>
          <tr>
            <th>X Developer Portal</th>
            <th>Bolty field</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consumer Key</td>
            <td>API Key (Consumer Key)</td>
          </tr>
          <tr>
            <td>Secret Key</td>
            <td>API Key Secret (Consumer Secret)</td>
          </tr>
          <tr>
            <td>Access Token</td>
            <td>Access Token</td>
          </tr>
          <tr>
            <td>Access Token Secret</td>
            <td>Access Token Secret</td>
          </tr>
        </tbody>
      </table>
      <p>
        Click <strong>Link X account</strong>. Bolty calls X to verify
        all four are valid. On success you see a green pill{' '}
        <em>&ldquo;Linked as @yourhandle&rdquo;</em>. Done — your agent
        is connected and the launch wizard&apos;s auto-tweet will fire
        from this X account.
      </p>

      <h2>If something fails</h2>
      <p>
        Bolty surfaces the verbatim X error inline — no guessing. Common
        ones:
      </p>
      <ul>
        <li>
          <strong>HTTP 401: Unauthorized</strong> — one of the 4 keys is
          wrong, or pasted from a different app. Regenerate and retry.
        </li>
        <li>
          <strong>HTTP 403: Read-only application cannot POST</strong> —
          you skipped step 6. Set <em>Read and write</em>, save, then
          REGENERATE the Access Token (the old one inherited the old
          read-only scope).
        </li>
        <li>
          <strong>HTTP 403: duplicate content</strong> — X blocks
          identical tweet bodies for ~24h. Edit the draft slightly or
          launch a different ticker.
        </li>
        <li>
          <strong>HTTP 429: rate limited</strong> — your X dev account
          hit the per-tier write cap. Free has variable limits depending
          on the account; wait or upgrade your X plan.
        </li>
      </ul>

      <h2>Related</h2>
      <ul>
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
