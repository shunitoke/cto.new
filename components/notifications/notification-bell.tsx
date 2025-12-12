"use client";

import * as React from "react";
import { Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/lib/alerts-context";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, clearNotifications, checkForNewJobs, isPolling } = useAlerts();
  const [open, setOpen] = React.useState(false);

  const recentNotifications = notifications.slice(0, 10);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const handleRefresh = () => {
    void checkForNewJobs();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isPolling}
            >
              {isPolling ? "Checking..." : "Refresh"}
            </Button>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Clear all
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b last:border-b-0 ${
                    notification.id.startsWith("read_") ? "bg-muted/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {notification.filterName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.count} new job{notification.count !== 1 ? "s" : ""} found
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {notification.jobs.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {notification.jobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="text-xs bg-muted/50 rounded p-2">
                          <div className="font-medium">{job.title}</div>
                          <div className="text-muted-foreground">
                            {job.company} • {job.remote ? "Remote" : job.city}
                          </div>
                        </div>
                      ))}
                      {notification.jobs.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{notification.jobs.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}