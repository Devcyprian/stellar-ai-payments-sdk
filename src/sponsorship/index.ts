/**
 * Fee Sponsorship
 * Wraps transactions in Stellar's fee-bump envelope so agents don't need XLM for fees.
 */
import {
  FeeBumpTransaction,
  Transaction,
  TransactionBuilder,
  Keypair,
  Networks,
} from '@stellar/stellar-sdk';

export interface FeeBumpOptions {
  sponsorKeypair: Keypair;
  innerTxXdr: string;
  baseFee?: string;
  networkPassphrase?: string;
}

export interface FeeBumpResult {
  xdr: string;
  feeAccount: string;
  innerTxHash: string;
}

/**
 * Wrap an existing signed transaction in a fee-bump envelope.
 * The sponsor pays the fee; the inner transaction signer pays nothing.
 */
export function buildFeeBump(options: FeeBumpOptions): FeeBumpResult {
  const {
    sponsorKeypair,
    innerTxXdr,
    baseFee = '200',
    networkPassphrase = Networks.TESTNET,
  } = options;

  const innerTx = TransactionBuilder.fromXDR(innerTxXdr, networkPassphrase) as Transaction;

  const feeBump = TransactionBuilder.buildFeeBumpTransaction(
    sponsorKeypair,
    baseFee,
    innerTx,
    networkPassphrase
  ) as FeeBumpTransaction;

  feeBump.sign(sponsorKeypair);

  return {
    xdr: feeBump.toXDR(),
    feeAccount: sponsorKeypair.publicKey(),
    innerTxHash: innerTx.hash().toString('hex'),
  };
}

/**
 * Estimate the fee for a fee-bump transaction.
 * Fee = baseFee * (innerOperationCount + 1)
 */
export function estimateFeeBump(innerOperationCount: number, baseFee = 100): number {
  return baseFee * (innerOperationCount + 1);
}
