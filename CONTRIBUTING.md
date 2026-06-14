# Contributing to Cavafy

Cavafy is free software licensed under GPL v3. Contributions are welcome.

## Before you start

Open an issue before starting significant work. This avoids duplicate effort and lets us agree on the right approach before you invest time writing code.

For small fixes — typos, obvious bugs, minor UI polish — you can open a PR directly.

## Setting up locally

Follow the setup instructions in the [README](README.md). You'll need a Google Cloud project with the Drive API enabled and an OAuth client configured for `http://localhost:3000`.

## How to contribute

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Open a pull request with a clear description of what changed and why

## What we're working on

The active roadmap is in the README. The areas most open to contribution right now are:

- **Phase 3** writing experience features (distraction-free mode, split screen, dialogue focus)
- **Phase 4** export features (PDF, DOCX, ePub)
- **Bug fixes** — open an issue first so we can confirm it's a bug
- **Accessibility** improvements
- **Alternative storage backends** — local filesystem, Nextcloud, or other self-hosted options (this is a long-term goal that would bring Cavafy closer to full software freedom)

## Code style

- TypeScript throughout — no `any` if avoidable
- Tailwind for styling — match the existing CSS variable conventions (`var(--bg)`, `var(--text)`, etc.)
- No comments unless the *why* is non-obvious
- Keep components focused — if a component is getting long, split it

## Licensing

By submitting a pull request you agree that your contribution will be licensed under GPL v3, the same license as the rest of the project.

## A note on the Google Drive dependency

Cavafy currently requires Google Drive for storage. Contributions that reduce or eliminate this dependency — by adding support for local or self-hosted storage — are especially welcome, as they move the project toward full software freedom.
