/**
 * Authentication and Authorization Constants
 * Define all permissions and role-based access control
 */

export const PERMISSIONS = {
  // User Management (Admin only)
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Financial Management (Admin + Directors)
  VIEW_ALL_PAYMENTS: 'view_all_payments',
  EDIT_TUITION: 'edit_tuition',
  PROCESS_PAYMENTS: 'process_payments',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  EXPORT_DATA: 'export_data',
  
  // Member Management (Admin + Directors)
  ADD_MEMBERS: 'add_members',
  EDIT_MEMBERS: 'edit_members',
  DELETE_MEMBERS: 'delete_members',
  VIEW_MEMBER_DETAILS: 'view_member_details',
  
  // System Settings (Admin only)
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Personal Access (All authenticated users)
  VIEW_OWN_PROFILE: 'view_own_profile',
  EDIT_OWN_PROFILE: 'edit_own_profile',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  MEMBER: 'member',
} as const;

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.DIRECTOR]: [
    PERMISSIONS.VIEW_ALL_PAYMENTS,
    PERMISSIONS.EDIT_TUITION,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.ADD_MEMBERS,
    PERMISSIONS.EDIT_MEMBERS,
    PERMISSIONS.VIEW_MEMBER_DETAILS,
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
  ],
  [ROLES.MEMBER]: [
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
  ],
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return [...(ROLE_PERMISSIONS[role] as readonly Permission[])];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

/**
 * Check if user has a specific role
 */
export function hasRole(userRole: string | undefined, role: Role): boolean {
  return userRole === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(userRole: string | undefined, roles: Role[]): boolean {
  if (!userRole) return false;
  return roles.includes(userRole as Role);
}
