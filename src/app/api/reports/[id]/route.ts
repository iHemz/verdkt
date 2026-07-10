// Manage a published report. DELETE unpublishes it, given the manage token.

import { NextResponse, type NextRequest } from "next/server";
import { getStore, isValidId } from "@/lib/reports";

export const runtime = "nodejs";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!token) return NextResponse.json({ error: "Missing manage token." }, { status: 400 });

  const removed = await (await getStore()).remove(id, token);
  if (!removed) return NextResponse.json({ error: "Wrong token or already gone." }, { status: 403 });

  return NextResponse.json({ removed: true });
}
