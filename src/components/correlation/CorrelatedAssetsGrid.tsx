import AssetCard from "./AssetCard";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenGroup } from "./TokenGroupPanel";

interface CorrelatedAssetsGridProps {
  assets?: Array<{
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    volume: number;
    marketCap: number;
    correlationScore?: number;
    timeLagHours?: number;
    priceRatio?: number;
    id?: string;
  }>;
  loading?: boolean;
  groups?: TokenGroup[];
  onAddToGroup?: (groupId: string, tokenId: string) => void;
}

const LoadingSkeleton = () => (
  <div className="space-y-2 p-4 border border-gray-100 rounded-lg">
    <div className="flex justify-between items-start">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const CorrelatedAssetsGrid = ({
  assets = [],
  loading = false,
  groups = [],
  onAddToGroup,
}: CorrelatedAssetsGridProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((asset, index) => (
        <AssetCard
          key={`${asset.symbol}-${index}`}
          {...asset}
          correlationScore={asset.correlationScore || 0}
          timeLagHours={asset.timeLagHours || 0}
          priceRatio={asset.priceRatio || 1}
          tokenId={asset.id}
          groups={groups}
          onAddToGroup={onAddToGroup}
        />
      ))}
    </div>
  );
};

export default CorrelatedAssetsGrid;
