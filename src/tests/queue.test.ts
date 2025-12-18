import { describe, it, expect } from 'vitest';
import { orderQueue } from '../queue/index.js';
import { OrderStatus } from '../types/index.js';

describe('Order Queue Configuration', () => {
  it('has correct queue name', () => {
    expect(orderQueue.name).toBe('orders');
  });

  it('has 3 retry attempts', () => {
    expect(orderQueue.defaultJobOptions.attempts).toBe(3);
  });

  it('uses exponential backoff', () => {
    const backoff = orderQueue.defaultJobOptions.backoff as { type: string; delay: number };
    expect(backoff.type).toBe('exponential');
  });

  it('has 1 second initial delay', () => {
    const backoff = orderQueue.defaultJobOptions.backoff as { type: string; delay: number };
    expect(backoff.delay).toBe(1000);
  });
});

describe('Order Status Constants', () => {
  it('has pending status', () => {
    expect(OrderStatus.PENDING).toBe('pending');
  });

  it('has routing status', () => {
    expect(OrderStatus.ROUTING).toBe('routing');
  });

  it('has building status', () => {
    expect(OrderStatus.BUILDING).toBe('building');
  });

  it('has submitted status', () => {
    expect(OrderStatus.SUBMITTED).toBe('submitted');
  });

  it('has confirmed status', () => {
    expect(OrderStatus.CONFIRMED).toBe('confirmed');
  });

  it('has failed status', () => {
    expect(OrderStatus.FAILED).toBe('failed');
  });
});
