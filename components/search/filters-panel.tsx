"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SalaryRange } from "@/components/search/salary-range";
import type { ExperienceLevel } from "@/components/search/types";
import { CityCombobox } from "@/components/search/city-combobox";

export type FiltersState = {
  keyword: string;
  city: string;
  salary: [number, number];
  experience: ExperienceLevel | "any";
  remoteOnly: boolean;
};

export function FiltersPanel({
  value,
  onChange,
  facets,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  facets: { cities: string[]; salaryMin: number; salaryMax: number };
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="keyword">Keyword</Label>
        <Input
          id="keyword"
          value={value.keyword}
          placeholder="React, Node, analyst..."
          onChange={(e) => onChange({ ...value, keyword: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <CityCombobox
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          options={facets.cities}
          placeholder="Start typing..."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Salary range</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...value, salary: [facets.salaryMin, facets.salaryMax] })}
          >
            Reset
          </Button>
        </div>

        <SalaryRange
          min={facets.salaryMin}
          max={facets.salaryMax}
          value={value.salary}
          onValueChange={(salary) => onChange({ ...value, salary })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Experience</Label>
        <select
          id="experience"
          value={value.experience}
          onChange={(e) => onChange({ ...value, experience: e.target.value as FiltersState["experience"] })}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
        >
          <option value="any">Any</option>
          <option value="noExperience">No Experience</option>
          <option value="between1And3">1-3 Years</option>
          <option value="between3And6">3-6 Years</option>
          <option value="moreThan6">6+ Years</option>
        </select>
      </div>

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Remote only</div>
          <div className="text-xs text-muted-foreground">Show remote-first positions</div>
        </div>
        <Switch
          checked={value.remoteOnly}
          onCheckedChange={(remoteOnly) => onChange({ ...value, remoteOnly })}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          onChange({
            keyword: "",
            city: "",
            salary: [facets.salaryMin, facets.salaryMax],
            experience: "any",
            remoteOnly: false,
          })
        }
      >
        Clear filters
      </Button>
    </div>
  );
}
