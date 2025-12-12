import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { redis } from "@/lib/redis";
import { searchJobs, type ExperienceLevel } from "@/features/jobs";

const checkSchema = z.object({
  token: z.string().min(1),
});

type FilterDefinition = {
  id: string;
  name: string;
  query: string;
  city?: string;
  experience?: ExperienceLevel;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  createdAt: string;
};

type Notification = {
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

async function getUserFilters(token: string): Promise<FilterDefinition[]> {
  try {
    const filtersJson = await redis.get(`alerts:filters:${token}`);
    if (!filtersJson) return [];
    
    const filters = JSON.parse(filtersJson);
    return Array.isArray(filters) ? filters : [];
  } catch (error) {
    console.error("Failed to get user filters:", error);
    return [];
  }
}

async function getLastSeenJobs(filterId: string): Promise<string[]> {
  try {
    const lastSeenJson = await redis.get(`alerts:lastseen:${filterId}`);
    if (!lastSeenJson) return [];
    
    const lastSeen = JSON.parse(lastSeenJson);
    return Array.isArray(lastSeen) ? lastSeen : [];
  } catch (error) {
    console.error("Failed to get last seen jobs:", error);
    return [];
  }
}

async function updateLastSeenJobs(filterId: string, jobIds: string[]) {
  try {
    const serialized = JSON.stringify(jobIds.slice(0, 100)); // Keep only last 100 job IDs
    await redis.setex(`alerts:lastseen:${filterId}`, 7 * 24 * 60 * 60, serialized);
  } catch (error) {
    console.error("Failed to update last seen jobs:", error);
  }
}

async function searchJobsForFilter(filter: FilterDefinition) {
  try {
    const result = await searchJobs(
      {
        keyword: filter.query,
        city: filter.city,
        experience: filter.experience,
        remoteOnly: filter.remoteOnly,
        salaryMin: filter.salaryMin,
        salaryMax: filter.salaryMax,
      },
      { offset: 0, limit: 50 }
    );

    return result.items;
  } catch (error) {
    console.error(`Failed to search jobs for filter ${filter.id}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  
  if (!token) {
    return NextResponse.json(
      { error: "Missing token" },
      { status: 400 }
    );
  }

  try {
    const parsed = checkSchema.parse({ token });
    const filters = await getUserFilters(parsed.token);
    
    if (filters.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications: Notification[] = [];

    // Check each filter for new jobs
    for (const filter of filters) {
      try {
        const currentJobs = await searchJobsForFilter(filter);
        const currentJobIds = currentJobs.map(job => job.id);
        const lastSeenJobIds = await getLastSeenJobs(filter.id);
        
        // Find new job IDs (in current but not in last seen)
        const newJobIds = currentJobIds.filter(id => !lastSeenJobIds.includes(id));
        
        if (newJobIds.length > 0) {
          // Get full job details for new jobs
          const newJobs = currentJobs.filter(job => newJobIds.includes(job.id));
          
          notifications.push({
            id: `notification_${Date.now()}_${filter.id}`,
            filterId: filter.id,
            filterName: filter.name,
            jobs: newJobs.slice(0, 5).map(job => ({
              id: job.id,
              title: job.title,
              company: job.company,
              city: job.city,
              remote: job.remote,
            })),
            count: newJobIds.length,
            timestamp: new Date().toISOString(),
          });

          // Update last seen with all current job IDs
          await updateLastSeenJobs(filter.id, currentJobIds);
        } else {
          // Still update last seen to keep the list current
          await updateLastSeenJobs(filter.id, currentJobIds);
        }
      } catch (filterError) {
        console.error(`Error checking filter ${filter.id}:`, filterError);
        // Continue with other filters even if one fails
      }
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("GET /api/alerts/check error:", error);
    return NextResponse.json(
      { error: "Failed to check for new jobs" },
      { status: 500 }
    );
  }
}