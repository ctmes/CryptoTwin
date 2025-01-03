import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate Pearson correlation coefficient between two arrays
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  // Calculate means
  const xMean = x.reduce((a, b) => a + b, 0) / x.length;
  const yMean = y.reduce((a, b) => a + b, 0) / y.length;

  // Calculate correlation coefficient
  let numerator = 0;
  let xDenominator = 0;
  let yDenominator = 0;

  for (let i = 0; i < x.length; i++) {
    const xDiff = x[i] - xMean;
    const yDiff = y[i] - yMean;
    numerator += xDiff * yDiff;
    xDenominator += xDiff * xDiff;
    yDenominator += yDiff * yDiff;
  }

  const correlation = numerator / Math.sqrt(xDenominator * yDenominator);
  return isNaN(correlation) ? 0 : Math.abs(correlation); // Return absolute value for UI purposes
}

// Calculate percentage changes between consecutive values
export function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const percentageChange = (prices[i] - prices[i - 1]) / prices[i - 1];
    returns.push(percentageChange);
  }
  return returns;
}

// Extract prices from CoinGecko API response
export function extractPricesFromHistory(data: any): number[] {
  if (!data?.prices || !Array.isArray(data.prices)) return [];
  return data.prices.map(([, price]: [number, number]) => price);
}
