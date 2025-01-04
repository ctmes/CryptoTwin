import React, { useState, useEffect, useMemo } from "react";
import MainChart from "./correlation/MainChart";
import TimeframeSelector from "./correlation/TimeframeSelector";
import CorrelatedAssetsGrid from "./correlation/CorrelatedAssetsGrid";
import CurrencySelector from "./correlation/CurrencySelector";
import CorrelationHeatmap from "./correlation/CorrelationHeatmap";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search, TrendingUp, Coins } from "lucide-react";
import {
  CRYPTO_GROUPS,
  searchCryptoGroups,
  fetchCryptoData,
  fetchCryptoHistory,
} from "@/lib/api";
import {
  calculateCorrelation,
  calculateReturns,
  extractPricesFromHistory,
} from "@/lib/utils";

const Home = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "24h" | "7d" | "30d"
  >("24h");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(CRYPTO_GROUPS[0]);
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState("usd");

  const loadCryptoData = async () => {
    try {
      setLoading(true);
      const data = await fetchCryptoData(selectedGroup.coins, selectedCurrency);
      setCryptoData(data);
    } catch (error) {
      console.error("Error loading crypto data:", error);
    }
  };

  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      setPriceHistory(null); // Clear existing data while loading
      const days =
        selectedTimeframe === "24h"
          ? "1"
          : selectedTimeframe === "7d"
            ? "7"
            : "30";
      const data = await fetchCryptoHistory(
        selectedGroup.coins,
        days,
        selectedCurrency,
      );
      setPriceHistory(data);
    } catch (error) {
      console.error("Error loading price history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    loadCryptoData();
  }, [selectedGroup, selectedCurrency]);

  // Load price history when timeframe changes
  useEffect(() => {
    loadPriceHistory();
  }, [selectedTimeframe, selectedGroup, selectedCurrency]);

  // Memoize returns calculation
  const returns = useMemo(() => {
    if (!priceHistory || !priceHistory[0]) return {};

    const returnData: { [key: string]: number[] } = {};
    selectedGroup.coins.forEach((coin, index) => {
      if (priceHistory[index]) {
        const prices = extractPricesFromHistory(priceHistory[index]);
        returnData[coin] = calculateReturns(prices);
      }
    });
    return returnData;
  }, [priceHistory, selectedGroup.coins]);

  // Memoize correlation calculations
  const correlations = useMemo(() => {
    const correlationData: { [key: string]: { [key: string]: number } } = {};

    selectedGroup.coins.forEach((coin1) => {
      correlationData[coin1] = {};
      if (!returns[coin1]) return;

      selectedGroup.coins.forEach((coin2) => {
        if (!returns[coin2]) return;

        // Skip if we've already calculated this pair
        if (correlationData[coin2]?.[coin1] !== undefined) {
          correlationData[coin1][coin2] = correlationData[coin2][coin1];
          return;
        }

        const minLength = Math.min(
          returns[coin1].length,
          returns[coin2].length,
        );
        if (minLength < 2) {
          correlationData[coin1][coin2] = 0;
          return;
        }

        correlationData[coin1][coin2] = calculateCorrelation(
          returns[coin1].slice(0, minLength),
          returns[coin2].slice(0, minLength),
        );
      });
    });

    return correlationData;
  }, [returns, selectedGroup.coins]);

  const filteredGroups = searchCryptoGroups(searchQuery);

  const formatCryptoData = () => {
    if (!cryptoData) return [];

    return selectedGroup.coins.map((coinId) => {
      const data = cryptoData[coinId] || {};
      return {
        name: coinId
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        symbol: coinId.toUpperCase(),
        price: data[selectedCurrency] || 0,
        change24h: data[`${selectedCurrency}_24h_change`] || 0,
        volume: data[`${selectedCurrency}_24h_vol`] || 0,
        marketCap: data[`${selectedCurrency}_market_cap`] || 0,
        correlationStrength:
          correlations[selectedGroup.coins[0]]?.[coinId] || 0,
        currency: selectedCurrency,
      };
    });
  };

  const handleTimeframeChange = (timeframe: "24h" | "7d" | "30d") => {
    setSelectedTimeframe(timeframe);
    setPriceHistory(null); // Clear existing data
  };

  const handleGroupChange = (group: (typeof CRYPTO_GROUPS)[0]) => {
    setSelectedGroup(group);
    setPriceHistory(null); // Clear existing data
    setCryptoData(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Crypto Correlation Analysis
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedGroup.description}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <CurrencySelector
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={loadCryptoData}
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Derivatives Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Derivatives
                </h2>
              </div>
              <TimeframeSelector
                selectedTimeframe={selectedTimeframe}
                onTimeframeChange={handleTimeframeChange}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filteredGroups.map((group) => (
                  <Button
                    key={group.name}
                    variant={
                      selectedGroup.name === group.name
                        ? "default"
                        : "secondary"
                    }
                    onClick={() => handleGroupChange(group)}
                    className="whitespace-nowrap"
                  >
                    {group.name}
                  </Button>
                ))}
              </div>
              <div className="relative w-64 flex-shrink-0 ml-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search derivatives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Price Movement Correlation
            </h2>
          </div>
          <MainChart
            mainMover={{
              symbol: selectedGroup.coins[0].toUpperCase(),
              data: priceHistory?.[0]?.prices || [],
            }}
            correlatedAssets={selectedGroup.coins
              .slice(1)
              .map((coin, index) => ({
                symbol: coin.toUpperCase(),
                data: priceHistory?.[index + 1]?.prices || [],
                correlation: correlations[selectedGroup.coins[0]]?.[coin] || 0,
              }))}
            currency={selectedCurrency}
          />
        </div>

        {/* Additional Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Correlation Heatmap
            </h2>
            <CorrelationHeatmap
              assets={selectedGroup.coins.map((coin) => ({
                symbol: coin.toUpperCase(),
                correlations: correlations[coin] || {},
              }))}
              loading={loading}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Correlated Assets
            </h2>
            <CorrelatedAssetsGrid
              assets={formatCryptoData()}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
