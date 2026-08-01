import { NextResponse } from "next/server";
import { getUrl } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const link = getUrl(code);
  if (!link) {
    return NextResponse.json({ error: "Link tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.redirect(link.url, 307);
}
