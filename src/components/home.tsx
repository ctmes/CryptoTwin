import { useState, useEffect, useMemo, useCallback } from "react";
import TokenGroupPanel, { TokenGroup } from "./correlation/TokenGroupPanel";
import MainChart from "./correlation/MainChart";
import TimeframeSelector from "./correlation/TimeframeSelector";
import CorrelatedAssetsGrid from "./correlation/CorrelatedAssetsGrid";
import CurrencySelector from "./correlation/CurrencySelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Search,
  TrendingUp,
  Coins,
  SplitSquareHorizontal,
  Plus,
} from "lucide-react";
import {
  searchTokens,
  fetchCryptoData,
  fetchCryptoHistory,
  findCorrelatedTokens,
  type Token,
} from "@/lib/api";
import {
  calculateCorrelation,
  calculateReturns,
  extractPricesFromHistory,
  calculateTimeLag,
  calculatePriceRatio,
} from "@/lib/utils";
import { tokenCache } from "@/lib/tokenCache";

const Home = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "24h" | "7d" | "30d"
  >("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [correlatedTokens, setCorrelatedTokens] = useState<string[]>([]);
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("usd");
  const [tokenGroups, setTokenGroups] = useState<TokenGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();

  // Handle search
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery) {
        const results = await tokenCache.searchCachedTokens(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Load correlated tokens when a token is selected
  useEffect(() => {
    const loadCorrelatedTokens = async () => {
      if (selectedToken) {
        setLoadingTokens(true);
        const tokens = await findCorrelatedTokens(selectedToken.id);
        setCorrelatedTokens(tokens);
        setLoadingTokens(false);
      }
    };

    loadCorrelatedTokens();
  }, [selectedToken]);

  const allTokens = useMemo(() => {
    if (!selectedToken) return [];
    return [selectedToken.id];
  }, [selectedToken]);

  // Continuously load and update token data
  useEffect(() => {
    const loadTokenData = async () => {
      const popularTokens = tokenCache.getPopularTokens();
      if (popularTokens.length > 0) {
        setCryptoData(
          popularTokens.reduce((acc, token) => {
            if (token.data) {
              acc[token.id] = token.data;
            }
            return acc;
          }, {}),
        );
      }
    };

    // Initial load
    loadTokenData();

    // Set up polling interval
    const interval = setInterval(loadTokenData, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const loadPriceHistory = async () => {
    if (!allTokens.length) return;

    try {
      setLoadingHistory(true);
      setPriceHistory(null);
      const days =
        selectedTimeframe === "24h"
          ? "1"
          : selectedTimeframe === "7d"
            ? "7"
            : "30";
      const data = await fetchCryptoHistory(allTokens, days, selectedCurrency);
      setPriceHistory(data);
    } catch (error) {
      console.error("Error loading price history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load price history when timeframe changes
  useEffect(() => {
    if (allTokens.length > 0) {
      loadPriceHistory();
    }
  }, [selectedTimeframe]);

  // Token Group Management
  const handleCreateGroup = useCallback((name: string) => {
    const newGroup: TokenGroup = {
      id: crypto.randomUUID(),
      name,
      tokens: [],
    };
    setTokenGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
  }, []);

  const handleUpdateGroup = useCallback((updatedGroup: TokenGroup) => {
    setTokenGroups((prev) =>
      prev.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group,
      ),
    );
  }, []);

  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      setTokenGroups((prev) => prev.filter((group) => group.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(undefined);
        setSelectedToken(null);
        setCorrelatedTokens([]);
      }
    },
    [selectedGroupId],
  );

  const handleAddToken = useCallback((groupId: string, token: Token) => {
    setTokenGroups((prev) =>
      prev.map((group) => {
        if (group.id === groupId) {
          const exists = group.tokens.some((t) => t.id === token.id);
          if (!exists) {
            return {
              ...group,
              tokens: [...group.tokens, token],
            };
          }
        }
        return group;
      }),
    );
  }, []);

  const handleRemoveToken = useCallback(
    (groupId: string, tokenId: string) => {
      setTokenGroups((prev) =>
        prev.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              tokens: group.tokens.filter((t) => t.id !== tokenId),
            };
          }
          return group;
        }),
      );
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
        setCorrelatedTokens([]);
      }
    },
    [selectedToken],
  );

  const formatCryptoData = () => {
    if (!cryptoData) return [];

    // Get all popular tokens from cache
    const popularTokens = tokenCache.getPopularTokens();

    return popularTokens
      .filter((token) => token.data) // Only include tokens with data
      .map((token) => {
        const data = token.data;
        return {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          price: data[selectedCurrency] || 0,
          change24h: data[`${selectedCurrency}_24h_change`] || 0,
          volume: data[`${selectedCurrency}_24h_vol`] || 0,
          marketCap: data[`${selectedCurrency}_market_cap`] || 0,
        };
      })
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)); // Sort by market cap
  };

  const formatChartData = () => {
    if (!priceHistory || !selectedToken) return null;

    const mainPrices = priceHistory[0];
    if (!mainPrices?.prices) return null;

    return {
      mainMover: {
        symbol: selectedToken.symbol,
        data: mainPrices.prices || [],
      },
      correlatedAssets: [],
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TokenGroupPanel
        groups={tokenGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={handleCreateGroup}
        onUpdateGroup={handleUpdateGroup}
        onDeleteGroup={handleDeleteGroup}
        onAddToken={handleAddToken}
        onRemoveToken={handleRemoveToken}
      />
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <SplitSquareHorizontal className="h-6 w-6 text-indigo-600" />
                  <span className="text-xl font-semibold">CryptoTwin</span>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Market Analysis
                  </h1>
                  {selectedToken && (
                    <p className="text-sm text-gray-500 mt-1">
                      Analyzing {selectedToken.name} ({selectedToken.symbol})
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrencySelector
                  value={selectedCurrency}
                  onValueChange={setSelectedCurrency}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Token Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select Token
                  </h2>
                </div>
                <TimeframeSelector
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                />
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for a token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-white"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                    {searchResults.map((token) => (
                      <button
                        key={token.id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => {
                          setSelectedToken(token);
                          setSearchQuery("");
                          setSearchResults([]);
                          if (selectedGroupId) {
                            handleAddToken(selectedGroupId, token);
                          }
                        }}
                      >
                        <span>
                          {token.name} ({token.symbol})
                        </span>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedToken && (
            <>
              {/* Chart Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Price Movement Analysis
                  </h2>
                </div>
                {loadingHistory ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <MainChart
                    {...formatChartData()}
                    currency={selectedCurrency}
                  />
                )}
              </div>
            </>
          )}

          {/* Market Data Grid */}
          <div className="w-full">
            <div className="bg-white rounded-lg shadow-sm p-6 w-full">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Market Data
              </h2>
              <CorrelatedAssetsGrid
                assets={formatCryptoData()}
                loading={loading || loadingTokens}
                groups={tokenGroups}
                onAddToGroup={handleAddToken}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
