import { chromium } from 'playwright'
import type { Browser, BrowserContext, Page } from 'playwright'
import { evidenceUrl, InputError, now, redact, uid } from './model.js'
import type { Evidence, Step } from './model.js'

export interface BrowserOptions { headless: boolean; executablePath?: string; timeoutMs: number }
export async function launch(options: BrowserOptions, headless = options.headless): Promise<Browser> {
  try {
    return await chromium.launch({ headless, ...(options.executablePath ? { executablePath: options.executablePath } : {}) })
  } catch (error) {
    if (String(error).includes("Executable doesn't exist")) throw new InputError('Chromium is not installed. Run: npx dsh-frontend-replay install-browser')
    throw error
  }
}

export function collectEvidence(page: Page, evidence: Evidence[], secrets: string[] = []): void {
  const errorKind = (value: Evidence): string => value.kind === 'pageerror' ? 'pageerror'
    : value.kind === 'console' && value.level === 'error' ? 'console'
      : value.kind === 'request' && (value.failure || (value.status ?? 0) >= 400) ? 'request' : ''
  const add = (value: Evidence): void => {
    if (evidence.length < 1000) { evidence.push(value); return }
    const kind = errorKind(value)
    if (!kind) return
    // Preserve each error category when routine traffic fills the evidence buffer.
    let index = evidence.findLastIndex(item => errorKind(item) === kind)
    if (index < 0) index = evidence.findIndex(item => !errorKind(item))
    if (index < 0) index = evidence.findIndex(item => evidence.filter(other => errorKind(other) === errorKind(item)).length > 1)
    if (index >= 0) evidence[index] = value
  }
  page.on('console', message => add({ kind: 'console', at: now(), level: message.type(), text: redact(message.text(), secrets) }))
  page.on('pageerror', error => add({ kind: 'pageerror', at: now(), text: redact(error.stack ?? error.message, secrets) }))
  page.on('requestfailed', request => add({
    kind: 'request', at: now(), method: request.method(), url: evidenceUrl(request.url(), secrets),
    failure: redact(request.failure()?.errorText ?? 'Request failed', secrets),
  }))
  page.on('response', response => add({
    kind: 'request', at: now(), method: response.request().method(), url: evidenceUrl(response.url(), secrets), status: response.status(),
  }))
}

/** Runs inside the inspected page. Keep it self-contained so Playwright can serialize it. */
function recorderScript(binding: string): void {
  if (window.top !== window) return
  const emit = (value: unknown): void => {
    const callback = (window as unknown as Record<string, (data: unknown) => Promise<void>>)[binding]
    void callback?.(value).catch(() => {})
  }
  const selector = (element: Element): string => {
    for (const attr of ['data-testid', 'data-test', 'data-cy']) {
      const value = element.getAttribute(attr)
      if (value) {
        const candidate = `[${attr}=${JSON.stringify(value)}]`
        if (document.querySelectorAll(candidate).length === 1) return candidate
      }
    }
    if (element.id && document.querySelectorAll(`#${CSS.escape(element.id)}`).length === 1) return `#${CSS.escape(element.id)}`
    const path: string[] = []
    let current: Element | null = element
    while (current && current !== document.documentElement) {
      const tag = current.tagName.toLowerCase()
      const parent: Element | null = current.parentElement
      const siblings = parent ? [...parent.children].filter(child => child.tagName === current!.tagName) : []
      path.unshift(`${tag}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : ''}`)
      const candidate = path.join(' > ')
      if (document.querySelectorAll(candidate).length === 1) return candidate
      current = parent
    }
    return path.join(' > ')
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return
    const element = event.target.closest('button,a,input,select,textarea,[role="button"],[role="link"],[data-testid]') ?? event.target
    if (element.matches('select,textarea,label') || (element instanceof HTMLInputElement && !['button', 'submit', 'reset', 'image'].includes(element.type))) return
    emit({ action: 'click', selector: selector(element) })
  }, true)
  document.addEventListener('input', event => {
    if (!event.isTrusted || !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return
    const element = event.target
    if (element instanceof HTMLInputElement && ['checkbox', 'radio', 'file', 'hidden', 'submit', 'button'].includes(element.type)) return
    const secret = element instanceof HTMLInputElement && (element.type === 'password' || /password|secret|token|api.?key/i.test(`${element.name} ${element.id} ${element.autocomplete}`))
    emit({ action: 'fill', selector: selector(element), value: secret ? '${ENV:REPRO_SECRET_1}' : element.value, ...(secret ? { secret: true } : {}) })
  }, true)
  document.addEventListener('change', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return
    const element = event.target
    if (element instanceof HTMLSelectElement && !element.multiple) emit({ action: 'select', selector: selector(element), value: element.value })
    if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) emit({ action: 'check', selector: selector(element), checked: element.checked })
  }, true)
  document.addEventListener('keydown', event => {
    if (!event.isTrusted || event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return
    emit({ action: 'press', selector: selector(event.target), key: 'Enter' })
  }, true)
}

export class Recording {
  readonly steps: Step[] = []
  readonly evidence: Evidence[] = []
  readonly startedAt = now()
  readonly browser: Browser
  readonly context: BrowserContext
  readonly page: Page
  private lastActionAt = 0
  private lastUrl: string
  private navigationFromAction = false
  private closing = false
  private secretFields = new Map<string, string>()
  private constructor(browser: Browser, context: BrowserContext, page: Page, url: string) {
    this.browser = browser; this.context = context; this.page = page; this.lastUrl = url
    this.steps.push({ id: uid(), action: 'navigate', url })
    collectEvidence(page, this.evidence)
  }
  static async start(url: string, options: BrowserOptions): Promise<Recording> {
    const browser = await launch(options)
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' })
      context.setDefaultTimeout(options.timeoutMs)
      const page = await context.newPage()
      const session = new Recording(browser, context, page, url)
      const binding = `__repro_${uid().replaceAll('-', '')}`
      await context.exposeBinding(binding, (source, value: unknown) => {
        if (source.frame !== page.mainFrame() || session.closing || session.steps.length >= 500) return
        const step = value as Omit<Step, 'id'>
        if (!['click', 'fill', 'select', 'check', 'press'].includes(step.action) || typeof step.selector !== 'string') return
        if (step.secret) {
          let ref = session.secretFields.get(step.selector)
          if (!ref) { ref = `\${ENV:REPRO_SECRET_${session.secretFields.size + 1}}`; session.secretFields.set(step.selector, ref) }
          step.value = ref
        }
        const last = session.steps.at(-1)
        if (step.action === 'fill' && last?.action === 'fill' && last.selector === step.selector) last.value = step.value
        else session.steps.push({ ...step, id: uid() })
        session.lastActionAt = Date.now()
        session.navigationFromAction = ['click', 'press'].includes(step.action)
      })
      await context.addInitScript(recorderScript, binding)
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      session.lastUrl = page.url()
      // The initial goto belongs to the first step. Subsequent address-bar navigation/reloads are recorded.
      page.on('framenavigated', frame => {
        if (frame !== page.mainFrame() || session.closing || session.steps.length >= 500) return
        const target = frame.url()
        if (!/^https?:/.test(target)) return
        if (!(session.navigationFromAction && Date.now() - session.lastActionAt < 10000)) {
          session.steps.push(target === session.lastUrl ? { id: uid(), action: 'reload' } : { id: uid(), action: 'navigate', url: target })
        }
        session.navigationFromAction = false
        session.lastUrl = target
      })
      return session
    } catch (error) { await browser.close(); throw error }
  }
  async stop(screenshot: string): Promise<boolean> {
    this.closing = true
    let captured = false
    try {
      if (!this.page.isClosed()) {
        await this.page.screenshot({ path: screenshot, fullPage: true, mask: [this.page.locator('input[type="password"], [data-repro-private]'), ...[...this.secretFields.keys()].map(selector => this.page.locator(selector))] })
        captured = true
      }
    } finally { await this.browser.close() }
    return captured
  }
  async close(): Promise<void> { this.closing = true; await this.browser.close() }
}
