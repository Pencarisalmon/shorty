import { NextResponse } from "next/server";
import { createShort } from "@/lib/store";
import { auth } from "@/lib/auth";

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
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return NextResponse.json({ error: "URL must start with http:// or https://" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const link = await createShort(url.toString(), session?.user.id);
  const base = process.env.BASE_URL ?? new URL(request.url).origin;
  return NextResponse.json(
    { code: link.code, shortUrl: `${base}/${link.code}` },
    { status: 201 }
  );
}
