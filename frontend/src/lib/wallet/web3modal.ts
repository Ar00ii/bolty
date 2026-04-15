'use client';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

export function initWeb3Modal() {
  // Web3Modal initialization happens automatically with the provider setup
  if (!projectId) {
    console.warn('NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID not set. Wallet connections may not work.');
  }
}

export { projectId };
