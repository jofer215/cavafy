# Cavafy

An open-source novel writing application for serious writers, powered by Google Drive.

Write from anywhere — Mac, iPad, Linux, or any browser — with your work always organized and safe in your own Google Drive.

---

## Features

- **Google OAuth** — sign in with your Google account; all files live in *your* Drive, not ours
- **Binder** — collapsible tree (folders, chapters, scenes) with drag-to-reorder, rename, active/inactive toggle, archive folder, and label color-coding
- **TipTap editor** — prose editor with auto-save to Google Drive every 1.5s; documents are native Google Docs editable from any browser
- **Union view** — select a folder to read all its scenes as one continuous scroll
- **Inspector** — per-document status, label, synopsis, notes, tags, references, and snapshots
- **Tags & References** — `@pov`, `@char`, `@location`, `@plot` etc. per scene; References panel shows every scene a tag value appears in
- **Pieces** — world-building records for characters, places, and objects; board view, detailed list, relations, and "Appears In" linking to tagged scenes
- **Plot Grid** — matrix of plot lines × scenes with per-cell notes
- **Corkboard** — index card view per folder; drag to reorder scenes
- **Outliner** — spreadsheet table: Title, Status, Label, Words, Synopsis, POV, Characters, Location
- **Collections** — named saved groups of scenes, open together in Union view
- **Snapshots** — named point-in-time copies of any document, restorable from Inspector
- **Word count goals** — daily target with an 18-week streak calendar
- **Offline support** — app shell cached by service worker; recently opened documents readable and writable offline with auto-sync on reconnect
- **PWA** — installable on macOS, iPadOS, Linux; works in any browser without install
- **Google Workspace Marketplace** — installable from the Workspace app launcher

## Roadmap

### Phase 2 — Organization & Views ✅ Complete
- Corkboard, Outliner, Plot Grid
- Label color-coding in binder
- Union view (continuous multi-document scroll)
- Snapshots, Collections, Daily word count goals
- Pieces — world-building records (characters, places, objects)
- Offline support — service worker + IndexedDB read cache + write queue
- Google Workspace Marketplace listing

### Phase 3 — Writing Experience ← Current
- [ ] Distraction-free mode — chrome fades as you type, returns on mouse move
- [ ] Document merge — right-click folder → merge children into one doc
- [ ] Split screen — two editor panels side by side
- [ ] Dialogue Focus — fade non-speech text to gray
- [ ] Bookmarks and annotations

### Phase 4 — Power Features
- [ ] Compile & Export → PDF, DOCX, ePub
- [ ] Read-aloud (text-to-speech)
- [ ] ProWritingAid integration
- [ ] Templates root folder

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
   - Under **Test users**, add your own Google email (required while the app is in Testing mode; not needed once the OAuth app is published to Production)
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
    [projectId]/              # Main workspace (editor, corkboard, outliner, plot-grid, pieces, collections)
    api/projects/             # REST API (projects CRUD, document read/write, snapshots)
    login/                    # Sign-in page
    privacy/ terms/           # Required for Workspace Marketplace listing
    drive-open/               # Google Drive "Open With" handler
  components/
    binder/                   # Binder tree
    editor/                   # TipTap editor, Union view
    inspector/                # Inspector panel (documents + pieces)
    pieces/                   # Pieces board, detailed/simple views, type management
    collections/              # Collections list + Union view
    corkboard/                # Index card grid
    outliner/                 # Spreadsheet table view
    plot-grid/                # Plot × scene matrix
    workspace/                # Top nav, view routing, word count widget, offline banner
  lib/
    cache/db.ts               # IndexedDB wrapper (documents, projects, pending writes, elements)
    google/drive.ts           # Google Drive API client
    pieces/migration.ts       # One-time migration: Characters/Places folders → Pieces
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
      Manuscript/             <- mirrors binder folder structure
        Chapter 1/
          Scene 1             <- native Google Doc (editable in Google Docs)
          Scene 2
      Characters/
      Research/
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

GPL v3. Cavafy is free software: you can run it, study it, modify it, and distribute modified versions under the same license.

**A note on software freedom:** Cavafy currently requires Google Drive for storage, which is a dependency on a proprietary service. This is an acknowledged limitation — it means users cannot run a fully free stack without relying on Google's closed infrastructure. Support for self-hosted and local storage backends is a planned future goal, so that Cavafy can be run entirely on free software.

---

*Named after Constantine P. Cavafy (1863–1933), Greek poet.*
