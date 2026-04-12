'use client';

import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, Bell } from 'lucide-react';

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

  const notificationOptions = [
    {
      key: 'emailOnErrors' as const,
      icon: AlertCircle,
      title: 'Email on API Errors',
      description: 'Get alerts for failed requests or rate limit warnings',
    },
    {
      key: 'weeklyReport' as const,
      icon: Mail,
      title: 'Weekly Usage Report',
      description: `Summary of your API usage sent to ${billingEmail}`,
    },
    {
      key: 'monthlyReport' as const,
      icon: Bell,
      title: 'Monthly Newsletter',
      description: 'Product updates, tips, and new features',
    },
    {
      key: 'deploymentAlerts' as const,
      icon: CheckCircle,
      title: 'Deployment Alerts',
      description: 'Notifications when your agents are deployed or updated',
    },
  ];

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
        <p className="text-sm text-gray-400 mt-1">Manage how you receive updates and alerts</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-300">Notification preferences saved successfully</p>
        </div>
      )}

      {/* Notification Options */}
      <div className="space-y-3">
        {notificationOptions.map(({ key, icon: Icon, title, description }) => (
          <div
            key={key}
            className="p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-white">{title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={localSettings[key]}
                      onChange={() => handleToggle(key)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Email Preferences */}
      <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
        <p className="text-sm font-medium text-white mb-2">Email Address</p>
        <p className="text-sm text-gray-300 break-all">{billingEmail}</p>
        <p className="text-xs text-gray-500 mt-2">All notifications will be sent to this email address</p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
          <button
            onClick={() => setLocalSettings(settings)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

NotificationsSection.displayName = 'NotificationsSection';
