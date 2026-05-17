/**
 * Stellar Account Helpers
 * Utilities for account creation, funding, and balance queries.
 */
import axios from 'axios';
import { Keypair, Networks } from '@stellar/stellar-sdk';

export interface AccountBalance {
  asset: string;
  balance: string;
  limit?: string;
}

export interface AccountInfo {
  publicKey: string;
  sequence: string;
  balances: AccountBalance[];
  subentryCount: number;
}

export class StellarAccountHelper {
  private horizonUrl: string;

  constructor(horizonUrl = 'https://horizon-testnet.stellar.org') {
    this.horizonUrl = horizonUrl;
  }

  /** Generate a new random Stellar keypair. */
  static generateKeypair(): { publicKey: string; secretKey: string } {
    const kp = Keypair.random();
    return { publicKey: kp.publicKey(), secretKey: kp.secret() };
  }

  /** Fund an account on testnet via Friendbot. */
  async fundTestnet(publicKey: string): Promise<void> {
    const res = await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (res.status !== 200) throw new Error(`Friendbot failed: ${res.status}`);
  }

  /** Fetch account info from Horizon. */
  async getAccountInfo(publicKey: string): Promise<AccountInfo> {
    const res = await axios.get(`${this.horizonUrl}/accounts/${publicKey}`);
    const data = res.data;
    return {
      publicKey: data.account_id,
      sequence: data.sequence,
      subentryCount: data.subentry_count,
      balances: (data.balances as Array<{
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance: string;
        limit?: string;
      }>).map((b) => ({
        asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
        balance: b.balance,
        limit: b.limit,
      })),
    };
  }

  /** Check if an account exists on the network. */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.getAccountInfo(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /** Get XLM balance for an account. */
  async getXlmBalance(publicKey: string): Promise<string> {
    const info = await this.getAccountInfo(publicKey);
    const xlm = info.balances.find((b) => b.asset === 'XLM');
    return xlm?.balance ?? '0';
  }
}

export const NETWORKS = {
  TESTNET: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: Networks.TESTNET,
  },
  MAINNET: {
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: Networks.PUBLIC,
  },
} as const;

  /** Get balance for a specific asset. */
  async getAssetBalance(publicKey: string, assetStr: string): Promise<string> {
    const info = await this.getAccountInfo(publicKey);
    const found = info.balances.find((b) => b.asset === assetStr);
    return found?.balance ?? '0';
  }

export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
