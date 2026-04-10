'use client';

import { User } from '@/lib/auth/AuthProvider';
import React from 'react';

interface ProfileSidebarProps {
  user: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string; icon: React.ReactNode }[];
}

export function ProfileSidebar({ user, activeTab, onTabChange, tabs }: ProfileSidebarProps) {
  return (
    <div className="profile-sidebar w-64 flex flex-col gap-8">
      {/* User Info Card */}
      <div className="profile-card">
        <div className="flex flex-col items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName || user.username || 'User'}
              className="w-20 h-20 rounded-full border-2 border-purple-500/30 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl font-light text-white">
              {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
            </div>
          )}
          <div className="text-center">
            <p className="text-base font-light text-white">
              {user?.displayName || user?.username || 'User'}
            </p>
            <p className="text-sm text-text-secondary">@{user?.username || 'username'}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full ${
              activeTab === tab.id
                ? 'bg-purple-500/10 text-purple-300'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <span className="w-5 h-5 flex items-center justify-center">{tab.icon}</span>
            <span className="text-sm font-light flex-1 text-left">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
