# Order Execution Engine

A high-performance order execution engine for Solana DEX trading with real-time WebSocket updates.

## Order Type: Market Order

I chose **Market Order** because it's the most straightforward to implement and demonstrate - immediate execution at current price with no price monitoring required. 

**Extending to other order types:**
- **Limit Order**: Add a price watcher service that monitors pool prices and triggers execution when target is reached
- **Sniper Order**: Add a token launch listener that watches for new pool creation events and executes immediately

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Fastify   │────▶│   BullMQ    │
│  (HTTP/WS)  │◀────│   Server    │◀────│   Queue     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                   │
                    ┌──────┴──────┐     ┌──────┴──────┐
                    │  PostgreSQL │     │    Redis    │
                    │  (history)  │     │  (cache)    │
                    └─────────────┘     └─────────────┘
                                              │
                                        ┌─────┴─────┐
                                        │  Worker   │
                                        │           │
                                        └─────┬─────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │               │               │
                        ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
                        │  Raydium  │   │  Meteora  │   │  Pub/Sub  │
                        │   (real)  │   │  (mock)   │   │ (updates) │
                        └───────────┘   └───────────┘   └───────────┘
```

## Features

- **DEX Router**: Queries Raydium (real devnet) and Meteora (mock), routes to best price
- **WebSocket Streaming**: Real-time order status updates (pending → routing → building → submitted → confirmed)
- **Queue System**: BullMQ with 10 concurrent orders, exponential backoff retry (3 attempts)
- **Dual Protocol**: Same endpoint handles HTTP POST and WebSocket upgrade

## Tech Stack

- Node.js + TypeScript
- Fastify (HTTP + WebSocket)
- BullMQ + Redis (queue)
- PostgreSQL (order history)
- Raydium SDK v2 (real devnet swaps)

## Setup

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL and Redis)
- Solana devnet wallet with SOL (get from https://faucet.solana.com)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd order-execution-engine
npm install

# Start databases
docker-compose up -d

# Configure environment
cp .env.example .env
# Edit .env with your wallet private key

# Start server
npm run dev
```

### Environment Variables

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=order_execution
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
REDIS_HOST=localhost
REDIS_PORT=6379
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=[your-devnet-wallet-json-array]
```

## API

### Submit Order (HTTP)
```bash
POST /api/orders/execute
Content-Type: application/json

{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 0.01,
  "slippage": 0.5,
}

# Response
{
  "orderId": "uuid",
  "status": "pending",
  "wsUrl": "ws://localhost:3000/api/orders/execute"
}
```

### Submit Order (WebSocket)
```javascript
const ws = new WebSocket('ws://localhost:3000/api/orders/execute');
ws.onopen = () => ws.send(JSON.stringify({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.01 }));
ws.onmessage = (e) => console.log(e.data);
// Receives: pending → routing → building → submitted → confirmed
```

### Get Order Status
```bash
GET /api/orders/:orderId
```

### Health Check
```bash
GET /health
```

## Order Status Flow

```
pending → routing → building → submitted → confirmed
                                    ↓
                                 failed (with error)
```

## Testing

```bash
# Unit tests (26 tests)
npm test

# Integration tests (requires DB)
npm run test:integration

# Full flow test
npm run test:flow
```

## Demo

**YouTube Video**: https://youtu.be/KrGOLYDrU54

**Live URL**: [Deployed URL]

**Transaction Proof**: PPyz2QQmQXjvLgiSkcWsoyQvEbc96sinimnccFUKgSF4Le1WDVJf989Xo2EKTyi9ye64vSjB2rJFkQMG9aTCGRC

## Postman Collection

Import `postman/Order-Execution-Engine.postman_collection.json` into Postman.

## Design Decisions

1. **Real Raydium + Mock Meteora**: Raydium has good devnet support, Meteora doesn't have devnet pools
2. **BullMQ over simple queue**: Built-in retry, backoff, concurrency control
3. **Redis Pub/Sub for WebSocket**: Decouples worker from WebSocket connections
4. **Single endpoint for HTTP/WS**: Cleaner API, matches requirement spec

## Project Structure

```
src/
├── config/          # Environment config
├── db/              # PostgreSQL + Redis
├── queue/           # BullMQ queue + worker
├── server/          # Fastify server + routes
├── services/
│   ├── dex-router/  # Raydium + Meteora
│   ├── pubsub.ts    # Redis pub/sub
│   └── solana/      # Wallet service
├── tests/           # Unit + integration tests
└── types/           # TypeScript types
```
