import { google } from "googleapis";
import { createDefaultProject, ProjectData } from "@/lib/project/schema";

const CAVAFY_ROOT = "Cavafy";
const PROJECT_META_FILENAME = ".cavafy-project.json";

function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function getOrCreateCavafyRoot(accessToken: string): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.list({
    q: `name='${CAVAFY_ROOT}' and mimeType='application/vnd.google-apps.folder' and trashed=false and 'root' in parents`,
    fields: "files(id, name)",
    spaces: "drive",
  });
  const existingId = res.data.files?.[0]?.id;
  if (existingId) return existingId;

  const folder = await drive.files.create({
    requestBody: { name: CAVAFY_ROOT, mimeType: "application/vnd.google-apps.folder" },
    fields: "id",
  });
  if (!folder.data.id) throw new Error("Failed to create Cavafy root folder");
  return folder.data.id;
}

export async function listProjects(accessToken: string): Promise<ProjectData[]> {
  const drive = getDriveClient(accessToken);
  const rootId = await getOrCreateCavafyRoot(accessToken);

  const foldersRes = await drive.files.list({
    q: `'${rootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name, createdTime, modifiedTime)",
    orderBy: "modifiedTime desc",
  });

  const folders = foldersRes.data.files ?? [];
  const projects: ProjectData[] = [];

  for (const folder of folders) {
    if (!folder.id) continue;
    const metaRes = await drive.files.list({
      q: `'${folder.id}' in parents and name='${PROJECT_META_FILENAME}' and trashed=false`,
      fields: "files(id)",
    });
    const metaId = metaRes.data.files?.[0]?.id;
    if (!metaId) continue;
    const content = await getFileContent(accessToken, metaId);
    try {
      projects.push(JSON.parse(content) as ProjectData);
    } catch {
      // corrupted meta, skip
    }
  }
  return projects;
}

export async function createProject(accessToken: string, name: string): Promise<ProjectData> {
  const drive = getDriveClient(accessToken);
  const rootId = await getOrCreateCavafyRoot(accessToken);

  const folderRes = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [rootId],
    },
    fields: "id",
  });
  if (!folderRes.data.id) throw new Error("Failed to create project folder");
  const folderId = folderRes.data.id;

  const projectId = crypto.randomUUID();
  const projectData = createDefaultProject(projectId, name, folderId);

  await saveProjectMeta(accessToken, folderId, projectData);
  return projectData;
}

export async function saveProjectMeta(
  accessToken: string,
  folderId: string,
  data: ProjectData
): Promise<void> {
  const drive = getDriveClient(accessToken);

  const existing = await drive.files.list({
    q: `'${folderId}' in parents and name='${PROJECT_META_FILENAME}' and trashed=false`,
    fields: "files(id)",
  });

  const content = JSON.stringify(data, null, 2);
  const media = { mimeType: "application/json", body: content };
  const existingId = existing.data.files?.[0]?.id;

  if (existingId) {
    await drive.files.update({ fileId: existingId, media });
  } else {
    await drive.files.create({
      requestBody: {
        name: PROJECT_META_FILENAME,
        mimeType: "application/json",
        parents: [folderId],
      },
      media,
      fields: "id",
    });
  }
}

export async function loadProject(accessToken: string, projectId: string): Promise<ProjectData | null> {
  const projects = await listProjects(accessToken);
  return projects.find((p) => p.id === projectId) ?? null;
}

export async function createDocument(
  accessToken: string,
  parentFolderId: string,
  title: string
): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.create({
    requestBody: {
      name: title,
      mimeType: "application/vnd.google-apps.document",
      parents: [parentFolderId],
    },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Failed to create document");
  return res.data.id;
}

export async function createFolder(
  accessToken: string,
  parentFolderId: string,
  name: string
): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Failed to create folder");
  return res.data.id;
}

export async function getFileContent(accessToken: string, fileId: string): Promise<string> {
  const drive = getDriveClient(accessToken);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "text" }
  );
  return res.data as string;
}

export async function saveFileContent(
  accessToken: string,
  fileId: string,
  content: string,
  mimeType = "text/plain"
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({ fileId, media: { mimeType, body: content } });
}

export async function renameFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({ fileId, requestBody: { name: newName } });
}

export async function trashFile(accessToken: string, fileId: string): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({ fileId, requestBody: { trashed: true } });
}
