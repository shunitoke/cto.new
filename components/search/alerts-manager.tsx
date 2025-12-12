"use client";

import * as React from "react";
import { Bell, BellPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlerts } from "@/lib/alerts-context";
import { useToast } from "@/lib/use-toast";
import type { FiltersState } from "@/components/search/filters-panel";

export function AlertsManager({ filters, facets }: { 
  filters: FiltersState;
  facets: { cities: string[]; salaryMin: number; salaryMax: number };
}) {
  const { filters: existingFilters, addFilter, removeFilter } = useAlerts();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [alertName, setAlertName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const hasActiveFilters = React.useMemo(() => {
    return (
      filters.keyword.trim() !== "" ||
      filters.city.trim() !== "" ||
      filters.experience !== "any" ||
      filters.remoteOnly ||
      filters.salary[0] > facets.salaryMin ||
      filters.salary[1] < facets.salaryMax
    );
  }, [filters, facets]);

  const handleSaveAlert = async () => {
    if (!hasActiveFilters) {
      toast({
        title: "No filters to save",
        description: "Please set some filters before creating an alert.",
      });
      return;
    }

    if (!alertName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your alert.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addFilter({
        name: alertName.trim(),
        query: filters.keyword.trim(),
        city: filters.city.trim() || undefined,
        experience: filters.experience !== "any" ? filters.experience : undefined,
        remoteOnly: filters.remoteOnly || undefined,
        salaryMin: filters.salary[0] > facets.salaryMin ? filters.salary[0] : undefined,
        salaryMax: filters.salary[1] < facets.salaryMax ? filters.salary[1] : undefined,
      });

      toast({
        title: "Alert saved",
        description: `You'll be notified about new jobs matching "${alertName}".`,
      });

      setAlertName("");
      setIsOpen(false);
    } catch {
      toast({
        title: "Failed to save alert",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAlert = async (filterId: string, filterName: string) => {
    try {
      await removeFilter(filterId);
      toast({
        title: "Alert removed",
        description: `Alert "${filterName}" has been deleted.`,
      });
    } catch {
      toast({
        title: "Failed to remove alert",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-sm font-medium">Job Alerts</div>
          <div className="text-xs text-muted-foreground">
            Get notified when new jobs match your criteria
          </div>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!hasActiveFilters}>
              <BellPlus className="h-4 w-4 mr-1" />
              Save Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Job Alert</DialogTitle>
              <DialogDescription>
                Save your current filters as an alert. You&apos;ll be notified when new jobs match these criteria.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="alert-name">Alert Name</Label>
                <Input
                  id="alert-name"
                  placeholder="e.g., React jobs in Moscow"
                  value={alertName}
                  onChange={(e) => setAlertName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                <strong>Current filters:</strong>
                <ul className="mt-1 space-y-1">
                  {filters.keyword && <li>• Keyword: &quot;{filters.keyword}&quot;</li>}
                  {filters.city && <li>• City: {filters.city}</li>}
                  {filters.experience !== "any" && <li>• Experience: {filters.experience}</li>}
                  {filters.remoteOnly && <li>• Remote only</li>}
                  {(filters.salary[0] > facets.salaryMin || filters.salary[1] < facets.salaryMax) && (
                    <li>• Salary: {filters.salary[0].toLocaleString()} - {filters.salary[1].toLocaleString()}</li>
                  )}
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSaveAlert} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Alert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {existingFilters.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Active Alerts</div>
          <div className="space-y-2">
            {existingFilters.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{filter.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {filter.query && `Keyword: "${filter.query}"`}
                    {filter.city && ` • City: ${filter.city}`}
                    {filter.experience && ` • Experience: ${filter.experience}`}
                    {filter.remoteOnly && ` • Remote only`}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveAlert(filter.id, filter.name)}
                  className="h-6 w-6 p-0"
                >
                  <Bell className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}