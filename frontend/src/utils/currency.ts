// Currency conversion utilities
export const EUR_TO_TND = 3.3;

export const formatPrice = (priceInEur: number): string => {
  const priceInTnd = priceInEur * EUR_TO_TND;
  return `€${priceInEur.toFixed(2)} / ${priceInTnd.toFixed(2)} TND`;
};

export const formatPriceShort = (priceInEur: number): string => {
  const priceInTnd = priceInEur * EUR_TO_TND;
  return `€${priceInEur.toFixed(2)}`;
};
