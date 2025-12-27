# Phase 3 Complete: Shopping List with Persistence ✅

**Date:** December 26, 2024

## Overview

Phase 3 adds a fully functional shopping list that automatically generates from the meal plan, persists checked/unchecked state per week, and supports custom user-added items. The list stays synchronized with meal plan changes while preserving user interactions.

## What Was Built

### 1. Database Schema Extensions

Added to `prisma/schema.prisma`:

- **ShoppingListState Model**: Stores per-user, per-week shopping list state
  - Unique constraint on `userId + weekStartDate`
  - Cascade delete to items when state is deleted
  - One state record per user per week

- **ShoppingListItemState Model**: Individual item states (checked + custom items)
  - Links to either a real `Ingredient` (generated items) OR stores `customName` (custom items)
  - Unique constraint on `stateId + ingredientId` (prevents duplicate saved states for same ingredient)
  - `checked`: Boolean for checked/unchecked state
  - `quantity` + `unit`: Optional, used for custom items
  - Cascade delete with state, set null on ingredient delete

### 2. Computation Strategy

**Key Design Decision:**
- Generated items are computed fresh each time from the meal plan
- Only state (checked + custom items) is persisted
- This ensures the list is always up-to-date when recipes change

**Benefits:**
- No complex sync logic needed
- Always reflects current meal plan
- Still supports persistent checkoffs and custom additions

### 3. Shopping List Router (`src/server/trpc/routers/shopping.ts`)

Six procedures for complete shopping list management:

#### `getWeekList`
- **Input**: `weekStartDate` (YYYY-MM-DD)
- **Output**: `{ weekStartDate, generated[], custom[] }`
- **Logic**:
  1. Get/create ShoppingListState for user+week
  2. Compute generated items from MealPlanWeek → MealPlanItem → Recipe → RecipeItem → Ingredient
  3. Accumulate quantities by ingredient ID and unit
  4. Merge with saved checked state from ShoppingListItemState
  5. Return generated items (with checked status) + custom items
- **Used by**: ShoppingList component to display full list

#### `toggleChecked`
- **Input**: `weekStartDate`, `ingredientId` OR `customItemId`
- **Logic**: Flips checked boolean for specified item (upserts if doesn't exist)
- **Used by**: Checkbox clicks

#### `setChecked`
- **Input**: `weekStartDate`, `ingredientId` OR `customItemId`, `checked` boolean
- **Logic**: Sets checked to specific value (upserts for generated items)
- **Used by**: Batch operations (not currently used in UI but available)

#### `addCustomItem`
- **Input**: `weekStartDate`, `name`, optional `quantity`, optional `unit`
- **Output**: Created custom item
- **Logic**: Creates ShoppingListItemState with customName (no ingredientId)
- **Used by**: Add custom item form

#### `removeCustomItem`
- **Input**: `customItemId`
- **Logic**: Deletes custom item by ID
- **Used by**: Remove button on custom items

#### `clearChecks`
- **Input**: `weekStartDate`
- **Logic**: Sets all items in week to unchecked (updateMany)
- **Used by**: Clear Checks button

### 4. Quantity Handling (v1)

**Simple Approach:**
- Multiple amounts with different units are kept separate
- Display format: "2 lbs + 500 g" (joined with " + ")
- No unit conversion in v1

**Example:**
If meal plan has:
- Recipe A: 1 lb chicken
- Recipe B: 500 g chicken

Shopping list shows: **Chicken Breast** - `1 lb + 500 g`

**Future Enhancement (Phase 3b):**
- Add unit conversion library
- Normalize to common units
- Smart aggregation (1 lb + 500 g → 1.1 lbs OR 952 g)

### 5. ShoppingList Component Refactor

**Major Changes:**
- Removed all mock/hard-coded data
- Integrated with `trpc.shopping.getWeekList` query
- Added optimistic updates for instant UI feedback
- Two sections: "From Your Meal Plan" (generated) and "Custom Items"
- Add custom item form with name, quantity (optional), unit (optional)

**Key Features:**
- **Auto-refresh**: When meal plan changes, shopping list reflects it on next load
- **Persistent checks**: Checked items stay checked across page refreshes
- **Custom items**: Users can add items not in meal plan (e.g., "Paper Towels")
- **Remove custom items**: X button on each custom item
- **Clear checks**: Button to uncheck all items at once
- **Export CSV**: Downloads shopping list as CSV with categories
- **Print**: Print-optimized layout

**Optimistic Updates:**
- Toggle checked: Updates immediately, rolls back on error
- Remove custom item: Removes from UI immediately, rolls back on error
- Add custom item: Waits for server response (shows in list after created)

**Empty States:**
- No generated items: "No items yet. Add recipes to your meal plan..."
- No custom items: "No custom items yet. Add items above..."

## Database Migration Instructions

### Migration Name
```bash
pnpm prisma:migrate --name shopping_list_state
```

This creates:
- `ShoppingListState` table
- `ShoppingListItemState` table
- Foreign key constraints and indexes
- Unique constraints

### Verify Migration
```bash
pnpm prisma:studio
```

Check for:
- ShoppingListState table (id, userId, weekStartDate, createdAt, updatedAt)
- ShoppingListItemState table (id, stateId, ingredientId, customName, checked, quantity, unit, createdAt, updatedAt)
- Proper relations and constraints

## Testing Sequence

### 1. Generated List from Meal Plan

**Setup:**
1. Add 2-3 recipes to meal plan (e.g., Monday Breakfast, Tuesday Lunch)
2. Navigate to Shopping List

**Expected:**
- List shows all ingredients from those recipes
- Quantities are accumulated (e.g., if both recipes use chicken, shows combined amount)
- Items are unchecked by default
- Sorted alphabetically

### 2. Checked State Persistence

**Steps:**
1. Check 2-3 items in shopping list
2. Refresh page (hard reload)

**Expected:**
- Checked items remain checked ✅
- Unchecked items remain unchecked ✅

### 3. Custom Items

**Add Custom Item:**
1. Enter name: "Paper Towels"
2. Enter quantity: 2
3. Enter unit: "rolls"
4. Click Add (+)

**Expected:**
- Item appears in "Custom Items" section ✅
- Shows "2 rolls" ✅
- Unchecked by default ✅

**Persistence:**
1. Check the custom item
2. Refresh page

**Expected:**
- Custom item still there ✅
- Still checked ✅

**Remove:**
1. Click X button on custom item

**Expected:**
- Item removed immediately ✅
- Does not reappear after refresh ✅

### 4. Auto-Update on Meal Plan Change

**Steps:**
1. Note current shopping list items
2. Go to Meal Planner
3. Add a new recipe to meal plan
4. Return to Shopping List
5. Click "Refresh" button

**Expected:**
- New ingredients from added recipe appear ✅
- Previous checked states preserved ✅
- Sorted correctly ✅

### 5. Multiple Units Handling

**Setup:**
Create two recipes:
- Recipe A: 1 lb chicken breast
- Recipe B: 500 g chicken breast

Add both to meal plan.

**Expected:**
Shopping list shows:
- **Chicken Breast** - `1 lb + 500 g` ✅

### 6. Clear Checks

**Steps:**
1. Check 3-4 items
2. Click "Clear Checks" button

**Expected:**
- All items become unchecked immediately ✅
- Custom items also unchecked ✅

### 7. Export CSV

**Steps:**
1. Check some items
2. Add a custom item
3. Click "Export CSV"

**Expected:**
- Downloads file: `shopping-list-2024-12-23.csv` ✅
- Contains columns: Category, Item, Quantity, Checked ✅
- Generated items in "Generated" category ✅
- Custom items in "Custom" category ✅

### 8. Print List

**Steps:**
1. Click "Print List"

**Expected:**
- Print dialog opens ✅
- Layout is printer-friendly (compact) ✅
- Only shopping list content visible (no nav/buttons) ✅

## Architecture Decisions

### Computed vs Stored

**Computed (Every Query):**
- Generated items from meal plan
- Ingredient names and quantities

**Stored (Database):**
- Checked/unchecked state per ingredient
- Custom items (name, quantity, unit, checked)

**Why This Split:**
- Meal plans change frequently (add/remove recipes)
- Computing ensures list is always current
- Only user actions (checks, custom items) need persistence
- Avoids complex "sync" operations

### Unique Constraints

**State Level:**
- `(userId, weekStartDate)` unique on ShoppingListState
- Ensures one state record per user per week

**Item Level:**
- `(stateId, ingredientId)` unique on ShoppingListItemState
- Prevents duplicate saved states for same ingredient
- Custom items (null ingredientId) can have multiple rows

### Quantity Aggregation

**Current (v1):**
```typescript
amounts: [
  { quantity: 1, unit: "lb" },
  { quantity: 500, unit: "g" }
]
```

Display: "1 lb + 500 g"

**Why No Conversion:**
- Avoids incorrect conversions (volume vs weight)
- Simple and predictable
- Users can mentally convert if needed
- Can add conversion in Phase 3b without breaking changes

### Week Boundaries

Uses same `getWeekStartDate` helper as Phase 2:
- Monday = week start
- UTC midnight normalization
- Consistent keys across meal plan and shopping list

## API Examples

### Load Shopping List

```typescript
const { data } = trpc.shopping.getWeekList.useQuery({
  weekStartDate: "2024-12-23"
});

// Returns:
// {
//   weekStartDate: "2024-12-23",
//   generated: [
//     {
//       ingredientId: "xyz",
//       name: "Chicken Breast",
//       amounts: [{ quantity: 3, unit: "lbs" }],
//       checked: false
//     }
//   ],
//   custom: [
//     {
//       id: "abc",
//       name: "Paper Towels",
//       quantity: 2,
//       unit: "rolls",
//       checked: false
//     }
//   ]
// }
```

### Toggle Item with Optimistic Update

```typescript
const toggleMutation = trpc.shopping.toggleChecked.useMutation({
  onMutate: async (variables) => {
    await utils.shopping.getWeekList.cancel({ weekStartDate });
    const prev = utils.shopping.getWeekList.getData({ weekStartDate });
    
    utils.shopping.getWeekList.setData({ weekStartDate }, (old) => {
      if (!old) return old;
      
      if (variables.ingredientId) {
        return {
          ...old,
          generated: old.generated.map(item =>
            item.ingredientId === variables.ingredientId
              ? { ...item, checked: !item.checked }
              : item
          )
        };
      }
      return old;
    });
    
    return { prev };
  },
  onError: (_err, _variables, context) => {
    if (context?.prev) {
      utils.shopping.getWeekList.setData({ weekStartDate }, context.prev);
    }
  },
  onSettled: () => {
    utils.shopping.getWeekList.invalidate({ weekStartDate });
  }
});

// Usage:
toggleMutation.mutate({
  weekStartDate: "2024-12-23",
  ingredientId: "xyz"
});
```

### Add Custom Item

```typescript
addCustomItemMutation.mutate({
  weekStartDate: "2024-12-23",
  name: "Paper Towels",
  quantity: 2,
  unit: "rolls"
});
```

## Known Behaviors

### Duplicate Ingredients (Different Units)

When the same ingredient appears with different units:
- Shows as separate lines in amounts array
- Displayed as "1 lb + 500 g"
- User can check once to mark entire ingredient done

**Not Implemented (v1):**
- Unit conversion
- Smart merging

### Meal Plan Changes

When meal plan changes:
- Shopping list automatically reflects changes on next query/refresh
- Checked states persist (by ingredientId)
- If ingredient removed from meal plan, its checked state remains in DB but doesn't appear in list

**Example:**
1. Check "Chicken Breast"
2. Remove all recipes with chicken from meal plan
3. Chicken disappears from shopping list (but state saved)
4. Add chicken recipe back → Chicken reappears still checked ✅

### Custom Item Lifecycle

Custom items are:
- Per-week (tied to weekStartDate)
- Independent of meal plan
- Removed only by explicit user action (X button)
- Persist across meal plan changes

### Week Navigation (Not Implemented Yet)

Shopping list currently shows current week only. Future enhancement:
- Previous/Next week buttons
- Each week has independent shopping list and checked states

## Code Quality ✅

All checks passing:

```bash
pnpm typecheck  # ✅ No TypeScript errors
pnpm lint       # ✅ No Biome warnings
pnpm format     # ✅ All files formatted
```

## Files Modified/Created

### Created
- `src/server/trpc/routers/shopping.ts` - Shopping list procedures (383 lines)
- `PHASE3_COMPLETE.md` - This document

### Modified
- `prisma/schema.prisma` - Added ShoppingListState and ShoppingListItemState models + relation to Ingredient
- `src/server/trpc/root.ts` - Added shopping router to appRouter
- `src/components/ShoppingList.tsx` - Complete refactor from mock data to tRPC integration (481 lines)
- `src/lib/week.ts` - Changed `getCurrentWeekStart()` to return string instead of Date for consistency

## Next Steps

Phase 3 is **code complete**. When you're ready:

1. Run migration:
   ```bash
   cd trofitrak
   pnpm prisma:migrate --name shopping_list_state
   ```

2. Test shopping list using testing sequence above

3. Verify:
   - Generated list reflects meal plan ✅
   - Checked state persists ✅
   - Custom items work ✅
   - Export CSV works ✅
   - Print layout looks good ✅

4. Optional Phase 3b enhancements:
   - Unit conversion for quantity aggregation
   - Aisle/category sorting
   - Week navigation
   - Bulk operations (check all, uncheck all category)

## Questions?

- **Why compute generated items every time?** Keeps list in sync with meal plan automatically, no complex sync logic needed
- **Why separate generated/custom sections?** Clear distinction between auto-generated (from recipes) vs manually added items
- **Why store checked state by ingredientId?** Persists across meal plan changes - if you check chicken and later remove/re-add chicken recipe, it stays checked
- **Why not convert units?** v1 simplicity - avoids errors from incorrect conversions (volume vs weight), can add later without breaking changes
- **Why unique constraint on (stateId, ingredientId)?** Prevents duplicate saved states for same ingredient per week

---

**Status**: ✅ Ready for database migration and testing  
**Next Phase**: InBody Scan Persistence OR USDA Ingredient Import (user choice)
