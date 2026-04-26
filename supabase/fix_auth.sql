-- ============================================================
-- RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR
-- Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── 1. Fix handle_new_user trigger ───────────────────────────
--
-- Problem: the original trigger did an unsafe enum cast
--   (NEW.raw_user_meta_data->>'role')::user_role
-- If anything goes wrong, the whole INSERT into auth.users
-- is rolled back and Supabase returns "Database error saving new user".
--
-- Fix: wrap the cast in a BEGIN/EXCEPTION block so any cast
-- failure silently defaults to 'Citizen'. Also add
-- ON CONFLICT DO NOTHING so a duplicate profile never errors.
-- The outer EXCEPTION block ensures the trigger NEVER blocks signup.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'Citizen';
  v_name TEXT;
BEGIN
  -- Safely parse the role — fall back to Citizen on any error
  BEGIN
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      v_role := (NEW.raw_user_meta_data->>'role')::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'Citizen';
  END;

  -- Safely parse the name — fall back to email prefix
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO profiles (user_id, name, email, role)
  VALUES (NEW.id, v_name, NEW.email, v_role)
  ON CONFLICT (user_id) DO UPDATE
    SET name  = EXCLUDED.name,
        email = EXCLUDED.email,
        role  = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a signup due to a profile creation failure
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── 2. Promote yourself to Admin ─────────────────────────────
--
-- STEP A: Register through the app UI first, then come back here.
-- STEP B: Replace the email below with the email you registered with,
--         then run ONLY this UPDATE statement.

-- UPDATE profiles
-- SET role = 'Admin'
-- WHERE email = 'your-email@example.com';

-- ── 3. (Optional) Verify the fix ─────────────────────────────
-- SELECT user_id, name, email, role, created_at
-- FROM profiles
-- ORDER BY created_at DESC
-- LIMIT 10;
