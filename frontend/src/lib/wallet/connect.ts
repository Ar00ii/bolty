'use client';

import { BrowserProvider, type Eip1193Provider } from 'ethers';

import { api } from '@/lib/api/client';

interface ConnectedAccount {
  address: string;
  chainId: number;
}

interface NonceResponse {
  nonce: string;
  message: string;
}

interface VerifyRequest {
  address: string;
  signature: string;
  nonce: string;
}

export async function connectWallet(provider: Eip1193Provider): Promise<ConnectedAccount> {
  if (!provider) {
    throw new Error('No Web3 provider available');
  }

  const ethersProvider = new BrowserProvider(provider);

  // Get accounts
  let accounts: string[];
  try {
    accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to get accounts from wallet');
  }

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found in wallet');
  }

  const address = accounts[0];

  // Get chain ID
  let chainId: number;
  try {
    const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
    chainId = parseInt(chainIdHex, 16);
  } catch (err) {
    throw new Error('Failed to get chain ID');
  }

  // Get nonce from server
  let nonceData: NonceResponse;
  try {
    nonceData = await api.post<NonceResponse>('/auth/nonce/ethereum', {
      address,
    });
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to get nonce from server');
  }

  // Sign message
  let signature: string;
  try {
    const signer = await ethersProvider.getSigner();
    signature = await signer.signMessage(nonceData.message);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to sign message');
  }

  // Verify signature on server
  try {
    const verifyRequest: VerifyRequest = {
      address,
      signature,
      nonce: nonceData.nonce,
    };
    await api.post('/auth/verify/ethereum', verifyRequest);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Signature verification failed');
  }

  return { address, chainId };
}

/**
 * Switch the connected wallet to Ethereum mainnet (chain 1). Renamed
 * from `switchToBase` as part of the Base → ETH mainnet migration —
 * Bolty no longer uses Base for any onchain settlement.
 */
export async function switchToEthereum(provider: Eip1193Provider): Promise<boolean> {
  const ethChainId = 1;
  const hexChainId = '0x' + ethChainId.toString(16);

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (err) {
    // Chain not added (extremely rare for ETH mainnet but handle it).
    const error = err as { code?: number };
    if (error?.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: 'Ethereum',
              nativeCurrency: {
                name: 'Ether',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: [
                process.env.NEXT_PUBLIC_ETH_RPC_URL || 'https://eth.llamarpc.com',
                'https://ethereum.publicnode.com',
                'https://rpc.ankr.com/eth',
              ],
              blockExplorerUrls: ['https://etherscan.io'],
            },
          ],
        });
        return true;
      } catch (addErr) {
        throw new Error('Failed to add Ethereum mainnet to wallet');
      }
    }
    throw new Error('Failed to switch to Ethereum mainnet');
  }
}

/** @deprecated Kept as a thin alias only so call-sites that still
 *  reference `switchToBase` keep compiling during the rename. */
export const switchToBase = switchToEthereum;

interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
}

export async function sendTransaction(
  provider: Eip1193Provider,
  to: string,
  value: string,
  data?: string,
): Promise<string> {
  if (!provider) {
    throw new Error('No Web3 provider available');
  }

  const ethersProvider = new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  try {
    const txRequest: TransactionRequest = {
      to,
      value,
      data,
    };
    const tx = await signer.sendTransaction(txRequest);

    return tx.hash;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Failed to send transaction');
  }
}
