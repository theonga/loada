/**
 * Backfill User.phoneHash for every existing row.
 *
 * Run once per environment after deploying the migration that adds the column.
 * Idempotent — only updates rows where phoneHash is null. Safe to re-run.
 *
 * Usage:
 *   PHONE_PEPPER=<hex> ts-node -r tsconfig-paths/register src/scripts/backfill-phone-hash.ts
 *
 * Once this has run cleanly in every env, follow up with a migration that
 * makes phoneHash NOT NULL (and drop the lazy-backfill branch in
 * verifyOTPAndLogin if you want).
 */

import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPhoneLookup } from "@/lib/phone-hash";

async function main() {
  const users = await prisma.user.findMany({
    where: { phoneHash: null },
    select: { id: true, phone: true },
  });

  if (users.length === 0) {
    console.log("Nothing to backfill — every User row already has a phoneHash.");
    return;
  }

  console.log(`Backfilling phoneHash for ${users.length} user(s)...`);
  let updated = 0;
  let collisions = 0;

  for (const user of users) {
    const hash = hashPhoneLookup(user.phone);
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneHash: hash },
      });
      updated++;
    } catch (err) {
      // Unique constraint violation = another row already has this hash,
      // which means duplicate phone rows existed before. Surface so an
      // operator can dedupe by hand.
      const code = (err as { code?: string }).code;
      if (code === "P2002") {
        collisions++;
        console.warn(`  ! Hash collision for user ${user.id} (${user.phone}) — likely duplicate phone row, skipped`);
      } else {
        throw err;
      }
    }
  }

  console.log(`Done. Updated ${updated}, collisions ${collisions}.`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
