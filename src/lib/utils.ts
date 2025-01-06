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

// Calculate time lag between two price series
export function calculateTimeLag(series1: number[], series2: number[]): number {
  // Simple implementation: find the lag that maximizes correlation
  let maxCorrelation = -1;
  let bestLag = 0;

  // Try lags up to 24 hours (assuming hourly data)
  for (let lag = 0; lag <= 24; lag++) {
    if (lag >= series1.length || lag >= series2.length) break;

    const correlation = calculateCorrelation(
      series1.slice(lag),
      series2.slice(0, series2.length - lag),
    );

    if (correlation > maxCorrelation) {
      maxCorrelation = correlation;
      bestLag = lag;
    }
  }

  return bestLag;
}

// Calculate price ratio between two tokens
export function calculatePriceRatio(
  mainPrice: number,
  comparisonPrice: number,
): number {
  if (comparisonPrice === 0) return 0;
  return mainPrice / comparisonPrice;
}

// Calculate momentum score
export function calculateMomentum(
  prices: number[],
  periods: number = 14,
): number {
  if (prices.length < periods) return 0;

  const recentPrice = prices[prices.length - 1];
  const oldPrice = prices[prices.length - periods];

  return ((recentPrice - oldPrice) / oldPrice) * 100;
}
