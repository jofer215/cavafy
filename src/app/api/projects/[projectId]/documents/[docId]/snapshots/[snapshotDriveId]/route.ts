// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSnapshotContent } from "@/lib/google/drive";

type Params = { params: Promise<{ projectId: string; docId: string; snapshotDriveId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { snapshotDriveId } = await params;
  try {
    const content = await getSnapshotContent(session.accessToken, snapshotDriveId);
    return NextResponse.json({ content });
  } catch (e) {
    console.error(`Failed to load snapshot ${snapshotDriveId}:`, e);
    return NextResponse.json({ error: "Failed to load snapshot" }, { status: 500 });
  }
}
