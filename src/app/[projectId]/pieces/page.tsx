import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { loadProject } from "@/lib/google/drive";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default async function PiecesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const { projectId } = await params;
  const project = await loadProject(session.accessToken, projectId);
  if (!project) redirect("/projects");

  return <WorkspaceShell initialProject={project} initialView="pieces" />;
}
