import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getPermissionsForRole, type Role } from './permissions';
import { debugAuthConfig } from './debug-auth';
import '../types/auth'; // Import to extend NextAuth types

// Debug the auth configuration
debugAuthConfig();
// Debug the session data

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (user.length === 0) {
            return null;
          }

          const userData = user[0];

          // Check if user is active
          if (!userData.isActive) {
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            userData.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Get user permissions (from role + any additional permissions)
          const rolePermissions = getPermissionsForRole(userData.role as Role);
          
          // Get additional permissions from database
          const additionalPermissions = await db
            .select()
            .from(userPermissions)
            .where(eq(userPermissions.userId, userData.id));

          const allPermissions = [
            ...rolePermissions,
            ...additionalPermissions.map(p => p.permission)
          ];

          // Remove duplicates
          const uniquePermissions = [...new Set(allPermissions)];

          // Update last login
          await db
            .update(users)
            .set({ 
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .where(eq(users.id, userData.id));

          const userToReturn = {
            id: userData.id,
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            permissions: uniquePermissions,
          };

          console.log('Authorize - Returning user:', userToReturn);
          return userToReturn;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // User object is only available on initial sign-in
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
      }
      
      return token;
    },
    async session({ session, token }) {      
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }
      
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
});

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
