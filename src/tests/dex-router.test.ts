import { describe, it, expect } from 'vitest';
import { selectBestDex } from '../services/router/index.js';
import { DexQuote } from '../types/index.js';

describe('DEX Router', () => {
  it('selects DEX with higher effective output', () => {
    const quotes = {
      raydium: { dex: 'raydium', price: 100, amountOut: 100, fee: 0.003, priceImpact: 0 } as DexQuote,
      meteora: { dex: 'meteora', price: 99, amountOut: 99, fee: 0.001, priceImpact: 0 } as DexQuote,
    };

    const result = selectBestDex(quotes);

    // Raydium: 100 * (1 - 0.003) = 99.7
    // Meteora: 99 * (1 - 0.001) = 98.901
    expect(result.bestQuote.dex).toBe('raydium');
  });

  it('selects meteora when it has better effective output', () => {
    const quotes = {
      raydium: { dex: 'raydium', price: 100, amountOut: 100, fee: 0.05, priceImpact: 0 } as DexQuote,
      meteora: { dex: 'meteora', price: 99, amountOut: 99, fee: 0.001, priceImpact: 0 } as DexQuote,
    };

    const result = selectBestDex(quotes);

    // Raydium: 100 * (1 - 0.05) = 95
    // Meteora: 99 * (1 - 0.001) = 98.901
    expect(result.bestQuote.dex).toBe('meteora');
  });

  it('returns only available DEX when one fails', () => {
    const quotes = {
      raydium: undefined,
      meteora: { dex: 'meteora', price: 99, amountOut: 99, fee: 0.002, priceImpact: 0 } as DexQuote,
    };

    const result = selectBestDex(quotes);

    expect(result.bestQuote.dex).toBe('meteora');
    expect(result.reason).toContain('Only');
  });

  it('throws when no quotes available', () => {
    const quotes = { raydium: undefined, meteora: undefined };

    expect(() => selectBestDex(quotes)).toThrow('No quotes available');
  });

  it('returns all quotes in result', () => {
    const quotes = {
      raydium: { dex: 'raydium', price: 100, amountOut: 100, fee: 0.003, priceImpact: 0 } as DexQuote,
      meteora: { dex: 'meteora', price: 99, amountOut: 99, fee: 0.002, priceImpact: 0 } as DexQuote,
    };

    const result = selectBestDex(quotes);

    expect(result.allQuotes).toHaveLength(2);
  });
});
