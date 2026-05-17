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
