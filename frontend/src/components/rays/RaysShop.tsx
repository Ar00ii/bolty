'use client';

import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface Pack {
  pack: string;
  rays: number;
  boltyPrice: number;
}

interface RaysShopProps {
  agentId: string;
  onPurchaseSuccess?: () => void;
  loading?: boolean;
}

export const RaysShop: React.FC<RaysShopProps> = ({
  agentId,
  onPurchaseSuccess,
  loading = false,
}) => {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingPacks, setLoadingPacks] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  // Fetch packs
  useEffect(() => {
    const fetchPacks = async () => {
      try {
        setLoadingPacks(true);
        const response = await fetch(`${API_URL}/rays/packs`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch packs');
        const data = await response.json();
        setPacks(data.packs || []);
        if (data.packs?.length > 0) {
          setSelectedPack(data.packs[1].pack); // Default to 2nd pack
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packs');
      } finally {
        setLoadingPacks(false);
      }
    };

    fetchPacks();
  }, [API_URL]);

  const handlePurchase = async () => {
    if (!selectedPack) {
      setError('Please select a pack');
      return;
    }

    setPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${API_URL}/rays/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          pack: selectedPack,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Purchase failed');
      }

      const data = await response.json();
      setSuccess(`Successfully purchased rays! Total: ${data.agentRays.totalRaysAccumulated} rays`);
      setSelectedPack(null);
      onPurchaseSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (loadingPacks) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
        <p className="text-gray-400">Loading packs...</p>
      </div>
    );
  }

  const selectedPackData = packs.find((p) => p.pack === selectedPack);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Purchase Rays
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Boost your agent in trending rankings. Rays accumulate permanently forever.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{success}</p>
        </div>
      )}

      {/* Packs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {packs.map((pack) => (
          <button
            key={pack.pack}
            onClick={() => setSelectedPack(pack.pack)}
            disabled={purchasing}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedPack === pack.pack
                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
            } disabled:opacity-50`}
          >
            <div className="font-semibold text-white">{pack.rays} Rays</div>
            <div className="text-2xl font-bold text-purple-400 mt-2">{pack.boltyPrice}</div>
            <div className="text-xs text-gray-400 mt-1">BOLTY</div>
            <div className="text-xs text-gray-500 mt-2">
              {(pack.boltyPrice / pack.rays).toFixed(2)} per ray
            </div>
          </button>
        ))}
      </div>

      {/* Selected Pack Details */}
      {selectedPackData && (
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Rays
              </p>
              <p className="text-2xl font-bold text-white mt-1">{selectedPackData.rays}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                Price
              </p>
              <p className="text-2xl font-bold text-purple-400 mt-1">{selectedPackData.boltyPrice} BOLTY</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-purple-500/20">
            <p className="text-xs text-gray-400 mb-2">
              When you purchase these rays:
            </p>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>- 50% BOLTY burned (reduces supply)</li>
              <li>- 50% BOLTY to Bolty DAO (development)</li>
              <li>- Rays accumulate permanently</li>
              <li>- Increases trending visibility</li>
            </ul>
          </div>
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={!selectedPack || purchasing}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
          selectedPack && !purchasing
            ? 'bg-purple-600 hover:bg-purple-700 text-white'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {purchasing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            {selectedPackData ? `Purchase ${selectedPackData.rays} Rays` : 'Select a Pack'}
          </>
        )}
      </button>

      {/* Info */}
      <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
        <p className="text-xs text-gray-400">
          Note: Purchase requires BOLTY tokens in your wallet. Rays are applied immediately to your agent and boost visibility in the trending section.
        </p>
      </div>
    </div>
  );
};

RaysShop.displayName = 'RaysShop';
