# Backups & Disaster Recovery

This document is the operational runbook for Loada's data. Read it before
running any production deploy and before anyone touches the `Job`, `Bid`,
`DriverWallet`, or `WalletTransaction` tables.

## What we back up

| What | Where | Strategy | RPO | RTO |
|---|---|---|---|---|
| PostgreSQL (RDS) | AWS RDS automated snapshots | Daily, 14-day retention | 24h | ~30 min |
| PostgreSQL (RDS) | AWS RDS point-in-time recovery (PITR) | Continuous WAL, 7 days | 5 min | ~30 min |
| S3 driver/POD uploads | S3 with versioning enabled | Object versioning, lifecycle to Glacier at 90 days | 0 (versioned) | minutes |
| Redis | None — transient cache only | Lost data acceptable; recoverable from Postgres | — | n/a |
| App config | Postgres `AppConfig` table | Recovered with main RDS restore | 24h | ~30 min |

Redis is intentionally not backed up. Live OTPs, presence, BullMQ delayed
tasks, and the bid session state will be lost on a Redis outage. The
auto-settle and sweep workers were designed for exactly this — they replay
the timeline from Postgres state on the next tick.

## RDS configuration that must be set in production

These are not the defaults. Verify before launch.

- **Encryption at rest**: enabled (AES-256, AWS-managed KMS key is fine for MVP)
- **Automated backups**: 14-day retention
- **Backup window**: 02:00–03:00 Africa/Harare (lowest traffic)
- **Multi-AZ**: enabled (single-AZ MVP is acceptable only for the first 30 days; flip to Multi-AZ before any revenue)
- **Deletion protection**: enabled — refuse to delete the DB without a console override
- **Performance Insights**: enabled (free tier, 7-day retention)
- **Storage autoscaling**: enabled, ceiling 100 GB initially

## Quarterly restore drill

Backups that aren't restored aren't backups. Schedule this every quarter:

1. Pick the most recent automated snapshot
2. Restore to a new RDS instance named `loada-restore-test-<date>`
3. Connect from an ops box and verify:
   - `SELECT COUNT(*) FROM "User"` — matches production within a few rows
   - `SELECT COUNT(*) FROM "WalletTransaction" WHERE type = 'COMMISSION_DEDUCT'` — matches the commission revenue we reported for that period
   - `\d "Job"` — schema matches the live migration head
4. Run `prisma migrate status` against the restored DB — should report `Database schema is up to date`
5. Tear the test instance down
6. Record the drill date and any issues in `docs/DECISIONS.md`

If anything in step 3 doesn't match, treat it as a P1 — the backup pipeline
is broken even if no current trip data was lost.

## Point-in-time recovery — when to use

Use PITR (not the daily snapshot) for any **partial** data loss where you know
the time the bad write happened:

- A bulk-cancel run targeted the wrong status filter
- An admin force-deleted a row they shouldn't have
- A migration locked up midway through

Workflow:

```bash
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier loada-prod \
  --target-db-instance-identifier loada-pitr-<short-utc> \
  --restore-time 2026-05-29T13:42:00Z \
  --db-instance-class db.t3.medium
```

Then:
- Sanity-check the restored instance with the same SQL as the quarterly drill
- Dump the specific rows you need (`pg_dump --table='"User"' --data-only --rows="..."`)
- Re-insert into prod inside a transaction
- Tear down the PITR instance

Never repoint the application at the PITR instance — that creates two diverged
timelines and confuses every subsequent restore.

## What we don't currently back up — known gaps

- **No off-AWS copy of snapshots.** A full AWS account compromise (root credentials leaked) would lose everything. The fix is `aws backup` with a vault in a separate account; flag for follow-up before crossing $X revenue.
- **Mobile push tokens (FCM)** are stored in `User.fcmToken`. They're recoverable from re-login but a multi-day outage with no DB means users won't get notifications until they re-open the app.
- **No tested S3 cross-region replication.** POD photos are versioned but if `eu-west-1` is down we cannot serve them. Acceptable for MVP.

## Incident drill

When you suspect data loss in production, run this checklist top to bottom:

1. **Stop writes** if loss is ongoing: scale the API to 0 instances via PM2 or revert the bad deploy.
2. Identify the **time the bad write started** — Sentry, CloudWatch, or the admin audit log.
3. Decide: **PITR** (partial, time-bounded) vs **full snapshot restore** (whole-DB corruption).
4. Restore to a *new* instance (never overwrite prod).
5. Verify with the quarterly-drill SQL.
6. Surgically copy good rows back into prod, or repoint DNS if the corruption is total.
7. Write a postmortem within 48 hours. File in `docs/DECISIONS.md`.

## Contact / on-call

- AWS account owner: clouditate@gmail.com
- Paynow merchant contact: (TBD before launch)
- BulkIT support: (TBD before launch)

Update this section the moment a real on-call rotation exists.
