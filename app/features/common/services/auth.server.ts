import type { AppLoadContext } from "@remix-run/cloudflare";
import {
  createCookie,
  createWorkersKVSessionStorage,
} from "@remix-run/cloudflare";

import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { users } from "~/db/schema";
import { InferInsertModel, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

export type AuthUser = {
  id: number;
  profile_id: string;
  icon_url: string;
  display_name: string;
};

type CreateUser = InferInsertModel<typeof users>;

let _authenticator: Authenticator<AuthUser> | undefined;
export function getAuthenticator(
  context: AppLoadContext,
): Authenticator<AuthUser> {
  if (_authenticator == null) {
    const env = context.env as Env;
    const cookie = createCookie("__session", {
      secrets: [env.SESSION_SECRET],
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
    });

    const sessionStorage = createWorkersKVSessionStorage({
      kv: env.SESSION_KV as KVNamespace,
      cookie,
    });
    _authenticator = new Authenticator<AuthUser>(sessionStorage);
    const googleAuth = new GoogleStrategy(
      {
        clientID: env.GOOGLE_AUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_AUTH_CLIENT_SECRET,
        callbackURL: env.GOOGLE_AUTH_CALLBACK_URL,
      },
      async ({ profile }) => {
        console.log({ profile });
        const env = context.env as Env;
        const db = drizzle(env.DB);
        const user = await db
          .select()
          .from(users)
          .where(eq(users.profile_id, profile.id))
          .get();
        if (user) return user as AuthUser;

        const ret = await db
          .insert(users)
          .values({
            profile_id: profile.id,
            icon_url: profile.photos?.[0].value,
            display_name: profile.displayName,
            created_at: sql`CURRENT_TIMESTAMP`,
          })
          .returning()
          .get();

        return {
          id: ret.id,
          profile_id: profile.id,
          icon_url: profile.photos?.[0].value,
          display_name: profile.displayName,
        };
      },
    );
    _authenticator.use(googleAuth);
  }
  return _authenticator;
}
