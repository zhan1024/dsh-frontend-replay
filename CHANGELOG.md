# Changelog

## 0.2.0

- Rename the plugin to **Frontend Replay · 前端验修台** and the package to `dsh-frontend-replay` for clearer search and discovery.
- Update the DSH bundle identity, CLI, bilingual workbench branding, report exports and installation documentation.
- Preserve existing `.dsh-repro` data, environment settings, `repro_*` tools, case formats and the old CLI alias. Remove the old DSH plugin before installing the renamed package.
- Keep v0.1.0 release tags and artifacts unchanged.

## 0.1.0

- First public release: DSH bundle, standalone CLI, bilingual local workbench.
- Record top-level Chromium interactions and replay saved actions in isolated contexts.
- Explicit acceptance conditions, immutable run snapshots, baseline comparisons, browser diagnostics and screenshots.
- Self-contained HTML / Markdown reports, JSON case import/export, portable Playwright test export.
- Local authenticated API, common credential redaction, environment references for secret inputs, masked screenshots.
