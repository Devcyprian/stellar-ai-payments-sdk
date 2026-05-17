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
