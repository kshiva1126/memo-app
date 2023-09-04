import { LoaderArgs, redirect } from "@remix-run/cloudflare";
import { and, eq } from "drizzle-orm";
import { memos } from "~/db/schema";
import { getAuthenticator } from "~/features/common/services/auth.server";
import { createClient } from "~/features/common/services/db.server";

export const loader = async ({ request, params, context }: LoaderArgs) => {
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
  const data = await db
    .select()
    .from(memos)
    .where(and(eq(memos.user_id, user.id), eq(memos.id, memoId)))
    .get();

  if (!data) {
    return redirect("/");
  }

  // Markdown ファイルをダウンロードさせる
  return new Response(data.content, {
    headers: {
      "Content-Disposition": `attachment; filename="${data.title}.md"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
