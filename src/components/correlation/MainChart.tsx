import React, { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchCryptoHistory } from "@/lib/api";

interface MainChartProps {
  mainMover: {
    symbol: string;
    data: Array<{
      timestamp: string;
      price: number;
    }>;
  };
  correlatedAssets: Array<{
    symbol: string;
    data: Array<{
      timestamp: string;
      price: number;
    }>;
    correlation: number;
  }>;
  currency?: string;
}

const COIN_MAPPING = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
};

const MainChart = ({
  mainMover = { symbol: "BTC", data: [] },
  correlatedAssets = [],
  currency = "usd",
}: MainChartProps) => {
  const [timeframe, setTimeframe] = React.useState("24h");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      const days = timeframe === "24h" ? "1" : timeframe === "7d" ? "7" : "30";

      try {
        const mainData = await fetchCryptoHistory(
          [COIN_MAPPING[mainMover.symbol as keyof typeof COIN_MAPPING]],
          days,
          currency,
        );
        const correlatedData = await Promise.all(
          correlatedAssets.map((asset) =>
            fetchCryptoHistory(
              [COIN_MAPPING[asset.symbol as keyof typeof COIN_MAPPING]],
              days,
              currency,
            ),
          ),
        );

        if (mainData && mainData[0]?.prices) {
          const formattedData = mainData[0].prices.map(
            ([timestamp, price]: [number, number]) => ({
              timestamp: new Date(timestamp).toISOString(),
              [mainMover.symbol]: price,
              ...correlatedData.reduce((acc, curr, index) => {
                if (curr && curr[0]?.prices) {
                  const matchingPrice = curr[0].prices.find(
                    ([t]: [number, number]) => Math.abs(t - timestamp) < 1000,
                  );
                  if (matchingPrice) {
                    acc[correlatedAssets[index].symbol] = matchingPrice[1];
                  }
                }
                return acc;
              }, {}),
            }),
          );

          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error loading chart data:", error);
      }

      setLoading(false);
    };

    loadChartData();
  }, [timeframe, mainMover.symbol, currency]);

  const normalizeData = useMemo(
    () => (data: any[]) => {
      if (!data || data.length === 0) return [];

      const firstValues: { [key: string]: number } = {};
      const symbols = [
        mainMover.symbol,
        ...correlatedAssets.map((a) => a.symbol),
      ];

      symbols.forEach((symbol) => {
        firstValues[symbol] = data[0][symbol];
      });

      return data.map((point) => {
        const normalized: any = { timestamp: point.timestamp };
        symbols.forEach((symbol) => {
          normalized[`${symbol}_normalized`] =
            (point[symbol] / firstValues[symbol] - 1) * 100;
        });
        return normalized;
      });
    },
    [mainMover.symbol, correlatedAssets],
  );

  const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

  if (loading) {
    return (
      <Card className="w-full h-[500px] p-6 bg-slate-900 text-white flex items-center justify-center">
        Loading chart data...
      </Card>
    );
  }

  return (
    <Card className="w-full h-[500px] p-6 bg-slate-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Price Movement Correlation</h2>
        <div className="flex gap-2">
          <Button
            variant={timeframe === "24h" ? "default" : "secondary"}
            onClick={() => setTimeframe("24h")}
            size="sm"
          >
            24h
          </Button>
          <Button
            variant={timeframe === "7d" ? "default" : "secondary"}
            onClick={() => setTimeframe("7d")}
            size="sm"
          >
            7d
          </Button>
          <Button
            variant={timeframe === "30d" ? "default" : "secondary"}
            onClick={() => setTimeframe("30d")}
            size="sm"
          >
            30d
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={normalizeData(chartData || [])}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) =>
              new Date(timestamp).toLocaleTimeString()
            }
            stroke="#64748b"
          />
          <YAxis
            label={{ value: "Change %", angle: -90, position: "insideLeft" }}
            stroke="#64748b"
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "none" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Legend />

          <Line
            type="monotone"
            dataKey={`${mainMover.symbol}_normalized`}
            name={mainMover.symbol}
            stroke={colors[0]}
            dot={false}
            strokeWidth={2}
          />

          {correlatedAssets.map((asset, index) => (
            <Line
              key={asset.symbol}
              type="monotone"
              dataKey={`${asset.symbol}_normalized`}
              name={`${asset.symbol} (${(asset.correlation * 100).toFixed(0)}%)`}
              stroke={colors[index + 1]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default MainChart;
