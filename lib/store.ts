import { eq, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { links, type Link } from "@/lib/schema";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function genCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

// ponytail: retry loop as unique-violation backstop; 62^6 codes, collisions near-impossible
const MAX_RETRIES = 5;

export async function createShort(url: string): Promise<Link> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = genCode();
    const inserted = await db
      .insert(links)
      .values({ code, url })
      .onConflictDoNothing()
      .returning();
    if (inserted[0]) return inserted[0];
  }
  throw new Error("Gagal generate kode unik");
}

export async function getUrl(code: string): Promise<Link | undefined> {
  const rows = await db.select().from(links).where(eq(links.code, code));
  return rows[0];
}

const LIST_LIMIT = 10;

export async function listLinks(): Promise<Link[]> {
  return db.select().from(links).orderBy(desc(links.createdAt)).limit(LIST_LIMIT);
}
