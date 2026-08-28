# mediapipe 測試 — GitHub Copilot instructions

These instructions are automatically applied. Follow them on every change.

## Source of truth

- Primary: `AGENTS.md`
- Details: `docs/ai-assist.md`, `docs/naming-conventions.md`, `docs/code-conventions.md`, `docs/comment-conventions.md`, `docs/figma-mcp.md`, `docs/project-conventions.md`

## Always apply

- Package manager: **pnpm only** (no npm / yarn)
- UI copy: Traditional Chinese (繁體中文)
- Vue SFC: always `<script setup lang="ts">`; TypeScript strict; avoid `any`
- Put HTTP/API only in `src/services/`; `views/` compose pages; shared UI in `components/common/`
- Naming: PascalCase components (`*View.vue`); composables `useXxx`; see `docs/naming-conventions.md`
- Comments: short, **English + 繁中**, purpose only — see `docs/comment-conventions.md`
- Figma MCP: **read-only by default**; never write to Figma unless the user explicitly asks
- Commits: Conventional Commits (`docs/commit-conventions.md`); do not commit secrets / `.env` credentials

## Workflows

When the user asks to commit / push / deploy, follow `.cursor/skills/commit|push|deploy/SKILL.md` (or the Skills table in `AGENTS.md`).
