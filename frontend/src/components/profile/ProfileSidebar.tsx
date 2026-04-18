'use client';

import React from 'react';

import { User } from '@/lib/auth/AuthProvider';

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
            <div className="relative">
              <div
                className="absolute -inset-1 rounded-full opacity-70"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(131,110,249,0.45) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              <img
                src={user.avatarUrl}
                alt={user.displayName || user.username || 'User'}
                className="relative w-20 h-20 rounded-full object-cover"
                style={{
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 0 2px rgba(131,110,249,0.35), 0 0 24px -4px rgba(131,110,249,0.5)',
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <div
                className="absolute -inset-1 rounded-full opacity-70"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(131,110,249,0.45) 0%, transparent 70%)',
                  filter: 'blur(8px)',
                }}
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-light text-white"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.6) 0%, rgba(6,182,212,0.55) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 24px -4px rgba(131,110,249,0.5)',
                }}
              >
                {(user?.displayName || user?.username || 'U')[0]?.toUpperCase()}
              </div>
            </div>
          )}
          <div className="text-center">
            <p className="text-base font-light text-white tracking-[-0.005em]">
              {user?.displayName || user?.username || 'User'}
            </p>
            <p className="text-[12px] text-zinc-500 font-mono tracking-[0.005em] mt-0.5">
              @{user?.username || 'username'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`profile-menu-item flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all w-full ${isActive ? 'active' : ''}`}
            >
              <span
                className={`w-5 h-5 flex items-center justify-center transition-colors ${isActive ? 'text-[#b4a7ff]' : 'text-zinc-500'}`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-[13px] font-light flex-1 text-left tracking-[0.005em] transition-colors ${isActive ? 'text-[#b4a7ff]' : 'text-zinc-300'}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
