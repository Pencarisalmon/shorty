import { NextResponse } from "next/server";
import { createShort } from "@/lib/store";

export async function POST(request: Request) {
  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url.trim() : "";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "URL harus http/https" }, { status: 400 });
  }

  const link = await createShort(url.toString());
  const base = process.env.BASE_URL ?? new URL(request.url).origin;
  return NextResponse.json(
    { code: link.code, shortUrl: `${base}/${link.code}` },
    { status: 201 }
  );
}
