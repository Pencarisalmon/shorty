import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { randomBytes } from "crypto";
import { join } from "path";

type Link = { code: string; url: string; createdAt: string };

const DB_FILE = join(process.cwd(), "data", "links.json");

// ponytail: JSON file storage; concurrent writes race, swap to SQLite if traffic matters
function readAll(): Record<string, Link> {
  try {
    return JSON.parse(readFileSync(DB_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(links: Record<string, Link>) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(links, null, 2));
}

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function genCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export function createShort(url: string): { code: string; url: string; createdAt: string } {
  const links = readAll();
  let code = genCode();
  while (links[code]) code = genCode();
  const link: Link = { code, url, createdAt: new Date().toISOString() };
  links[code] = link;
  writeAll(links);
  return link;
}

export function getUrl(code: string): Link | undefined {
  return readAll()[code];
}
