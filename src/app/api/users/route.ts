import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userPermissions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PERMISSIONS, ROLES, hasRole } from '@/lib/permissions';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users (admin only)
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch all users with their permissions
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Fetch permissions for each user
    const usersWithPermissions = await Promise.all(
      allUsers.map(async (user) => {
        const permissions = await db
          .select({
            permission: userPermissions.permission,
          })
          .from(userPermissions)
          .where(eq(userPermissions.userId, user.id));

        return {
          ...user,
          permissions: permissions.map(p => p.permission),
        };
      })
    );

    return NextResponse.json(usersWithPermissions);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users (admin only)
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { email, firstName, lastName, role, password } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password (you'll need to implement this)
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new user
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        firstName,
        lastName,
        role,
        passwordHash,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
