import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  profile_id: text("profile_id").notNull(),
  icon_url: text("icon_url").notNull(),
  display_name: text("display_name").notNull(),
  created_at: text("created_at")
    .default(sql`(DATETIME('now', 'localtime'))`)
    .notNull(),
});

export const memos = sqliteTable("memos", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  user_id: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  created_at: text("created_at")
    .default(sql`(DATETIME('now', 'localtime'))`)
    .notNull(),
  updated_at: text("updated_at")
    .default(sql`(DATETIME('now', 'localtime'))`)
    .notNull(),
});
