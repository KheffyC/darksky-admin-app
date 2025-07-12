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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission={PERMISSIONS.MANAGE_USERS}>
      <div className="py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">User Management</h1>
            <p className="text-lg sm:text-xl text-gray-300">Manage user access and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 mb-8 border border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
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
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No users found matching your criteria.</p>
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
      <tr className="hover:bg-gray-700/50 transition-colors duration-200">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                {user.firstName} {user.lastName}
                {isCurrentUser && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full">
                    You
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <select
            value={user.role}
            onChange={(e) => onUpdateRole(user.id, e.target.value as Role)}
            disabled={isCurrentUser || isSaving}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                ? 'bg-green-600/20 text-green-400 border border-green-400/30 hover:bg-green-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-400/30 hover:bg-red-600/30'
            }`}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td className="px-6 py-4">
          <button
            onClick={() => setShowPermissions(!showPermissions)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-2"
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
        <td className="px-6 py-4 text-sm text-gray-400">
          {formatDate(user.lastLoginAt)}
        </td>
      </tr>
      {showPermissions && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-800/50">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white mb-3">
                Custom Permissions for {user.firstName} {user.lastName}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allPermissions.map((permission) => {
                  const hasPermission = user.permissions?.includes(permission) || false;
                  const rolePermissions = getPermissionsForRole(user.role);
                  const hasFromRole = rolePermissions.includes(permission);
                  
                  return (
                    <label
                      key={permission}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                        hasFromRole
                          ? 'bg-blue-600/10 border-blue-400/30 cursor-not-allowed'
                          : hasPermission
                          ? 'bg-green-600/10 border-green-400/30 hover:bg-green-600/20'
                          : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={hasPermission || hasFromRole}
                        onChange={() => !hasFromRole && onTogglePermission(user.id, permission)}
                        disabled={hasFromRole || isSaving}
                        className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                      />
                      <span className={`text-sm ${hasFromRole ? 'text-blue-400' : 'text-gray-300'}`}>
                        {permission.replace(/_/g, ' ').toUpperCase()}
                        {hasFromRole && (
                          <span className="ml-2 text-xs text-blue-400">(from role)</span>
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
    role: ROLES.MEMBER as Role,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={ROLES.MEMBER}>Member</option>
              <option value={ROLES.DIRECTOR}>Director</option>
              <option value={ROLES.ADMIN}>Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Temporary password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
