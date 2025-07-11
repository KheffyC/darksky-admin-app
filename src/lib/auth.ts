import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { users, userPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getPermissionsForRole, type Role } from './permissions';
import '../types/auth'; // Import to extend NextAuth types

export const { handlers, auth, signIn, signOut } = NextAuth({
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

          return {
            id: userData.id,
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`,
            role: userData.role,
            permissions: uniquePermissions,
          };
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
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = user.role;
        (token as any).permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = (token as any).role;
        session.user.permissions = (token as any).permissions;
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
