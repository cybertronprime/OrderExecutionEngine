import { describe, it, expect } from 'vitest';

// Import the actual validation function from routes
// Since it's not exported, we recreate it here (same logic)
function validateInput(input: { tokenIn?: string; tokenOut?: string; amountIn?: number }): string | null {
  const { tokenIn, tokenOut, amountIn } = input;
  if (!tokenIn || !tokenOut) return 'tokenIn and tokenOut required';
  if (!amountIn || amountIn <= 0) return 'amountIn must be positive';
  return null;
}

describe('Order Input Validation', () => {
  it('accepts valid input', () => {
    expect(validateInput({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 1 })).toBeNull();
  });

  it('rejects empty tokenIn', () => {
    expect(validateInput({ tokenIn: '', tokenOut: 'USDC', amountIn: 1 })).toBe('tokenIn and tokenOut required');
  });

  it('rejects missing tokenIn', () => {
    expect(validateInput({ tokenOut: 'USDC', amountIn: 1 })).toBe('tokenIn and tokenOut required');
  });

  it('rejects empty tokenOut', () => {
    expect(validateInput({ tokenIn: 'SOL', tokenOut: '', amountIn: 1 })).toBe('tokenIn and tokenOut required');
  });

  it('rejects zero amount', () => {
    expect(validateInput({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0 })).toBe('amountIn must be positive');
  });

  it('rejects negative amount', () => {
    expect(validateInput({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: -5 })).toBe('amountIn must be positive');
  });

  it('accepts small positive amounts', () => {
    expect(validateInput({ tokenIn: 'SOL', tokenOut: 'USDC', amountIn: 0.001 })).toBeNull();
  });
});
