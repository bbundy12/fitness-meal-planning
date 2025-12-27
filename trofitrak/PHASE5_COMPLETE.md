# Phase 5 Complete: Authentication

## Summary
Added Auth.js (NextAuth v5) authentication with email magic links via Resend. Replaced `DEFAULT_USER_ID` with real session-based authentication.

## Changes Made

### 1. Database Schema
- Added `User` model with relations to all data models (`Ingredient`, `Recipe`, `MealPlanWeek`, `ShoppingListState`, `InBodyScan`)
- Added Auth.js required tables: `Account`, `Session`, `VerificationToken`
- All user data has `onDelete: Cascade` (deleting user deletes their data)

### 2. Authentication Setup
- **Provider**: Resend email magic links (passwordless)
- **Session**: JWT-based (stateless)
- **Configuration**: [src/server/auth.ts](src/server/auth.ts)
  - Prisma adapter integration
  - Session callback injects `user.id` into session
  - Custom login page at `/login`

### 3. tRPC Context
- **Before**: Hardcoded `DEFAULT_USER_ID = "default-user"`
- **After**: [src/server/trpc/context.ts](src/server/trpc/context.ts) calls `auth()` to get session
- Throws `UNAUTHORIZED` error if session missing
- All tRPC procedures now require authentication

### 4. Route Protection
- **Middleware**: [middleware.ts](middleware.ts) protects all routes
- Public routes: `/login`, `/api/auth/*`
- Redirects unauthenticated users to `/login` with callback URL

### 5. UI Components
- **Login page**: [src/app/login/page.tsx](src/app/login/page.tsx)
  - Email input form
  - Shows "Check your email" confirmation
- **User menu**: [src/components/user-menu.tsx](src/components/user-menu.tsx)
  - Displays user email
  - Sign out button
  - Added to header in [src/app/layout.tsx](src/app/layout.tsx)

### 6. Type Definitions
- [types/next-auth.d.ts](types/next-auth.d.ts) extends session to include `user.id`

## Environment Variables Required

Add to `.env.local`:

```env
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-here"

# Get from https://resend.com/api-keys
AUTH_RESEND_KEY="re_your_key_here"

# Base URL for callbacks
AUTH_URL="http://localhost:3000"
```

## Migration Required

Before running the app:

```bash
pnpm prisma:migrate --name auth_user
```

This will:
- Create `User`, `Account`, `Session`, `VerificationToken` tables
- Add `userId` foreign keys to all existing tables
- **WARNING**: Existing data will need a user association (see below)

## Testing Instructions

1. **Setup environment**:
   ```bash
   # Generate auth secret
   openssl rand -base64 32
   
   # Add to .env.local with AUTH_SECRET, AUTH_RESEND_KEY, AUTH_URL
   ```

2. **Run migration**:
   ```bash
   pnpm prisma:migrate --name auth_user
   ```

3. **Start dev server**:
   ```bash
   pnpm dev
   ```

4. **Test authentication flow**:
   - Visit http://localhost:3000 → redirects to `/login`
   - Enter email address
   - Check email for magic link
   - Click link → redirects to app
   - Verify user menu shows email
   - Create some data (ingredients, recipes, etc.)
   - Sign out → redirects to `/login`
   - Sign in as different user → verify no access to previous user's data

## Data Scoping

All queries now automatically scope to the authenticated user:

- `ctx.userId` available in all tRPC procedures
- All models have `user` relation with `onDelete: Cascade`
- No manual filtering needed (context handles it)

## Verification Checklist

- [x] TypeScript compilation passes (`pnpm typecheck`)
- [x] Linting passes (`pnpm lint`)
- [x] Formatting passes (`pnpm format`)
- [ ] Migration runs successfully
- [ ] Login flow works (send magic link)
- [ ] User menu displays correctly
- [ ] Sign out works
- [ ] Data scoping verified (no cross-user access)

## Notes

- **Session strategy**: JWT (stateless, no database session storage)
- **Email provider**: Resend (requires API key)
- **Custom login page**: `/login` (not default Auth.js UI)
- **All routes protected** except `/login` and `/api/auth/*`
- **Existing data**: Any data created with `DEFAULT_USER_ID` will need to be migrated or deleted

## Next Steps (Not Included)

Per project requirements, Phase 5 completes authentication. **Do not add**:
- User profiles
- Team features
- Role-based permissions
- Additional OAuth providers
- Account settings pages
