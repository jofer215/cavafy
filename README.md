# Cavafy

An open-source novel writing application inspired by Scrivener, powered by Google Drive.

Write from anywhere — Mac, iPad, Linux, or any browser — with your work always organized and safe in your own Google Drive.

---

## Features (Phase 1 — MVP)

- **Google OAuth** — sign in with your Google account; all files live in *your* Drive
- **Binder** — tree navigation of your project (folders, chapters, scenes)
- **TipTap editor** — clean, distraction-free prose editor with auto-save to Google Drive
- **Inspector** — per-document status, label, synopsis, and notes
- **PWA** — installable on macOS, iPadOS, Linux; works in any browser without install

## Roadmap

- **Phase 2**: Corkboard, Outliner, Custom metadata, Snapshots, Collections, Split screen
- **Phase 3**: Distraction-free mode, Dialogue Focus, Bookmarks, Annotations, Word count goals
- **Phase 4**: Compile & Export (PDF/DOCX/ePub), ProWritingAid integration, Templates

---

## Getting Started

### 1. Google Cloud setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project, enable **Google Drive API**
3. Create OAuth 2.0 credentials (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
5. Copy the Client ID and Client Secret

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### 3. Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Deploy to Vercel

```bash
npx vercel
```

Set the same env vars in the Vercel dashboard. Update your Google OAuth redirect URI to your Vercel URL.

---

## Tech Stack

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

## Project structure in Google Drive

```
My Drive/
  Cavafy/
    [Your Project Name]/
      .cavafy-project.json    <- all metadata, binder structure
      Manuscript/
        Chapter 1/
          Scene 1.html
      Characters/
      Research/
```

## License

GPL v3

---

*Named after Constantine P. Cavafy (1863-1933), Greek poet.*
