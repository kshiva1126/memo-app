import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: text("created_at")
    .default(sql`(DATETIME('now', 'localtime'))`)
    .notNull(),
  updated_at: text("updated_at")
    .default(sql`(DATETIME('now', 'localtime'))`)
    .notNull(),
});
