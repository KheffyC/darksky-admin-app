import { useSession } from 'next-auth/react';
import { hasPermission, hasRole } from '@/lib/permissions';
import type { Permission, Role } from '@/lib/permissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission;
  role?: Role;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions or role
 */
export function PermissionGuard({ 
  children, 
  permission, 
  role, 
  fallback = null 
}: PermissionGuardProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    console.log('User not authenticated, rendering fallback');
    return <>{fallback}</>;
  }

  const userPermissions = session.user.permissions || [];
  const userRole = session.user.role;

  // Check permission if specified
  if (permission && !hasPermission(userPermissions, permission)) {
    return <>{fallback}</>;
  }

  // Check role if specified
  if (role && !hasRole(userRole, role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has a specific permission
 */
export function usePermission(permission: Permission): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return false;
  }

  const userPermissions = session.user.permissions || [];
  return hasPermission(userPermissions, permission);
}

/**
 * Hook to check if current user has a specific role
 */
export function useRole(role: Role): boolean {
  const { data: session } = useSession();
  
  if (!session?.user) {
    return false;
  }

  return hasRole(session.user.role, role);
}

/**
 * Hook to get current user's permissions and role
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    permissions: session?.user?.permissions || [],
    role: session?.user?.role,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
  };
}
