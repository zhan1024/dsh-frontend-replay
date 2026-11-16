# Release verification · 0.1.0

Public GitHub and npm installation checks are recorded in [published package verification](./PUBLISHED-VERIFICATION.md).

Verified on 2026-11-16. Local environment: macOS, Node.js 26.0.0, npm 11.12.1, pnpm 10.15.1, Playwright 1.65.1, DeepSeek Harness 0.2.2-rc.1. The repository workflow repeats verification on Ubuntu with Node.js 24.

## Executed checks

| Command | Evidence |
| --- | --- |
| `npm run typecheck` | Strict TypeScript check passed |
| `npm test` | 6 unit/API tests passed |
| `npm run test:e2e` | 7 real Chromium tests passed |
| `npm run test:dsh` | Packed tarball installed into an isolated DSH headless profile; all 9 tools offered to the model; actual agent loop completed create → browser replay → report |
| `npm pack --dry-run --json` | Prebuilt JavaScript, declarations, workbench assets, Cordis patch, README, documentation and license included; no credentials, node_modules, test fixtures or run data |

The DSH test uses a deterministic local OpenAI-compatible model endpoint. It verifies the real Harness tool protocol and browser execution without requiring a paid model key; it does not measure an LLM's ability to choose correct selectors or infer acceptance conditions.

## Browser coverage

- The exact same settings case fails with the demo bug enabled, then passes after its save implementation is switched to persist changes. Comparison confirms that the steps and assertions did not change.
- Trusted browser actions are recorded, saved, and replayed. Input submit buttons are captured. Distinct password fields become separate environment references; missing environment variables fail explicitly.
- A case without assertions remains unverified. A failed action prevents subsequent actions and assertions from reporting success. Cancellation closes the active browser.
- Actual page exceptions, console errors, HTTP 503 responses, credential redaction, and source candidates are captured. Error categories remain observable when routine console traffic fills the 1,000-entry evidence buffer.
- The workbench creates and edits cases, executes the baseline/fix/verification flow, downloads an HTML report, reconnects with a new startup token, and fits a 390 px viewport without horizontal overflow. The 1440 px desktop layout was visually checked.
- A generated Playwright test is run by the independent `@playwright/test` CLI: it fails on the bug and passes after the fix.

## Verify a published package

Set `REPRO_PLUGIN_SPEC` to a GitHub release tarball URL or an exact npm package version when running `npm run test:dsh`. The test installs that published package into a fresh profile and exercises the real agent loop. Without this override it tests the newly packed local tarball.

## Scope

Chromium and top-level DOM interactions are covered. Iframes, uploads, drag-and-drop, multi-window flows and persisted authentication are outside this release. Review recordings after delayed or automatic navigation. Replaying a case does not reset the target application's backend state. Errors occurring after the explicit test state is reached are not continuously monitored.

No throughput benchmark, cross-browser compatibility certification or model-quality claim is implied by these checks. See the repository Actions run for the actual CI result of each commit.
