import { addMonths, calculateRenewalPrice } from './pricing';

describe('calculateRenewalPrice', () => {
  it('keeps one month at the base price', () => expect(calculateRenewalPrice(4900, 1)).toMatchObject({ amountCents: 4900, discountCents: 0 }));
  it('applies five percent to three months', () => expect(calculateRenewalPrice(4900, 3)).toMatchObject({ amountCents: 13965, discountCents: 735 }));
  it('applies ten percent to six months', () => expect(calculateRenewalPrice(4900, 6)).toMatchObject({ amountCents: 26460, discountCents: 2940 }));
  it('applies fifteen percent to twelve months', () => expect(calculateRenewalPrice(4900, 12)).toMatchObject({ amountCents: 49980, discountCents: 8820 }));
  it('extends from the supplied date without mutating it', () => {
    const start = new Date('2026-01-15T00:00:00.000Z');
    expect(addMonths(start, 3)).toEqual(new Date('2026-04-15T00:00:00.000Z'));
    expect(start).toEqual(new Date('2026-01-15T00:00:00.000Z'));
  });
});
