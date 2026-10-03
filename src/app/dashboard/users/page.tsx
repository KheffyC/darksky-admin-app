'use client';
import { useEffect, useState } from 'react';
import { PermissionGuard, useAuth } from '@/components/auth/PermissionGuard';
import { PERMISSIONS, ROLES, getPermissionsForRole, type Permission, type Role } from '@/lib/permissions';
import { useToastNotifications } from '@/hooks/useToastNotifications';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  permissions: Permission[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user: currentUser } = useAuth();
  const { success: showToast } = useToastNotifications();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        showToast('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showToast]);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    setSaving(userId);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      showToast('User updated successfully');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      showToast(error.message || 'Failed to update user');
    } finally {
      setSaving(null);
    }
  };

  const updateUserRole = (userId: string, newRole: Role) => {
    const rolePermissions = getPermissionsForRole(newRole);
    updateUser(userId, { 
      role: newRole,
      permissions: rolePermissions 
    });
  };

  const toggleUserPermission = (userId: string, permission: Permission) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentPermissions = user.permissions || [];
    const hasPermission = currentPermissions.includes(permission);
    
    const newPermissions = hasPermission
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    updateUser(userId, { permissions: newPermissions });
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    updateUser(userId, { isActive: !user.isActive });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const allPermissions = Object.values(PERMISSIONS);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="text-xl text-ink">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
      <div className="py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-3 text-3xl font-bold tracking-[-0.03em] text-ink sm:text-4xl">User Management</h1>
            <p className="text-lg text-muted sm:text-xl">Manage user access and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl border border-ink bg-ink px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-ink-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-line bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              >
                <option value="">All Roles</option>
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.DIRECTOR}>Director</option>
                <option value={ROLES.MEMBER}>Member</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-wash">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    currentUser={currentUser}
                    allPermissions={allPermissions}
                    onUpdateRole={updateUserRole}
                    onTogglePermission={toggleUserPermission}
                    onToggleStatus={toggleUserStatus}
                    isSaving={saving === user.id}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted">No users found matching your criteria.</p>
          </div>
        )}

        {/* Add User Modal */}
        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              // Refetch users
              window.location.reload();
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

interface UserRowProps {
  user: User;
  currentUser: any;
  allPermissions: Permission[];
  onUpdateRole: (userId: string, role: Role) => void;
  onTogglePermission: (userId: string, permission: Permission) => void;
  onToggleStatus: (userId: string) => void;
  isSaving: boolean;
}

function UserRow({
  user,
  currentUser,
  allPermissions,
  onUpdateRole,
  onTogglePermission,
  onToggleStatus,
  isSaving
}: UserRowProps) {
  const [showPermissions, setShowPermissions] = useState(false);
  const isCurrentUser = currentUser?.id === user.id;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <tr className="transition-colors duration-200 hover:bg-wash">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ink">
                <span className="font-semibold text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                {user.firstName} {user.lastName}
                {isCurrentUser && (
                  <span className="rounded-full border border-line bg-white px-2 py-1 text-xs text-ink">
                    You
                  </span>
                )}
              </div>
              <div className="text-sm text-muted">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <select
            value={user.role}
            onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
            disabled={isCurrentUser || isSaving}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
          >
            <option value={ROLES.ADMIN}>Admin</option>
            <option value={ROLES.DIRECTOR}>Director</option>
            <option value={ROLES.MEMBER}>Member</option>
          </select>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => onToggleStatus(user.id)}
            disabled={isCurrentUser || isSaving}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              user.isActive
                ? 'border border-ink bg-ink text-white hover:bg-ink-hover'
                : 'border border-line-strong bg-white text-muted hover:border-ink'
            }`}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setShowPermissions(!showPermissions)}
            className="flex items-center gap-2 text-sm font-medium text-ink hover:text-muted"
          >
            {user.permissions?.length || 0} custom permissions
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${showPermissions ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </td>
        <td className="px-6 py-4 text-sm text-muted">
          {formatDate(user.lastLoginAt)}
        </td>
      </tr>
      {showPermissions && (
        <tr>
          <td colSpan={5} className="bg-wash px-6 py-4">
            <div className="space-y-4">
              <h4 className="mb-3 text-lg font-semibold text-ink">
                Custom Permissions for {user.firstName} {user.lastName}
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {allPermissions.map((permission) => {
                  const hasPermission = user.permissions?.includes(permission) || false;
                  const rolePermissions = getPermissionsForRole(user.role);
                  const hasFromRole = rolePermissions.includes(permission);
                  
                  return (
                    <label
                      key={permission}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                        hasFromRole
                          ? 'cursor-not-allowed border-line bg-canvas'
                          : hasPermission
                          ? 'border-ink bg-white hover:bg-wash'
                          : 'border-line bg-white hover:bg-wash'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasPermission || hasFromRole}
                        onChange={() => !hasFromRole && onTogglePermission(user.id, permission)}
                        disabled={hasFromRole || isSaving}
                        className="h-4 w-4 rounded border-line bg-white text-ink focus:ring-2 focus:ring-ink/10 disabled:opacity-50"
                      />
                      <span className={`text-sm ${hasFromRole ? 'text-muted' : 'text-ink'}`}>
                        {permission.replace(/_/g, ' ').toUpperCase()}
                        {hasFromRole && (
                          <span className="ml-2 text-xs text-muted">(from role)</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

interface AddUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddUserModal({ onClose, onSuccess }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: ROLES.DIRECTOR as Role,
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { success: showToast } = useToastNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      showToast('User created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      showToast(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6">
        <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-ink">Add New User</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-white p-2 text-muted transition-colors duration-200 hover:bg-wash hover:text-ink"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                placeholder="John"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
            >
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.DIRECTOR}>Director</option>
              <option value={ROLES.MEMBER}>Member</option>
            </select>
            <p className="mt-2 text-xs text-muted">
              {formData.role === ROLES.ADMIN && 'Everything, including settings, integrations, and adding users.'}
              {formData.role === ROLES.DIRECTOR && 'Members, payments, and reports. No settings or user management.'}
              {formData.role === ROLES.MEMBER && 'Only their own profile.'}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
              placeholder="Temporary password (8+ characters)"
            />
          </div>

          <div className="flex gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-ink transition-colors duration-200 hover:bg-wash disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl border border-ink bg-ink px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
