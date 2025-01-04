const COINGECKO_API = "https://api.coingecko.com/api/v3";

interface CryptoGroup {
  name: string;
  description: string;
  coins: string[];
}

export const SUPPORTED_CURRENCIES = [
  { value: "usd", label: "USD ($)", symbol: "$" },
  { value: "eur", label: "EUR (€)", symbol: "€" },
  { value: "gbp", label: "GBP (£)", symbol: "£" },
  { value: "jpy", label: "JPY (¥)", symbol: "¥" },
  { value: "aud", label: "AUD ($)", symbol: "A$" },
  { value: "cad", label: "CAD ($)", symbol: "C$" },
];

export const CRYPTO_GROUPS: CryptoGroup[] = [
  {
    name: "Layer 1",
    description: "Major blockchain platforms",
    coins: ["bitcoin", "ethereum", "solana", "cardano", "avalanche-2"],
  },
  {
    name: "DeFi Blue Chips",
    description: "Major decentralized finance protocols",
    coins: [
      "uniswap",
      "aave",
      "maker",
      "compound-governance-token",
      "curve-dao-token",
    ],
  },
  {
    name: "Meme Coins",
    description: "Popular cryptocurrency memes and their followers",
    coins: ["dogecoin", "shiba-inu", "pepe", "floki", "bonk"],
  },
  {
    name: "AI Tokens",
    description: "Artificial Intelligence focused cryptocurrencies",
    coins: [
      "fetch-ai",
      "singularitynet",
      "ocean-protocol",
      "numeraire",
      "cortex",
    ],
  },
];

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

export const fetchCryptoData = async (
  coins: string[],
  currency: string = "usd",
) => {
  return requestQueue.add(async () => {
    try {
      const response = await fetchWithRetry(
        `${COINGECKO_API}/simple/price?ids=${coins.join(",")}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching crypto data:", error);
      throw error;
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
    const interval = days === "1" ? "minute" : days === "7" ? "hour" : "day";

    for (const coinId of coinIds) {
      const data = await requestQueue.add(async () => {
        const response = await fetchWithRetry(
          `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${interval}`,
        );
        return response.json();
      });
      results.push(data);
    }

    return results;
  } catch (error) {
    console.error("Error fetching crypto history:", error);
    throw error;
  }
};

export const searchCryptoGroups = (query: string): CryptoGroup[] => {
  if (!query) return CRYPTO_GROUPS;

  const lowerQuery = query.toLowerCase();
  return CRYPTO_GROUPS.filter(
    (group) =>
      group.name.toLowerCase().includes(lowerQuery) ||
      group.description.toLowerCase().includes(lowerQuery) ||
      group.coins.some((coin) => coin.toLowerCase().includes(lowerQuery)),
  );
};
