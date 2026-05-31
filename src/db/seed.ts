import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../lib/db';
import { members, users } from './schema';

// Ensure .env.local is loaded when running outside Next.js runtime.
loadEnv({ path: '.env.local' });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@darksky.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password';
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME ?? 'DarkSky';
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME ?? 'Admin';
const SEASON = process.env.SEED_SEASON ?? '2026';

const nowIso = () => new Date().toISOString();

async function upsertAdminUser() {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: 'admin',
        isActive: true,
        passwordHash,
        updatedAt: nowIso(),
      })
      .where(eq(users.id, existing[0].id));

    return { id: existing[0].id, created: false };
  }

  const [created] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      email: ADMIN_EMAIL,
      firstName: ADMIN_FIRST_NAME,
      lastName: ADMIN_LAST_NAME,
      role: 'admin',
      isActive: true,
      passwordHash,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    })
    .returning({ id: users.id });

  return { id: created.id, created: true };
}

async function upsertSeedMembers() {
  const memberSeeds = [
    {
      firstName: 'Avery',
      lastName: 'Reed',
      legalName: 'Avery Jordan Reed',
      email: 'avery.reed@example.com',
      phone: '555-0101',
      parentEmail: 'parent.avery@example.com',
      section: 'Snare',
      instrument: 'Pearl Championship CarbonCore',
      tuitionAmount: 1200,
    },
    {
      firstName: 'Morgan',
      lastName: 'Lee',
      legalName: 'Morgan Lee',
      email: 'morgan.lee@example.com',
      phone: '555-0102',
      parentEmail: 'parent.morgan@example.com',
      section: 'Tenors',
      instrument: 'Yamaha Field-Corps Tenors',
      tuitionAmount: 1100,
    },
    {
      firstName: 'Skyler',
      lastName: 'Diaz',
      legalName: 'Skyler Quinn Diaz',
      email: 'skyler.diaz@example.com',
      phone: '555-0103',
      parentEmail: 'parent.skyler@example.com',
      section: 'Bass',
      instrument: 'Yamaha Field-Corps Bass',
      tuitionAmount: 1000,
    },
    {
      firstName: 'Riley',
      lastName: 'Nguyen',
      legalName: 'Riley Nguyen',
      email: 'riley.nguyen@example.com',
      phone: '555-0104',
      parentEmail: 'parent.riley@example.com',
      section: 'Front Ensemble',
      instrument: 'Marimba',
      tuitionAmount: 950,
    },
  ];

  let createdCount = 0;
  let updatedCount = 0;

  for (const seed of memberSeeds) {
    const existing = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.email, seed.email), eq(members.season, SEASON)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(members)
        .set({
          firstName: seed.firstName,
          lastName: seed.lastName,
          legalName: seed.legalName,
          phone: seed.phone,
          parentEmail: seed.parentEmail,
          section: seed.section,
          instrument: seed.instrument,
          tuitionAmount: seed.tuitionAmount,
          contractSigned: true,
          source: 'manual',
          updatedAt: nowIso(),
        })
        .where(eq(members.id, existing[0].id));

      updatedCount += 1;
      continue;
    }

    await db.insert(members).values({
      id: randomUUID(),
      firstName: seed.firstName,
      lastName: seed.lastName,
      legalName: seed.legalName,
      email: seed.email,
      phone: seed.phone,
      parentEmail: seed.parentEmail,
      section: seed.section,
      season: SEASON,
      tuitionAmount: seed.tuitionAmount,
      contractSigned: true,
      source: 'manual',
      instrument: seed.instrument,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    createdCount += 1;
  }

  return { createdCount, updatedCount, totalSeeds: memberSeeds.length };
}

async function runSeed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Make sure .env.local exists and is valid.');
  }

  const adminResult = await upsertAdminUser();
  const memberResult = await upsertSeedMembers();

  console.log('Seed complete');
  console.log(`Admin email: ${ADMIN_EMAIL}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log(`Admin ${adminResult.created ? 'created' : 'updated'}: ${adminResult.id}`);
  console.log(
    `Members created: ${memberResult.createdCount}, updated: ${memberResult.updatedCount}, total template members: ${memberResult.totalSeeds}`
  );
}

runSeed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
