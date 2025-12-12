# hh.ru API Integration

This document describes the integration with the official hh.ru (HeadHunter) job search API.

## Overview

The application uses the hh.ru public REST API to fetch real job vacancies. The integration is fully synced with the official OpenAPI specification available at `openapi.yml`.

## Architecture

### Files

- **`lib/hh.ts`** - Main API client implementing all hh.ru endpoints
- **`features/jobs/search.ts`** - Business logic layer for job search
- **`features/jobs/types.ts`** - TypeScript types matching hh.ru API response structure
- **`app/api/jobs/route.ts`** - Next.js API route exposing job search to frontend
- **`openapi.yml`** - Official hh.ru OpenAPI specification (reference only)

## API Endpoints

### Main Endpoint: GET /vacancies

Search for vacancies with advanced filtering.

**URL:** `https://api.hh.ru/vacancies`

**Required Headers:**
- `User-Agent` - Must be provided. Example: `hh-job-search/1.0`

**Query Parameters (from OpenAPI spec):**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `text` | string | Search keyword (supports hh.ru query language) | `frontend react` |
| `area` | string | Region/Area ID | `1` (Moscow), `2` (SPB) |
| `salary` | number | Desired salary (searches for similar ranges) | `100000` |
| `currency` | string | Salary currency | `RUR`, `USD`, `EUR` |
| `only_with_salary` | boolean | Show only vacancies with salary specified | `true` |
| `experience` | string | Required experience level | `noExperience`, `between1And3`, `between3And6`, `moreThan6` |
| `employment_form` | string | Employment type | `full`, `part`, `project`, `probation`, `temporary`, `volunteer`, `remote` |
| `work_format` | string | Work format | As per hh.ru dictionaries |
| `professional_role` | string | Professional role ID | As per hh.ru dictionaries |
| `page` | number | Page number (0-indexed) | `0` |
| `per_page` | number | Items per page (max 100) | `20` |
| `order_by` | string | Sort order | `publication_time`, `salary_desc`, `salary_asc` |
| `metro` | string | Metro station/line ID | As per hh.ru dictionaries |
| `date_from` | string | Search from date (ISO 8601) | `2024-01-01` |
| `date_to` | string | Search to date (ISO 8601) | `2024-12-31` |

**Response Structure:**

```typescript
{
  items: [
    {
      id: string;
      name: string;
      area: { id: string; name: string; url: string };
      salary: { 
        currency: string; 
        from: number | null; 
        to: number | null; 
        gross: boolean 
      } | null;
      address: {
        building: string | null;
        city: string;
        street: string | null;
        lat: number | null;
        lng: number | null;
        metro_stations: Array<{
          id: string;
          name: string;
          line_id: string;
          line_name: string;
          lat: number;
          lng: number;
        }> | null;
        raw: string;
        description: string | null;
      } | null;
      employer: {
        id: string;
        name: string;
        url: string;
        alternate_url: string;
        logo_urls: { [key: string]: string } | null;
        trusted: boolean;
        accredited_it_employer: boolean;
      };
      snippet: {
        requirement: string | null;
        responsibility: string | null;
      };
      published_at: string; // ISO 8601
      alternate_url: string;
      apply_alternate_url: string;
      url: string;
      // ... many other optional fields
    }
  ];
  found: number;
  page: number;
  pages: number;
  per_page: number;
}
```

## Area IDs (Regions)

Common Russian areas (from hh.ru API):

| Region | ID |
|--------|-----|
| Moscow (Москва) | `1` |
| Saint Petersburg (Санкт-Петербург) | `2` |
| Kazan (Казань) | `3` |
| Novosibirsk (Новосибирск) | `4` |
| Yekaterinburg (Екатеринбург) | `5` |
| Russia (all) | `113` |

## Experience Levels

The API uses hh.ru-specific experience level IDs:

| Level | ID | Meaning |
|-------|-----|---------|
| No Experience | `noExperience` | Entry level, no professional experience |
| 1-3 Years | `between1And3` | Junior level |
| 3-6 Years | `between3And6` | Middle level |
| 6+ Years | `moreThan6` | Senior level |

**Note:** The old UI experience levels (intern, junior, mid, senior, lead) are still supported in the frontend for backward compatibility but are mapped to hh.ru API values.

## Currencies

Supported currencies in hh.ru API:

- `RUR` - Russian Ruble (default)
- `USD` - US Dollar
- `EUR` - Euro
- `KZT` - Kazakhstan Tenge
- `BYN` - Belarusian Ruble
- `UAH` - Ukrainian Hryvnia
- `AZN` - Azerbaijani Manat
- `UZS` - Uzbek Som
- `GEL` - Georgian Lari

## Usage Examples

### Search Frontend Engineers in Moscow

```bash
curl -H "User-Agent: MyApp/1.0" \
  "https://api.hh.ru/vacancies?text=frontend&area=1&per_page=20&page=0"
```

### Search by Salary

```bash
curl -H "User-Agent: MyApp/1.0" \
  "https://api.hh.ru/vacancies?text=developer&salary=150000&only_with_salary=true&currency=USD&per_page=50"
```

### Search by Experience

```bash
curl -H "User-Agent: MyApp/1.0" \
  "https://api.hh.ru/vacancies?experience=between3And6&employment_form=full&per_page=30"
```

## Rate Limiting

- **Anonymous users:** 4 requests per second
- **Authorized users:** Higher limits (requires auth token)
- **No User-Agent:** Requests may be blocked

## Data Transformation

The `features/jobs/search.ts` module transforms hh.ru API responses to the application's internal `Job` type:

1. Maps hh.ru area IDs to city names
2. Determines if job is remote based on address information
3. Extracts professional roles as tags
4. Combines requirement and responsibility snippets as description
5. Handles null values gracefully

## Implementation Details

### searchVacancies() Function

```typescript
async function searchVacancies(params: HHSearchParams): Promise<HHSearchResponse>
```

- Constructs query string from parameters
- Calls hh.ru API with proper User-Agent header
- Handles errors with appropriate HTTP status codes
- Returns typed response object

### searchJobs() Function (Business Logic)

```typescript
async function searchJobs(
  query: JobSearchQuery,
  { offset, limit }: { offset: number; limit: number },
): Promise<JobSearchResult>
```

- Converts offset/limit to page-based pagination for hh.ru API
- Maps city names to area IDs
- Transforms hh.ru vacancies to application Job type
- Returns search results with pagination support

## Error Handling

The integration includes comprehensive error handling:

- **Network errors:** Logged to console, returns empty results
- **API errors:** Propagated with HTTP status codes
- **Data validation:** Graceful handling of missing/null fields
- **Type safety:** TypeScript ensures proper data structures

## Testing

The API integration can be tested with the included mock data fallback:

```bash
npm run dev
# Visit http://localhost:3000
# Search functionality works with real API data
```

## Related Documentation

- Official hh.ru API: https://api.hh.ru
- OpenAPI Spec: See `openapi.yml` in project root (35,000+ lines)
- Frontend Integration: See `components/search/search-page.tsx`
- API Route: See `app/api/jobs/route.ts`

## Troubleshooting

### "No vacancies found"
- Check area ID is correct
- Verify search text is realistic
- Check salary range parameters

### "Rate limit exceeded"
- Wait a few seconds before retrying
- Ensure User-Agent header is set
- Consider implementing retry logic with exponential backoff

### "Invalid experience level"
- Use official hh.ru values: `noExperience`, `between1And3`, `between3And6`, `moreThan6`
- Don't use old UI values like `intern`, `junior`, etc.

## Future Enhancements

- [ ] Add authentication support for higher rate limits
- [ ] Cache responses in Redis
- [ ] Implement batch requests for multiple searches
- [ ] Add advanced filtering UI for all OpenAPI parameters
- [ ] Support for dictionaries API (for dynamic filter options)
