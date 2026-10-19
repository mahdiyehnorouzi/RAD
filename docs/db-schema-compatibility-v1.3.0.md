# Database schema compatibility: production v1.3.0 → current `main`

**This is an unresolved, blocking finding, not a fix.** It is reported here
rather than acted on, per the standing rule not to invent a destructive
database decision silently.

## What was checked

Production is confirmed running `v1.3.0` (git tag `v1.3.0`, commit
`7931481`). Diffing that tag against current `main`:

```
git diff --stat v1.3.0 HEAD -- apps/api/src/database/entities/
```

shows **every** TypeORM entity file (`product.entity.ts`,
`order.entity.ts`, `product-image.entity.ts`, `user.entity.ts`, etc. — 19
files, 1114 lines) as entirely new. Confirmed directly:

```
git ls-tree -r v1.3.0 --name-only | grep -iE "database|typeorm|postgres|datasource"
```

returns **nothing**. At `v1.3.0`, this codebase has no TypeORM entities, no
`DataSource`, no Postgres integration of any kind in `apps/api` at all.

## What this means

Deploying current `main`'s API code to replace `v1.3.0` is not "the same
app with a newer schema" — it introduces an entire persistence layer
(orders, payments, inventory, product images, users, reviews, etc.) where
production's running process currently has none. Two questions this repo's
tooling cannot answer on its own:

1. **Does production's Postgres database already have this schema?**
   Someone may have already run `TYPEORM_SYNCHRONIZE=true` against it at
   some point independent of which API code is currently deployed (the
   commit message on the 1.4.0 bump, `ef1b58c`, literally reads "opt-in
   production schema sync" — suggesting this was already a live concern
   before this task). Or the database may be empty/absent/schema-less,
   matching the code that's actually running now. **This cannot be
   determined without direct database access**, which this session does
   not have.
2. **If the schema does not exist yet, how should it be created?** This
   repository has no migration framework and no migration files — the
   only schema-creation mechanism it has ever had is TypeORM's
   `synchronize`, which `apps/api/src/database/data-source.ts` correctly
   keeps off by default in production, and which every instruction
   governing this work explicitly forbids enabling or running
   destructively without sign-off. There is currently no *safe, reviewed,
   non-destructive* path in this codebase to create a missing schema in
   production.

## What was deliberately NOT done

- `TYPEORM_SYNCHRONIZE` was not enabled anywhere, for any environment, as
  part of this work. `scripts/lib/deploy-api-remote.sh` actively refuses
  to deploy if it finds this set to `true` in the production env file.
- No migration file, migration runner, or schema-altering script was
  added. Writing one is a legitimate separate option, but doing so without
  first knowing production's actual current schema state would be
  guessing at exactly the kind of irreversible action this task's rules
  say to stop and ask about.

## What has to happen before this can ship

Someone with production database access needs to answer, in order:

1. **Does `rad_orders`/`product_images`/etc. already exist in production's
   Postgres?** (`\dt` via `psql`, or equivalent, against the real
   connection string — never run from this session.)
2. If **yes** (schema already created, perhaps by an earlier, since-reset
   code deploy): compare its actual columns against current `main`'s
   entities for drift, then this is a normal, lower-risk deploy.
3. If **no** (database is genuinely empty or schema-less): decide,
   explicitly, how to create it — a single supervised one-time
   `synchronize=true` run against a **freshly backed-up** database, done
   by a human with the backup verified restorable first, is the
   lowest-effort option this codebase already supports; introducing real
   TypeORM migrations is the more durable fix but is separate, larger
   work. Either way, this is a decision for whoever owns the production
   database, made with real schema visibility — not something to automate
   here.

Until one of these is explicitly resolved, treat the API deploy as blocked
on data-layer risk even once every tooling fix in this task is in place.
