// Debug utility for NextAuth issues
export function debugAuthConfig() {
  console.log('=== NextAuth Debug Info ===');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
  console.log('NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length || 0);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('============================');
}

export function debugSessionData(session: any, token: any) {
  console.log('=== Session Debug ===');
  console.log('Session exists:', !!session);
  console.log('Session user:', session?.user);
  console.log('Token exists:', !!token);
  console.log('Token sub:', token?.sub);
  console.log('Token role:', token?.role);
  console.log('Token permissions:', token?.permissions);
  console.log('===================');
}
