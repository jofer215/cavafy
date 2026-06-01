import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createSnapshotFile, loadProject, saveProjectMeta } from "@/lib/google/drive";
import { Snapshot } from "@/lib/project/schema";

type Params = { params: Promise<{ projectId: string; docId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId, docId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, content, nodeId } = await req.json();
  if (!name || typeof content !== "string" || !nodeId) {
    return NextResponse.json({ error: "name, content, and nodeId are required" }, { status: 400 });
  }

  const driveId = await createSnapshotFile(
    session.accessToken,
    project.driveRootId,
    `${docId}_${Date.now()}`,
    content
  );

  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    driveId,
  };

  const existing = project.snapshots?.[nodeId] ?? [];
  const updated = {
    ...project,
    snapshots: { ...project.snapshots, [nodeId]: [...existing, snapshot] },
    modified: new Date().toISOString(),
  };
  await saveProjectMeta(session.accessToken, project.driveRootId, updated);

  return NextResponse.json({ snapshot });
}
