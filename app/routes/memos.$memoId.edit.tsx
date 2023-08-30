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
import { sql } from "drizzle-orm";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/use-toast";

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

export async function loader({ params, context }: LoaderArgs) {
  const env = context.env as Env;
  const db = drizzle(env.DB);
  const memoId = Number(params.memoId as string);

  if (Number.isNaN(memoId)) {
    return redirect("/memos");
  }

  const data = await db
    .select()
    .from(memos)
    .where(sql`id = ${memoId}`)
    .get();

  if (!data) {
    // 空のデータを作成する
    await db.insert(memos).values({
      id: memoId,
      title: "",
      content: "",
      created_at: sql`CURRENT_TIMESTAMP`,
      updated_at: sql`CURRENT_TIMESTAMP`,
    });
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
            登録する
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link to="/">戻る</Link>
          </Button>
        </div>
      </Form>
    </div>
  );
}
