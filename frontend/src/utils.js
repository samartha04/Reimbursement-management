export function getCurrencySymbol(code) {
  const symbols = {
    USD: '$', EUR: '€', INR: '₹', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$',
    CHF: 'CHF', CNY: '¥', SEK: 'kr', NZD: 'NZ$', MXN: '$', SGD: 'S$', HKD: 'HK$',
    NOK: 'kr', KRW: '₩', TRY: '₺', RUB: '₽', BRL: 'R$', ZAR: 'R'
  };
  return symbols[code] || code;
}
