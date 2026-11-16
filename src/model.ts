import { randomUUID } from 'node:crypto'

export type Action = 'navigate' | 'click' | 'fill' | 'select' | 'check' | 'press' | 'reload' | 'wait'
export type CheckType = 'visible' | 'hidden' | 'text' | 'url' | 'request' | 'no_page_errors' | 'no_console_errors' | 'no_failed_requests'
export interface Step { id: string; action: Action; selector?: string; value?: string; url?: string; key?: string; checked?: boolean; secret?: boolean }
export interface Assertion { id: string; type: CheckType; selector?: string; expected?: string; status?: number }
export interface Case {
  id: string; title: string; url: string; description: string; steps: Step[]; assertions: Assertion[];
  createdAt: string; updatedAt: string; baselineRunId?: string
}
export interface Evidence {
  kind: 'console' | 'pageerror' | 'request'; at: string; level?: string; text?: string;
  url?: string; method?: string; status?: number; failure?: string
}
export interface StepResult { stepId: string; action: string; status: 'passed' | 'failed' | 'skipped'; durationMs: number; error?: string }
export interface CheckResult { assertionId: string; type: CheckType; status: 'passed' | 'failed' | 'skipped'; detail: string }
export interface Run {
  id: string; caseId: string; kind: 'baseline' | 'verification' | 'recording'; status: 'passed' | 'failed' | 'unverified';
  startedAt: string; durationMs: number; snapshot: Case; steps: StepResult[]; checks: CheckResult[];
  evidence: Evidence[]; screenshot?: string; sourceHints: string[]; error?: string
}

export class InputError extends Error { readonly status = 400 }
export const uid = (): string => randomUUID()
export const now = (): string => new Date().toISOString()
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('Expected a JSON object')
  return value as Record<string, unknown>
}
export function string(value: unknown, field: string, max = 4000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new InputError(`${field}: expected a non-empty string (max ${max})`)
  return value
}
export function httpUrl(value: unknown): string {
  const text = string(value, 'url', 4000)
  let url: URL
  try { url = new URL(text) } catch { throw new InputError('url: expected an absolute http(s) URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new InputError('url: use http(s) without embedded credentials')
  return url.href
}
export function safeId(value: string): string {
  if (!/^[\w-]{1,80}$/.test(value)) throw new InputError('Invalid identifier')
  return value
}
function optional(value: unknown, field: string, max = 4000): string | undefined {
  return value === undefined || value === '' ? undefined : string(value, field, max)
}
export function steps(value: unknown): Step[] {
  if (!Array.isArray(value) || value.length > 500) throw new InputError('steps: expected an array with at most 500 entries')
  const ids = new Set<string>()
  return value.map(entry => {
    const item = record(entry)
    const action = string(item.action, 'action') as Action
    if (!['navigate', 'click', 'fill', 'select', 'check', 'press', 'reload', 'wait'].includes(action)) throw new InputError(`Unsupported action: ${action}`)
    const id = item.id === undefined ? uid() : safeId(string(item.id, 'step.id'))
    if (ids.has(id)) throw new InputError('Duplicate step id')
    ids.add(id)
    const out: Step = { id, action }
    if (action === 'navigate') out.url = httpUrl(item.url)
    if (['click', 'fill', 'select', 'check', 'press', 'wait'].includes(action)) out.selector = string(item.selector, 'selector', 2000)
    if (action === 'wait' && item.value !== undefined) out.value = string(item.value, 'value', 16000)
    if (action === 'fill' || action === 'select') {
      if (typeof item.value !== 'string' || item.value.length > 16000) throw new InputError('value: expected a string (max 16000)')
      out.value = item.value
    }
    if (action === 'check') {
      if (typeof item.checked !== 'boolean') throw new InputError('checked: expected a boolean')
      out.checked = item.checked
    }
    if (action === 'press') out.key = string(item.key, 'key', 80)
    if (item.secret === true) {
      if (action !== 'fill' || !/^\$\{ENV:[A-Z_][A-Z0-9_]*\}$/.test(out.value ?? '')) throw new InputError('Secret input must use ${ENV:VARIABLE_NAME}')
      out.secret = true
    }
    return out
  })
}
export function assertions(value: unknown): Assertion[] {
  if (!Array.isArray(value) || value.length > 100) throw new InputError('assertions: expected an array with at most 100 entries')
  const ids = new Set<string>()
  return value.map(entry => {
    const item = record(entry)
    const type = string(item.type, 'assertion.type') as CheckType
    if (!['visible', 'hidden', 'text', 'url', 'request', 'no_page_errors', 'no_console_errors', 'no_failed_requests'].includes(type)) throw new InputError(`Unsupported assertion: ${type}`)
    const id = item.id === undefined ? uid() : safeId(string(item.id, 'assertion.id'))
    if (ids.has(id)) throw new InputError('Duplicate assertion id')
    ids.add(id)
    const out: Assertion = { id, type }
    if (['visible', 'hidden', 'text'].includes(type)) out.selector = string(item.selector, 'assertion.selector', 2000)
    if (['text', 'url', 'request'].includes(type)) out.expected = string(item.expected, 'assertion.expected')
    if (type === 'request') {
      if (!Number.isInteger(item.status) || Number(item.status) < 100 || Number(item.status) > 599) throw new InputError('request.status must be an HTTP status (100–599)')
      out.status = Number(item.status)
    }
    return out
  })
}
export function makeCase(input: unknown, previous?: Case): Case {
  const item = record(input)
  const title = item.title ?? previous?.title
  const url = item.url ?? previous?.url
  return {
    id: previous?.id ?? uid(), title: string(title, 'title', 200).trim(), url: httpUrl(url),
    description: optional(item.description ?? previous?.description, 'description', 8000) ?? '',
    steps: steps(item.steps ?? previous?.steps ?? []), assertions: assertions(item.assertions ?? previous?.assertions ?? []),
    createdAt: previous?.createdAt ?? now(), updatedAt: now(),
    ...(previous?.baselineRunId ? { baselineRunId: previous.baselineRunId } : {}),
  }
}
export function redact(text: string, secrets: string[] = []): string {
  let out = text
  for (const secret of secrets) if (secret.length) out = out.split(secret).join('[REDACTED]')
  return out.replace(/(bearer\s+)[\w.\-]+/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|authorization)["']?\s*[:=]\s*["']?)[^\s,"'&}]+/gi, '$1[REDACTED]')
    .slice(0, 12000)
}
export function evidenceUrl(raw: string, secrets: string[] = []): string {
  try {
    const url = new URL(raw)
    url.username = ''; url.password = ''; url.hash = ''
    for (const key of url.searchParams.keys()) if (/token|password|secret|key|auth|session/i.test(key)) url.searchParams.set(key, '[REDACTED]')
    return redact(url.href, secrets)
  } catch { return redact(raw, secrets) }
}
export function sourceHints(evidence: Evidence[]): string[] {
  const found = new Set<string>()
  for (const item of evidence) {
    const text = `${item.text ?? ''} ${item.url ?? ''}`
    for (const match of text.matchAll(/(?:https?:\/\/[^\s)]+|(?:\/?[\w@.\-]+\/)+[\w.\-]+)\.(?:vue|tsx?|jsx?)(?::\d+(?::\d+)?)?/g)) {
      if (!/node_modules|playwright|__repro/i.test(match[0])) found.add(match[0])
    }
  }
  return [...found].slice(0, 15)
}
