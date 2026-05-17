# @stellar-ai-payments/sdk

TypeScript SDK for AI agent payments on Stellar — x402 protocol, MPP, session keys, fee sponsorship.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  AI Agent / App                     │
├──────────┬──────────┬──────────────┬────────────────┤
│  x402    │   MPP    │   Session    │  Sponsorship   │
│ Protocol │ Payments │    Keys      │  Fee Bump      │
├──────────┴──────────┴──────────────┴────────────────┤
│              @stellar/stellar-sdk                   │
│              Stellar Horizon / Soroban              │
└─────────────────────────────────────────────────────┘
```

## File Tree

```
src/
  x402/       x402 HTTP 402 protocol client
  mpp/        Multi-party payment builder
  account/    Account helpers & Friendbot
  session/    Session key manager
  sponsorship/ Fee-bump envelope builder
tests/        Jest test suite
```

## Setup

```bash
npm install @stellar-ai-payments/sdk
cp .env.example .env
```

## Usage

```typescript
import { X402Client, SessionKeyManager, buildFeeBump } from '@stellar-ai-payments/sdk';

// x402 flow
const client = new X402Client();
const response = await client.fetch(url, async (details) => {
  // sign and submit payment, return proof
  return { txHash: '...', ledger: 1, paidAt: Date.now() };
});

// Session keys
const mgr = new SessionKeyManager();
const key = mgr.create({ ttlSeconds: 300, maxAmountPerTx: '5' });
```

## Scripts

```bash
npm test        # Jest with coverage
npm run lint    # ESLint
npm run build   # tsc → dist/
```
