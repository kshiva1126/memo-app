import {
  ActionArgs,
  json,
  redirect,
  type LoaderArgs,
  type V2_MetaFunction,
} from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { InferModelFromColumns, InferSelectModel, eq, sql } from "drizzle-orm";
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
import { getAuthenticator } from "~/features/common/services/auth.server";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "Memo App" },
    { name: "description", content: "Welcome to Memo App!" },
  ];
};

export async function action({ request, context }: ActionArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect("/");
  }

  const body = await request.formData();

  const env = context.env as Env;
  const db = drizzle(env.DB);
  const data = await db
    .insert(memos)
    .values({
      user_id: user.id,
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

export async function loader({ request, context }: LoaderArgs) {
  const authenticator = getAuthenticator(context);
  const user = await authenticator.isAuthenticated(request);

  const env = context.env as Env;
  const db = drizzle(env.DB);
  let memoList: InferSelectModel<typeof memos>[] = [];
  if (user) {
    memoList = await db
      .select({
        id: memos.id,
        user_id: memos.user_id,
        title: memos.title,
        content: memos.content,
        // MEMO: SQLite は UTC で保存されるので、日本時間に変換する
        created_at: sql<string>`datetime(${memos.created_at}, '+9 hours')`,
        updated_at: sql<string>`datetime(${memos.updated_at}, '+9 hours')`,
      })
      .from(memos)
      .where(eq(memos.user_id, user?.id))
      .orderBy(sql`${memos.updated_at} DESC`);
  }

  return json({
    user,
    list: memoList,
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="p-4 lg:p-12 max-w-[1440px] mx-auto">
      <h1 className="text-xl">Memo App</h1>
      {data.user ? (
        <>
          <section className="mt-4">
            <div className="flex items-center">
              <p>ようこそ {data.user.display_name} さん</p>
              <Form className="ml-4" method="post" action="/auth/logout">
                <Button type="submit" variant={"secondary"}>
                  ログアウト
                </Button>
              </Form>
            </div>
          </section>
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
              {data.list.map((memo) => (
                <Link key={memo.id} to={`/memos/${memo.id}/edit`}>
                  <Card className="hover:shadow-md">
                    <CardHeader>
                      <CardTitle>{memo.title}</CardTitle>
                      <CardDescription>
                        {memo?.updated_at && (
                          <span>
                            {new Date(memo.updated_at).toLocaleString("ja-JP", {
                              timeZone: "Asia/Tokyo",
                            })}
                            に更新
                          </span>
                        )}
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
        </>
      ) : (
        <section className="mt-4">
          <Form method="post" action="/auth/google">
            <Button type="submit" variant={"outline"}>
              Login with Google
            </Button>
          </Form>
        </section>
      )}
    </div>
  );
}
