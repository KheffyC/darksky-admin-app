'use client';
import { useSession } from 'next-auth/react';
import { useAuth } from './auth/PermissionGuard';

export function SessionDebugger() {
  const { data: session, status } = useSession();
  const auth = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md text-xs overflow-auto max-h-96 z-50">
      <h3 className="font-bold mb-2">Session Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Session exists:</strong> {session ? 'Yes' : 'No'}
        </div>
        
        {session && (
          <>
            <div>
              <strong>User ID:</strong> {session.user?.id || 'undefined'}
            </div>
            
            <div>
              <strong>Email:</strong> {session.user?.email || 'undefined'}
            </div>
            
            <div>
              <strong>Name:</strong> {session.user?.name || 'undefined'}
            </div>
            
            <div>
              <strong>Role:</strong> {session.user?.role || 'undefined'}
            </div>
            
            <div>
              <strong>Permissions:</strong> 
              <pre className="mt-1 bg-gray-800 p-1 rounded text-xs">
                {JSON.stringify(session.user?.permissions || [], null, 2)}
              </pre>
            </div>
          </>
        )}
        
        <div className="border-t border-gray-600 pt-2">
          <strong>useAuth Hook:</strong>
          <pre className="mt-1 bg-gray-800 p-1 rounded text-xs">
            {JSON.stringify({
              isAuthenticated: auth.isAuthenticated,
              isLoading: auth.isLoading,
              role: auth.role,
              permissionsCount: auth.permissions.length
            }, null, 2)}
          </pre>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <strong>Raw Session:</strong>
          <pre className="mt-1 bg-gray-800 p-1 rounded text-xs">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
