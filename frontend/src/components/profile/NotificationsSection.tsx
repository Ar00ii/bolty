'use client';

import { Mail, AlertCircle, CheckCircle, Bell, type LucideIcon } from 'lucide-react';
import React, { useState } from 'react';

interface NotificationSettings {
  emailOnErrors: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  deploymentAlerts: boolean;
}

interface NotificationsSectionProps {
  settings: NotificationSettings;
  billingEmail: string;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
}

interface NotificationOption {
  key: keyof NotificationSettings;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  textColor: string;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  settings,
  billingEmail,
  onUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    const updated = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await onUpdate(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const notificationOptions: NotificationOption[] = [
    {
      key: 'emailOnErrors',
      icon: AlertCircle,
      title: 'Email on API Errors',
      description: 'Get alerts for failed requests or rate limit warnings',
      color: '239,68,68',
      textColor: '#fda4af',
    },
    {
      key: 'weeklyReport',
      icon: Mail,
      title: 'Weekly Usage Report',
      description: `Summary of your API usage sent to ${billingEmail}`,
      color: '6,182,212',
      textColor: '#67e8f9',
    },
    {
      key: 'monthlyReport',
      icon: Bell,
      title: 'Monthly Newsletter',
      description: 'Product updates, tips, and new features',
      color: '245,158,11',
      textColor: '#fcd34d',
    },
    {
      key: 'deploymentAlerts',
      icon: CheckCircle,
      title: 'Deployment Alerts',
      description: 'Notifications when your agents are deployed or updated',
      color: '34,197,94',
      textColor: '#86efac',
    },
  ];

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-light text-white">Notifications</h2>
        <p className="text-sm text-gray-400 mt-1">Manage how you receive updates and alerts</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div
          className="relative p-3 rounded-lg flex items-center gap-2 overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(34,197,94,0.3)',
          }}
        >
          <CheckCircle className="w-4 h-4 text-[#86efac] flex-shrink-0" />
          <p className="text-[13px] text-[#86efac] tracking-[0.005em]">
            Notification preferences saved successfully
          </p>
        </div>
      )}

      {/* Notification Options */}
      <div className="space-y-3">
        {notificationOptions.map(({ key, icon: Icon, title, description, color, textColor }) => {
          const isEnabled = localSettings[key];
          return (
            <div
              key={key}
              className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(${color},0.4) 50%, transparent 100%)`,
                }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, rgba(${color},0.22) 0%, rgba(${color},0.06) 100%)`,
                    boxShadow: `inset 0 0 0 1px rgba(${color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${color},0.45)`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: textColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-light text-white tracking-[0.005em]">
                        {title}
                      </h3>
                      <p className="text-[12px] text-zinc-400 mt-1 tracking-[0.005em]">
                        {description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(key)}
                      disabled={loading}
                      role="switch"
                      aria-checked={isEnabled}
                      className="relative w-10 h-5.5 rounded-full flex-shrink-0 transition-all disabled:opacity-50"
                      style={{
                        background: isEnabled
                          ? 'linear-gradient(180deg, rgba(131,110,249,0.8) 0%, rgba(131,110,249,0.55) 100%)'
                          : 'linear-gradient(180deg, rgba(40,40,48,0.9) 0%, rgba(24,24,30,0.9) 100%)',
                        boxShadow: isEnabled
                          ? 'inset 0 0 0 1px rgba(131,110,249,0.6), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px -2px rgba(131,110,249,0.5)'
                          : 'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
                        width: '40px',
                        height: '22px',
                      }}
                    >
                      <span
                        className="absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform"
                        style={{
                          transform: isEnabled ? 'translateX(18px)' : 'translateX(0)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Email Preferences */}
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
          Email Address
        </p>
        <p className="text-sm text-white font-light tracking-[0.005em] break-all">{billingEmail}</p>
        <p className="text-xs text-zinc-500 mt-2">
          All notifications will be sent to this email address
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
          <button
            onClick={() => setLocalSettings(settings)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-zinc-300 rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 hover:text-white disabled:opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

NotificationsSection.displayName = 'NotificationsSection';
