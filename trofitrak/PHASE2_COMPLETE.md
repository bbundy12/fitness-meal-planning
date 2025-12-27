# Phase 2 Complete: Meal Planner Persistence ✅

**Date:** December 26, 2024

## Overview

Phase 2 adds full database persistence for the Meal Planner with per-user, per-week storage. The UI maintains the same drag/drop experience with optimistic updates for instant feedback.

## What Was Built

### 1. Database Schema Extensions

Added to `prisma/schema.prisma`:

- **MealSlot Enum**: `BREAKFAST`, `SNACK1`, `LUNCH`, `SNACK2`, `DINNER`, `SNACK3`
- **MealPlanWeek Model**: Stores weekly meal plans per user
  - Unique constraint on `userId + weekStartDate`
  - Cascade deletes to items when week is deleted
- **MealPlanItem Model**: Individual meal slots
  - Unique constraint on `weekId + dayOfWeek + slot` (prevents duplicates)
  - Cascade delete with week, restrict delete with recipe
  - `dayOfWeek`: 0-6 (Monday = 0, Sunday = 6)
  - `servingsMult`: Multiplier for recipe servings

### 2. Week Utilities (`src/lib/week.ts`)

Centralized date normalization functions:

- `getWeekStartDate(date)`: Returns Monday at UTC midnight for any date
- `toISODateOnly(date)`: Converts Date to YYYY-MM-DD string
- `dayIndexFromName(dayName)`: Converts day names to 0-6 index
- `getCurrentWeekStart()`: Gets this week's Monday as YYYY-MM-DD

**Why UTC midnight?** Ensures consistent week keys across timezones. All users see the same "week of 2024-12-23" regardless of local timezone.

### 3. tRPC Meal Plan Router (`src/server/trpc/routers/mealPlan.ts`)

Five procedures for meal plan management:

#### `getWeek`

- **Input**: `weekStartDate` (YYYY-MM-DD)
- **Output**: Week with items + full recipe data, or empty structure if doesn't exist
- **Used by**: MealPlanner component to load current week

#### `upsertItem`

- **Input**: `weekStartDate`, `dayOfWeek` (0-6), `slot` (enum), `recipeId`, `servingsMult`
- **Logic**: Creates week if needed, then upserts item by unique constraint
- **Used by**: Drag/drop handler and copy operations

#### `removeItem`

- **Input**: `weekStartDate`, `dayOfWeek`, `slot`
- **Logic**: Deletes item if exists, silent if not found
- **Used by**: Remove meal button

#### `resetWeek`

- **Input**: `weekStartDate`
- **Logic**: Deletes entire week (cascades to all items)
- **Used by**: Reset week button

#### `copyDayToAll`

- **Input**: `weekStartDate`, `sourceDayOfWeek`
- **Logic**: Copies all meals from source day to other 6 days
- **Used by**: Copy Monday to All button

### 4. MealPlanner Component Refactor

**Major Changes:**

- Replaced all local state with tRPC queries (`trpc.mealPlan.getWeek`)
- Added optimistic updates for instant UI feedback
- Maintained exact same UI/UX (drag/drop, repeat daily, copy Monday, reset week)

**Optimistic Updates:**

- When dragging a recipe, UI updates immediately before server response
- Uses `utils.mealPlan.getWeek.setData()` to update React Query cache
- Server response overwrites optimistic data on success
- Mutations invalidate query on success/error for consistency

**Repeat Daily Mode:**

- Client-side loop through all days when toggled on
- Each day gets a separate mutation call
- Optimistic update for each day creates smooth experience

**Copy Monday:**

- Calls backend `copyDayToAll` mutation
- Server handles all 6 copy operations in transaction
- Single optimistic update refreshes entire week

## Database Migration Instructions

### Prerequisites

1. **PostgreSQL Database** - Choose one:
   - **Neon** (recommended): Free tier at [neon.tech](https://neon.tech)
   - **Local Postgres**: Install via Homebrew or Docker

### Setup Steps

1. **Get Database URL**

   For Neon:

   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

   For local:

   ```
   postgresql://postgres:password@localhost:5432/trofitrak
   ```

2. **Add to Environment**

   Create/update `trofitrak/.env.local`:

   ```bash
   DATABASE_URL="your_connection_string_here"
   ```

3. **Run Migration**

   ```bash
   cd trofitrak
   pnpm prisma:migrate --name meal_plans
   ```

   This creates:

   - `MealPlanWeek` table
   - `MealPlanItem` table
   - `MealSlot` enum type
   - All indexes and constraints

4. **Verify Schema**

   ```bash
   pnpm prisma:studio
   ```

   Opens Prisma Studio to browse tables.

## Testing Sequence

### 1. Basic Persistence

```bash
pnpm dev
```

1. Navigate to Meal Planner
2. Drag a recipe to Monday Breakfast
3. Refresh page → meal should still be there ✅

### 2. Optimistic Updates

1. Open Network tab (throttle to "Slow 3G")
2. Drag recipe to Tuesday Lunch
3. UI updates instantly (optimistic)
4. Server response arrives later
5. UI stays correct ✅

### 3. Repeat Daily Mode

1. Toggle "Repeat Daily" on
2. Drag recipe to Wednesday Dinner
3. Recipe appears in ALL days' Dinner slots ✅
4. Click remove on any day → removes from ALL days ✅

### 4. Copy Monday

1. Add 3 different recipes to Monday
2. Click "Copy Monday to All"
3. Confirmation dialog appears
4. Accept → all days now match Monday ✅

### 5. Reset Week

1. Fill several meal slots
2. Click "Reset Week"
3. Confirmation dialog appears
4. Accept → entire week clears ✅

### 6. Week Navigation

1. Click "Previous Week" button
2. Empty week loads (different weekStartDate)
3. Add a meal
4. Click "Next Week" back to current
5. Original meals still there ✅

## Architecture Decisions

### Week as Primary Key

Each week is stored as a separate `MealPlanWeek` record with `weekStartDate` as the unique identifier (per user). This allows:

- Easy week navigation (just change the date)
- Efficient queries (index on `userId + weekStartDate`)
- Clean deletion (cascade removes all items)
- Historical tracking (can query old weeks)

### Monday = Day 0

Days are stored as integers 0-6 (Monday through Sunday) matching JavaScript's date conventions when week starts on Monday. The `dayIndexFromName()` helper converts from UI day names to database indexes.

### Unique Constraint on Slots

`MealPlanItem` has unique constraint on `(weekId, dayOfWeek, slot)` ensuring you can't have two recipes in the same meal slot. The `upsert` operation replaces existing meals when dragging a new recipe.

### Optimistic Updates

Drag/drop needs to feel instant. Optimistic updates modify the React Query cache before the server responds. If the mutation fails, React Query automatically rolls back to the previous state.

### Cascade vs Restrict

- **Week → Items**: Cascade delete (removing a week deletes all its meals)
- **Recipe → Items**: Restrict delete (can't delete recipe used in meal plans)

This prevents orphaned data while protecting against accidental recipe deletion.

## API Examples

### Load Current Week

```typescript
const { data: weekData } = trpc.mealPlan.getWeek.useQuery({
  weekStartDate: "2024-12-23", // Monday
});
```

### Add Meal with Optimistic Update

```typescript
const upsertMutation = trpc.mealPlan.upsertItem.useMutation({
  onMutate: async (variables) => {
    // Cancel outgoing queries
    await utils.mealPlan.getWeek.cancel();

    // Snapshot current data
    const prev = utils.mealPlan.getWeek.getData({ weekStartDate });

    // Optimistically update
    utils.mealPlan.getWeek.setData({ weekStartDate }, (old) => {
      // ... update logic
      return updated;
    });

    return { prev };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    utils.mealPlan.getWeek.setData({ weekStartDate }, context?.prev);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    utils.mealPlan.getWeek.invalidate({ weekStartDate });
  },
});

upsertMutation.mutate({
  weekStartDate: "2024-12-23",
  dayOfWeek: 0, // Monday
  slot: "BREAKFAST",
  recipeId: "recipe123",
  servingsMult: 1,
});
```

## Known Behaviors

### Multi-Day Operations

When "Repeat Daily" is enabled:

- Drag/drop creates 7 separate mutations (one per day)
- Each mutation has its own optimistic update
- All mutations fire in parallel for speed
- If one fails, others may still succeed

Alternative approach would be a single `upsertMultipleDays` mutation, but the current design keeps the API simpler and allows per-day error handling.

### Week Boundaries

Weeks always start on Monday at UTC midnight. If a user in timezone GMT+10 loads the app on Sunday at 11 PM, they'll see the current week (which includes that Monday-starting week). This is intentional for consistency.

### Servings Multiplier

The `servingsMult` field is currently always `1` from the UI, but the schema supports fractional servings (e.g., 0.5 for half recipe, 2 for double). Future UI enhancement could add serving size adjustment.

## Code Quality ✅

All checks passing:

```bash
pnpm typecheck  # No TypeScript errors
pnpm lint       # No Biome warnings
pnpm format     # Applied formatting
```

## Files Modified/Created

### Created

- `src/lib/week.ts` - Week date utilities
- `src/server/trpc/routers/mealPlan.ts` - Meal plan procedures
- `prisma/prisma.config.ts` - Prisma 7 migration config
- `PHASE2_COMPLETE.md` - This document

### Modified

- `prisma/schema.prisma` - Added MealSlot enum, MealPlanWeek, MealPlanItem
- `src/server/trpc/root.ts` - Added mealPlan router
- `src/components/MealPlanner.tsx` - Complete refactor for tRPC + persistence

## Next Steps

Phase 2 is **code complete**. When you're ready:

1. Set up PostgreSQL database (Neon or local)
2. Run migration: `pnpm prisma:migrate --name meal_plans`
3. Test persistence using the testing sequence above
4. Verify optimistic updates work smoothly
5. Ready for Phase 3 (Shopping List persistence) or other features

## Questions?

- **Why UTC?** Consistent week keys across all timezones
- **Why Monday start?** Matches common weekly planning habits (Monday = day 0)
- **Why separate week records?** Easier navigation, historical tracking, clean deletion
- **Why optimistic updates?** Drag/drop must feel instant for good UX
- **Why cascade delete?** Week deletion should remove all its meals
- **Why restrict recipe delete?** Prevent breaking meal plans

---

**Status**: ✅ Ready for database migration and testing
**Next Phase**: Shopping List Persistence (Phase 3)
