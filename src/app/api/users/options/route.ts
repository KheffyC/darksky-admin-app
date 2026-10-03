import { NextResponse } from 'next/server';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { ROLES } from '@/lib/permissions';

// GET /api/users/options - Active admins and directors, for "who" pickers (paid by, task owner)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(and(eq(users.isActive, true), inArray(users.role, [ROLES.ADMIN, ROLES.DIRECTOR])))
      .orderBy(asc(users.firstName));

    return NextResponse.json(rows.map((user) => ({ id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), firstName: user.firstName })));
  } catch (error) {
    console.error('Error fetching user options:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
