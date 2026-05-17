import { parseAsset } from '../src/mpp';
import { Asset } from '@stellar/stellar-sdk';

describe('MPP helpers', () => {
  it('parseAsset returns native for XLM', () => {
    expect(parseAsset('XLM')).toEqual(Asset.native());
  });

  it('parseAsset parses CODE:ISSUER format', () => {
    const asset = parseAsset('USDC:GISSUER123');
    expect(asset.getCode()).toBe('USDC');
    expect(asset.getIssuer()).toBe('GISSUER123');
  });

  it('parseAsset throws on invalid format', () => {
    expect(() => parseAsset('BADFORMAT')).toThrow('Invalid asset format');
  });
});

describe('isValidPublicKey', () => {
  it('accepts valid G... key', () => {
    const { isValidPublicKey } = require('../src/mpp');
    expect(isValidPublicKey('GABC' + 'A'.repeat(52))).toBe(true);
  });
  it('rejects invalid key', () => {
    const { isValidPublicKey } = require('../src/mpp');
    expect(isValidPublicKey('SABC')).toBe(false);
  });
});

describe('validateSplits', () => {
  it('returns valid for good splits', () => {
    const { validateSplits } = require('../src/mpp');
    const result = validateSplits([{ destination: 'G' + 'A'.repeat(55), amount: '1' }]);
    expect(result.valid).toBe(true);
  });
  it('catches invalid destination', () => {
    const { validateSplits } = require('../src/mpp');
    const result = validateSplits([{ destination: 'BAD', amount: '1' }]);
    expect(result.valid).toBe(false);
  });
});
