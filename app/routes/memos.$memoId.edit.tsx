import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { Editor } from "~/components/Editor";
import { Button } from "~/components/ui/button";
import { drizzle } from "drizzle-orm/d1";
import { memos } from "~/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";
import { getAuthenticator } from "~/features/common/services/auth.server";

export async function action({ request, context }: ActionArgs) {
  const body = await request.formData();

  const env = context.env as Env;
  const db = drizzle(env.DB);
  await db
    .update(memos)
    .set({
      title: body.get("title") as string,
      content: body.get("content") as string,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .where(sql`id = ${body.get("id")}`);

  return json({
    message: "success",
  });
}

export async function loader({ request, params, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/");
  }

  const env = context.env as Env;
  const db = drizzle(env.DB);
  const memoId = Number(params.memoId as string);

  if (Number.isNaN(memoId)) {
    return redirect("/");
  }

  const data = await db
    .select()
    .from(memos)
    .where(and(eq(memos.user_id, user.id), eq(memos.id, memoId)))
    .get();

  if (!data) {
    return redirect("/");
  }

  return json({
    title: data?.title ?? "",
    content: data?.content ?? "",
  });
}

export default function Edit() {
  const { toast } = useToast();
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  useEffect(() => {
    if (actionData?.message === "success") {
      toast({
        title: "保存しました",
      });
    }
  }, [actionData]);

  const [title, setTitle] = useState<string>(loaderData.title);
  const [content, setContent] = useState<string>(loaderData.content);
  const params = useParams();
  const id = params.memoId;

  return (
    <div className="p-4 lg:p-12">
      <Form method="post" action={`/memos/${id}/edit`}>
        <input type="hidden" name="id" value={id} />
        <Input
          name="title"
          value={title}
          placeholder="タイトル"
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="mt-2">
          <Editor value={content} setValue={setContent} />
        </div>
        <textarea name="content" hidden readOnly value={content} />
        <div className="mt-2 px-12 flex flex-col items-center gap-2">
          <Button className="w-full" type="submit">
            保存する
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link to="/">一覧に戻る</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
