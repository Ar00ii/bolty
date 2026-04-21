import React from 'react';

type IconProps = { className?: string; size?: number };

// MetaMask fox — simplified official silhouette
export function MetaMaskIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="MetaMask"
    >
      <path
        d="M29.5 3.5 17.7 12.3l2.2-5.2 9.6-3.6Z"
        fill="#E17726"
        stroke="#E17726"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="M2.5 3.5 14.2 12.4l-2.1-5.3-9.6-3.6Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m25.3 22.5-3.1 4.7 6.7 1.8 1.9-6.4-5.5-.1Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m1.2 22.6 1.9 6.4 6.7-1.8-3.1-4.7-5.5.1Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m9.5 14.2-1.8 2.7 6.6.3-.2-7.1-4.6 4.1Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m22.5 14.2-4.7-4.2-.1 7.2 6.6-.3-1.8-2.7Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m9.8 27.2 4-1.9-3.4-2.7-.6 4.6Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m18.2 25.3 4 1.9-.6-4.6-3.4 2.7Z"
        fill="#E27625"
        stroke="#E27625"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m22.2 27.2-4-1.9.3 2.6v1.1l3.7-1.8Z"
        fill="#D5BFB2"
        stroke="#D5BFB2"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m9.8 27.2 3.7 1.8v-1.1l.3-2.6-4 1.9Z"
        fill="#D5BFB2"
        stroke="#D5BFB2"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m13.6 20.9-3.3-.9 2.3-1.1 1 2Z"
        fill="#233447"
        stroke="#233447"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m18.4 20.9 1-2 2.3 1.1-3.3.9Z"
        fill="#233447"
        stroke="#233447"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m9.8 27.2.6-4.7-3.7.1 3.1 4.6Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m21.6 22.5.6 4.7 3.1-4.6-3.7-.1Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m24.3 16.9-6.6.3.6 3.7 1-2 2.3 1.1 2.7-3.1Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m10.3 20 2.3-1.1 1 2 .6-3.7-6.6-.3 2.7 3.1Z"
        fill="#CC6228"
        stroke="#CC6228"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m7.7 16.9 2.7 5.5-.1-2.4-2.6-3.1Z"
        fill="#E27525"
        stroke="#E27525"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m21.7 20 0 2.4 2.6-5.5-2.6 3.1Z"
        fill="#E27525"
        stroke="#E27525"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m14.3 17.2-.6 3.7.7 3.7.2-4.9-.3-2.5Z"
        fill="#E27525"
        stroke="#E27525"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m17.7 17.2-.3 2.5.2 4.9.7-3.7-.6-3.7Z"
        fill="#E27525"
        stroke="#E27525"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m18.4 20.9-.7 3.7.5.3 3.4-2.7.1-2.4-3.3 1.1Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m10.3 20 .1 2.4 3.4 2.7.5-.3-.7-3.7-3.3-1.1Z"
        fill="#F5841F"
        stroke="#F5841F"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m18.5 29v-1.1l-.3-.3h-4.4l-.3.3v1.1l-3.7-1.8 1.3 1.1 2.6 1.8h4.5l2.6-1.8 1.3-1.1-3.6 1.8Z"
        fill="#C0AC9D"
        stroke="#C0AC9D"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
      <path
        d="m18.2 25.3-.5-.3h-3.4l-.5.3-.3 2.6.3-.3h4.4l.3.3-.3-2.6Z"
        fill="#161616"
        stroke="#161616"
        strokeLinejoin="round"
        strokeWidth=".5"
      />
    </svg>
  );
}

// WalletConnect official blue
export function WalletConnectIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WalletConnect"
    >
      <rect width="32" height="32" rx="8" fill="#3B99FC" />
      <path
        d="M9.7 12.3a8.9 8.9 0 0 1 12.6 0l.4.4a.4.4 0 0 1 0 .6l-1.4 1.4a.2.2 0 0 1-.3 0l-.6-.6a6.2 6.2 0 0 0-8.8 0l-.6.6a.2.2 0 0 1-.3 0l-1.4-1.4a.4.4 0 0 1 0-.6l.4-.4Zm15.6 2.9 1.2 1.2a.4.4 0 0 1 0 .6L21.1 22.4a.4.4 0 0 1-.6 0l-3.8-3.8a.1.1 0 0 0-.1 0l-3.8 3.8a.4.4 0 0 1-.6 0l-5.4-5.4a.4.4 0 0 1 0-.6l1.2-1.2a.4.4 0 0 1 .6 0l3.8 3.8a.1.1 0 0 0 .1 0l3.8-3.8a.4.4 0 0 1 .6 0l3.8 3.8a.1.1 0 0 0 .1 0l3.8-3.8a.4.4 0 0 1 .6 0Z"
        fill="#fff"
      />
    </svg>
  );
}

// Uniswap unicorn (pink)
export function UniswapIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Uniswap"
    >
      <rect width="32" height="32" rx="8" fill="#FF007A" />
      <path
        d="M12.7 9c-.3 0-.5.2-.5.5s0 .4.2.6c.1.1.2.2.3.3.6.5 1 1 1.1 1.7 0 .2.1.5.1.8 0 1.5-.9 2.8-2.3 3.3-.4.1-.7.2-1.1.2-.3 0-.6-.1-.8-.4a.8.8 0 0 1-.1-.6c0-.2.2-.5.4-.6.2-.1.4-.1.6.1.1.1.2.3.4.3.1 0 .3 0 .4-.2.1-.2 0-.4-.1-.6-.3-.3-.6-.5-.9-.6-.5-.2-.9-.4-1.2-.8-.4-.4-.6-1-.5-1.6 0-.5.3-1 .8-1.3.4-.3 1-.4 1.5-.4h1.7Zm6.6 4.2c1.8 1 3 2.7 3.3 4.7.2 1.3 0 2.6-.8 3.7-.6 1-1.6 1.7-2.8 2-.7.2-1.5.3-2.3.3-2.2 0-4.3-.7-6-2.1.4.4 1.2.8 2.2 1.2-1.7-.9-2.5-2.1-2.3-3.6.2-1.3.9-2.4 2.1-3.2-.5.7-.7 1.5-.5 2.4.3 1.5 1.4 2.5 3.1 2.8 1.3.2 2.5 0 3.5-.7.6-.4 1-1 1.2-1.7.2-.9-.1-1.7-.8-2.3-.3-.3-.7-.5-1.1-.6l-.2-.1c-.5-.2-.7-.6-.7-1.1 0-.5.4-.9.8-1 .5-.1.9 0 1.3.3Z"
        fill="#fff"
      />
    </svg>
  );
}

// Coinbase Wallet blue circle
export function CoinbaseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Coinbase"
    >
      <rect width="32" height="32" rx="8" fill="#0052FF" />
      <path
        d="M16 22.6a6.6 6.6 0 1 1 6.5-7.8h-3.3a3.4 3.4 0 1 0 0 2.4h3.3A6.6 6.6 0 0 1 16 22.6Z"
        fill="#fff"
      />
    </svg>
  );
}

// Rainbow wallet gradient
export function RainbowIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Rainbow"
    >
      <defs>
        <linearGradient id="rbBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#174299" />
          <stop offset="1" stopColor="#001E59" />
        </linearGradient>
        <linearGradient id="rbArc1" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FF4000" />
          <stop offset="1" stopColor="#8754C9" />
        </linearGradient>
        <linearGradient id="rbArc2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF700" />
          <stop offset="1" stopColor="#FF4000" />
        </linearGradient>
        <linearGradient id="rbArc3" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#00AAFF" />
          <stop offset="1" stopColor="#01DA40" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#rbBg)" />
      <path
        d="M6 26v-4a12 12 0 0 1 12 12h4a16 16 0 0 0-16-16v4Z"
        fill="url(#rbArc1)"
      />
      <path
        d="M6 20v-4a18 18 0 0 1 18 18h4a22 22 0 0 0-22-22v-4Z"
        fill="url(#rbArc2)"
      />
      <circle cx="8" cy="24" r="2.5" fill="url(#rbArc3)" />
    </svg>
  );
}

// Generic wallet fallback (Lucide-like)
export function GenericWalletIcon({ className, size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Wallet"
    >
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M4 9h15a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="13" r="1.25" fill="currentColor" />
    </svg>
  );
}

export type WalletProvider =
  | 'METAMASK'
  | 'WALLETCONNECT'
  | 'COINBASE'
  | 'RAINBOW'
  | 'UNISWAP'
  | 'OTHER';

export function WalletProviderIcon({
  provider,
  className,
  size = 24,
}: {
  provider?: string | null;
  className?: string;
  size?: number;
}) {
  const p = (provider || '').toUpperCase();
  if (p === 'METAMASK') return <MetaMaskIcon className={className} size={size} />;
  if (p === 'WALLETCONNECT') return <WalletConnectIcon className={className} size={size} />;
  if (p === 'COINBASE') return <CoinbaseIcon className={className} size={size} />;
  if (p === 'RAINBOW') return <RainbowIcon className={className} size={size} />;
  if (p === 'UNISWAP') return <UniswapIcon className={className} size={size} />;
  return <GenericWalletIcon className={className} size={size} />;
}

export function walletProviderLabel(provider?: string | null): string {
  const p = (provider || '').toUpperCase();
  if (p === 'METAMASK') return 'MetaMask';
  if (p === 'WALLETCONNECT') return 'WalletConnect';
  if (p === 'COINBASE') return 'Coinbase';
  if (p === 'RAINBOW') return 'Rainbow';
  if (p === 'UNISWAP') return 'Uniswap';
  return 'Wallet';
}
