import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { loadProject, saveProjectMeta } from "@/lib/google/drive";
import { ProjectData } from "@/lib/project/schema";

type Params = { params: Promise<{ projectId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as Partial<ProjectData>;
  const updated: ProjectData = {
    ...project,
    ...body,
    id: project.id,
    modified: new Date().toISOString(),
  };
  await saveProjectMeta(session.accessToken, project.driveRootId, updated);
  return NextResponse.json(updated);
}
