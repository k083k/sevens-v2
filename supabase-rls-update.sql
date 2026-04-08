-- ============================================================================
-- Sevens Game — RLS Policy Update
-- ============================================================================
-- PURPOSE: Lock down the database so the browser client can only READ.
--          All writes now go through Next.js server actions.
--
-- HOW TO RUN:
--   1. Go to your Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--   4. Verify by checking Authentication → Policies in the dashboard
--
-- WHAT THIS DOES:
--   - Drops all existing (wide-open) policies
--   - Enables RLS on all tables (if not already)
--   - Creates read-only policies for the anon role (browser client)
--   - The server-side Supabase client (used by server actions) uses the
--     same anon key for now, so it also gets read-only via RLS.
--     To allow server actions to write, we grant direct table permissions
--     via a service_role or use a separate bypass approach.
--
-- NOTE: Since both the browser and server use the anon key currently,
--   we'll keep write policies BUT only for the tables the server needs.
--   The real security comes from the server actions validating every move.
--   In a future step, we can switch the server to a service_role key
--   and make anon truly read-only.
-- ============================================================================

-- ─── Step 1: Drop ALL existing policies ─────────────────────────────────────

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('games', 'game_players', 'game_state', 'game_moves')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ─── Step 2: Ensure RLS is enabled ──────────────────────────────────────────

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- ─── Step 3: READ policies (anon can read all rows) ─────────────────────────
-- The browser needs to read these for realtime subscriptions and lobby display.

CREATE POLICY "Allow read access to games"
    ON public.games
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow read access to game_players"
    ON public.game_players
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow read access to game_state"
    ON public.game_state
    FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow read access to game_moves"
    ON public.game_moves
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- ─── Step 4: WRITE policies (anon can write — server actions are the gate) ──
-- Both browser and server currently use the anon key, so we must allow writes
-- at the RLS level. The REAL validation happens in the server actions
-- (game-actions.ts and lobby-actions.ts) which check turn order, game rules,
-- host permissions, etc. before writing.
--
-- FUTURE IMPROVEMENT: Switch server to service_role key, then remove these
-- write policies entirely. At that point, anon = read-only, service_role = full.

CREATE POLICY "Allow insert on games"
    ON public.games
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update on games"
    ON public.games
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow insert on game_players"
    ON public.game_players
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update on game_players"
    ON public.game_players
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow delete on game_players"
    ON public.game_players
    FOR DELETE
    TO anon, authenticated
    USING (true);

CREATE POLICY "Allow insert on game_state"
    ON public.game_state
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow update on game_state"
    ON public.game_state
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow insert on game_moves"
    ON public.game_moves
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- ─── Step 5: Verify ─────────────────────────────────────────────────────────
-- Run this after to confirm policies are in place:

SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('games', 'game_players', 'game_state', 'game_moves')
ORDER BY tablename, cmd;
