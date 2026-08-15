import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/lib/auth-schema";

export const links = pgTable("links", {
  code: text("code").primaryKey(),
  url: text("url").notNull(),
  ownerId: text("owner_id").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Link = typeof links.$inferSelect;
