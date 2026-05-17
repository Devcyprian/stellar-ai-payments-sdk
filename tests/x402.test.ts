import { X402Client, X402PaymentDetails, X402PaymentProof } from '../src/x402/client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('X402Client', () => {
  let client: X402Client;

  beforeEach(() => {
    client = new X402Client({ horizonUrl: 'https://horizon-testnet.stellar.org' });
    // Mock axios.create to return a mock instance
    const mockInstance = {
      get: jest.fn(),
    };
    (axios.create as jest.Mock).mockReturnValue(mockInstance);
    client = new X402Client();
  });

  describe('parsePaymentRequired', () => {
    it('parses a valid base64-encoded payment details header', () => {
      const details: X402PaymentDetails = {
        amount: '1000000',
        asset: 'XLM',
        destination: 'GABC123',
      };
      const header = Buffer.from(JSON.stringify(details)).toString('base64');
      const response = { headers: { 'x-payment-details': header } } as Parameters<typeof client.parsePaymentRequired>[0];
      expect(client.parsePaymentRequired(response)).toEqual(details);
    });

    it('throws when X-Payment-Details header is missing', () => {
      const response = { headers: {} } as Parameters<typeof client.parsePaymentRequired>[0];
      expect(() => client.parsePaymentRequired(response)).toThrow('Missing X-Payment-Details header');
    });

    it('throws on invalid base64 JSON', () => {
      const response = { headers: { 'x-payment-details': 'not-valid-json-base64' } } as Parameters<typeof client.parsePaymentRequired>[0];
      expect(() => client.parsePaymentRequired(response)).toThrow('Invalid X-Payment-Details header encoding');
    });
  });

  describe('buildProofHeader', () => {
    it('encodes proof as base64 JSON', () => {
      const proof: X402PaymentProof = { txHash: 'abc123', ledger: 42, paidAt: 1700000000 };
      const header = client.buildProofHeader(proof);
      const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
      expect(decoded).toEqual(proof);
    });
  });

  describe('estimateFeeBump', () => {
    it('calculates fee correctly', () => {
      const { estimateFeeBump } = require('../src/sponsorship');
      expect(estimateFeeBump(3, 100)).toBe(400);
      expect(estimateFeeBump(1, 200)).toBe(400);
    });
  });
});

describe('backoffMs', () => {
  it('doubles each attempt', () => {
    const { backoffMs } = require('../src/x402/client');
    expect(backoffMs(0)).toBe(200);
    expect(backoffMs(1)).toBe(400);
    expect(backoffMs(2)).toBe(800);
  });
});

describe('validateMemo', () => {
  it('accepts short memo', () => {
    const { validateMemo } = require('../src/x402/client');
    expect(validateMemo('hello')).toBe(true);
  });
  it('rejects memo over 28 bytes', () => {
    const { validateMemo } = require('../src/x402/client');
    expect(validateMemo('a'.repeat(29))).toBe(false);
  });
});

describe('sponsorship estimateFeeBump', () => {
  it('handles zero operations', () => {
    const { estimateFeeBump } = require('../src/sponsorship');
    expect(estimateFeeBump(0, 100)).toBe(100);
  });
});

describe('X402Error', () => {
  it('has correct name and code', () => {
    const { X402Error } = require('../src/x402/client');
    const err = new X402Error('PAYMENT_EXPIRED', 'Payment expired');
    expect(err.name).toBe('X402Error');
    expect(err.code).toBe('PAYMENT_EXPIRED');
  });
});
