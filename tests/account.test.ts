import { StellarAccountHelper, NETWORKS } from '../src/account';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StellarAccountHelper', () => {
  it('generates a valid Stellar keypair', () => {
    const { publicKey, secretKey } = StellarAccountHelper.generateKeypair();
    expect(publicKey).toMatch(/^G[A-Z2-7]{55}$/);
    expect(secretKey).toMatch(/^S[A-Z2-7]{55}$/);
  });

  it('returns TESTNET and MAINNET network configs', () => {
    expect(NETWORKS.TESTNET.horizonUrl).toContain('testnet');
    expect(NETWORKS.MAINNET.horizonUrl).toContain('horizon.stellar.org');
  });

  it('getAccountInfo maps balances correctly', async () => {
    const helper = new StellarAccountHelper();
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        account_id: 'GABC',
        sequence: '1234',
        subentry_count: 0,
        balances: [
          { asset_type: 'native', balance: '100.0000000' },
          { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '50.0000000', limit: '1000.0000000' },
        ],
      },
    });
    const info = await helper.getAccountInfo('GABC');
    expect(info.balances[0].asset).toBe('XLM');
    expect(info.balances[1].asset).toBe('USDC:GISSUER');
  });

  it('accountExists returns false on 404', async () => {
    const helper = new StellarAccountHelper();
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('Not Found'));
    expect(await helper.accountExists('GNONE')).toBe(false);
  });
});
