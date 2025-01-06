import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUp,
  Clock,
  MoreVertical,
} from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TokenGroup } from "./TokenGroupPanel";

interface AssetCardProps {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap: number;
  correlationScore?: number;
  timeLagHours?: number;
  priceRatio?: number;
  currency?: string;
  tokenId?: string;
  groups?: TokenGroup[];
  onAddToGroup?: (groupId: string, tokenId: string) => void;
}

const AssetCard = ({
  name = "Bitcoin",
  symbol = "BTC",
  price = 50000,
  change24h = 5.67,
  volume = 25000000000,
  marketCap = 1000000000000,
  correlationScore = 0,
  timeLagHours = 0,
  priceRatio = 1,
  currency = "usd",
  tokenId,
  groups = [],
  onAddToGroup,
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

  const formatPercentage = (num: number) => {
    return `${Math.abs(num).toFixed(2)}%`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${symbol}`}
            alt={symbol}
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{symbol}</span>
              <span className="text-sm text-gray-500">{name}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium">{formatNumber(price)}</span>
              <div
                className={`flex items-center text-sm ${change24h >= 0 ? "text-green-500" : "text-red-500"}`}
              >
                {change24h >= 0 ? (
                  <ArrowUpIcon className="w-3 h-3" />
                ) : (
                  <ArrowDownIcon className="w-3 h-3" />
                )}
                <span>{formatPercentage(change24h)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">Volume 24h</div>
            <div className="text-sm font-medium">{formatNumber(volume)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Market Cap</div>
            <div className="text-sm font-medium">{formatNumber(marketCap)}</div>
          </div>
          {tokenId && onAddToGroup && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-500 hover:text-gray-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="text-xs font-medium text-gray-500 px-2 py-1.5">
                  Add to Group
                </div>
                <DropdownMenuSeparator />
                {groups.map((group) => (
                  <DropdownMenuItem
                    key={group.id}
                    onClick={() => onAddToGroup(group.id, tokenId)}
                    className="text-sm"
                  >
                    {group.name}
                  </DropdownMenuItem>
                ))}
                {groups.length === 0 && (
                  <div className="text-xs text-gray-500 px-2 py-1.5">
                    No groups available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span>Correlation</span>
          </div>
          <Progress value={correlationScore * 100} className="h-2" />
          <div className="text-xs font-medium mt-1">
            {formatPercentage(correlationScore * 100)}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Clock className="w-3 h-3" />
            <span>Time Lag</span>
          </div>
          <div className="text-sm font-medium">{timeLagHours}h</div>
          <div className="text-xs text-gray-500">behind main token</div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span>💰</span>
            <span>Price Ratio</span>
          </div>
          <div className="text-sm font-medium">{priceRatio.toFixed(2)}x</div>
          <div className="text-xs text-gray-500">vs main token</div>
        </div>
      </div>
    </div>
  );
};

export default AssetCard;
