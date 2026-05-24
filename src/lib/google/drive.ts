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
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }
  const folder = await drive.files.create({
    requestBody: {
      name: CAVAFY_ROOT,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });
  return folder.data.id!;
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
    const metaRes = await drive.files.list({
      q: `'${folder.id}' in parents and name='${PROJECT_META_FILENAME}' and trashed=false`,
      fields: "files(id)",
    });
    if (metaRes.data.files && metaRes.data.files.length > 0) {
      const metaId = metaRes.data.files[0].id!;
      const content = await getFileContent(accessToken, metaId);
      try {
        projects.push(JSON.parse(content) as ProjectData);
      } catch {
        // corrupted meta, skip
      }
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
  const folderId = folderRes.data.id!;

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

  if (existing.data.files && existing.data.files.length > 0) {
    await drive.files.update({
      fileId: existing.data.files[0].id!,
      media,
    });
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
  return res.data.id!;
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
  return res.data.id!;
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
  await drive.files.update({
    fileId,
    media: { mimeType, body: content },
  });
}

export async function renameFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({
    fileId,
    requestBody: { name: newName },
  });
}

export async function trashFile(accessToken: string, fileId: string): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
  });
}
