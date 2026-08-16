import { NextResponse } from "next/server";
import { listLinks } from "@/lib/store";

export async function GET(request: Request) {
  const links = await listLinks();
  const base = process.env.BASE_URL ?? new URL(request.url).origin;
  return NextResponse.json({
    links: links.map((link) => ({
      code: link.code,
      url: link.url,
      shortUrl: `${base}/${link.code}`,
      createdAt: link.createdAt.toISOString(),
      ownerId: link.ownerId,
    })),
  });
}
