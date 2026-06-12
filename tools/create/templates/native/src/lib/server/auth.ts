import { SvelteKitAuth, type DefaultSession } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import MicrosoftEntraID from '@auth/sveltekit/providers/microsoft-entra-id';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { userAccount } from '$lib/server/schema';
import {
  authUser,
  authAccount,
  authSession,
  authVerificationToken,
} from '$lib/server/auth-schema';

// Extend the Auth.js Session type to expose user.id (auth.user.id text) so
// auth-resolver.ts can map it to user_account.id without type assertions.
declare module '@auth/sveltekit' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
  }
}

// Lazy initialization (function form) so platform-provided env vars work in
// Cloudflare Workers and similar runtimes that inject env at request time.
export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  const {
    AUTH_SECRET,
    AUTH_MICROSOFT_ENTRA_ID_ID,
    AUTH_MICROSOFT_ENTRA_ID_SECRET,
    AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET,
    AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET,
  } = await import('$env/static/private');

  return {
    secret: AUTH_SECRET,
    trustHost: true,
    adapter: DrizzleAdapter(db, {
      usersTable: authUser,
      accountsTable: authAccount,
      sessionsTable: authSession,
      verificationTokensTable: authVerificationToken,
    }),
    providers: [
      MicrosoftEntraID({
        clientId: AUTH_MICROSOFT_ENTRA_ID_ID,
        clientSecret: AUTH_MICROSOFT_ENTRA_ID_SECRET,
        issuer: AUTH_MICROSOFT_ENTRA_ID_ISSUER,
      }),
      Google({
        clientId: AUTH_GOOGLE_ID,
        clientSecret: AUTH_GOOGLE_SECRET,
      }),
      GitHub({
        clientId: AUTH_GITHUB_ID,
        clientSecret: AUTH_GITHUB_SECRET,
      }),
    ],
    callbacks: {
      session({ session, user }) {
        // Propagate the database user ID into the session so auth-resolver.ts
        // can look up public.user_account.auth_user_id without an extra query.
        session.user.id = user.id;
        return session;
      },
    },
    events: {
      // Provision a public.user_account row the first time a user signs in.
      // Auth.js has already created auth.user at this point, so auth_user_id
      // is guaranteed to exist. Idempotent — safe if called more than once.
      createUser: async ({ user }) => {
        if (!user.id) return;
        const existing = await db
          .select({ id: userAccount.id })
          .from(userAccount)
          .where(eq(userAccount.authUserId, user.id))
          .limit(1);
        if (existing.length === 0) {
          await db.insert(userAccount).values({ authUserId: user.id });
        }
      },
    },
  };
});
