import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import type { Browser, Page } from 'playwright'
import { collectEvidence, launch, Recording } from './browser.js'
import type { BrowserOptions } from './browser.js'
import { InputError, makeCase, now, redact, sourceHints, steps as validateSteps, uid } from './model.js'
import type { Assertion, Case, CheckResult, Evidence, Run, Step } from './model.js'
import { Store } from './store.js'

export interface EngineOptions { dataDir?: string; headless?: boolean; executablePath?: string; timeoutMs?: number }
export class BusyError extends Error { readonly status = 409 }

export class Engine {
  readonly store: Store
  readonly browserOptions: BrowserOptions
  private recording?: { caseId: string; session: Recording }
  private busy = ''
  private activeBrowser?: Browser
  private disposed = false
  constructor(options: EngineOptions = {}) {
    this.store = new Store(options.dataDir ?? process.env.DSH_REPRO_DIR ?? '.dsh-repro')
    this.browserOptions = {
      headless: options.headless ?? process.env.DSH_REPRO_HEADLESS === '1',
      timeoutMs: options.timeoutMs ?? 5000,
      ...(options.executablePath ? { executablePath: options.executablePath } : {}),
    }
    if (!Number.isInteger(this.browserOptions.timeoutMs) || this.browserOptions.timeoutMs < 100 || this.browserOptions.timeoutMs > 60000) throw new InputError('timeoutMs must be 100–60000')
  }
  async init(): Promise<void> { await this.store.init() }
  status(): { busy: string; recording: null | { caseId: string; steps: Step[]; evidence: Evidence[]; startedAt: string } } {
    return {
      busy: this.busy,
      recording: this.recording ? {
        caseId: this.recording.caseId, steps: structuredClone(this.recording.session.steps),
        evidence: structuredClone(this.recording.session.evidence), startedAt: this.recording.session.startedAt,
      } : null,
    }
  }
  private async exclusive<T>(label: string, task: () => Promise<T>, allowRecording = false): Promise<T> {
    if (this.disposed) throw new BusyError('Frontend Replay is shutting down')
    if (this.busy || (this.recording && !allowRecording)) throw new BusyError('Finish the current recording or run first')
    this.busy = label
    try { return await task() } finally { this.busy = '' }
  }
  async create(input: unknown): Promise<Case> {
    const value = makeCase(input)
    await this.store.saveCase(value)
    return value
  }
  async update(id: string, input: unknown): Promise<Case> {
    if (this.busy || this.recording?.caseId === id) throw new BusyError('Finish the current operation before editing this case')
    const value = makeCase(input, await this.store.case(id))
    await this.store.saveCase(value)
    return value
  }
  async startRecording(id: string): Promise<ReturnType<Engine['status']>> {
    return await this.exclusive('recording:start', async () => {
      const item = await this.store.case(id)
      const session = await Recording.start(item.url, this.browserOptions)
      this.recording = { caseId: id, session }
      return this.status()
    })
  }
  async stopRecording(): Promise<{ case: Case; run: Run }> {
    return await this.exclusive('recording:stop', async () => {
      if (!this.recording) throw new InputError('No recording is active')
      const { caseId, session } = this.recording
      const runId = uid()
      const directory = await this.store.artifactDirectory(runId)
      let screenshot = false
      try { screenshot = await session.stop(join(directory, 'screenshot.png')) }
      finally { this.recording = undefined }
      const item = makeCase({ steps: validateSteps(session.steps) }, await this.store.case(caseId))
      await this.store.saveCase(item)
      const run: Run = {
        id: runId, caseId, kind: 'recording', status: 'unverified', startedAt: session.startedAt,
        durationMs: Date.now() - Date.parse(session.startedAt), snapshot: structuredClone(item),
        steps: [], checks: [], evidence: session.evidence, sourceHints: sourceHints(session.evidence),
        ...(screenshot ? { screenshot: `${runId}/screenshot.png` } : {}),
      }
      await this.store.saveRun(run)
      return { case: item, run }
    }, true)
  }
  async baseline(caseId: string, runId: string): Promise<Case> {
    if (this.busy || this.recording?.caseId === caseId) throw new BusyError('Finish the current operation first')
    const run = await this.store.run(runId)
    if (run.caseId !== caseId) throw new InputError('This run belongs to another case')
    if (run.kind === 'recording') throw new InputError('Replay the recording before choosing it as a baseline')
    const item = await this.store.case(caseId)
    item.baselineRunId = runId; item.updatedAt = now()
    await this.store.saveCase(item)
    return item
  }
  async run(caseId: string, kind: 'baseline' | 'verification' = 'verification', signal?: AbortSignal): Promise<Run> {
    if (!['baseline', 'verification'].includes(kind)) throw new InputError('Run kind must be baseline or verification')
    return await this.exclusive('run', async () => {
      const item = await this.store.case(caseId)
      if (!item.steps.length) throw new InputError('Add or record at least one step before running')
      const id = uid()
      const directory = await this.store.artifactDirectory(id)
      const result: Run = {
        id, caseId, kind, status: 'unverified', startedAt: now(), durationMs: 0,
        snapshot: structuredClone(item), steps: [], checks: [], evidence: [], sourceHints: [],
      }
      const secrets: string[] = []
      for (const step of item.steps) {
        const match = /^\$\{ENV:([A-Z_][A-Z0-9_]*)\}$/.exec(step.value ?? '')
        if (match && process.env[match[1]!]) secrets.push(process.env[match[1]!]!)
      }
      let browser: Browser | undefined
      const abort = (): void => { void browser?.close().catch(() => {}) }
      try {
        signal?.throwIfAborted()
        browser = await launch(this.browserOptions, true)
        this.activeBrowser = browser
        signal?.addEventListener('abort', abort, { once: true })
        signal?.throwIfAborted()
        const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' })
        context.setDefaultTimeout(this.browserOptions.timeoutMs)
        context.setDefaultNavigationTimeout(this.browserOptions.timeoutMs)
        const page = await context.newPage()
        const writes = new Set<unknown>()
        page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.add(request) })
        page.on('response', response => { writes.delete(response.request()) })
        page.on('requestfinished', request => { writes.delete(request) })
        page.on('requestfailed', request => { writes.delete(request) })
        collectEvidence(page, result.evidence, secrets)
        if (item.steps[0]?.action !== 'navigate') await page.goto(item.url, { waitUntil: 'domcontentloaded' })
        let failed = false
        for (const step of item.steps) {
          if (failed) { result.steps.push({ stepId: step.id, action: step.action, status: 'skipped', durationMs: 0 }); continue }
          const started = Date.now()
          try {
            signal?.throwIfAborted()
            // Do not reload/navigate away while a preceding save is still in flight.
            if (['reload', 'navigate', 'click'].includes(step.action) && writes.size) {
              const deadline = Date.now() + this.browserOptions.timeoutMs
              while (writes.size && Date.now() < deadline) await delay(50)
              if (writes.size) throw new Error('A previous write request did not finish before the next action')
            }
            await this.executeStep(page, step)
            result.steps.push({ stepId: step.id, action: step.action, status: 'passed', durationMs: Date.now() - started })
          } catch (error) {
            failed = true
            result.steps.push({ stepId: step.id, action: step.action, status: 'failed', durationMs: Date.now() - started, error: redact(String(error), secrets) })
          }
        }
        if (!page.isClosed()) await delay(350)
        const checks = new Map<string, CheckResult>()
        // DOM checks wait for the application to settle before diagnostics are evaluated.
        const ordered = [...item.assertions].sort((a, b) => Number(a.type.startsWith('no_')) - Number(b.type.startsWith('no_')))
        for (const assertion of ordered) {
          if (failed) checks.set(assertion.id, { assertionId: assertion.id, type: assertion.type, status: 'skipped', detail: 'A replay step failed; acceptance was not evaluated' })
          else checks.set(assertion.id, await this.check(page, assertion, result.evidence, secrets))
        }
        result.checks = item.assertions.map(assertion => checks.get(assertion.id)!)
        result.status = failed || result.checks.some(check => check.status === 'failed') ? 'failed' : result.checks.length ? 'passed' : 'unverified'
        if (!page.isClosed()) {
          const secretSelectors = item.steps.filter(step => step.secret).map(step => step.selector!).filter(Boolean)
          await page.screenshot({ path: join(directory, 'screenshot.png'), fullPage: true,
            mask: [page.locator('input[type="password"], [data-repro-private]'), ...secretSelectors.map(selector => page.locator(selector))] })
          result.screenshot = `${id}/screenshot.png`
        }
      } catch (error) {
        result.status = 'failed'; result.error = redact(String(error), secrets)
      } finally {
        signal?.removeEventListener('abort', abort)
        await browser?.close().catch(() => {})
        this.activeBrowser = undefined
      }
      result.sourceHints = sourceHints(result.evidence)
      result.durationMs = Date.now() - Date.parse(result.startedAt)
      await this.store.saveRun(result)
      if (kind === 'baseline') {
        item.baselineRunId = id; item.updatedAt = now()
        await this.store.saveCase(item)
      }
      return result
    })
  }
  private async executeStep(page: Page, step: Step): Promise<void> {
    const locator = step.selector ? page.locator(step.selector) : undefined
    const value = (): string => {
      const raw = step.value ?? ''
      const match = /^\$\{ENV:([A-Z_][A-Z0-9_]*)\}$/.exec(raw)
      if (!match) return raw
      const secret = process.env[match[1]!]
      if (secret === undefined) throw new InputError(`Set environment variable ${match[1]} before replaying this input`)
      return secret
    }
    switch (step.action) {
      case 'navigate': await page.goto(step.url!, { waitUntil: 'domcontentloaded' }); break
      case 'reload': await page.reload({ waitUntil: 'domcontentloaded' }); break
      case 'click': await locator!.click(); break
      case 'fill': await locator!.fill(value()); break
      case 'select': await locator!.selectOption(value()); break
      case 'check': await locator!.setChecked(step.checked!); break
      case 'press': await locator!.press(step.key!); break
      case 'wait': await (step.value ? locator!.filter({ hasText: step.value }) : locator!).waitFor({ state: 'visible' }); break
    }
  }
  private async check(page: Page, assertion: Assertion, evidence: Evidence[], secrets: string[]): Promise<CheckResult> {
    const out: CheckResult = { assertionId: assertion.id, type: assertion.type, status: 'failed', detail: '' }
    try {
      const timeout = Date.now() + this.browserOptions.timeoutMs
      let success = false
      do {
        const locator = assertion.selector ? page.locator(assertion.selector) : undefined
        switch (assertion.type) {
          case 'visible': success = await locator!.isVisible(); out.detail = `Visible: ${assertion.selector}`; break
          case 'hidden': success = await locator!.isHidden(); out.detail = `Hidden: ${assertion.selector}`; break
          case 'text': {
            const actual = await locator!.count() ? await locator!.innerText({ timeout: 300 }) : ''
            success = actual.includes(assertion.expected!)
            out.detail = `Expected text ${JSON.stringify(assertion.expected)}; received ${JSON.stringify(actual).slice(0, 500)}`
            break
          }
          case 'url': success = page.url().includes(assertion.expected!); out.detail = `Expected URL containing ${JSON.stringify(assertion.expected)}; received ${page.url()}`; break
          case 'request': {
            const matches = evidence.filter(item => item.kind === 'request' && item.url?.includes(assertion.expected!))
            success = matches.some(item => item.status === assertion.status)
            out.detail = `${assertion.expected}: expected HTTP ${assertion.status}; observed ${matches.map(item => item.status ?? item.failure).join(', ') || 'no matching request'}`
            break
          }
          case 'no_page_errors': {
            const errors = evidence.filter(item => item.kind === 'pageerror')
            success = !errors.length; out.detail = `${errors.length} uncaught page error(s)`; break
          }
          case 'no_console_errors': {
            const errors = evidence.filter(item => item.kind === 'console' && item.level === 'error')
            success = !errors.length; out.detail = `${errors.length} console error(s)`; break
          }
          case 'no_failed_requests': {
            const errors = evidence.filter(item => item.kind === 'request' && (item.failure || (item.status ?? 0) >= 400))
            success = !errors.length; out.detail = `${errors.length} failed request(s) or HTTP error(s)`; break
          }
        }
        if (success || assertion.type.startsWith('no_') || Date.now() >= timeout) break
        await delay(100)
      } while (true)
      out.status = success ? 'passed' : 'failed'
    } catch (error) { out.detail = String(error) }
    out.detail = redact(out.detail, secrets)
    return out
  }
  async close(): Promise<void> {
    this.disposed = true
    await Promise.allSettled([this.recording?.session.close(), this.activeBrowser?.close()])
    this.recording = undefined
  }
}
