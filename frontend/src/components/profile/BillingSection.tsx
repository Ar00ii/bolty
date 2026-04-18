'use client';

import { CreditCard, Download, AlertCircle, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

type Plan = 'free' | 'pro' | 'enterprise';

interface BillingData {
  plan: Plan;
  email: string;
  nextBillingDate?: string;
  amount?: number;
  status: 'active' | 'inactive' | 'past_due';
  cardLast4?: string;
}

interface BillingSectionProps {
  data: BillingData;
  onUpgrade?: (plan: Plan) => Promise<void>;
  onUpdatePayment?: () => Promise<void>;
}

export const BillingSection: React.FC<BillingSectionProps> = ({
  data,
  onUpgrade,
  onUpdatePayment,
}) => {
  const [loading, setLoading] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const planDetails = {
    free: {
      name: 'Free',
      price: 0,
      calls: '100,000',
      features: ['100,000 API calls/month', 'Community support', '1 active agent'],
    },
    pro: {
      name: 'Professional',
      price: 99,
      calls: '1,000,000',
      features: [
        '1,000,000 API calls/month',
        'Email support',
        '10 active agents',
        'Advanced analytics',
      ],
    },
    enterprise: {
      name: 'Enterprise',
      price: 999,
      calls: 'Custom',
      features: [
        'Unlimited API calls',
        'Priority support',
        'Unlimited agents',
        'Custom integrations',
      ],
    },
  };

  const currentPlan = planDetails[data.plan];
  const statusConfig = {
    active: { color: 'text-green-400', bg: 'bg-green-900/20', icon: CheckCircle, label: 'Active' },
    inactive: {
      color: 'text-gray-400',
      bg: 'bg-gray-900/20',
      icon: AlertCircle,
      label: 'Inactive',
    },
    past_due: { color: 'text-red-400', bg: 'bg-red-900/20', icon: AlertCircle, label: 'Past Due' },
  };
  const status = statusConfig[data.status];

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-light text-white">Billing & Subscription</h2>
        <p className="text-sm text-gray-400 mt-1">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan Card */}
      <div
        className="relative p-6 rounded-xl overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(131,110,249,0.12) 0%, rgba(131,110,249,0.02) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(131,110,249,0.32), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 32px -8px rgba(131,110,249,0.35)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.55) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-light text-white tracking-[-0.01em]">
              {currentPlan.name}
            </h3>
            <p className="text-sm text-zinc-400 mt-1">Your current plan</p>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              background:
                data.status === 'active'
                  ? 'linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.04) 100%)'
                  : data.status === 'past_due'
                    ? 'linear-gradient(180deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.04) 100%)'
                    : 'linear-gradient(180deg, rgba(161,161,170,0.18) 0%, rgba(161,161,170,0.04) 100%)',
              boxShadow:
                data.status === 'active'
                  ? 'inset 0 0 0 1px rgba(34,197,94,0.32)'
                  : data.status === 'past_due'
                    ? 'inset 0 0 0 1px rgba(239,68,68,0.32)'
                    : 'inset 0 0 0 1px rgba(161,161,170,0.3)',
            }}
          >
            <status.icon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-[11px] font-medium tracking-[0.005em] ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {data.plan !== 'free' && (
          <div className="space-y-1 mb-4 pb-4 border-b border-white/[0.06]">
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Price
            </p>
            <p className="text-2xl font-light text-white tabular-nums tracking-[-0.01em]">
              ${currentPlan.price}
            </p>
            <p className="text-xs text-zinc-500">billed monthly</p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
            Includes
          </p>
          {currentPlan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#836EF9',
                  boxShadow: '0 0 8px rgba(131,110,249,0.6)',
                }}
              />
              <span className="text-sm text-zinc-300">{feature}</span>
            </div>
          ))}
        </div>

        {data.plan !== 'enterprise' && (
          <button
            onClick={async () => {
              if (!onUpgrade) return;
              setLoading(true);
              try {
                await onUpgrade(data.plan === 'free' ? 'pro' : 'enterprise');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full mt-4 px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            {loading
              ? 'Processing...'
              : data.plan === 'free'
                ? 'Upgrade to Pro'
                : 'Upgrade to Enterprise'}
          </button>
        )}
      </div>

      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
          Billing Information
        </h3>

        {/* Email */}
        <div
          className="relative p-4 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.35) 50%, transparent 100%)',
            }}
          />
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
            Billing Email
          </p>
          <p className="text-sm text-white font-light tracking-[0.005em]">{data.email}</p>
        </div>

        {/* Next Billing Date */}
        {data.plan !== 'free' && data.nextBillingDate && (
          <div
            className="relative p-4 rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.35) 50%, transparent 100%)',
              }}
            />
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
              Next Billing Date
            </p>
            <p className="text-sm text-white font-light tabular-nums tracking-[0.005em]">
              {new Date(data.nextBillingDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Payment Method */}
        {data.plan !== 'free' && (
          <div
            className="relative p-4 rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.35) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#b4a7ff]" />
                </div>
                <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                  Payment Method
                </p>
              </div>
              <button
                onClick={() => setShowCardModal(true)}
                className="text-[11px] font-medium tracking-[0.005em] text-[#b4a7ff] hover:text-white transition-colors"
              >
                Update
              </button>
            </div>
            <p className="text-sm text-white font-light tabular-nums tracking-[0.005em]">
              {data.cardLast4 ? `•••• •••• •••• ${data.cardLast4}` : 'No payment method on file'}
            </p>
          </div>
        )}
      </div>

      {/* Invoice History */}
      {data.plan !== 'free' && (
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <h3 className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
            Invoice History
          </h3>
          {['INV-2025-04-001', 'INV-2025-03-001'].map((invoiceId) => (
            <button
              key={invoiceId}
              className="group relative w-full flex items-center justify-between px-4 py-3 rounded-xl overflow-hidden transition-all hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
                }}
              />
              <span className="text-[13px] text-zinc-300 font-light tracking-[0.005em] font-mono">
                Invoice #{invoiceId}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                }}
              >
                <Download className="w-3.5 h-3.5 text-[#b4a7ff]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

BillingSection.displayName = 'BillingSection';
