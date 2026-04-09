'use client';

import {
  Plus,
  X,
  Search,
  MessageCircle,
  Star,
  Clock,
  DollarSign,
  Briefcase,
  Code2,
  Cpu,
  Globe,
  Shield,
  Smartphone,
  Server,
  BarChart2,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import { ReputationBadge } from '@/components/ui/reputation-badge';
import { api, ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface ServiceUser {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  reputationPoints: number;
  occupation: string | null;
  bio?: string | null;
  _count?: { repositories: number; marketListings: number; serviceListings: number };
}

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  minBudget: number | null;
  maxBudget: number | null;
  currency: string;
  deliveryDays: number | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  user: ServiceUser;
}

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: Globe },
  { value: 'AI_DEVELOPMENT', label: 'AI Development', icon: Cpu },
  { value: 'SMART_CONTRACTS', label: 'Smart Contracts', icon: Shield },
  { value: 'WEB_DEVELOPMENT', label: 'Web Development', icon: Code2 },
  { value: 'BOT_DEVELOPMENT', label: 'Bot Development', icon: Star },
  { value: 'CONSULTING', label: 'Consulting', icon: Briefcase },
  { value: 'CODE_REVIEW', label: 'Code Review', icon: BarChart2 },
  { value: 'MOBILE_DEVELOPMENT', label: 'Mobile', icon: Smartphone },
  { value: 'DEVOPS', label: 'DevOps', icon: Server },
  { value: 'OTHER', label: 'Other', icon: HelpCircle },
];

const CATEGORY_LABEL: Record<string, string> = {
  AI_DEVELOPMENT: 'AI Development',
  SMART_CONTRACTS: 'Smart Contracts',
  WEB_DEVELOPMENT: 'Web Development',
  BOT_DEVELOPMENT: 'Bot Development',
  CONSULTING: 'Consulting',
  CODE_REVIEW: 'Code Review',
  MOBILE_DEVELOPMENT: 'Mobile',
  DEVOPS: 'DevOps',
  OTHER: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  AI_DEVELOPMENT: '#836ef9',
  SMART_CONTRACTS: '#38bdf8',
  WEB_DEVELOPMENT: '#34d399',
  BOT_DEVELOPMENT: '#f59e0b',
  CONSULTING: '#a855f7',
  CODE_REVIEW: '#f87171',
  MOBILE_DEVELOPMENT: '#fb923c',
  DEVOPS: '#2dd4bf',
  OTHER: '#71717a',
};

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'AI_DEVELOPMENT',
  skills: [] as string[],
  skillInput: '',
  minBudget: '',
  maxBudget: '',
  currency: 'USD',
  deliveryDays: '',
};

export default function ServicesPage() {
  const { isAuthenticated, user } = useAuth();
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      const data = await api.get<{ data: ServiceListing[] }>(`/services?${params}`);
      setServices(data.data);
    } catch {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const addSkill = () => {
    const skill = form.skillInput.trim();
    if (!skill || form.skills.includes(skill) || form.skills.length >= 15) return;
    setForm((f) => ({ ...f, skills: [...f.skills, skill], skillInput: '' }));
  };

  const removeSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const createService = async () => {
    if (!form.title.trim() || form.title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }
    if (!form.description.trim() || form.description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await api.post('/services', {
        title: form.title,
        description: form.description,
        category: form.category,
        skills: form.skills,
        minBudget: form.minBudget ? parseFloat(form.minBudget) : undefined,
        maxBudget: form.maxBudget ? parseFloat(form.maxBudget) : undefined,
        currency: form.currency,
        deliveryDays: form.deliveryDays ? parseInt(form.deliveryDays, 10) : undefined,
      });
      setSuccess('Service listing created successfully!');
      setForm(INITIAL_FORM);
      setShowCreate(false);
      await fetchServices();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create service');
    } finally {
      setCreating(false);
    }
  };

  const formatBudget = (s: ServiceListing) => {
    if (!s.minBudget && !s.maxBudget) return 'Negotiable';
    if (s.minBudget && s.maxBudget) return `$${s.minBudget}–$${s.maxBudget} ${s.currency}`;
    if (s.minBudget) return `From $${s.minBudget} ${s.currency}`;
    return `Up to $${s.maxBudget} ${s.currency}`;
  };

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="page-header">
        <p className="text-xs font-light text-monad-400 uppercase tracking-wider mb-2">
          Hire & Collaborate
        </p>
        <h1 className="text-2xl font-light text-white tracking-tight">Developer Services</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Find skilled developers for your project — or list your own services for others to
          discover.
        </p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg text-xs text-emerald-400 border border-emerald-500/25 bg-emerald-500/[0.06]">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-xs text-red-400 border border-red-500/20 bg-red-500/[0.06] flex items-center justify-between">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search services, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full pl-9"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.slice(0, 5).map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  category === cat.value
                    ? 'text-monad-300 bg-monad-500/12 border-monad-500/30 shadow-[0_0_8px_rgba(131,110,249,0.1)]'
                    : 'text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              List Your Services
            </button>
          )}
        </div>
      </div>

      {/* More categories */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {CATEGORIES.slice(5).map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              category === cat.value
                ? 'text-monad-300 bg-monad-500/12 border-monad-500/30 shadow-[0_0_8px_rgba(131,110,249,0.1)]'
                : 'text-zinc-500 bg-transparent border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create Service Form */}
      {showCreate && (
        <div className="card-elevated p-6 mb-8" style={{ borderColor: 'rgba(131,110,249,0.2)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-light text-white">Create Service Listing</h2>
            <button
              onClick={() => setShowCreate(false)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Service Title *</label>
              <input
                type="text"
                placeholder="e.g. I will build a custom AI trading bot for Solana"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={120}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input appearance-none cursor-pointer"
              >
                {CATEGORIES.filter((c) => c.value).map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">
                Estimated Delivery (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="e.g. 7"
                value={form.deliveryDays}
                onChange={(e) => setForm((f) => ({ ...f, deliveryDays: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Min Budget (USD)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100"
                value={form.minBudget}
                onChange={(e) => setForm((f) => ({ ...f, minBudget: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Max Budget (USD)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={form.maxBudget}
                onChange={(e) => setForm((f) => ({ ...f, maxBudget: e.target.value }))}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Skills & Technologies</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. TypeScript, Solidity, Next.js..."
                  value={form.skillInput}
                  onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="input flex-1"
                />
                <button onClick={addSkill} className="btn-secondary text-xs px-4">
                  Add
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.map((s) => (
                    <span key={s} className="badge flex items-center gap-1.5">
                      {s}
                      <button
                        onClick={() => removeSkill(s)}
                        className="opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Description *</label>
              <textarea
                placeholder="Describe your service in detail..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                maxLength={3000}
                rows={5}
                className="input resize-none"
              />
              <div className="text-right text-xs text-zinc-600 mt-1">
                {form.description.length}/3000
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={createService}
              disabled={creating}
              className="btn-primary text-xs px-6 py-2 disabled:opacity-50"
            >
              {creating ? 'Publishing...' : 'Publish Service'}
            </button>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon mx-auto">
            <Briefcase className="w-6 h-6 text-monad-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-light text-white mb-2">No services found</h3>
          <p className="text-sm text-zinc-500 mb-1 max-w-sm mx-auto">
            {isAuthenticated
              ? 'Be the first to list your developer services and get discovered by the community.'
              : 'Sign in to list your services and start collaborating with other developers.'}
          </p>
          {isAuthenticated ? (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary text-sm px-5 py-2 mt-5 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> List Your Services
            </button>
          ) : (
            <Link
              href="/auth"
              className="btn-primary text-sm px-5 py-2 mt-5 inline-flex items-center gap-2"
            >
              Sign in to get started
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => {
            const catColor = CATEGORY_COLORS[service.category] || '#71717a';
            const isExpanded = expandedCard === service.id;

            return (
              <div key={service.id} className="card-elevated flex flex-col overflow-hidden p-0">
                {/* Category accent bar */}
                <div
                  className="h-[2px] w-full"
                  style={{ background: `linear-gradient(90deg, ${catColor}, transparent 80%)` }}
                />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <Link href={`/u/${service.user.username}`} className="flex-shrink-0 group">
                      {service.user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={service.user.avatarUrl}
                          alt={service.user.username || ''}
                          className="w-10 h-10 rounded-xl object-cover border border-zinc-800 group-hover:border-monad-500/30 transition-colors"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-light text-sm transition-colors group-hover:border-monad-500/30"
                          style={{
                            background: `${catColor}12`,
                            border: `1px solid ${catColor}20`,
                            color: catColor,
                          }}
                        >
                          {(service.user.displayName ||
                            service.user.username ||
                            'U')[0].toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Link
                          href={`/u/${service.user.username}`}
                          className="text-xs text-zinc-400 hover:text-monad-400 transition-colors truncate font-light"
                        >
                          {service.user.displayName || service.user.username}
                        </Link>
                        <ReputationBadge points={service.user.reputationPoints} size="sm" />
                      </div>
                      {service.user.occupation && (
                        <p className="text-xs text-zinc-600 truncate">{service.user.occupation}</p>
                      )}
                    </div>

                    <span
                      className="badge-secondary text-[10px] flex-shrink-0"
                      style={{ color: catColor }}
                    >
                      {CATEGORY_LABEL[service.category] || service.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-light text-white mb-2 leading-snug">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-xs text-zinc-400 leading-relaxed mb-3"
                    style={
                      {
                        display: '-webkit-box',
                        WebkitLineClamp: isExpanded ? undefined : 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: isExpanded ? 'visible' : 'hidden',
                      } as React.CSSProperties
                    }
                  >
                    {service.description}
                  </p>

                  {service.description.length > 150 && (
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : service.id)}
                      className="flex items-center gap-1 text-xs text-monad-400/70 hover:text-monad-400 transition-colors mb-3 self-start"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}

                  {/* Skills */}
                  {service.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {service.skills.slice(0, 5).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                        >
                          {s}
                        </span>
                      ))}
                      {service.skills.length > 5 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-zinc-600">
                          +{service.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div
                    className="flex items-center gap-4 text-xs mt-auto pt-3 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="flex items-center gap-1 text-emerald-400">
                      <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                      {formatBudget(service)}
                    </span>
                    {service.deliveryDays && (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        {service.deliveryDays}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-5">
                  {isAuthenticated && service.user.username !== user?.username ? (
                    <Link
                      href={`/dm?user=${service.user.username}&context=service&serviceId=${service.id}`}
                      className="btn-primary w-full justify-center gap-2 text-xs py-2.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Contact Developer
                    </Link>
                  ) : isAuthenticated && service.user.username === user?.username ? (
                    <div className="card text-center py-2 text-xs text-zinc-600">Your listing</div>
                  ) : (
                    <Link
                      href="/auth"
                      className="btn-secondary w-full justify-center gap-2 text-xs py-2.5"
                    >
                      Sign in to contact
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How it works */}
      <div className="mt-16">
        <h2 className="text-base font-light text-white mb-5">How Hire & Collaborate Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: '01',
              title: 'Browse Services',
              desc: 'Explore services from verified developers. Filter by category, skills, or budget.',
              icon: Search,
            },
            {
              step: '02',
              title: 'Contact via DM',
              desc: 'Send a direct message to the developer. Discuss your project scope, timeline and requirements.',
              icon: MessageCircle,
            },
            {
              step: '03',
              title: 'Collaborate & Build',
              desc: "Work together using the platform's tools. Build reputation through successful collaborations.",
              icon: Star,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="step-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="step-number">{item.step}</div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'var(--brand-dim)',
                      border: '1px solid rgba(131,110,249,0.15)',
                    }}
                  >
                    <Icon className="w-5 h-5 text-monad-400" strokeWidth={1.75} />
                  </div>
                </div>
                <h3 className="text-sm font-light text-white mb-2">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
