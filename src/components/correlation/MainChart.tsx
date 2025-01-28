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
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch and process chart data
  useEffect(() => {
    if (mainMover.data && mainMover.data.length > 0) {
      const formattedData = mainMover.data.map(({ timestamp, price }) => {
        // Format main mover data
        const formattedPoint: any = {
          timestamp: new Date(timestamp).toISOString(),
          [mainMover.symbol]: price,
        };

        // Add correlated asset data for the same timestamp (within 1-hour tolerance)
        correlatedAssets.forEach((asset) => {
          const matchingPoint = asset.data.find(
            (point) =>
              Math.abs(new Date(point.timestamp).getTime() - new Date(timestamp).getTime()) < 3600000 // 1 hour tolerance
          );
          if (matchingPoint) {
            formattedPoint[asset.symbol] = matchingPoint.price;
          }
        });

        return formattedPoint;
      });

      setChartData(formattedData);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [mainMover.data, correlatedAssets]);

  // Normalize data for percentage change visualization
  const normalizeData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    const firstValues: { [key: string]: number } = {};
    const symbols = [
      mainMover.symbol,
      ...correlatedAssets.map((asset) => asset.symbol),
    ];

    // Record the first value of each symbol for normalization
    symbols.forEach((symbol) => {
      firstValues[symbol] = chartData[0][symbol];
    });

    return chartData.map((point) => {
      const normalizedPoint: any = { timestamp: point.timestamp };

      symbols.forEach((symbol) => {
        if (point[symbol] !== undefined) {
          normalizedPoint[`${symbol}_normalized`] =
            ((point[symbol] / firstValues[symbol]) - 1) * 100;
        }
      });

      return normalizedPoint;
    });
  }, [chartData, mainMover.symbol, correlatedAssets]);

  // Define colors for the chart lines
  const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  // Render loading state if data is not ready
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
          data={normalizeData}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          {/* X-Axis */}
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) =>
              new Date(timestamp).toLocaleString()
            }
            stroke="#64748b"
          />
          {/* Y-Axis */}
          <YAxis
            label={{
              value: "Change %",
              angle: -90,
              position: "insideLeft",
            }}
            stroke="#64748b"
          />
          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ color: "#1e293b" }}
          />
          <Legend />

          {/* Main mover line */}
          <Line
            type="monotone"
            dataKey={`${mainMover.symbol}_normalized`}
            name={mainMover.symbol}
            stroke={colors[0]}
            dot={false}
            strokeWidth={2}
          />

          {/* Correlated assets lines */}
          {correlatedAssets.map((asset, index) => (
            <Line
              key={asset.symbol}
              type="monotone"
              dataKey={`${asset.symbol}_normalized`}
              name={`${asset.symbol} (${(asset.correlation * 100).toFixed(
                0
              )}%)`}
              stroke={colors[index + 1] || "#ccc"}
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
