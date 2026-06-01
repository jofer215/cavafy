# Cavafy

An open-source novel writing application for serious writers, powered by Google Drive.

Write from anywhere — Mac, iPad, Linux, or any browser — with your work always organized and safe in your own Google Drive.

---

## Features

- **Google OAuth** — sign in with your Google account; all files live in *your* Drive, not ours
- **Binder** — collapsible tree (folders, chapters, scenes) with drag-to-reorder, rename, active/inactive toggle, archive folder, and label color-coding
- **TipTap editor** — distraction-free prose editor with auto-save to Google Drive every 1.5s
- **Scrivenings view** — select a folder to read all its scenes as one continuous scroll
- **Inspector** — per-document status, label, synopsis, notes, tags, and references
- **Tags & References** — `@pov`, `@char`, `@location`, `@plot` etc. per scene; References panel shows every scene a tag value appears in
- **Plot Grid** — matrix of plot lines × scenes with per-cell notes
- **Corkboard** — index card view per folder; drag to reorder scenes
- **Outliner** — spreadsheet table: Title, Status, Label, Words, Synopsis, POV, Characters, Location
- **PWA** — installable on macOS, iPadOS, Linux; works in any browser without install

## Roadmap

- **Phase 2 (in progress)**: Snapshots, Collections, Split screen, Document merge, Word count goals
- **Phase 3**: Distraction-free mode, Dialogue Focus, Bookmarks, Annotations
- **Phase 4**: Compile & Export (PDF/DOCX/ePub), ProWritingAid integration, Templates

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- A **Google account**
- A **Google Cloud project** (free)

---

### 1. Clone and install

```bash
git clone https://github.com/jofer215/cavafy.git
cd cavafy
npm install
```

---

### 2. Google Cloud setup

#### Create OAuth credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project (e.g. `cavafy-dev`)
2. Navigate to **APIs & Services → Library** and enable **Google Drive API**
3. Navigate to **APIs & Services → OAuth consent screen**
   - Choose **External**
   - Fill in app name, support email, developer email
   - Add scope: `https://www.googleapis.com/auth/drive.file`
   - Under **Test users**, add your own Google email
4. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

---

### 3. Environment variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Fill in the values:

```env
# From Google Cloud Console → Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret

# Generate with: openssl rand -base64 32
AUTH_SECRET=your-random-secret

# Local dev URL
NEXTAUTH_URL=http://localhost:3000
```

---

### 4. macOS TLS fix (if needed)

On macOS, Node.js may fail to verify Google's SSL certificate if you have a VPN, iCloud Private Relay, or certain network extensions active. The `npm run dev` script already sets `NODE_EXTRA_CA_CERTS` automatically, but you need to generate the cert bundle once:

```bash
security export -t certs -f pemseq \
  -k /System/Library/Keychains/SystemRootCertificates.keychain \
  > ~/.cavafy-ca-bundle.pem
```

You only need to do this once (or after a macOS update if the issue recurs).

**Linux/Windows:** Not needed — Node.js uses the system cert store by default on those platforms. Remove the `NODE_EXTRA_CA_CERTS=...` prefix from the `dev` script in `package.json` if it causes problems.

---

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and create your first project.

---

### 6. Deploy to Vercel

```bash
npx vercel
```

In the Vercel dashboard, add the same environment variables from `.env.local`, then:

1. In Google Cloud Console → Credentials → your OAuth client, add your Vercel URL to:
   - **Authorized JavaScript origins**: `https://your-app.vercel.app`
   - **Authorized redirect URIs**: `https://your-app.vercel.app/api/auth/callback/google`
2. Set `NEXTAUTH_URL=https://your-app.vercel.app` in the Vercel environment variables

---

## Project structure

```
src/
  app/                        # Next.js App Router pages and API routes
    [projectId]/              # Main workspace (editor, corkboard, outliner, plot-grid)
    api/projects/             # REST API (projects CRUD, document read/write)
    login/                    # Sign-in page
  components/
    binder/                   # Binder tree
    editor/                   # TipTap editor, Scrivenings view
    inspector/                # Inspector panel (meta, tags, synopsis, notes, references)
    corkboard/                # Index card grid
    outliner/                 # Spreadsheet table view
    plot-grid/                # Plot × scene matrix
    workspace/                # Top nav, view routing
  lib/
    google/drive.ts           # Google Drive API client
    project/schema.ts         # TypeScript types for all project data
  store/project.ts            # Zustand store
  auth.ts                     # NextAuth v5 config
  middleware.ts               # Auth redirect guard
```

## Data model (Google Drive layout)

All data lives in the user's own Google Drive — Cavafy never stores your writing on its own servers.

```
My Drive/
  Cavafy/
    [Your Project Name]/
      .cavafy-project.json    <- binder tree, metadata, labels, statuses, plot grid
      Scene 1.html            <- TipTap HTML per document
      Scene 2.html
      ...
```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth | NextAuth.js v5 (Auth.js) |
| Storage | Google Drive API v3 |
| Editor | TipTap (ProseMirror) |
| State | Zustand |
| PWA | Web App Manifest |

---

## Contributing

PRs welcome. Open an issue first for anything substantial. The plan file at `.claude/plans/` has the full feature roadmap if you want context on what's coming next.

## License

GPL v3

---

*Named after Constantine P. Cavafy (1863–1933), Greek poet.*
