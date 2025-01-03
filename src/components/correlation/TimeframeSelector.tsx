import React from "react";
import { Toggle } from "@/components/ui/toggle";

interface TimeframeSelectorProps {
  selectedTimeframe?: "24h" | "7d" | "30d";
  onTimeframeChange?: (timeframe: "24h" | "7d" | "30d") => void;
}

const TimeframeSelector = ({
  selectedTimeframe = "24h",
  onTimeframeChange = () => {},
}: TimeframeSelectorProps) => {
  return (
    <div className="w-[300px] h-[40px] bg-slate-900 p-2 rounded-lg flex gap-2">
      <Toggle
        pressed={selectedTimeframe === "24h"}
        onPressedChange={() => onTimeframeChange("24h")}
        aria-label="Toggle 24h timeframe"
        className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        24h
      </Toggle>
      <Toggle
        pressed={selectedTimeframe === "7d"}
        onPressedChange={() => onTimeframeChange("7d")}
        aria-label="Toggle 7d timeframe"
        className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        7d
      </Toggle>
      <Toggle
        pressed={selectedTimeframe === "30d"}
        onPressedChange={() => onTimeframeChange("30d")}
        aria-label="Toggle 30d timeframe"
        className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        30d
      </Toggle>
    </div>
  );
};

export default TimeframeSelector;
