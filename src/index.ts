import { Engine } from './engine.js'
import type { EngineOptions } from './engine.js'
import { InputError, record, string } from './model.js'
import { markdown, playwrightTest } from './report.js'
import { startDashboard } from './server.js'
import type { Dashboard } from './server.js'

export const name = 'dsh-repro'
export const inject = ['tools'] as const
export { Engine, startDashboard }
export type { EngineOptions }
export type { Case, Step, Assertion, Run } from './model.js'

interface Schema { type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; enum?: string[]; description?: string }
export interface ToolDefinition {
  name: string; description: string; parameters: Schema; timeoutMs?: number;
  output: { schema: Schema; render(args: unknown, value: unknown): { type: 'text'; text: string }[] };
  execute(args: unknown, exec: { signal: AbortSignal }): Promise<unknown>
}
export interface HarnessContext {
  tools: { register(tool: ToolDefinition): (() => void) | void };
  effect(callback: () => () => void | Promise<void>): unknown;
  logger?: { info(message: string): void }
}
const text: Schema = { type: 'string' }
const stepSchema: Schema = {
  type: 'object', additionalProperties: false,
  properties: { id: text, action: { type: 'string', enum: ['navigate', 'click', 'fill', 'select', 'check', 'press', 'reload', 'wait'] }, selector: text, value: text, url: text, key: text, checked: { type: 'boolean' }, secret: { type: 'boolean' } },
  required: ['action'],
}
const assertionSchema: Schema = {
  type: 'object', additionalProperties: false,
  properties: { id: text, type: { type: 'string', enum: ['visible', 'hidden', 'text', 'url', 'request', 'no_page_errors', 'no_console_errors', 'no_failed_requests'] }, selector: text, expected: text, status: { type: 'integer' } },
  required: ['type'],
}
const caseProperties: Record<string, Schema> = {
  title: text, url: text, description: text,
  steps: { type: 'array', items: stepSchema }, assertions: { type: 'array', items: assertionSchema },
}
function id(args: Record<string, unknown>, key = 'case_id'): string { return string(args[key], key, 80) }

export function createTools(engine: Engine, open: () => Promise<Dashboard>): ToolDefinition[] {
  const tool = (suffix: string, description: string, properties: Record<string, Schema>, required: string[], execute: (args: Record<string, unknown>, signal: AbortSignal) => Promise<unknown>): ToolDefinition => ({
    name: `repro_${suffix}`, description,
    parameters: { type: 'object', properties, required, additionalProperties: false },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => {
        const json = JSON.stringify(value, null, 2)
        return [{ type: 'text', text: json.length > 24000 ? `${json.slice(0, 24000)}\n[Display clipped. Open the Repro workbench for complete evidence.]` : json }]
      },
    },
    execute: async (args, exec) => { exec.signal.throwIfAborted(); return await execute(record(args), exec.signal) },
  })
  return [
    tool('open', 'Open the local Repro workbench. Return its URL to the user for manual recording, editing acceptance conditions, and comparing before/after evidence.', {}, [], async () => ({ url: (await open()).url })),
    tool('list', 'List recorded frontend bug cases and their acceptance conditions.', {}, [], async () => ({ cases: await engine.store.cases(), ...engine.status() })),
    tool('create', 'Create a frontend reproduction case with structured actions and explicit acceptance assertions. With no assertions, runs are UNVERIFIED, never passed. Use wait steps before asynchronous transitions. Password values must use ${ENV:VARIABLE_NAME} and secret:true.', caseProperties, ['title', 'url'], async args => ({ case: await engine.create(args) })),
    tool('update', 'Update a reproduction case. Preserve step and assertion ids when editing. Runs keep immutable snapshots; changing the case does not rewrite earlier evidence.', { case_id: text, ...caseProperties }, ['case_id'], async args => {
      const { case_id, ...input } = args
      return { case: await engine.update(string(case_id, 'case_id'), input) }
    }),
    tool('record', 'Start a visible Chromium browser to record the user reproducing a bug. A recording replaces this case\'s steps when stopped. Ask the user to operate that browser, then use repro_stop_recording. Top-level DOM interactions only.', { case_id: text }, ['case_id'], async args => ({ ...await engine.startRecording(id(args)) })),
    tool('stop_recording', 'Stop the active recording and save its actions, browser evidence, and screenshot. Recording alone is unverified: add acceptance conditions and replay before claiming a fix.', {}, [], async () => ({ ...await engine.stopRecording() })),
    { ...tool('run', 'Replay a case in a fresh Chromium context and evaluate every acceptance assertion. kind=baseline saves the pre-fix reference; kind=verification checks a fix. Report failed and unverified results accurately. Run after the target application has actually been changed.', { case_id: text, kind: { type: 'string', enum: ['baseline', 'verification'] } }, ['case_id'], async (args, signal) => {
      const kind = args.kind ?? 'verification'
      if (kind !== 'baseline' && kind !== 'verification') throw new InputError('kind must be baseline or verification')
      return { run: await engine.run(id(args), kind, signal) }
    }), timeoutMs: 300000 },
    tool('report', 'Read immutable replay evidence and a Markdown acceptance report. Source locations are candidates from browser logs, not confirmed root causes. A changed case definition cannot prove a fix against its earlier baseline.', { run_id: text }, ['run_id'], async args => {
      const run = await engine.store.run(id(args, 'run_id'))
      const item = await engine.store.case(run.caseId)
      const baseline = item.baselineRunId ? await engine.store.run(item.baselineRunId) : undefined
      return { run, markdown: markdown(run, baseline) }
    }),
    tool('export', 'Export a saved case as portable JSON or a standalone Playwright test. The Playwright test needs @playwright/test in the receiving project; no assertions means the generated test is skipped.', { case_id: text, format: { type: 'string', enum: ['json', 'playwright'] } }, ['case_id', 'format'], async args => {
      const item = await engine.store.case(id(args))
      if (args.format !== 'json' && args.format !== 'playwright') throw new InputError('format must be json or playwright')
      return { filename: args.format === 'json' ? 'repro.case.json' : 'repro.spec.ts', content: args.format === 'json' ? JSON.stringify(item, null, 2) : playwrightTest(item) }
    }),
  ]
}

export async function apply(ctx: HarnessContext, config: EngineOptions & { port?: number } = {}): Promise<void> {
  const input = record(config)
  if (input.headless !== undefined && typeof input.headless !== 'boolean') throw new InputError('headless must be a boolean')
  if (input.dataDir !== undefined) string(input.dataDir, 'dataDir')
  if (input.port !== undefined && (!Number.isInteger(input.port) || Number(input.port) < 0 || Number(input.port) > 65535)) throw new InputError('port must be 0–65535')
  const engine = new Engine(config)
  await engine.init()
  let dashboard: Promise<Dashboard> | undefined
  const open = (): Promise<Dashboard> => {
    dashboard ??= startDashboard(engine, config.port).catch(error => { dashboard = undefined; throw error })
    return dashboard
  }
  // Register cleanup before any tool is made visible, including partial startup failures.
  ctx.effect(() => async () => {
    await engine.close()
    if (dashboard) await (await dashboard).close()
  })
  for (const definition of createTools(engine, open)) ctx.tools.register(definition)
  ctx.logger?.info('Repro ready. Ask the agent to call repro_open to open the workbench.')
}
