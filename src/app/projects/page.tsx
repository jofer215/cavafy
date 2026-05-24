import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listProjects } from "@/lib/google/drive";
import { ProjectLibrary } from "@/components/workspace/ProjectLibrary";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");

  const projects = await listProjects(session.accessToken);

  return <ProjectLibrary initialProjects={projects} />;
}
