/**
 * Multi-Party Payment (MPP) Integration
 * Splits a payment across multiple Stellar accounts using path payments.
 */
import { Networks, TransactionBuilder, Operation, Asset, Keypair, Account } from '@stellar/stellar-sdk';

export interface MppSplit {
  destination: string;
  amount: string;       // in XLM or asset units
  asset?: string;       // defaults to XLM
}

export interface MppPaymentOptions {
  sourceKeypair: Keypair;
  sourceAccount: Account;
  splits: MppSplit[];
  networkPassphrase?: string;
  fee?: string;
  memo?: string;
}

export interface MppResult {
  xdr: string;
  totalAmount: string;
  splitCount: number;
}

/**
 * Build a multi-party payment transaction XDR.
 * Each split becomes a separate payment operation in one atomic transaction.
 */
export function buildMppTransaction(options: MppPaymentOptions): MppResult {
  const {
    sourceKeypair,
    sourceAccount,
    splits,
    networkPassphrase = Networks.TESTNET,
    fee = '100',
  } = options;

  const builder = new TransactionBuilder(sourceAccount, {
    fee,
    networkPassphrase,
  });

  let totalAmount = 0;

  for (const split of splits) {
    const asset = split.asset
      ? parseAsset(split.asset)
      : Asset.native();

    builder.addOperation(
      Operation.payment({
        destination: split.destination,
        asset,
        amount: split.amount,
      })
    );
    totalAmount += parseFloat(split.amount);
  }

  if (options.memo) {
    builder.addMemo({ type: 'text', value: options.memo } as Parameters<typeof builder.addMemo>[0]);
  }

  const tx = builder.setTimeout(30).build();
  tx.sign(sourceKeypair);

  return {
    xdr: tx.toXDR(),
    totalAmount: totalAmount.toFixed(7),
    splitCount: splits.length,
  };
}

/**
 * Parse "CODE:ISSUER" or "XLM" into a Stellar Asset.
 */
export function parseAsset(assetStr: string): Asset {
  if (assetStr === 'XLM') return Asset.native();
  const [code, issuer] = assetStr.split(':');
  if (!issuer) throw new Error(`Invalid asset format: ${assetStr}. Expected "CODE:ISSUER" or "XLM"`);
  return new Asset(code, issuer);
}

/** Validate a Stellar public key format. */
export function isValidPublicKey(key: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(key);
}

/** Validate that all split destinations are valid Stellar public keys. */
export function validateSplits(splits: MppSplit[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const s of splits) {
    if (!isValidPublicKey(s.destination)) {
      errors.push(`Invalid destination: ${s.destination}`);
    }
    if (parseFloat(s.amount) <= 0) {
      errors.push(`Invalid amount for ${s.destination}: ${s.amount}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/** Calculate total fee for an MPP transaction (100 stroops per operation). */
export function calculateMppFee(splitCount: number, baseFeeStroops = 100): number {
  return baseFeeStroops * splitCount;
}
