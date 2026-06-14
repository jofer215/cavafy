// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDocument, loadProject } from "@/lib/google/drive";

type Params = { params: Promise<{ projectId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { projectId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, parentFolderId } = await req.json();
  const driveId = await createDocument(
    session.accessToken,
    parentFolderId ?? project.driveRootId,
    title ?? "Untitled"
  );
  return NextResponse.json({ driveId });
}
