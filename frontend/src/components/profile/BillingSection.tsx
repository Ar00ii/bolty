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
      <div className="p-6 border-2 border-purple-500/30 bg-purple-900/10 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-light text-white">{currentPlan.name}</h3>
            <p className="text-sm text-gray-400 mt-1">Your current plan</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${status.bg}`}>
            <status.icon className={`w-4 h-4 ${status.color}`} />
            <span className={`text-xs font-light ${status.color}`}>{status.label}</span>
          </div>
        </div>

        {data.plan !== 'free' && (
          <div className="space-y-1 mb-4 pb-4 border-b border-gray-700">
            <p className="text-sm text-gray-400">Price</p>
            <p className="text-lg font-light text-white">${currentPlan.price}</p>
            <p className="text-xs text-gray-500">billed monthly</p>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Includes</p>
          {currentPlan.features.map((feature) => (
            <div key={feature} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-sm text-gray-300">{feature}</span>
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
            className="w-full mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-light transition-colors disabled:opacity-50"
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
        <h3 className="text-sm font-light text-white uppercase tracking-wide">
          Billing Information
        </h3>

        {/* Email */}
        <div className="p-4 border border-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 mb-2">Billing Email</p>
          <p className="text-sm text-white font-light">{data.email}</p>
        </div>

        {/* Next Billing Date */}
        {data.plan !== 'free' && data.nextBillingDate && (
          <div className="p-4 border border-gray-700 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Next Billing Date</p>
            <p className="text-sm text-white font-light">
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
          <div className="p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500">Payment Method</p>
              </div>
              <button
                onClick={() => setShowCardModal(true)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Update
              </button>
            </div>
            <p className="text-sm text-white font-light">
              {data.cardLast4 ? `•••• •••• •••• ${data.cardLast4}` : 'No payment method on file'}
            </p>
          </div>
        )}
      </div>

      {/* Invoice History */}
      {data.plan !== 'free' && (
        <div className="space-y-3 pt-4 border-t border-gray-700">
          <h3 className="text-sm font-light text-white uppercase tracking-wide">Invoice History</h3>
          <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
            <span className="text-sm text-gray-300">Invoice #INV-2025-04-001</span>
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
            <span className="text-sm text-gray-300">Invoice #INV-2025-03-001</span>
            <Download className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

BillingSection.displayName = 'BillingSection';
