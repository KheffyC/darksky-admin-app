import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, userPermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PERMISSIONS, ROLES, hasRole, getPermissionsForRole } from '@/lib/permissions';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users (admin only)
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { role, permissions: customPermissions, isActive } = await request.json();
    const userId = params.id;

    // Prevent user from demoting themselves
    if (userId === session.user.id && role !== ROLES.ADMIN) {
      return NextResponse.json({ 
        error: 'Cannot demote yourself from admin role' 
      }, { status: 400 });
    }

    // Update user role and active status
    await db
      .update(users)
      .set({
        role,
        isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    // Clear existing custom permissions
    await db
      .delete(userPermissions)
      .where(eq(userPermissions.userId, userId));

    // Add custom permissions if provided
    if (customPermissions && customPermissions.length > 0) {
      const permissionInserts = customPermissions.map((permission: string) => ({
        id: crypto.randomUUID(),
        userId,
        permission,
        grantedBy: session.user.id,
        createdAt: new Date().toISOString(),
      }));

      await db.insert(userPermissions).values(permissionInserts);
    }

    // Fetch updated user data
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const permissions = await db
      .select({ permission: userPermissions.permission })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));

    return NextResponse.json({
      ...updatedUser,
      permissions: permissions.map(p => p.permission),
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users (admin only)
    if (!hasRole(session.user.role, ROLES.ADMIN)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const userId = params.id;

    // Prevent user from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json({ 
        error: 'Cannot deactivate your own account' 
      }, { status: 400 });
    }

    // Deactivate user instead of deleting
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Failed to deactivate user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
