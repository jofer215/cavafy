import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listProjects, createProject } from "@/lib/google/drive";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projects = await listProjects(session.accessToken);
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const project = await createProject(session.accessToken, name.trim());
  return NextResponse.json(project, { status: 201 });
}
