import { describe, it, expect } from 'vitest';
import { subscribeToOrder, publishOrderUpdate } from '../services/pubsub.js';

describe('WebSocket Pub/Sub', () => {
  it('publishes order update message', async () => {
    const orderId = 'test-ws-1';
    await expect(publishOrderUpdate(orderId, 'routing')).resolves.not.toThrow();
  });

  it('publishes with additional data', async () => {
    const orderId = 'test-ws-2';
    await expect(publishOrderUpdate(orderId, 'confirmed', { txHash: 'abc123' })).resolves.not.toThrow();
  });

  it('subscribe returns unsubscribe function', () => {
    const orderId = 'test-ws-3';
    const unsubscribe = subscribeToOrder(orderId, () => {});
    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('subscriber receives published message', async () => {
    const orderId = 'test-ws-4';
    let received = '';
    
    const unsubscribe = subscribeToOrder(orderId, (msg) => { received = msg; });
    
    await new Promise(r => setTimeout(r, 100)); // Wait for subscription
    await publishOrderUpdate(orderId, 'building');
    await new Promise(r => setTimeout(r, 100)); // Wait for message
    
    expect(received).toContain('building');
    unsubscribe();
  });
});
