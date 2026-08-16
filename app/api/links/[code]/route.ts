import { NextResponse } from "next/server";
import { getUrl, deleteLink } from "@/lib/store";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const link = await getUrl(code);
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  if (link.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteLink(code, session.user.id);
  return NextResponse.json({ success: true }, { status: 200 });
}
