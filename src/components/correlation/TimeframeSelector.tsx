import React from "react";
import { Button } from "@/components/ui/button";

interface TimeframeSelectorProps {
  selectedTimeframe?: "24h" | "7d" | "30d";
  onTimeframeChange?: (timeframe: "24h" | "7d" | "30d") => void;
}

const TimeframeSelector = ({
  selectedTimeframe = "24h",
  onTimeframeChange = () => {},
}: TimeframeSelectorProps) => {
  return (
    <div className="flex gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
      <Button
        variant={selectedTimeframe === "24h" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeframeChange("24h")}
        className="text-sm px-3"
      >
        24h
      </Button>
      <Button
        variant={selectedTimeframe === "7d" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeframeChange("7d")}
        className="text-sm px-3"
      >
        7d
      </Button>
      <Button
        variant={selectedTimeframe === "30d" ? "default" : "ghost"}
        size="sm"
        onClick={() => onTimeframeChange("30d")}
        className="text-sm px-3"
      >
        30d
      </Button>
    </div>
  );
};

export default TimeframeSelector;
