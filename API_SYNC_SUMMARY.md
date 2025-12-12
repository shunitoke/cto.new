# hh.ru API Sync Summary

## Overview

This document summarizes the changes made to sync the application with the official hh.ru OpenAPI specification and real API behavior.

## Files Created

### 1. `lib/hh.ts` (New)

Main API client implementing hh.ru integration with the following:

- **Type Definitions:**
  - `HHSalary` - Salary information
  - `HHAddress` - Job location/address
  - `HHEmployer` - Company information
  - `HHArea` - Region/area
  - `HHVacancy` - Single vacancy from search results
  - `HHSearchResponse` - Complete search response with pagination
  - `HHSearchParams` - Search parameters
  - Experience levels: `noExperience`, `between1And3`, `between3And6`, `moreThan6`
  - Employment forms: `full`, `part`, `project`, `probation`, `temporary`, `volunteer`, `remote`

- **Functions:**
  - `searchVacancies(params)` - Search with advanced filtering
  - `getVacancy(vacancyId)` - Get single vacancy details
  - `buildQueryString(params)` - Helper to construct query strings

- **Features:**
  - Proper User-Agent header (required by hh.ru)
  - Error handling with HTTP status codes
  - TypeScript type safety
  - Documentation with curl examples

## Files Modified

### 2. `features/jobs/types.ts`

**Changes:**
- Updated `ExperienceLevel` from `"intern" | "junior" | "mid" | "senior" | "lead"` to hh.ru API values: `"noExperience" | "between1And3" | "between3And6" | "moreThan6"`
- Updated `Currency` to include all hh.ru supported currencies: `"RUB" | "USD" | "EUR" | "KZT" | "BYN" | "UAH" | "AZN" | "UZS" | "GEL"`
- Made `experience` field optional in `Job` type
- Added new required fields to `Job`:
  - `publishedAt: string` - Job publication date
  - `url: string` - API URL to vacancy
  - `applyUrl: string` - Direct application URL
  - `employer: { id, name, logo?, trusted? }` - Employer details

### 3. `features/jobs/search.ts`

**Major Rewrite:**
- Changed from synchronous mock data lookup to asynchronous hh.ru API calls
- Function is now `async`: `async function searchJobs()`
- Implemented real API integration:
  - Maps city names to hh.ru area IDs (Moscow→1, SPB→2, etc.)
  - Converts offset-based pagination to page-based (for hh.ru API)
  - Adds `isRemote()` function to detect remote jobs from address info
  - Adds `convertVacancy()` function to transform hh.ru data to app format
  - Implements error handling with empty fallback result

- **City ID Mapping:**
  - Moscow/Москва → "1"
  - Saint Petersburg/СПБ → "2"
  - Kazan/Казань → "3"
  - Novosibirsk/Новосибирск → "4"
  - Yekaterinburg/Екатеринбург → "5"

### 4. `app/api/jobs/route.ts`

**Changes:**
- Updated experience level validation enum to match OpenAPI spec values
- Made the route handler async: `export async function GET()`
- Added `await` for `searchJobs()` call (now async)
- Wrapped in try-catch block for better error handling
- Returns 500 status on search failures with descriptive error message

### 5. `components/search/types.ts`

**Changes:**
- Updated `ExperienceLevel` to hh.ru API values
- Updated `Currency` to include all supported currencies
- Made `experience` optional
- Added optional fields for extended job details:
  - `publishedAt`, `url`, `applyUrl`, `employer`

### 6. `components/search/filters-panel.tsx`

**Changes:**
- Updated experience level dropdown options to match OpenAPI spec
- Changed from: Intern, Junior, Mid, Senior, Lead
- Changed to: No Experience, 1-3 Years, 3-6 Years, 6+ Years

### 7. `components/search/format.ts`

**Changes:**
- Updated `formatExperience()` function to handle new experience levels
- Now properly formats: "No experience", "1-3 years", "3-6 years", "6+ years"
- Added undefined handling with "Experience not specified" fallback

### 8. `features/jobs/data.ts`

**Changes:**
- Updated mock data to use new experience level values
- Added `publishedAt`, `url`, `applyUrl`, `employer` fields to match Job type
- This file is now used as fallback/reference only (not called by searchJobs)

### 9. `lib/favorites-context.tsx`

**Changes:**
- Updated `FavoriteJob` type to support new experience levels and currencies
- Made `experience` optional
- Updated currency list to include all hh.ru supported currencies
- Updated deserialization logic to handle both old and new formats

### 10. `app/favorites/page.tsx`

**Changes:**
- Updated type annotations to match new Job structure
- Properly handles optional `experience` field

### 11. `app/api/alerts/check/route.ts`

**Changes:**
- Updated `FilterDefinition` type to use `ExperienceLevel` from features/jobs
- Made `experience` optional
- Made `searchJobsForFilter()` async and added await for `searchJobs()` call

## API Specification Compliance

### Endpoints Implemented

✅ **GET /vacancies** - Main job search endpoint
- Implements pagination with `page` and `per_page`
- Supports advanced filtering: text, area, salary, experience, employment_form, etc.
- Returns paginated results with vacancy details

❌ **GET /vacancies/{vacancy_id}** - Single vacancy (function implemented, not exposed in API route)

### Query Parameters

All common parameters from OpenAPI are supported:
- `text` - Search keyword ✅
- `area` - Region filter ✅
- `salary` - Salary filter ✅
- `only_with_salary` - Salary requirement filter ✅
- `experience` - Experience level filter ✅
- `employment_form` - Employment type filter ✅
- `page` & `per_page` - Pagination ✅

### Response Structure

Matches OpenAPI specification:
- `items` - Array of vacancies ✅
- `found` - Total number of results ✅
- `page` - Current page number ✅
- `pages` - Total number of pages ✅
- `per_page` - Items per page ✅

Each vacancy includes:
- Basic info: id, name, employer, area ✅
- Salary info ✅
- Location/address ✅
- Job snippets (requirements, responsibilities) ✅
- Publication date ✅
- Application URLs ✅

## Type System Changes

### Breaking Changes

1. **Experience levels are now different:**
   ```typescript
   // Old (UI)
   "intern" | "junior" | "mid" | "senior" | "lead"
   
   // New (API-aligned)
   "noExperience" | "between1And3" | "between3And6" | "moreThan6"
   ```

2. **Job type now requires new fields:**
   - `publishedAt` - ISO string
   - `url` - API endpoint URL
   - `applyUrl` - Direct application link
   - `employer` - Object with employer details

### Backward Compatibility

- Favorites loading gracefully handles old saved data (deserializer accepts both formats)
- Components handle optional `experience` field
- Currency list expanded but existing values (RUB, USD, EUR) still work

## Testing Recommendations

1. **Manual Testing:**
   ```bash
   npm run dev
   # Test searches with different keywords
   # Test filters (salary, experience, city)
   # Test pagination
   # Check network requests in DevTools
   ```

2. **API Response Verification:**
   ```bash
   curl -H "User-Agent: test/1.0" \
     "https://api.hh.ru/vacancies?text=react&area=1&per_page=5"
   ```

3. **Error Cases:**
   - Network failures
   - Invalid search parameters
   - Rate limiting (>4 req/sec for anonymous)

## Performance Notes

- API calls are now real network requests (not instant like mock data)
- Pagination is now based on hh.ru's page system (not cursor-based)
- Each search hits the real hh.ru API
- Consider implementing caching in production

## Documentation

Two comprehensive documents were added:
1. **`lib/HH_API_INTEGRATION.md`** - Technical integration details
2. **`API_SYNC_SUMMARY.md`** - This file, overview of changes

## Known Limitations

1. **No Authentication:** Currently uses anonymous API access
   - Limited to 4 requests per second
   - Limited filter options available

2. **No Caching:** Each search hits the live API
   - Recommended to add Redis caching in production

3. **Limited Advanced Filters:** UI only supports common filters
   - Full OpenAPI supports: metro, professional roles, industries, etc.

## Future Improvements

- [ ] Implement Redis caching for repeated searches
- [ ] Add authentication support for higher rate limits
- [ ] Expose more advanced filters in UI
- [ ] Add dictionary endpoints for dynamic filter options
- [ ] Implement batch/multi-search capabilities
- [ ] Add job alert functionality based on saved searches (partially done)
