import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCoupon } from './validateCoupon';
import Coupon from './models/coupon';

vi.mock('./models/coupon', () => ({
  default: { findOne: vi.fn() },
}));

const findOne = vi.mocked(Coupon.findOne);

describe('validateCoupon', () => {
  beforeEach(() => {
    findOne.mockReset();
  });

  it('rejects an empty code', async () => {
    const result = await validateCoupon('', 500);
    expect(result.error).toBe('Please enter a coupon code.');
  });

  it('rejects a code that does not exist', async () => {
    findOne.mockResolvedValueOnce(null);
    const result = await validateCoupon('MISSING', 500);
    expect(result.error).toBe('Invalid or inactive coupon code.');
  });

  it('rejects an inactive coupon', async () => {
    findOne.mockResolvedValueOnce({ active: false } as any);
    const result = await validateCoupon('OLD10', 500);
    expect(result.error).toBe('Invalid or inactive coupon code.');
  });

  it('rejects an expired coupon', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      expiresAt: new Date(Date.now() - 86400000),
    } as any);
    const result = await validateCoupon('EXPIRED', 500);
    expect(result.error).toBe('This coupon has expired.');
  });

  it('rejects a coupon that has hit its usage limit', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      usageLimit: 5,
      usedCount: 5,
    } as any);
    const result = await validateCoupon('MAXED', 500);
    expect(result.error).toBe('This coupon has reached its usage limit.');
  });

  it('rejects an order below the minimum spend', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      minSpend: 1000,
    } as any);
    const result = await validateCoupon('BIGORDER', 500);
    expect(result.error).toContain('Minimum spend of');
  });

  it('computes a percent discount', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      type: 'percent',
      value: 10,
      minSpend: 0,
    } as any);
    const result = await validateCoupon('TEN', 500);
    expect(result.error).toBeUndefined();
    expect(result.discount).toBe(50);
  });

  it('caps a percent discount at maxDiscount', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      type: 'percent',
      value: 50,
      minSpend: 0,
      maxDiscount: 100,
    } as any);
    const result = await validateCoupon('HALFOFF', 1000);
    expect(result.discount).toBe(100);
  });

  it('computes a fixed discount', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      type: 'fixed',
      value: 75,
      minSpend: 0,
    } as any);
    const result = await validateCoupon('FLAT75', 500);
    expect(result.discount).toBe(75);
  });

  it('never discounts more than the subtotal', async () => {
    findOne.mockResolvedValueOnce({
      active: true,
      type: 'fixed',
      value: 999,
      minSpend: 0,
    } as any);
    const result = await validateCoupon('HUGE', 200);
    expect(result.discount).toBe(200);
  });
});
