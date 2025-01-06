const COINGECKO_API = "https://api.coingecko.com/api/v3";

export interface Token {
  id: string;
  symbol: string;
  name: string;
}

export interface CryptoData {
  [currency: string]: number;
  [key: `${string}_24h_change`]: number;
  [key: `${string}_24h_vol`]: number;
  [key: `${string}_market_cap`]: number;
  last_updated_at?: number;
}

export const SUPPORTED_CURRENCIES = [
  { value: "usd", label: "USD ($)", symbol: "$" },
  { value: "eur", label: "EUR (€)", symbol: "€" },
  { value: "gbp", label: "GBP (£)", symbol: "£" },
  { value: "jpy", label: "JPY (¥)", symbol: "¥" },
  { value: "aud", label: "AUD ($)", symbol: "A$" },
  { value: "cad", label: "CAD ($)", symbol: "C$" },
];

// Cache configuration
const CACHE_DURATION = 60 * 1000; // 1 minute
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache {
  private store: { [key: string]: CacheEntry<any> } = {};

  set<T>(key: string, data: T): void {
    this.store[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  get<T>(key: string): T | null {
    const entry = this.store[key];
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_DURATION) {
      delete this.store[key];
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.store = {};
  }
}

const cache = new Cache();

// Rate limiting configuration
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds between requests
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 10000; // 10 seconds

class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest),
        );
      }

      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }

    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
  backoff = INITIAL_BACKOFF,
): Promise<Response> {
  try {
    const response = await fetch(url);

    if (response.status === 429) {
      // Too Many Requests
      if (retries === 0) throw new Error("Rate limit exceeded");
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return fetchWithRetry(
        url,
        retries - 1,
        Math.min(backoff * 2, MAX_BACKOFF),
      );
    }

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return fetchWithRetry(url, retries - 1, Math.min(backoff * 2, MAX_BACKOFF));
  }
}

export const searchTokens = async (query: string): Promise<Token[]> => {
  if (!query) return [];

  const cacheKey = `search:${query}`;
  const cachedResult = cache.get<Token[]>(cacheKey);
  if (cachedResult) return cachedResult;

  return requestQueue.add(async () => {
    try {
      const response = await fetchWithRetry(
        `${COINGECKO_API}/search?query=${query}`,
      );
      const data = await response.json();
      const results = data.coins.slice(0, 10).map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
      }));
      cache.set(cacheKey, results);
      return results;
    } catch (error) {
      console.error("Error searching tokens:", error);
      return [];
    }
  });
};

export const fetchSingleTokenData = async (
  coinId: string,
  currency: string = "usd",
): Promise<CryptoData | null> => {
  const cacheKey = `data:${coinId}:${currency}`;
  const cachedData = cache.get<CryptoData>(cacheKey);
  if (cachedData) return cachedData;

  return requestQueue.add(async () => {
    try {
      const response = await fetchWithRetry(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
      );
      const data = await response.json();
      const tokenData = data[coinId];
      if (tokenData) {
        cache.set(cacheKey, tokenData);
        return tokenData;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching data for ${coinId}:`, error);
      return null;
    }
  });
};

export const fetchCryptoData = async (
  coins: string[],
  currency: string = "usd",
) => {
  const result: { [key: string]: CryptoData } = {};
  const uncachedCoins: string[] = [];

  // Check cache first
  for (const coinId of coins) {
    const cacheKey = `data:${coinId}:${currency}`;
    const cachedData = cache.get<CryptoData>(cacheKey);
    if (cachedData) {
      result[coinId] = cachedData;
    } else {
      uncachedCoins.push(coinId);
    }
  }

  // Fetch uncached coins in parallel batches
  if (uncachedCoins.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < uncachedCoins.length; i += batchSize) {
      const batch = uncachedCoins.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (coinId) => {
          const data = await fetchSingleTokenData(coinId, currency);
          if (data) result[coinId] = data;
        }),
      );
    }
  }

  return result;
};

export const fetchSingleTokenHistory = async (
  coinId: string,
  days: string = "1",
  currency: string = "usd",
) => {
  const cacheKey = `history:${coinId}:${days}:${currency}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  const interval = days === "1" ? "minute" : days === "7" ? "hour" : "day";

  return requestQueue.add(async () => {
    try {
      const response = await fetchWithRetry(
        `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${interval}`,
      );
      const data = await response.json();
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching history for ${coinId}:`, error);
      return null;
    }
  });
};

export const fetchCryptoHistory = async (
  coinIds: string[],
  days: string = "1",
  currency: string = "usd",
) => {
  try {
    const results = [];
    const batchSize = 3;

    for (let i = 0; i < coinIds.length; i += batchSize) {
      const batch = coinIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((coinId) => fetchSingleTokenHistory(coinId, days, currency)),
      );
      results.push(...batchResults);
    }

    return results;
  } catch (error) {
    console.error("Error fetching crypto history:", error);
    throw error;
  }
};

// Function to find correlated tokens based on price movements
export const findCorrelatedTokens = async (
  mainToken: string,
  days: string = "30",
  currency: string = "usd",
  limit: number = 5,
): Promise<string[]> => {
  // For now, return a mock list of correlated tokens
  // In a real implementation, this would analyze price data to find correlations
  const mockCorrelations: { [key: string]: string[] } = {
    pepe: ["shiba-inu", "floki", "dogecoin", "wojak", "bonk"],
    bitcoin: ["ethereum", "litecoin", "bitcoin-cash", "monero", "dash"],
    ethereum: ["polygon", "avalanche-2", "solana", "cardano", "polkadot"],
  };

  return mockCorrelations[mainToken] || [];
};
