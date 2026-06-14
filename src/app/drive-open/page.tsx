// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFileContent } from "@/lib/google/drive";

interface Props {
  searchParams: Promise<{ state?: string }>;
}

// Handles Google Drive "Open With" redirects.
// Google sends: /drive-open?state=BASE64_JSON
// State shape: { action: "open", ids: [fileId], userId: string }
export default async function DriveOpenPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.accessToken) {
    const { state } = await searchParams;
    const callbackUrl = `/drive-open${state ? `?state=${encodeURIComponent(state)}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  const { state } = await searchParams;
  if (!state) redirect("/projects");

  try {
    const parsed = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));

    if (parsed.action === "open" && parsed.ids?.[0]) {
      // The file opened is a .cavafy-project.json — read it to get the project ID
      const content = await getFileContent(session.accessToken, parsed.ids[0]);
      const project = JSON.parse(content);
      if (project?.id) redirect(`/${project.id}`);
    }
  } catch {
    // Malformed state — fall through to projects list
  }

  redirect("/projects");
}
