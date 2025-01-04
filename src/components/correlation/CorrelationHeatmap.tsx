import React from "react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CorrelationHeatmapProps {
  assets: Array<{
    symbol: string;
    correlations: { [key: string]: number };
  }>;
  loading?: boolean;
}

const CorrelationHeatmap = ({
  assets = [],
  loading = false,
}: CorrelationHeatmapProps) => {
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse" />
    );
  }

  const getCorrelationColor = (correlation: number) => {
    // Blue color scale
    if (correlation >= 0.8) return "bg-blue-600";
    if (correlation >= 0.6) return "bg-blue-500";
    if (correlation >= 0.4) return "bg-blue-400";
    if (correlation >= 0.2) return "bg-blue-300";
    return "bg-blue-200";
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header row with symbols */}
        <div className="flex">
          <div className="w-20" /> {/* Empty corner cell */}
          {assets.map((asset) => (
            <div
              key={asset.symbol}
              className="w-20 h-20 flex items-center justify-center font-medium text-gray-900 -rotate-45 transform origin-bottom-left"
            >
              {asset.symbol}
            </div>
          ))}
        </div>

        {/* Correlation grid */}
        <div className="mt-4">
          {assets.map((rowAsset, i) => (
            <div key={rowAsset.symbol} className="flex">
              {/* Row header */}
              <div className="w-20 h-20 flex items-center justify-end pr-4 font-medium text-gray-900">
                {rowAsset.symbol}
              </div>

              {/* Correlation cells */}
              {assets.map((colAsset, j) => {
                const correlation =
                  i === j ? 1 : rowAsset.correlations[colAsset.symbol] || 0;

                return (
                  <TooltipProvider
                    key={`${rowAsset.symbol}-${colAsset.symbol}`}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        <div
                          className={`w-20 h-20 m-px ${getCorrelationColor(
                            correlation,
                          )} transition-colors duration-200 hover:opacity-80`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {rowAsset.symbol} → {colAsset.symbol}
                        </p>
                        <p className="text-sm">
                          Correlation: {(correlation * 100).toFixed(1)}%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;
