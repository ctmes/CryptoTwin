import React, { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

const MainChart = ({
  mainMover = { symbol: "BTC", data: [] },
  correlatedAssets = [],
  currency = "usd",
}: MainChartProps) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      mainMover?.data &&
      Array.isArray(mainMover.data) &&
      mainMover.data.length > 0
    ) {
      const formattedData = mainMover.data.map(
        ([timestamp, price]: [number, number]) => ({
          timestamp: new Date(timestamp).toISOString(),
          [mainMover.symbol]: price,
          ...correlatedAssets.reduce((acc, curr, index) => {
            if (curr.data && curr.data.length > 0) {
              const matchingPrice = curr.data.find(
                ([t]: [number, number]) => Math.abs(t - timestamp) < 3600000, // 1 hour tolerance
              );
              if (matchingPrice) {
                acc[curr.symbol] = matchingPrice[1];
              }
            }
            return acc;
          }, {}),
        }),
      );

      setChartData(formattedData);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [mainMover.data, correlatedAssets]);

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

  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-gray-500">
        Loading chart data...
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={normalizeData(chartData || [])}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            stroke="#64748b"
          />
          <YAxis
            label={{ value: "Change %", angle: -90, position: "insideLeft" }}
            stroke="#64748b"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "#1e293b" }}
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
    </div>
  );
};

export default MainChart;
