-- Migration 009: Fix singles RLS + add import_batches anon policies
-- Run manually in Supabase SQL editor if not using db:migrate.

-- ============================================================
-- 1. Consolidate singles SELECT policy
-- ============================================================
-- Drop the original policy from 002 and the additive policy from 004.
-- The new policy covers all four access paths in a single place.
drop policy if exists "singles_select" on singles;
drop policy if exists "shadchan_read_linked_singles" on singles;

create policy "singles_select" on singles
  for select using (
    -- Shadchan created this single directly
    created_by_shadchan_id = current_shadchan_id()
    -- Shadchan represents this single via the junction table
    or exists (
      select 1 from shadchan_singles
      where shadchan_singles.single_id = singles.id
        and shadchan_singles.shadchan_id = current_shadchan_id()
    )
    -- Single can see their own record
    or user_id = auth.uid()
    -- Platform admin can see everything
    or current_user_role() = 'platform_admin'
    -- Parent can see their linked child
    or exists (
      select 1 from parents
      where parents.user_id = auth.uid()
        and parents.child_id = singles.id
    )
  );

-- ============================================================
-- 2. Anon RLS policies on import_batches for review token routes
-- ============================================================
-- UUID review tokens (36 hex chars, ~122 bits entropy) serve as the
-- authorization credential. Anon access is intentional — the review
-- page (/review/[token]) is a public link sent to shadchanim.

create policy "import_batches_review_read" on import_batches
  for select to anon
  using (true);

-- Anon may only update a non-finalized batch,
-- and only to set status = 'shadchan_approved'.
create policy "import_batches_review_update" on import_batches
  for update to anon
  using (status not in ('admin_approved', 'rejected'))
  with check (status = 'shadchan_approved');
