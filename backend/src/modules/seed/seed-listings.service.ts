import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ListingStatus, ListingType, Prisma } from '@prisma/client';

import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * One-shot founder-listings seed.
 *
 * When SEED_LISTINGS_ON_BOOT=1, on app start we walk a hardcoded set
 * of marketplace listings and create any that don't already exist for
 * the corresponding founder seller. Idempotent: matching is by
 * (sellerId, title) so re-running with the env var still set is a
 * no-op for already-seeded rows.
 *
 * Used to bootstrap the marketplace with real listings from the team
 * so the homepage isn't visibly empty for the first wave of visitors.
 * Each entry below describes a real product the team can actually
 * fulfill; this is bootstrap content, not wash trading.
 *
 * To run:
 *   1. Set SEED_LISTINGS_ON_BOOT=1 on Render.
 *   2. Wait for the next deploy. Logs will say "[seed] created N
 *      listings" or "[seed] no missing listings".
 *   3. Unset the env var so it doesn't re-evaluate every boot.
 */

interface SeedListing {
  ownerUsername: string;
  title: string;
  description: string;
  type: ListingType;
  priceEth: number;
  tags: string[];
  agentUrl?: string;
  agentEndpoint?: string;
}

const SEED: SeedListing[] = [
  // ── @logic ───────────────────────────────────────────────────────
  {
    ownerUsername: 'logic',
    title: 'BoltyGuard Pro: AI security scanner for any agent code',
    description:
      "Drop a script, a repo URL, or a webhook into BoltyGuard and get a 0-100 security score in under 30 seconds. Detects hardcoded secrets, hidden network calls, shell injection, prompt injection sinks, and unsafe deserialization. Powered by the same LLM-driven scanner that gates every agent listing on Bolty.\n\nBuilt for: developers shipping AI agents who don't want to read a security report at 3 AM after their endpoint gets pwned.\n\nWhat you get: 100 free scans per month, JSON report download, security badge for your repo.",
    type: ListingType.AI_AGENT,
    priceEth: 0.002,
    tags: ['security', 'scanner', 'boltyguard', 'audit', 'ai'],
    agentUrl: 'https://www.boltynetwork.xyz/boltyguard',
  },
  {
    ownerUsername: 'logic',
    title: 'Webhook starter: Express + TypeScript agent template',
    description:
      'Production-ready Express + TypeScript template for any AI agent that needs a webhook on Bolty. Includes: health check endpoint, structured logging, OpenAI/Anthropic adapter, BoltyGuard-compatible response shape. Deploy to Render in 1 command.\n\nBuilt for: devs who want to ship an agent in 1 evening, not 1 week.\n\nWhat you get: GitHub repo (private mirror granted on purchase) + 1 hour of Discord support.',
    type: ListingType.REPO,
    priceEth: 0.0004,
    tags: ['template', 'typescript', 'express', 'starter', 'webhook'],
  },
  {
    ownerUsername: 'logic',
    title: "Tweet Composer: AI that writes posts in your agent's voice",
    description:
      "Webhook that takes your agent's name, recent on-chain activity, and brand voice, and returns 3 tweet drafts ready to post. Plugs into the Bolty Launch tweet flow.\n\nBuilt for: agent owners who launched a token but freeze every time they have to actually tweet about it.",
    type: ListingType.AI_AGENT,
    priceEth: 0.0008,
    tags: ['ai', 'social', 'tweet', 'launch', 'composer'],
    agentEndpoint: 'https://api.boltynetwork.xyz/api/v1/agents/tweet-composer',
  },

  // ── @mintak ──────────────────────────────────────────────────────
  {
    ownerUsername: 'mintak',
    title: 'Auto-Negotiator: AI agent that haggles for you',
    description:
      'Drops into your marketplace listing as the "negotiate" target. When a buyer pings, the agent reads the listing context, the buyer\'s reputation, and your floor price, then counter-offers in your voice. Closes about 40% more deals than fixed-price.\n\nBuilt for: sellers tired of replying to "lowball offer" DMs.\n\nWhat you get: webhook URL to plug into any Bolty listing, configurable floor price + minimum margin, full conversation log.',
    type: ListingType.AI_AGENT,
    priceEth: 0.0012,
    tags: ['negotiation', 'agent', 'ai', 'marketplace', 'sales'],
    agentEndpoint: 'https://api.boltynetwork.xyz/api/v1/agents/auto-negotiator',
  },
  {
    ownerUsername: 'mintak',
    title: 'Welcome pack for $BOLTY holders',
    description:
      'Free onboarding pack for new $BOLTY holders. Includes: how to launch your first agent (5 min walkthrough), how to use BoltyGuard, how to monetize your repo, and a curated list of 10 agent ideas that haven\'t been built yet but should.\n\nBuilt for: anyone holding $BOLTY who wants to actually use the platform, not just hodl.',
    type: ListingType.OTHER,
    priceEth: 0,
    tags: ['onboarding', 'bolty', 'guide', 'free', 'community'],
  },
  {
    ownerUsername: 'mintak',
    title: 'Pre-launch sanity check: 15 min review before you ship',
    description:
      "Tell us what you're about to launch (agent, token, repo) and we'll spend 15 min before you publish to flag the obvious mistakes: fee tier wrong for your market, name conflicts on X, security score below threshold, missing description fields. We've shipped enough launches to spot the patterns.\n\nBuilt for: first-time launchers who don't know what they don't know.",
    type: ListingType.OTHER,
    priceEth: 0.0004,
    tags: ['review', 'launch', 'consulting', 'pre-launch', 'sanity-check'],
  },

  // ── @drbug ───────────────────────────────────────────────────────
  {
    ownerUsername: 'drbug',
    title: 'New Launch Sniper: First-trade alert for Bolty Launchpad',
    description:
      'Telegram bot that pings you the second a new token launches on Bolty Launchpad. Filters by creator reputation, initial liquidity, and tags. Skip the doom-scrolling, get straight to the launches that matter.\n\nBuilt for: traders who want first-mover position on agent-launched tokens.',
    type: ListingType.BOT,
    priceEth: 0.0008,
    tags: ['bot', 'telegram', 'launchpad', 'sniper', 'alerts'],
    agentEndpoint: 'https://api.boltynetwork.xyz/api/v1/bots/launch-sniper',
  },
  {
    ownerUsername: 'drbug',
    title: '1-hour repo audit: structure, security, monetization',
    description:
      'Send your repo URL, get back a 1-page report covering: code structure (red flags, dead deps), security (BoltyGuard scan + manual review of the top findings), and monetization angles (which parts could be split into paid agents on Bolty). Delivered in under 1 hour.\n\nBuilt for: solo devs sitting on a half-shipped project not sure if it\'s worth the next 100 hours.',
    type: ListingType.SCRIPT,
    priceEth: 0.0016,
    tags: ['audit', 'review', 'repo', 'monetization', 'consulting'],
  },
];

@Injectable()
export class SeedListingsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedListingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    const flag = process.env.SEED_LISTINGS_ON_BOOT;
    if (flag !== '1' && flag !== 'true') return;
    // Fire off-thread so a slow seed doesn't block app readiness.
    setTimeout(() => {
      this.run().catch((err) => this.logger.warn(`seed failed: ${(err as Error).message}`));
    }, 4_000);
  }

  private async run(): Promise<void> {
    this.logger.log('[seed] starting founder-listings seed');

    // Resolve usernames → user ids once. If any owner is missing, skip
    // their listings rather than failing the whole batch.
    const usernames = Array.from(new Set(SEED.map((s) => s.ownerUsername)));
    const users = await this.prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true, username: true },
    });
    const idByUsername = new Map(
      users
        .filter((u): u is { id: string; username: string } => Boolean(u.username))
        .map((u) => [u.username.toLowerCase(), u.id]),
    );

    for (const wanted of usernames) {
      if (!idByUsername.has(wanted.toLowerCase())) {
        this.logger.warn(`[seed] no user @${wanted} in DB — skipping their listings`);
      }
    }

    let created = 0;
    let skipped = 0;
    for (const item of SEED) {
      const sellerId = idByUsername.get(item.ownerUsername.toLowerCase());
      if (!sellerId) {
        skipped += 1;
        continue;
      }
      // Idempotency: matching by (sellerId, title) so re-running doesn't
      // duplicate. We don't use a true unique index because the schema
      // doesn't have one — title is freeform — but founder listings have
      // distinct titles by design.
      const existing = await this.prisma.marketListing.findFirst({
        where: { sellerId, title: item.title },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await this.prisma.marketListing.create({
        data: {
          sellerId,
          title: item.title,
          description: item.description,
          type: item.type,
          price: item.priceEth,
          currency: 'ETH',
          tags: item.tags,
          status: ListingStatus.ACTIVE,
          // Founder listings skip the BoltyGuard gate — they have no
          // uploaded code (no fileKey) and the seller is trusted by
          // virtue of being the platform team.
          scanPassed: true,
          scanNote: 'Founder listing — skipped BoltyGuard scan (no fileKey to scan).',
          agentUrl: item.agentUrl ?? null,
          agentEndpoint: item.agentEndpoint ?? null,
        } satisfies Prisma.MarketListingUncheckedCreateInput,
      });
      created += 1;
      this.logger.log(`[seed] created '${item.title}' for @${item.ownerUsername}`);
    }

    this.logger.log(
      `[seed] done. created=${created} skipped=${skipped} (${SEED.length} total). Unset SEED_LISTINGS_ON_BOOT in Render so this doesn't re-evaluate on every boot.`,
    );
  }
}
