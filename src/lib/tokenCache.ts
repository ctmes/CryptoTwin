import {
  Token,
  searchTokens,
  fetchCryptoData,
  fetchCryptoHistory,
} from "./api";

interface CachedToken extends Token {
  lastUpdated: number;
  data?: any;
  history?: any;
}

class TokenCacheService {
  private static instance: TokenCacheService;
  private cache: Map<string, CachedToken> = new Map();
  private allTokenIds: string[] = [];
  private currentBatchIndex = 0;
  private isLoading = false;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private BATCH_SIZE = 10;

  private constructor() {
    this.initializeTokenList();
  }

  public static getInstance(): TokenCacheService {
    if (!TokenCacheService.instance) {
      TokenCacheService.instance = new TokenCacheService();
    }
    return TokenCacheService.instance;
  }

  private async initializeTokenList() {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/list",
      );
      const tokens = await response.json();
      this.allTokenIds = tokens
        .sort((a: any, b: any) => b.market_cap_rank - a.market_cap_rank)
        .map((token: any) => token.id);
      this.startBackgroundLoading();
    } catch (error) {
      console.error("Error initializing token list:", error);
      // Fallback to a basic list if the API fails
      this.allTokenIds = [
        "bitcoin",
        "ethereum",
        "binancecoin",
        "ripple",
        "cardano",
        "solana",
        "polkadot",
        "dogecoin",
        "avalanche-2",
        "chainlink",
      ];
      this.startBackgroundLoading();
    }
  }

  private async startBackgroundLoading() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      while (this.currentBatchIndex < this.allTokenIds.length) {
        const batch = this.allTokenIds.slice(
          this.currentBatchIndex,
          this.currentBatchIndex + this.BATCH_SIZE,
        );
        await this.loadTokenBatch(batch);
        this.currentBatchIndex += this.BATCH_SIZE;
        // Small delay between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // Reset and start over when we've loaded all tokens
      if (this.currentBatchIndex >= this.allTokenIds.length) {
        this.currentBatchIndex = 0;
        // Wait before starting the next cycle
        await new Promise((resolve) =>
          setTimeout(resolve, this.CACHE_DURATION),
        );
      }
    } catch (error) {
      console.error("Error in background loading:", error);
    } finally {
      this.isLoading = false;
      // Continue loading
      setTimeout(() => this.startBackgroundLoading(), 1000);
    }
  }

  private async loadTokenBatch(tokenIds: string[]) {
    try {
      const tokenData = await fetchCryptoData(tokenIds);
      const now = Date.now();

      for (const tokenId of tokenIds) {
        const existingToken = this.cache.get(tokenId);
        if (existingToken) {
          this.cache.set(tokenId, {
            ...existingToken,
            lastUpdated: now,
            data: tokenData[tokenId],
          });
        } else {
          this.cache.set(tokenId, {
            id: tokenId,
            symbol: tokenId.toUpperCase(),
            name: tokenId
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
            lastUpdated: now,
            data: tokenData[tokenId],
          });
        }
      }
    } catch (error) {
      console.error(`Error loading token batch:`, error);
    }
  }

  public async getToken(tokenId: string): Promise<CachedToken | null> {
    const cached = this.cache.get(tokenId);
    const now = Date.now();

    if (cached && now - cached.lastUpdated < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const data = await fetchCryptoData([tokenId]);
      const token: CachedToken = {
        id: tokenId,
        symbol: tokenId.toUpperCase(),
        name: tokenId
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        lastUpdated: now,
        data: data[tokenId],
      };

      this.cache.set(tokenId, token);
      return token;
    } catch (error) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  }

  public getAllCachedTokens(): CachedToken[] {
    return Array.from(this.cache.values());
  }

  public async searchCachedTokens(query: string): Promise<Token[]> {
    const cachedResults = Array.from(this.cache.values())
      .filter(
        (token) =>
          token.name.toLowerCase().includes(query.toLowerCase()) ||
          token.symbol.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 5);

    if (cachedResults.length >= 5) {
      return cachedResults;
    }

    const apiResults = await searchTokens(query);
    const combinedResults = [...cachedResults];

    for (const result of apiResults) {
      if (!combinedResults.some((r) => r.id === result.id)) {
        combinedResults.push(result);
      }
    }

    return combinedResults.slice(0, 10);
  }

  public findSimilarTokens(tokenId: string, limit: number = 5): CachedToken[] {
    const token = this.cache.get(tokenId);
    if (!token?.data) return [];

    const tokenPrice = token.data.usd || 0;
    const tokenVolume = token.data.usd_24h_vol || 0;
    const tokenMarketCap = token.data.usd_market_cap || 0;

    return Array.from(this.cache.values())
      .filter((t) => t.id !== tokenId && t.data) // Exclude the input token
      .map((t) => ({
        token: t,
        similarity: this.calculateSimilarity(
          tokenPrice,
          tokenVolume,
          tokenMarketCap,
          t.data.usd || 0,
          t.data.usd_24h_vol || 0,
          t.data.usd_market_cap || 0,
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.token);
  }

  private calculateSimilarity(
    price1: number,
    volume1: number,
    marketCap1: number,
    price2: number,
    volume2: number,
    marketCap2: number,
  ): number {
    // Normalize the values
    const priceRatio = Math.min(price1, price2) / Math.max(price1, price2);
    const volumeRatio = Math.min(volume1, volume2) / Math.max(volume1, volume2);
    const marketCapRatio =
      Math.min(marketCap1, marketCap2) / Math.max(marketCap1, marketCap2);

    // Weight the different factors
    return priceRatio * 0.3 + volumeRatio * 0.3 + marketCapRatio * 0.4;
  }
}

export const tokenCache = TokenCacheService.getInstance();
