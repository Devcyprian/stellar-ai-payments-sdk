/**
 * x402 Protocol Client
 * Implements the HTTP 402 Payment Required flow for AI agent micropayments.
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface X402PaymentDetails {
  amount: string;       // in stroops
  asset: string;        // e.g. "XLM" or "USDC:GA..."
  destination: string;  // Stellar account
  memo?: string;
  expiresAt?: number;   // unix timestamp
}

export interface X402PaymentProof {
  txHash: string;
  ledger: number;
  paidAt: number;
}

export interface X402ClientOptions {
  horizonUrl?: string;
  networkPassphrase?: string;
  maxRetries?: number;
}

export class X402Client {
  private http: AxiosInstance;
  private maxRetries: number;

  constructor(options: X402ClientOptions = {}) {
    this.http = axios.create({
      baseURL: options.horizonUrl ?? 'https://horizon-testnet.stellar.org',
    });
    this.maxRetries = options.maxRetries ?? 3;
  }

  /**
   * Parse a 402 response and extract payment details.
   */
  parsePaymentRequired(response: AxiosResponse): X402PaymentDetails {
    const header = response.headers['x-payment-details'];
    if (!header) throw new Error('Missing X-Payment-Details header in 402 response');
    try {
      return JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as X402PaymentDetails;
    } catch {
      throw new Error('Invalid X-Payment-Details header encoding');
    }
  }

  /**
   * Build a payment proof header from a submitted transaction.
   */
  buildProofHeader(proof: X402PaymentProof): string {
    return Buffer.from(JSON.stringify(proof)).toString('base64');
  }

  /**
   * Retry a request with a payment proof attached.
   */
  async retryWithPayment(
    url: string,
    proof: X402PaymentProof,
    options: Record<string, unknown> = {}
  ): Promise<AxiosResponse> {
    const headers = {
      ...(options.headers as Record<string, string> ?? {}),
      'X-Payment-Proof': this.buildProofHeader(proof),
    };
    return this.http.get(url, { ...options, headers });
  }

  /**
   * Full x402 flow: attempt request, handle 402, submit payment, retry.
   * The `payFn` callback receives payment details and returns a proof.
   */
  async fetch(
    url: string,
    payFn: (details: X402PaymentDetails) => Promise<X402PaymentProof>,
    options: Record<string, unknown> = {}
  ): Promise<AxiosResponse> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        const res = await this.http.get(url, options);
        return res;
      } catch (err: unknown) {
        const axiosErr = err as { response?: AxiosResponse };
        if (axiosErr.response?.status !== 402) throw err;
        const details = this.parsePaymentRequired(axiosErr.response);
        const proof = await payFn(details);
        return this.retryWithPayment(url, proof, options);
      } finally {
        attempt++;
      }
    }
    throw new Error(`x402: exceeded ${this.maxRetries} retries`);
  }
}

/**
 * Exponential backoff helper for x402 retries.
 */
export function backoffMs(attempt: number, baseMs = 200): number {
  return baseMs * Math.pow(2, attempt);
}

/** Validate memo length (Stellar max 28 bytes). */
export function validateMemo(memo: string): boolean {
  return Buffer.byteLength(memo, 'utf8') <= 28;
}

/** Default request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 10_000;

export class X402Error extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'X402Error';
  }
}
