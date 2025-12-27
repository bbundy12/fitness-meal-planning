# Phase 1 Complete: Backend Spine with tRPC + Prisma + Postgres

## ✅ Completed Tasks

### 1. Dependencies Installed
- **Runtime**: `@prisma/client`, `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `zod`
- **Dev**: `prisma`
- All packages compatible with Next.js 16 App Router

### 2. Database Schema (Prisma)
Location: [`prisma/schema.prisma`](prisma/schema.prisma)

**Models:**
- **`Ingredient`**: Multi-tenant (userId), stores name, macros (calories, protein, carbs, fat), serving info (servingSize, servingUnit, gramsPerServing), source (MANUAL/USDA), optional sourceId
- **`Recipe`**: Multi-tenant (userId), title, description, instructions, servings, calculated macros (calories, protein, carbs, fat)
- **`RecipeItem`**: Links recipes to ingredients with quantity and unit (grams/serving), cascade deletes with recipe, restricts deletes on ingredients

**Key Features:**
- User-scoped data for multi-user readiness (hard-coded `default-user` for now)
- Flexible serving sizes with unit support
- Automatic timestamp tracking (createdAt, updatedAt)
- Proper relation constraints (cascade, restrict)

### 3. Database Client
Location: [`src/server/db/client.ts`](src/server/db/client.ts)

- Singleton pattern to prevent connection exhaustion
- Environment-aware logging (verbose in dev, errors-only in prod)
- Global caching for hot-reload in development
- Compatible with Prisma 7.x

### 4. Environment Configuration
- **[`.env.example`](.env.example)**: Template with Neon Postgres URL format
- **[`.env.local`](.env.local)**: Local development config (using local Postgres URL)
- **[`src/env.ts`](src/env.ts)**: Zod-based runtime validation for `DATABASE_URL` and `NODE_ENV`

### 5. tRPC Setup

#### Context ([`src/server/trpc/context.ts`](src/server/trpc/context.ts))
- Provides `db` (PrismaClient) and `userId` (hard-coded `default-user`)
- Ready for future auth integration

#### Core tRPC ([`src/server/trpc/trpc.ts`](src/server/trpc/trpc.ts))
- Configured with context type
- Exports `router` and `publicProcedure` builders

#### App Router ([`src/server/trpc/root.ts`](src/server/trpc/root.ts))
- Combines `ingredientRouter` and `recipeRouter`
- Exports `AppRouter` type for client-side type safety

### 6. tRPC Routers

#### Ingredient Router ([`src/server/trpc/routers/ingredient.ts`](src/server/trpc/routers/ingredient.ts))
**Procedures:**
- `list`: Get all ingredients for current user (sorted by name)
- `searchLocal`: Search ingredients by name (case-insensitive)
- `create`: Add new ingredient with validation (Zod schema)
- `update`: Partial update of ingredient
- `delete`: Remove ingredient (will fail if used in recipes due to Restrict constraint)

**Schema Validation:**
- Name, macros (calories, protein, carbs, fat)
- Serving info (servingSize as Float, servingUnit, gramsPerServing)
- Source (MANUAL/USDA) with optional sourceId

#### Recipe Router ([`src/server/trpc/routers/recipe.ts`](src/server/trpc/routers/recipe.ts))
**Procedures:**
- `list`: Get all recipes with nested items/ingredients
- `get`: Get single recipe by ID with full details
- `create`: Create recipe with items, auto-calculate macros using `macroMath.ts`
- `update`: Update recipe metadata (title, description, instructions, servings)
- `delete`: Remove recipe (cascades to RecipeItems)

**Features:**
- Automatic macro calculation per serving
- Validation ensures all ingredient IDs exist and belong to user
- Returns full recipe with nested ingredient details

### 7. Macro Calculation Helper
Location: [`src/lib/macroMath.ts`](src/lib/macroMath.ts)

- `calculateRecipeMacros(items)`: Calculates total macros for a recipe
- Handles both "grams" and "serving" units
- Converts grams to servings using `gramsPerServing`
- Returns totals: `{ calories, protein, carbs, fat }`

### 8. API Route Handler
Location: [`src/app/api/trpc/[trpc]/route.ts`](src/app/api/trpc/[trpc]/route.ts)

- Next.js App Router compatible (GET/POST)
- Uses `fetchRequestHandler` from `@trpc/server/adapters/fetch`
- Endpoint: `/api/trpc`
- Creates context for each request

### 9. Client-Side Setup

#### tRPC Client ([`src/lib/trpc.ts`](src/lib/trpc.ts))
- Type-safe React hooks via `createTRPCReact<AppRouter>()`
- Full IntelliSense for all procedures

#### Providers Component ([`src/components/Providers.tsx`](src/components/Providers.tsx))
- Wraps app with `QueryClientProvider` and `trpc.Provider`
- Configures `httpBatchLink` for efficient batching
- Client-only component (`"use client"`)

#### Layout Integration ([`src/app/layout.tsx`](src/app/layout.tsx))
- Wrapped entire app with `<Providers>` component
- All pages now have access to tRPC hooks

### 10. UI Components Updated

#### IngredientsDatabase ([`src/components/IngredientsDatabase.tsx`](src/components/IngredientsDatabase.tsx))
**Changes:**
- Replaced mock state with `trpc.ingredient.list.useQuery()`
- Added `trpc.ingredient.create.useMutation()` with auto-invalidation
- Added `trpc.ingredient.delete.useMutation()` with auto-invalidation
- Updated form to use numeric `servingSize` (grams)
- Maintained USDA API search (still functional, uses mutations to persist)
- Shows loading state during queries
- Badge displays source (MANUAL/USDA)

**Features Preserved:**
- Browse all ingredients with search filter
- Manual entry tab with macro inputs
- USDA API tab with search and import
- Edit/delete buttons (delete wired, edit ready for future)

#### RecipeBuilder ([`src/components/RecipeBuilder.tsx`](src/components/RecipeBuilder.tsx))
**Changes:**
- Replaced mock state with `trpc.recipe.list.useQuery()`
- Added `trpc.ingredient.list.useQuery()` for ingredient selection
- Added `trpc.recipe.create.useMutation()` with auto-calculation
- Added `trpc.recipe.delete.useMutation()`
- New ingredient picker: search → select → specify quantity/unit
- Real-time macro calculation using actual ingredient data
- Shows recipe items count in saved recipes

**Features:**
- Create recipe with searchable ingredient picker
- Add ingredients with quantity (servings or grams)
- Live macro totals per serving
- Save recipes with instructions
- View saved recipes with full macro breakdown
- Delete recipes

### 11. Scripts Added to package.json
```json
"prisma:generate": "prisma generate",
"prisma:migrate": "prisma migrate dev",
"prisma:studio": "prisma studio"
```

## 📝 Testing Checklist (Before Database Migration)

### Prerequisites
You need a Postgres database. Choose one:
1. **Neon (Recommended)**: Free tier at https://neon.tech
   - Create project → Copy connection string → Update `.env.local`
2. **Local Postgres**: 
   ```bash
   # Install Postgres (macOS)
   brew install postgresql
   brew services start postgresql
   createdb trofitrak
   # Update .env.local: DATABASE_URL="postgresql://postgres:password@localhost:5432/trofitrak"
   ```

### Migration Steps
```bash
cd trofitrak

# 1. Update DATABASE_URL in .env.local with your Postgres connection string

# 2. Run initial migration
pnpm prisma:migrate --name init

# 3. Verify schema
pnpm prisma:studio  # Opens GUI at http://localhost:5555

# 4. Start dev server
pnpm dev
```

### Manual Testing Plan

#### Test 1: Create Ingredients
1. Navigate to `/ingredients`
2. Click "Add Manual" tab
3. Create ingredient: "Chicken Breast"
   - Serving Size: 100 grams
   - Calories: 165, Protein: 31, Carbs: 0, Fat: 3.6
4. Click "Add to Database"
5. ✅ Should appear in "Browse Database" tab
6. Refresh page → ✅ Should persist

#### Test 2: USDA Import
1. Click "USDA API" tab
2. Search: "banana"
3. Click "Add to Database" on a result
4. ✅ Should appear with "USDA" badge
5. Refresh page → ✅ Should persist with sourceId

#### Test 3: Create Recipe
1. Navigate to `/recipes`
2. Click "New Recipe"
3. Title: "Chicken and Rice"
4. Servings: 2
5. Search ingredient: type "chicken" → select your ingredient
6. Quantity: 200, Unit: grams → Click +
7. ✅ Should show calculated macros (165 cal × 2 = 330 cal)
8. Add instructions: "Grill chicken, serve with rice"
9. Click "Save Recipe"
10. ✅ Should appear in saved recipes
11. ✅ Should show "82.5 cal per serving" (330 cal / 4 servings)
12. Refresh page → ✅ Should persist

#### Test 4: Delete Recipe
1. Click trash icon on a recipe
2. ✅ Should disappear immediately
3. Refresh → ✅ Should stay gone

#### Test 5: Delete Ingredient
1. Try deleting ingredient used in a recipe
2. ✅ Should fail (Restrict constraint)
3. Delete recipe first
4. Now delete ingredient → ✅ Should succeed

## 🚫 Out of Scope (Phase 1)
- ❌ External USDA lookup/import (kept manual form + search mock)
- ❌ Authentication (using hard-coded `default-user`)
- ❌ Recipe editing (create + delete only)
- ❌ Ingredient editing (create + delete only)
- ❌ Shopping list persistence
- ❌ Meal planner persistence
- ❌ InBody scan persistence

## 🎯 Next Steps (Phase 2+)
User requested to **STOP after Phase 1** for approval. Future phases could include:
1. USDA API integration (external lookup + import)
2. Edit functionality for recipes and ingredients
3. Meal planner persistence (weekly plans)
4. Shopping list generation from meal plans
5. Authentication (Clerk/NextAuth)
6. InBody scan log persistence
7. Macro tracking and progress charts

## 📊 Code Quality
- ✅ `pnpm lint` passing (Biome)
- ✅ `pnpm typecheck` passing (TypeScript strict mode)
- ✅ `pnpm format` applied (Biome formatter)
- ✅ No build errors
- ✅ All tRPC types fully inferred (end-to-end type safety)

## 🔗 Architecture Summary
```
Client (React)
  ↓ (tRPC hooks via @trpc/react-query)
API Route (/api/trpc/[trpc])
  ↓ (tRPC router)
Server Procedures (routers/ingredient.ts, routers/recipe.ts)
  ↓ (Prisma client)
PostgreSQL Database
```

**Key Benefits:**
- Full type safety from DB to UI (no manual type definitions)
- Automatic query invalidation on mutations
- Batched requests (multiple queries in one HTTP call)
- React Query caching (fast subsequent loads)
- Multi-user ready (just needs auth integration)

## 📦 File Structure
```
trofitrak/
├── prisma/
│   └── schema.prisma           # DB schema (Ingredient, Recipe, RecipeItem)
├── src/
│   ├── app/
│   │   ├── api/trpc/[trpc]/
│   │   │   └── route.ts        # tRPC API handler
│   │   ├── layout.tsx          # Providers wrapper
│   │   └── (routes)...
│   ├── components/
│   │   ├── IngredientsDatabase.tsx  # Updated with tRPC
│   │   ├── RecipeBuilder.tsx        # Updated with tRPC
│   │   └── Providers.tsx            # React Query + tRPC client
│   ├── lib/
│   │   ├── trpc.ts             # Client-side tRPC hooks
│   │   └── macroMath.ts        # Recipe macro calculation
│   ├── server/
│   │   ├── db/
│   │   │   └── client.ts       # Prisma singleton
│   │   └── trpc/
│   │       ├── context.ts      # Request context (db + userId)
│   │       ├── trpc.ts         # tRPC init
│   │       ├── root.ts         # Combined router
│   │       └── routers/
│   │           ├── ingredient.ts
│   │           └── recipe.ts
│   └── env.ts                  # Environment validation (Zod)
├── .env.local                  # Local config (DATABASE_URL)
├── .env.example                # Template
└── package.json                # Updated scripts
```

---

**Ready for user approval before proceeding to USDA integration or additional features.**
