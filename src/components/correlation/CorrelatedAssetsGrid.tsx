import React from "react";
import AssetCard from "./AssetCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CorrelatedAssetsGridProps {
  assets?: Array<{
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    volume: number;
    marketCap: number;
    correlationStrength: number;
  }>;
  loading?: boolean;
}

const LoadingSkeleton = () => (
  <div className="w-[300px] h-[200px] bg-gray-100 rounded-lg animate-pulse" />
);

const CorrelatedAssetsGrid = ({
  assets = [],
  loading = false,
}: CorrelatedAssetsGridProps) => {
  if (loading) {
    return (
      <div className="w-full min-h-[300px] p-6 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
        {assets.map((asset, index) => (
          <AssetCard
            key={`${asset.symbol}-${index}`}
            name={asset.name}
            symbol={asset.symbol}
            price={asset.price}
            change24h={asset.change24h}
            volume={asset.volume}
            marketCap={asset.marketCap}
            correlationStrength={asset.correlationStrength}
          />
        ))}
      </div>
    </div>
  );
};

export default CorrelatedAssetsGrid;
