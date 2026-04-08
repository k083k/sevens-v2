# Sevens Game — Architecture Refactor Plan

**Created:** 2026-04-08
**Goal:** Transform the working game into a well-architected, secure, maintainable, portfolio-worthy application.
**Approach:** Incremental — the game stays playable at every step.

---

## Phase 1: Server-Side Security & API Layer
> Move game mutations behind server actions so the client can't cheat or access raw database.

### 1.1 — Create Server Actions for Game Mutations `[ DONE ]`
- Create `lib/actions/game-actions.ts` with `"use server"` directive
- Move these operations to server actions:
  - `createGame()` — create a new multiplayer game
  - `joinGame(code)` — join an existing game by code
  - `startGame(gameId)` — host starts the game
  - `playCard(gameId, playerId, card)` — validate + execute a card play
  - `handleCannotPlay(gameId, playerId)` — initiate card transfer
  - `executeCardTransfer(gameId, fromId, toId, card)` — complete transfer
  - `leaveGame(gameId, playerId)` — player leaves
- Each action validates the move server-side using `GameEngine` before writing to Supabase
- Return structured results: `{ success: boolean, error?: string, state?: GameState }`

### 1.2 — Server-Side Supabase Client `[ DONE ]`
- Create `lib/supabase/server.ts` — a server-only Supabase client (uses service role or server-side anon key)
- Keep `lib/supabase/client.ts` for realtime subscriptions only (read-only from client perspective)
- Client should never write directly to the database

### 1.3 — Tighten Row-Level Security (RLS) `[ DONE ]`
- Update RLS policies so anonymous browser clients can only:
  - **Read** their own game data (games they're part of)
  - **Read** the board state (public) but NOT other players' hands
  - **Subscribe** to realtime changes on their game
- All **writes** go through server actions (server-side client bypasses RLS or uses elevated permissions)

### 1.4 — Update Stores to Use Server Actions `[ DONE ]`
- Refactor `multiplayerStore.ts` to call server actions instead of direct Supabase writes
- Keep realtime subscriptions for receiving updates (read-only)
- Pattern: `user action → server action → DB write → realtime update → all clients`

---

## Phase 2: Unify Duplicated Code
> Eliminate the split between single-player and multiplayer where it doesn't need to exist.

### 2.1 — Shared Game Board Component `[ DONE ]`
- Extract common game board UI from `app/game/page.tsx` and `app/multiplayer/game/[gameId]/page.tsx`
- Create `components/game/GameBoard.tsx` that accepts props/callbacks for both modes
- Each page becomes a thin wrapper that provides mode-specific data

### 2.2 — Unified Game Store `[ SKIPPED ]`
- After analysis: single-player store is synchronous (local Game class), multiplayer store
  is async (server actions). Merging would add branching complexity without real benefit.
- The UI duplication is already solved by the shared GameBoard component (2.1).
- Each store is small and focused. Keeping them separate is cleaner.

### 2.3 — Shared Types & Contracts `[ DONE ]`
- Audit `lib/game/types/types.ts` — ensure all shared types are well-defined
- Create clear interfaces for server action inputs/outputs
- Ensure the `GameState` that flows over the wire is well-typed and minimal (don't send other players' hands to the client)

---

## Phase 3: Leverage Next.js Server Features
> Use the framework properly — server components for static/read pages, client components only where needed.

### 3.1 — Convert Static Pages to Server Components `[ NOT STARTED ]`
- `app/page.tsx` (landing) — evaluate if it can be a server component (animations may require client)
- `app/setup/page.tsx` — navigation page, could be server component with client islands
- `app/multiplayer/setup/page.tsx` — same, mostly navigation

### 3.2 — Server Component + Client Island Pattern `[ NOT STARTED ]`
- For pages like the lobby (`app/multiplayer/lobby/[gameId]/page.tsx`):
  - Server component fetches initial game data
  - Client component handles realtime updates
  - Pass initial data as props to avoid loading spinners

### 3.3 — Loading & Error States `[ NOT STARTED ]`
- Add `loading.tsx` files for route segments that fetch data
- Add `error.tsx` error boundaries for graceful failure handling
- Add `not-found.tsx` for invalid game codes / IDs

---

## Phase 4: Code Quality & Maintainability
> Clean up patterns, remove dead code, improve developer experience.

### 4.1 — Remove Unused Dependencies `[ NOT STARTED ]`
- Remove `@splinetool/react-spline` and `@splinetool/runtime` if not used
- Audit all dependencies for necessity

### 4.2 — Error Handling Strategy `[ NOT STARTED ]`
- Define consistent error types for game errors vs. network errors vs. validation errors
- Add proper error handling in multiplayer flows (disconnection, stale state, race conditions)
- Add reconnection logic for dropped realtime subscriptions

### 4.3 — Environment & Configuration `[ NOT STARTED ]`
- Add environment variable validation (fail fast on missing config)
- Add `.env.example` with required variables documented

### 4.4 — Testing Foundation `[ NOT STARTED ]`
- Set up a test runner (Vitest recommended for Next.js)
- Add unit tests for `GameEngine`, `SpadesLockValidator`, `Board` — these are pure logic, easy to test
- Add tests for server actions (mock Supabase, test validation)

---

## Phase 5: UI/UX Polish (Future)
> After architecture is solid, revisit the interface.

### 5.1 — UI Component Audit `[ NOT STARTED ]`
### 5.2 — Responsive Design Review `[ NOT STARTED ]`
### 5.3 — Accessibility Audit `[ NOT STARTED ]`
### 5.4 — Performance Optimization `[ NOT STARTED ]`

---

## Progress Tracker

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | DONE | Server-side security & API layer |
| Phase 2 | DONE | Unify duplicated code |
| Phase 3 | NOT STARTED | Leverage Next.js server features |
| Phase 4 | NOT STARTED | Code quality & maintainability |
| Phase 5 | NOT STARTED | UI/UX polish (future) |

---

## Architecture Diagrams

### Current (What we have now)
```
Browser (all logic + writes) ──────► Supabase (open RLS, no validation)
Browser (all logic + writes) ──────►
Browser (all logic + writes) ──────►
```

### Target (What we're building toward)
```
Browser (UI + reads + realtime) ──► Next.js Server Actions (validation + game logic)
                                         │
                                         ▼
                                    Supabase (protected, server-only writes)
                                         │
                                         ▼ (realtime broadcast)
                                    All connected browsers receive updates
```
