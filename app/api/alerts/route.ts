import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuid } from "uuid";

import { redis } from "@/lib/redis";

const filterSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1).max(200),
  city: z.string().optional(),
  experience: z.enum(["intern", "junior", "mid", "senior", "lead"]).optional(),
  remoteOnly: z.boolean().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  token: z.string().min(1),
});

type FilterDefinition = {
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

async function saveUserFilters(token: string, filters: FilterDefinition[]) {
  try {
    await redis.setex(`alerts:filters:${token}`, 7 * 24 * 60 * 60, JSON.stringify(filters));
  } catch (error) {
    console.error("Failed to save user filters:", error);
    throw error;
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
    const filters = await getUserFilters(token);
    return NextResponse.json({ filters });
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = filterSchema.parse(body);

    const filter: FilterDefinition = {
      id: uuid(),
      name: parsed.name,
      query: parsed.query,
      city: parsed.city,
      experience: parsed.experience,
      remoteOnly: parsed.remoteOnly,
      salaryMin: parsed.salaryMin,
      salaryMax: parsed.salaryMax,
      createdAt: new Date().toISOString(),
    };

    const filters = await getUserFilters(parsed.token);
    
    // Check if filter with same name already exists
    const existingIndex = filters.findIndex(f => f.name === filter.name);
    if (existingIndex >= 0) {
      filters[existingIndex] = filter;
    } else {
      filters.unshift(filter);
    }

    await saveUserFilters(parsed.token, filters);

    return NextResponse.json({ filter });
  } catch (error) {
    console.error("POST /api/alerts error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid filter data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save filter" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { filterId, token } = z.object({
      filterId: z.string().uuid(),
      token: z.string().min(1),
    }).parse(body);

    const filters = await getUserFilters(token);
    const filteredFilters = filters.filter(f => f.id !== filterId);
    
    await saveUserFilters(token, filteredFilters);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/alerts error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete filter" },
      { status: 500 }
    );
  }
}