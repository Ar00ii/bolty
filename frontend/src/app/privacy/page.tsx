'use client';

import { Shield } from 'lucide-react';
import React from 'react';

import { LegalPage, type LegalSection } from '@/components/ui/legal-page';

const SECTIONS: LegalSection[] = [
  {
    id: 'summary',
    title: '1. Summary',
    body: (
      <>
        <p>
          Atlas is a marketplace for code and AI agents, with payments settled on-chain. This policy
          describes what data we collect, why, and what you can do about it. We aim for the minimum
          data we need to run the service.
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data we collect',
    body: (
      <>
        <p>
          <strong className="text-zinc-200 font-normal">Account</strong> — email (if you register
          with one), username, display name, avatar, optional profile fields you choose to fill in
          (bio, GitHub handle, Twitter handle, website).
        </p>
        <p>
          <strong className="text-zinc-200 font-normal">Wallets</strong> — any EVM addresses you
          connect. We never see or store private keys.
        </p>
        <p>
          <strong className="text-zinc-200 font-normal">Usage</strong> — listings you publish,
          purchases you make, reviews you leave, messages you send through Atlas chat, votes,
          downloads. This is the raw material of the marketplace.
        </p>
        <p>
          <strong className="text-zinc-200 font-normal">Technical</strong> — IP address (for rate
          limiting and abuse prevention), user-agent, basic device info, session cookies, an
          httpOnly refresh-token cookie, and a non-httpOnly CSRF cookie.
        </p>
        <p>
          <strong className="text-zinc-200 font-normal">On-chain</strong> — transaction hashes and
          wallet addresses associated with your purchases. Note that everything on a public
          blockchain is visible to anyone — that&apos;s not a choice we make, it&apos;s the nature
          of the chain.
        </p>
      </>
    ),
  },
  {
    id: 'why',
    title: '3. Why we collect it',
    body: (
      <>
        <ul>
          <li>Operating the marketplace (listings, payments, escrow, chat).</li>
          <li>Authenticating you and protecting your account.</li>
          <li>Preventing fraud, spam, and abuse.</li>
          <li>Displaying reputation, reviews, and the leaderboard.</li>
          <li>Responding when you contact support.</li>
          <li>Meeting legal obligations if required by law enforcement or regulators.</li>
        </ul>
        <p>We do not sell your personal data. We do not run third-party advertising.</p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: '4. Third parties we use',
    body: (
      <>
        <ul>
          <li>
            <strong className="text-zinc-200 font-normal">GitHub</strong> — OAuth login and repo
            sync (only if you link your account).
          </li>
          <li>
            <strong className="text-zinc-200 font-normal">Google Gemini</strong> — powers the /ai
            chat. Your prompts are processed by Google subject to their terms.
          </li>
          <li>
            <strong className="text-zinc-200 font-normal">MetaMask / WalletConnect</strong> — wallet
            connection. Atlas never sees your private keys.
          </li>
          <li>
            <strong className="text-zinc-200 font-normal">Hosting and email</strong> — standard
            infrastructure providers for the app, database, and transactional email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: '5. Cookies',
    body: (
      <>
        <p>We use two categories of cookies, both strictly necessary:</p>
        <ul>
          <li>
            <strong className="text-zinc-200 font-normal">Session + refresh tokens</strong> — keep
            you signed in. httpOnly.
          </li>
          <li>
            <strong className="text-zinc-200 font-normal">CSRF token</strong> — protects form
            submissions from cross-site request forgery. Readable by the client.
          </li>
        </ul>
        <p>No analytics cookies, no marketing cookies, no third-party trackers.</p>
      </>
    ),
  },
  {
    id: 'your-rights',
    title: '6. Your rights',
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>Access a copy of the data we hold about you.</li>
          <li>Correct or update inaccurate data.</li>
          <li>Delete your account and associated data (on-chain records cannot be deleted).</li>
          <li>Export your data in a portable format.</li>
          <li>Object to certain processing.</li>
        </ul>
        <p>
          You can delete your account from your profile settings. For anything else, reach out via
          the channels below.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '7. Retention',
    body: (
      <>
        <p>
          We keep account data for as long as your account is active, plus a short window for
          disputes and legal obligations. Usage logs are rotated. On-chain transactions are
          permanent by nature — we cannot delete them.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: '8. Security',
    body: (
      <>
        <p>
          Passwords are hashed with bcrypt. Refresh tokens are rotated on use. API mutations require
          a CSRF token. Traffic is served over HTTPS. No system is perfectly secure — use a strong
          password and enable 2FA from your profile.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '9. Children',
    body: (
      <p>
        Atlas is not intended for users under 18. We do not knowingly collect data from minors. If
        you believe a minor has created an account, contact us so we can remove it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '10. Changes',
    body: (
      <p>
        We may update this policy as the product evolves. Material changes will be announced in-app
        and the &ldquo;last updated&rdquo; date at the top will change.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '11. Contact',
    body: (
      <p>
        Questions or privacy requests? Reach us on{' '}
        <a
          href="https://x.com/Atlas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-atlas-300 hover:text-atlas-200 underline underline-offset-2"
        >
          X
        </a>{' '}
        or through the in-app chat.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      icon={Shield}
      lastUpdated="April 20, 2026"
      sections={SECTIONS}
    />
  );
}
