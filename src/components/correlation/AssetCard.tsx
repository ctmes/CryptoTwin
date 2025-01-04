import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/api";

interface AssetCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  correlationStrength: number;
  currency?: string;
}

const AssetCard = ({
  name = "Bitcoin",
  symbol = "BTC",
  price = 50000,
  change24h = 5.67,
  volume = 25000000000,
  marketCap = 1000000000000,
  correlationStrength = 0.85,
  currency = "usd",
}: AssetCardProps) => {
  const currencyInfo =
    SUPPORTED_CURRENCIES.find((c) => c.value === currency) ||
    SUPPORTED_CURRENCIES[0];

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getCorrelationColor = (strength: number) => {
    if (strength >= 0.7) return "correlation-high";
    if (strength >= 0.4) return "correlation-medium";
    return "correlation-low";
  };

  return (
    <Card className="w-[300px] h-[200px] bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${symbol}`}
              alt={symbol}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500">{symbol}</p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`${getCorrelationColor(correlationStrength)} text-white`}
          >
            {(correlationStrength * 100).toFixed(0)}% Correlation
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-semibold text-gray-900">
              {formatNumber(price)}
            </span>
            <div
              className={`flex items-center ${change24h >= 0 ? "text-blue-500" : "text-red-500"}`}
            >
              {change24h >= 0 ? (
                <ArrowUpIcon size={16} />
              ) : (
                <ArrowDownIcon size={16} />
              )}
              <span className="font-semibold">
                {Math.abs(change24h).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Volume 24h</p>
              <p className="font-medium text-gray-900">
                {formatNumber(volume)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Market Cap</p>
              <p className="font-medium text-gray-900">
                {formatNumber(marketCap)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetCard;
