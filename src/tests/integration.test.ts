import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../server/index.js';

describe('API Integration', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/orders/execute', () => {
    it('creates order with valid input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.01 },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.orderId).toBeDefined();
      expect(body.status).toBe('pending');
      expect(body.wsUrl).toContain('ws://');
    });

    it('rejects missing tokenIn', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenOut: 'USDC', amountIn: 0.01 },
      });

      expect(response.statusCode).toBe(400);
    });

    it('rejects zero amountIn', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0 },
      });

      expect(response.statusCode).toBe(400);
    });

    it('accepts optional slippage', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.01, slippage: 1.0 },
      });

      expect(response.statusCode).toBe(200);
    });

    it('accepts optional poolId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.01, poolId: 'test-pool' },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('returns 404 for non-existent order', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/non-existent-id',
      });

      expect(response.statusCode).toBe(404);
    });

    it('returns order after creation', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/orders/execute',
        payload: { tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.01 },
      });

      const { orderId } = JSON.parse(createResponse.body);

      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/orders/${orderId}`,
      });

      expect(getResponse.statusCode).toBe(200);
      const order = JSON.parse(getResponse.body);
      expect(order.orderId).toBe(orderId);
    });
  });

  describe('GET /health', () => {
    it('returns health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBeDefined();
    });
  });
});
