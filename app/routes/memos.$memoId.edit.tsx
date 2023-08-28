import { ActionArgs, LoaderArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";
import { Editor } from "~/components/Editor";
import { Button } from "~/components/ui/button";
import { drizzle } from "drizzle-orm/d1";
import { memos } from "~/db/schema";
import { sql } from "drizzle-orm";
import { Input } from "~/components/ui/input";

interface Env {
  DB: D1Database;
}

export async function action({ request, context }: ActionArgs) {
  const body = await request.formData();
  console.log(body.get("content"));

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

  return redirect(`/memos/${body.get("id")}/edit`);
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
  const data = useLoaderData<typeof loader>();

  const [title, setTitle] = useState<string>(data.title);
  const [content, setContent] = useState<string>(data.content);
  const params = useParams();
  const id = params.memoId;

  return (
    <Form method="post" action={`/memos/${id}/edit`}>
      <input type="hidden" name="id" value={id} />
      <Input
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Editor value={content} setValue={setContent} />
      <textarea name="content" hidden readOnly value={content} />
      <Button type="submit">登録する</Button>
    </Form>
  );
}
