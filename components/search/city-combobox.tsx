"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CityComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
};

export function CityCombobox({
  value,
  onChange,
  options,
  placeholder = "City",
  className,
}: CityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const blurTimeoutRef = React.useRef<number | null>(null);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options.slice(0, 8);

    return options
      .filter((city) => city.toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, value]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (blurTimeoutRef.current) window.clearTimeout(blurTimeoutRef.current);
            blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 120);
          }}
          className="pr-9"
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>

      {open && filtered.length > 0 ? (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow">
          {filtered.map((city) => (
            <button
              key={city}
              type="button"
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent",
                city === value && "bg-accent",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(city);
                setOpen(false);
              }}
            >
              {city}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
