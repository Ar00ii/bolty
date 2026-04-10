'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Zap, Trophy, ShoppingCart } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-5xl lg:text-6xl font-light text-white mb-4">
            Click, click, done.
          </h2>
        </motion.div>

        {/* 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Column 1: Deploy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="relative"
          >
            {/* Number badge */}
            <div className="absolute -top-8 left-0 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                1
              </div>
              <h3 className="text-2xl font-light text-white">Deploy New Agent</h3>
            </div>

            <div className="mt-12 bg-black rounded-lg border border-gray-800 p-8 min-h-96">
              <p className="text-sm text-gray-400 mb-6">
                Connect your repository and configure your agent deployment settings
              </p>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Step 3 of 6</span>
                  <span className="text-xs text-purple-400">57%</span>
                </div>
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-2">AI Negotiation Webhook</label>
                  <input
                    type="text"
                    placeholder="https://your-api.com/webhook"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Endpoint where buyers can negotiate with your agent</p>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-2">Agent File</label>
                  <div className="border-2 border-dashed border-gray-700 rounded p-8 text-center">
                    <p className="text-gray-500 text-sm">Click to upload agent file</p>
                    <p className="text-xs text-gray-600 mt-1">.js, .ts, .zip, .json, .yaml or .yml — max 10 MB</p>
                  </div>
                </div>
              </div>

              <button className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded text-sm font-medium hover:opacity-90 transition">
                Setup Integrations ⚡
              </button>
            </div>
          </motion.div>

          {/* Column 2: Reputation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            {/* Number badge */}
            <div className="absolute -top-8 left-0 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                2
              </div>
              <h3 className="text-2xl font-light text-white">Build Reputation</h3>
            </div>

            <div className="mt-12 bg-black rounded-lg border border-gray-800 p-8 min-h-96">
              <p className="text-sm text-gray-400 mb-6">
                The most trusted and respected developers in the Bolty ecosystem
              </p>

              {/* Rank tiers */}
              <div className="mb-6">
                <h4 className="text-xs uppercase text-gray-600 font-mono mb-3">Rank Tiers</h4>
                <div className="space-y-2">
                  {['Newcomer', 'Bronze', 'Silver', 'Gold'].map((tier) => (
                    <div key={tier} className="text-xs text-gray-400 px-3 py-2 bg-gray-900 rounded border border-gray-800">
                      {tier}
                    </div>
                  ))}
                </div>
              </div>

              {/* How to earn */}
              <div>
                <h4 className="text-xs uppercase text-gray-600 font-mono mb-3">How to Earn Points</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Publish a repository</span>
                    <span className="text-purple-400">+15 pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sell a locked repository</span>
                    <span className="text-purple-400">+75 pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Complete your profile</span>
                    <span className="text-purple-400">+10 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Column 3: Marketplace */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            {/* Number badge */}
            <div className="absolute -top-8 left-0 flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                3
              </div>
              <h3 className="text-2xl font-light text-white">Earn & Grow</h3>
            </div>

            <div className="mt-12 bg-black rounded-lg border border-gray-800 p-8 min-h-96">
              <p className="text-sm text-gray-400 mb-6">
                AI agents, automation tools, and code repositories. Get instant revenue.
              </p>

              {/* Two main options */}
              <div className="space-y-4">
                <div className="border border-gray-800 rounded p-4 hover:border-purple-500 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">AI Agents</h4>
                      <p className="text-xs text-gray-400 mb-3">
                        Discover and buy autonomous AI bots
                      </p>
                      <button className="text-xs text-purple-400 hover:text-purple-300">
                        Browse marketplace →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-800 rounded p-4 hover:border-purple-500 transition cursor-pointer">
                  <div className="flex items-start gap-3">
                    <ArrowRight className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">Repositories</h4>
                      <p className="text-xs text-gray-400 mb-3">
                        Browse community code and locked projects
                      </p>
                      <button className="text-xs text-cyan-400 hover:text-cyan-300">
                        Browse repos →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  Ready to list your first agent? Get started →
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
