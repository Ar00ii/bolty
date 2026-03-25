'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api, ApiError } from '@/lib/api/client';
import { DottedSurface } from '@/components/ui/dotted-surface';
import { ReputationBadge } from '@/components/ui/reputation-badge';
import {
  Plus, X, Search, MessageCircle, Star, Clock, DollarSign,
  Briefcase, Code2, Cpu, Globe, Shield, Smartphone, Server,
  BarChart2, HelpCircle, ChevronDown,
} from 'lucide-react';

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

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const addSkill = () => {
    const skill = form.skillInput.trim();
    if (!skill || form.skills.includes(skill) || form.skills.length >= 15) return;
    setForm(f => ({ ...f, skills: [...f.skills, skill], skillInput: '' }));
  };

  const removeSkill = (s: string) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

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
    <div className="max-w-7xl mx-auto px-4 py-10">
      <DottedSurface />

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-mono text-monad-400 uppercase tracking-widest mb-2">Hire & Collaborate</p>
        <h1 className="text-2xl font-bold text-white mb-1">Developer Services</h1>
        <p className="text-sm text-zinc-500">
          Find skilled developers for your project — or list your own services for others to discover.
        </p>
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-xs font-mono text-emerald-400 border border-emerald-500/25" style={{ background: 'rgba(52,211,153,0.06)' }}>
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-xs font-mono text-red-400 border border-red-500/20" style={{ background: 'rgba(248,113,113,0.06)' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3 inline" /></button>
        </div>
      )}

      {/* Controls */}
      <div className="border border-white/06 rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex-1 min-w-48 flex items-center gap-2 rounded-xl px-3 py-2 border border-zinc-800 bg-zinc-900/70 focus-within:border-monad-500/50 transition-colors">
          <Search className="w-4 h-4 text-zinc-600 flex-shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search services, skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-600 outline-none"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.slice(0, 5).map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
              style={{
                background: category === cat.value ? 'rgba(131,110,249,0.15)' : 'rgba(255,255,255,0.03)',
                color: category === cat.value ? '#836ef9' : 'rgba(161,161,170,0.5)',
                border: category === cat.value ? '1px solid rgba(131,110,249,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 text-xs font-mono px-4 py-2 rounded-xl border border-monad-500/30 text-monad-400 hover:bg-monad-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            List Your Services
          </button>
        )}
      </div>

      {/* More categories */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {CATEGORIES.slice(5).map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className="px-3 py-1.5 text-xs font-mono rounded-lg transition-colors"
            style={{
              background: category === cat.value ? 'rgba(131,110,249,0.15)' : 'rgba(255,255,255,0.02)',
              color: category === cat.value ? '#836ef9' : 'rgba(161,161,170,0.4)',
              border: category === cat.value ? '1px solid rgba(131,110,249,0.3)' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create Service Form */}
      {showCreate && (
        <div className="border border-monad-500/20 rounded-2xl p-6 mb-8" style={{ background: 'rgba(131,110,249,0.03)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-monad-300 font-mono">Create Service Listing</h2>
            <button onClick={() => setShowCreate(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Service Title *</label>
              <input
                type="text"
                placeholder="e.g. I will build a custom AI trading bot for Solana"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={120}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white outline-none focus:border-monad-500/50 transition-colors appearance-none cursor-pointer"
              >
                {CATEGORIES.filter(c => c.value).map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Delivery */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Estimated Delivery (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="e.g. 7"
                value={form.deliveryDays}
                onChange={e => setForm(f => ({ ...f, deliveryDays: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors"
              />
            </div>

            {/* Budget range */}
            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Min Budget (USD)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100"
                value={form.minBudget}
                onChange={e => setForm(f => ({ ...f, minBudget: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1.5">Max Budget (USD)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={form.maxBudget}
                onChange={e => setForm(f => ({ ...f, maxBudget: e.target.value }))}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors"
              />
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Skills & Technologies</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. TypeScript, Solidity, Next.js..."
                  value={form.skillInput}
                  onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2 rounded-xl text-xs font-mono border border-monad-500/30 text-monad-400 hover:bg-monad-500/10 transition-colors"
                >
                  Add
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.skills.map(s => (
                    <span key={s} className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg"
                      style={{ background: 'rgba(131,110,249,0.1)', color: '#836ef9', border: '1px solid rgba(131,110,249,0.2)' }}>
                      {s}
                      <button onClick={() => removeSkill(s)} className="opacity-60 hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="text-xs text-zinc-500 block mb-1.5">Description *</label>
              <textarea
                placeholder="Describe your service in detail. What do you offer? What technologies do you use? What's included? What do you need from the client?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={3000}
                rows={5}
                className="w-full rounded-xl px-3 py-2.5 text-sm bg-zinc-900/70 border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-monad-500/50 transition-colors resize-none"
              />
              <div className="text-right text-xs text-zinc-700 mt-1">{form.description.length}/3000</div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 justify-end">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-mono text-zinc-500 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={createService}
              disabled={creating}
              className="px-6 py-2.5 rounded-xl text-xs font-mono text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#836EF9,#6b4fe0)' }}
            >
              {creating ? 'Publishing...' : 'Publish Service'}
            </button>
          </div>
        </div>
      )}

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-800 border-t-monad-400 animate-spin mx-auto" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/06 rounded-2xl">
          <Briefcase className="w-8 h-8 text-zinc-700 mx-auto mb-3" strokeWidth={1} />
          <p className="text-zinc-600 font-mono text-sm mb-1">No services found.</p>
          <p className="text-zinc-700 text-xs">
            {isAuthenticated ? 'Be the first to list your services.' : 'Sign in to list your services.'}
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-mono border border-monad-500/30 text-monad-400 hover:bg-monad-500/10 transition-colors"
            >
              + List Your Services
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => {
            const catColor = CATEGORY_COLORS[service.category] || '#71717a';
            const isExpanded = expandedCard === service.id;

            return (
              <div
                key={service.id}
                className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-1px]"
                style={{
                  background: '#0e0e12',
                  border: '1px solid rgba(255,255,255,0.07)',
                  boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}
              >
                {/* Category accent bar */}
                <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${catColor}, transparent)` }} />

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {/* Avatar */}
                    <Link href={`/u/${service.user.username}`} className="flex-shrink-0">
                      {service.user.avatarUrl ? (
                        <img
                          src={service.user.avatarUrl}
                          alt={service.user.username || ''}
                          className="w-10 h-10 rounded-xl object-cover border border-white/08"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={{ background: `${catColor}18`, border: `1px solid ${catColor}30`, color: catColor }}>
                          {(service.user.displayName || service.user.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Link href={`/u/${service.user.username}`} className="text-xs text-zinc-400 hover:text-monad-400 transition-colors truncate">
                          {service.user.displayName || service.user.username}
                        </Link>
                        <ReputationBadge points={service.user.reputationPoints} size="sm" />
                      </div>
                      {service.user.occupation && (
                        <p className="text-xs text-zinc-600 truncate">{service.user.occupation}</p>
                      )}
                    </div>

                    {/* Category badge */}
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded-lg flex-shrink-0"
                      style={{ background: `${catColor}12`, color: catColor, border: `1px solid ${catColor}25`, fontSize: '0.6rem' }}>
                      {CATEGORY_LABEL[service.category] || service.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-white mb-2 leading-snug">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-zinc-500 leading-relaxed mb-3"
                    style={{ display: '-webkit-box', WebkitLineClamp: isExpanded ? undefined : 3, WebkitBoxOrient: 'vertical', overflow: isExpanded ? 'visible' : 'hidden' } as React.CSSProperties}>
                    {service.description}
                  </p>

                  {service.description.length > 150 && (
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : service.id)}
                      className="flex items-center gap-1 text-xs text-monad-400/60 hover:text-monad-400 transition-colors mb-3 self-start"
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {/* Skills */}
                  {service.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {service.skills.slice(0, 5).map(s => (
                        <span key={s} className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(161,161,170,0.6)', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.65rem' }}>
                          {s}
                        </span>
                      ))}
                      {service.skills.length > 5 && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ color: 'rgba(161,161,170,0.4)', fontSize: '0.65rem' }}>
                          +{service.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Meta: budget + delivery */}
                  <div className="flex items-center gap-3 text-xs font-mono mt-auto pt-3 border-t border-white/05">
                    <span className="flex items-center gap-1 text-emerald-400/80">
                      <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                      {formatBudget(service)}
                    </span>
                    {service.deliveryDays && (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3" strokeWidth={1.5} />
                        {service.deliveryDays}d delivery
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer: Contact CTA */}
                <div className="px-5 pb-4">
                  {isAuthenticated && service.user.username !== user?.username ? (
                    <Link
                      href={`/dm?user=${service.user.username}&context=service&serviceId=${service.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #836EF9, #6b4fe0)' }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Contact Developer
                    </Link>
                  ) : isAuthenticated && service.user.username === user?.username ? (
                    <div className="flex items-center justify-center py-2 text-xs font-mono text-zinc-600 border border-dashed border-white/06 rounded-xl">
                      Your listing
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono border border-monad-500/30 text-monad-400 hover:bg-monad-500/10 transition-colors"
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
      <div className="mt-16 border border-white/06 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.01)' }}>
        <h2 className="text-sm font-semibold text-white mb-4 font-mono">How Hire & Collaborate Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Browse Services', desc: 'Explore services from verified developers. Filter by category, skills, or budget.' },
            { step: '02', title: 'Contact via DM', desc: 'Send a direct message to the developer. Discuss your project scope, timeline and requirements.' },
            { step: '03', title: 'Collaborate & Build', desc: 'Work together using the platform\'s tools. Build reputation through successful collaborations.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="text-2xl font-bold text-monad-400/20 font-mono flex-shrink-0">{item.step}</span>
              <div>
                <h3 className="text-xs font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
