import { ActionArgs, redirect } from "@remix-run/cloudflare";
import { and, eq } from "drizzle-orm";
import { memos } from "~/db/schema";
import { getAuthenticator } from "~/features/common/services/auth.server";
import { createClient } from "~/features/common/services/db.server";

export const loader = () => redirect("/");

export const action = async ({ request, params, context }: ActionArgs) => {
  const memoId = Number(params.memoId as string);
  if (Number.isNaN(memoId)) {
    return redirect("/");
  }

  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/");
  }

  const db = createClient(context);
  await db
    .delete(memos)
    .where(and(eq(memos.user_id, user.id), eq(memos.id, memoId)));

  return redirect("/");
};
