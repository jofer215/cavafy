import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileContent, saveFileContent } from "@/lib/google/drive";

type Params = { params: Promise<{ projectId: string; docId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { docId } = await params;
  try {
    const content = await getFileContent(session.accessToken, docId);
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "" });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { docId } = await params;
  const { content } = await req.json();
  await saveFileContent(session.accessToken, docId, content, "text/html");
  return NextResponse.json({ ok: true });
}
