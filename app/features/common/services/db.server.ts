import { AppLoadContext } from "@remix-run/cloudflare";
import { drizzle } from "drizzle-orm/d1";

export function createClient(context: AppLoadContext) {
  const env = context.env as Env;
  return drizzle(env.DB);
}
