export function formatCurrency(amount: number, symbol = 'Br'): string {
  const sign = amount < 0 ? '-' : '';
  const value = Math.abs(amount);
  return `${sign}${symbol} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function getCurrencySymbol(currency: string, language: string): string {
  if (currency === 'ETB') {
    return language === 'Amharic' ? 'ብር' : 'Br';
  }
  const map: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KES: 'KSh', INR: '₹' };
  return map[currency] ?? currency;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
