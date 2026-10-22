# Parallel worktrees

Local Supabase and Vite listen on fixed ports, and Supabase names its containers after `project_id`. Two worktrees running tests at once collide on both, so each worktree that runs API or e2e tests gets a **slot**: its own `project_id`, Supabase ports and Vite port.

## Steps

1. From the worktree root: `scripts/worktree-slot.sh on <k>`, with a slot number `k` (1–9) no other running worktree uses. Slot `k` shifts Supabase ports by `k × 1000` (API `54321` → `5{4+k}321`) and Vite to `5173 + k × 10`.
2. `supabase start -x studio,imgproxy,logflare,vector,supavisor,mailpit,storage-api,postgres-meta`, then `supabase db reset` after any migration change. The edge runtime doesn't reload edited functions: restart the stack after changing a function or its secrets.
3. Run e2e with `pnpm test:e2e --workers=2`: every test drives several headless Chromiums with fake cameras, and agents in parallel saturate the machine at the default worker count. Iterate on single spec files.
4. Before committing a real change to `.env`, `supabase/config.toml` or `playwright.config.ts`, and before any `git merge`: `scripts/worktree-slot.sh off`, do the change or merge, commit, then `on <k>` again. Slot edits are hidden from git and must never be committed.
5. When done: `supabase stop --no-backup` (frees the containers and their volumes), then `scripts/worktree-slot.sh off`.

**Done when** no container named `supabase_*_dog-watch-s<k>` is left running for your slot.
