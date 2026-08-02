import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  code: text("code").primaryKey(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Link = typeof links.$inferSelect;
