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

  // Guard against client sending malformed core fields
  if (body.binder !== undefined && !Array.isArray(body.binder))
    return NextResponse.json({ error: "Invalid binder" }, { status: 400 });
  if (body.statuses !== undefined && !Array.isArray(body.statuses))
    return NextResponse.json({ error: "Invalid statuses" }, { status: 400 });
  if (body.labels !== undefined && !Array.isArray(body.labels))
    return NextResponse.json({ error: "Invalid labels" }, { status: 400 });
  if (body.metadata !== undefined && (typeof body.metadata !== "object" || Array.isArray(body.metadata)))
    return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });

  const updated: ProjectData = {
    ...project,
    ...body,
    id: project.id,
    driveRootId: project.driveRootId,
    modified: new Date().toISOString(),
  };
  await saveProjectMeta(session.accessToken, project.driveRootId, updated);
  return NextResponse.json(updated);
}
