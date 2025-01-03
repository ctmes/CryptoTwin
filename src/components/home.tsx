import React, { useState, useEffect } from "react";
import MainChart from "./correlation/MainChart";
import TimeframeSelector from "./correlation/TimeframeSelector";
import CorrelatedAssetsGrid from "./correlation/CorrelatedAssetsGrid";
import CurrencySelector from "./correlation/CurrencySelector";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, Search } from "lucide-react";
import {
  CRYPTO_GROUPS,
  searchCryptoGroups,
  fetchCryptoData,
  fetchCryptoHistory,
  SUPPORTED_CURRENCIES,
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
    setLoading(true);
    const data = await fetchCryptoData(selectedGroup.coins, selectedCurrency);
    setCryptoData(data);
    setLoading(false);
  };

  const loadPriceHistory = async () => {
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
  };

  useEffect(() => {
    loadCryptoData();
    loadPriceHistory();
  }, [selectedGroup, selectedCurrency, selectedTimeframe]);

  const calculateCorrelations = () => {
    if (!priceHistory || !priceHistory[0]) return {};

    const mainCoinPrices = extractPricesFromHistory(priceHistory[0]);
    const mainCoinReturns = calculateReturns(mainCoinPrices);

    const correlations: { [key: string]: number } = {};

    // Skip the first coin (main coin) and calculate correlations for others
    selectedGroup.coins.slice(1).forEach((coin, index) => {
      if (priceHistory[index + 1]) {
        const prices = extractPricesFromHistory(priceHistory[index + 1]);
        const returns = calculateReturns(prices);

        // Ensure we have the same number of data points
        const minLength = Math.min(mainCoinReturns.length, returns.length);
        const correlation = calculateCorrelation(
          mainCoinReturns.slice(0, minLength),
          returns.slice(0, minLength),
        );

        correlations[coin] = correlation;
      } else {
        correlations[coin] = 0;
      }
    });

    return correlations;
  };

  const filteredGroups = searchCryptoGroups(searchQuery);

  const formatCryptoData = () => {
    if (!cryptoData) return [];
    const correlations = calculateCorrelations();

    return selectedGroup.coins.map((coinId) => {
      const data = cryptoData[coinId];
      return {
        name: coinId
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        symbol: coinId.toUpperCase(),
        price: data?.[selectedCurrency] || 0,
        change24h: data?.[`${selectedCurrency}_24h_change`] || 0,
        volume: data?.[`${selectedCurrency}_24h_vol`] || 0,
        marketCap: data?.[`${selectedCurrency}_market_cap`] || 0,
        correlationStrength: correlations[coinId] || 0,
        currency: selectedCurrency,
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold">{selectedGroup.name}</h1>

        <div className="flex gap-4 items-center">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-slate-900"
            />
          </div>

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

          <TimeframeSelector
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>
      </div>

      {filteredGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredGroups.map((group) => (
            <Button
              key={group.name}
              variant={
                selectedGroup.name === group.name ? "default" : "secondary"
              }
              onClick={() => setSelectedGroup(group)}
              className="whitespace-nowrap"
            >
              {group.name}
            </Button>
          ))}
        </div>
      )}

      <p className="text-muted-foreground">{selectedGroup.description}</p>

      <MainChart
        mainMover={{
          symbol: selectedGroup.coins[0].toUpperCase(),
          data: priceHistory?.[0]?.prices || [],
        }}
        correlatedAssets={selectedGroup.coins.slice(1).map((coin, index) => ({
          symbol: coin.toUpperCase(),
          data: priceHistory?.[index + 1]?.prices || [],
          correlation: calculateCorrelations()[coin] || 0,
        }))}
        currency={selectedCurrency}
      />

      <div>
        <h2 className="text-xl font-bold mb-4">Correlated Assets</h2>
        <CorrelatedAssetsGrid assets={formatCryptoData()} loading={loading} />
      </div>
    </div>
  );
};

export default Home;
