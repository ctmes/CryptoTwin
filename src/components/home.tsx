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
  const [selectedTimeframe, setSelectedTimeframe] = useState<"24h" | "7d" | "30d">("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [correlatedTokens, setCorrelatedTokens] = useState<string[]>([]);
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("usd");
  const [tokenGroups, setTokenGroups] = useState<TokenGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();

  const handleSearch = useCallback(async () => {
    if (searchQuery) {
      const results = await tokenCache.searchCachedTokens(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(searchTimeout);
  }, [handleSearch]);

  const loadCorrelatedTokens = useCallback(async () => {
    if (selectedToken) {
      setLoading(true);
      const tokens = await findCorrelatedTokens(selectedToken.id);
      setCorrelatedTokens(tokens);
      setLoading(false);
    }
  }, [selectedToken]);

  useEffect(() => {
    loadCorrelatedTokens();
  }, [loadCorrelatedTokens]);

  const loadPriceHistory = useCallback(async () => {
    if (!selectedToken) return;
    try {
      setLoadingHistory(true);
      const days = selectedTimeframe === "24h" ? "1" : selectedTimeframe === "7d" ? "7" : "30";
      const data = await fetchCryptoHistory([selectedToken.id], days, selectedCurrency);
      setPriceHistory(data);
    } catch (error) {
      console.error("Error loading price history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedToken, selectedTimeframe, selectedCurrency]);

  useEffect(() => {
    if (selectedToken) {
      loadPriceHistory();
    }
  }, [loadPriceHistory]);

  const formatChartData = () => {
    if (!priceHistory || !selectedToken) return null;
    const mainPrices = priceHistory[0];
    if (!mainPrices?.prices) return null;
    return {
      mainMover: {
        symbol: selectedToken.symbol,
        data: mainPrices.prices || [],
      },
      correlatedAssets: correlatedTokens.map((tokenId) => ({
        symbol: tokenId,
        data: priceHistory.find((h: any) => h.id === tokenId)?.prices || [],
        correlation: calculateCorrelation(mainPrices.prices, priceHistory.find((h: any) => h.id === tokenId)?.prices || []),
      })),
    };
  };

  const handleGroupOperations = useMemo(() => ({
    createGroup: (name: string) => {
      const newGroup: TokenGroup = { id: crypto.randomUUID(), name, tokens: [] };
      setTokenGroups((prev) => [...prev, newGroup]);
      setSelectedGroupId(newGroup.id);
    },
    updateGroup: (updatedGroup: TokenGroup) => {
      setTokenGroups((prev) =>
        prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group))
      );
    },
    deleteGroup: (groupId: string) => {
      setTokenGroups((prev) => prev.filter((group) => group.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId(undefined);
        setSelectedToken(null);
        setCorrelatedTokens([]);
      }
    },
    addToken: (groupId: string, token: Token) => {
      setTokenGroups((prev) =>
        prev.map((group) =>
          group.id === groupId && !group.tokens.some((t) => t.id === token.id)
            ? { ...group, tokens: [...group.tokens, token] }
            : group
        )
      );
    },
    removeToken: (groupId: string, tokenId: string) => {
      setTokenGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? { ...group, tokens: group.tokens.filter((t) => t.id !== tokenId) }
            : group
        )
      );
      if (selectedToken?.id === tokenId) {
        setSelectedToken(null);
        setCorrelatedTokens([]);
      }
    },
  }), [selectedGroupId, selectedToken]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <TokenGroupPanel
        groups={tokenGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onCreateGroup={handleGroupOperations.createGroup}
        onUpdateGroup={handleGroupOperations.updateGroup}
        onDeleteGroup={handleGroupOperations.deleteGroup}
        onAddToken={handleGroupOperations.addToken}
        onRemoveToken={handleGroupOperations.removeToken}
      />
      <div className="flex-1">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SplitSquareHorizontal className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-semibold">CryptoTwin</h1>
              </div>
              <CurrencySelector
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Select Token
              </h2>
              <TimeframeSelector
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for a token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-white"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-md shadow-lg">
                  {searchResults.map((token) => (
                    <button
                      key={token.id}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between"
                      onClick={() => {
                        setSelectedToken(token);
                        setSearchQuery("");
                        setSearchResults([]);
                        if (selectedGroupId) {
                          handleGroupOperations.addToken(selectedGroupId, token);
                        }
                      }}
                    >
                      {token.name} ({token.symbol})
                      <Plus className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selectedToken && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Price Movement Analysis
              </h2>
              {loadingHistory ? (
                <div className="h-[400px] flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <MainChart {...formatChartData()} currency={selectedCurrency} />
              )}
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Market Data
            </h2>
            <CorrelatedAssetsGrid
              assets={cryptoData}
              loading={loading}
              groups={tokenGroups}
              onAddToGroup={handleGroupOperations.addToken}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
