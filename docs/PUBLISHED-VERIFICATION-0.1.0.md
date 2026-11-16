# Repro v0.1.0 · Published package verification

Verified on 2026-11-16.

- Release source commit: `5838f961b523fa180add449257091f6d949fe606`.
- GitHub release: https://github.com/zhan1024/dsh-repro/releases/tag/v0.1.0
- npm: https://www.npmjs.com/package/dsh-repro/v/0.1.0 — public and downloadable after registry processing.
- Ubuntu / Node.js 24 CI: https://github.com/zhan1024/dsh-repro/actions/runs/43801175202 — success.
- Local verification: strict TypeScript check, 6 unit/API tests, 7 real Chromium tests, and the DSH agent integration passed.
- Downloaded the GitHub release tarball and SHA256SUMS anonymously over HTTPS; hashes match.
- Downloaded `dsh-repro@0.1.0` anonymously from the npm registry. Its SHA-256 matches the GitHub release package, and its SHA-512 matches the registry's published integrity value.
- SHA-256: `fb587af402198702e37f0d932e54823202c391d0546dc4019ee071f9f06bf294`.
- Installed both the public GitHub release URL and the exact npm version into separate fresh DSH profiles. In each run, all 9 Repro tools were offered to the deterministic model, which completed `repro_create → repro_run → repro_report` with a passing real Chromium result.
- Executed the CLI from the GitHub release URL with `npm exec`.
- Executed `npm exec --yes --package=dsh-repro@0.1.0 -- dsh-repro --help` from an independent directory with a new npm cache; it exited successfully.

The npm integration can be repeated from the source repository:

```sh
DSH_BIN=/path/to/dsh REPRO_PLUGIN_SPEC=dsh-repro@0.1.0 npm run test:dsh
```

The browser demo establishes a failed baseline and a passing verification using unchanged steps and assertions. The generated Playwright test was also executed independently and observed both outcomes.

The DSH integration uses a deterministic local model endpoint; it verifies tool integration, not LLM decision quality. See the README for recording scope and data handling.
