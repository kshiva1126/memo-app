import {
  ActionArgs,
  json,
  redirect,
  type LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { memos } from "~/db/schema";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Memo App" },
    { name: "description", content: "Welcome to Memo App!" },
  ];
};

export async function action({ request, context }: ActionArgs) {
  const body = await request.formData();

  const env = context.env as Env;
  const db = drizzle(env.DB);
  const data = await db
    .insert(memos)
    .values({
      title: body.get("title") as string,
      content: "",
      created_at: sql`CURRENT_TIMESTAMP`,
      updated_at: sql`CURRENT_TIMESTAMP`,
    })
    .returning({
      id: memos.id,
    });

  return redirect(`/memos/${data[0].id}/edit`);
}

export async function loader({ context }: LoaderArgs) {
  const env = context.env as Env;
  const db = drizzle(env.DB);
  const data = await db
    .select()
    .from(memos)
    .orderBy(sql`${memos.updated_at} DESC`);

  return json(data);
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-4 lg:p-12">
      <h1 className="text-xl">Memo App</h1>
      <Form method="post" action="/?index" className="mt-4">
        <h2 className="text-lg">Create</h2>
        <div className="mt-2 flex w-full items-center space-x-2">
          <Input name="title" placeholder="タイトル" />
          <Button type="submit" className="shrink-0">
            作成
          </Button>
        </div>
      </Form>
      <section className="mt-4">
        <h2 className="text-lg">List</h2>
        <div className="mt-2 flex flex-col gap-2">
          {data.map((memo) => (
            <Link key={memo.id} to={`/memos/${memo.id}/edit`}>
              <Card className="hover:shadow-md">
                <CardHeader>
                  <CardTitle>{memo.title}</CardTitle>
                  <CardDescription>
                    <span>
                      {new Date(memo.updated_at).toLocaleString()}に更新
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="truncate">{memo.content}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
