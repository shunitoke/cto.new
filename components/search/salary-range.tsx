"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SalaryRangeProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function SalaryRange({
  min,
  max,
  step = 5000,
  value,
  onValueChange,
  className,
}: SalaryRangeProps) {
  const [minValue, maxValue] = value;

  const fmt = React.useMemo(() => new Intl.NumberFormat("ru-RU"), []);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{fmt.format(minValue)}</span>
        <span className="text-muted-foreground">{fmt.format(maxValue)}</span>
      </div>

      <div className="relative h-8">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={(e) => {
            const nextMin = clamp(Number(e.target.value), min, max);
            onValueChange([Math.min(nextMin, maxValue), maxValue]);
          }}
          className="absolute inset-0 w-full accent-primary"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={(e) => {
            const nextMax = clamp(Number(e.target.value), min, max);
            onValueChange([minValue, Math.max(nextMax, minValue)]);
          }}
          className="absolute inset-0 w-full accent-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Min</span>
          <input
            type="number"
            inputMode="numeric"
            value={minValue}
            min={min}
            max={maxValue}
            step={step}
            onChange={(e) => {
              const nextMin = clamp(Number(e.target.value || 0), min, max);
              onValueChange([Math.min(nextMin, maxValue), maxValue]);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Max</span>
          <input
            type="number"
            inputMode="numeric"
            value={maxValue}
            min={minValue}
            max={max}
            step={step}
            onChange={(e) => {
              const nextMax = clamp(Number(e.target.value || 0), min, max);
              onValueChange([minValue, Math.max(nextMax, minValue)]);
            }}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
