"use client";

import * as React from "react";
import { fetchJson } from "@/lib/http";

export type FilterDefinition = {
  id: string;
  name: string;
  query: string;
  city?: string;
  experience?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
};

export type Notification = {
  id: string;
  filterId: string;
  filterName: string;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    city: string;
    remote: boolean;
  }>;
  count: number;
  timestamp: string;
};

export type AlertsContextType = {
  filters: FilterDefinition[];
  notifications: Notification[];
  unreadCount: number;
  addFilter: (filter: Omit<FilterDefinition, "id" | "createdAt">) => Promise<void>;
  removeFilter: (filterId: string) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  checkForNewJobs: () => Promise<void>;
  isPolling: boolean;
};

export const AlertsContext = React.createContext<AlertsContextType | null>(null);

function generateToken(): string {
  if (typeof window === "undefined") return "";
  const key = "job-alerts-token";
  let token = localStorage.getItem(key);
  
  if (!token) {
    token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, token);
  }
  
  return token;
}

function getAlertsToken(): string {
  return generateToken();
}

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<FilterDefinition[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isPolling, setIsPolling] = React.useState(false);

  const unreadCount = React.useMemo(
    () => notifications.filter(n => !n.id.startsWith("read_")).length,
    [notifications]
  );

  // Load filters from API
  const loadFilters = React.useCallback(async () => {
    try {
      const token = getAlertsToken();
      const response = await fetchJson<{ filters: FilterDefinition[] }>(
        `/api/alerts?token=${encodeURIComponent(token)}`
      );
      setFilters(response.filters || []);
    } catch (error) {
      console.error("Failed to load alerts filters:", error);
    }
  }, []);

  // Save filter to API
  const addFilter = React.useCallback(async (filterData: Omit<FilterDefinition, "id" | "createdAt">) => {
    try {
      const token = getAlertsToken();
      const response = await fetchJson<{ filter: FilterDefinition }>("/api/alerts", {
        method: "POST",
        body: JSON.stringify({
          ...filterData,
          token,
        }),
      });

      setFilters(prev => {
        const exists = prev.some(f => f.id === response.filter.id);
        return exists ? prev : [response.filter, ...prev];
      });
    } catch (error) {
      console.error("Failed to save alert filter:", error);
      throw error;
    }
  }, []);

  // Remove filter from API
  const removeFilter = React.useCallback(async (filterId: string) => {
    try {
      const token = getAlertsToken();
      await fetchJson("/api/alerts", {
        method: "DELETE",
        body: JSON.stringify({ filterId, token }),
      });

      setFilters(prev => prev.filter(f => f.id !== filterId));
    } catch (error) {
      console.error("Failed to remove alert filter:", error);
      throw error;
    }
  }, []);

  // Check for new jobs
  const checkForNewJobs = React.useCallback(async () => {
    if (isPolling) return;

    setIsPolling(true);
    try {
      const token = getAlertsToken();
      const response = await fetchJson<{ 
        notifications: Notification[] 
      }>(`/api/alerts/check?token=${encodeURIComponent(token)}`);
      
      if (response.notifications && response.notifications.length > 0) {
        setNotifications(prev => [...response.notifications, ...prev]);
      }
    } catch (error) {
      console.error("Failed to check for new jobs:", error);
    } finally {
      setIsPolling(false);
    }
  }, [isPolling]);

  // Mark notification as read
  const markAsRead = React.useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, id: `read_${n.id}` } : n)
    );
  }, []);

  // Clear all notifications
  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  // Load filters on mount
  React.useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  // Set up polling interval
  React.useEffect(() => {
    if (filters.length === 0) return;

    // Check immediately
    void checkForNewJobs();

    // Set up polling every 5 minutes
    const interval = setInterval(() => {
      void checkForNewJobs();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [filters, checkForNewJobs]);

  const value = React.useMemo(
    () => ({
      filters,
      notifications,
      unreadCount,
      addFilter,
      removeFilter,
      markAsRead,
      clearNotifications,
      checkForNewJobs,
      isPolling,
    }),
    [
      filters,
      notifications,
      unreadCount,
      addFilter,
      removeFilter,
      markAsRead,
      clearNotifications,
      checkForNewJobs,
      isPolling,
    ],
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

export function useAlerts() {
  const context = React.useContext(AlertsContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertsProvider");
  }
  return context;
}