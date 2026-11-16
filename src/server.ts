import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { Engine } from './engine.js'
import { InputError, record, string } from './model.js'
import { comparison, htmlReport, markdown, playwrightTest } from './report.js'
import { demoCss, demoHtml, demoJs } from './demo.js'

export interface Dashboard { url: string; origin: string; close(): Promise<void> }
async function body(request: IncomingMessage): Promise<unknown> {
  let size = 0
  const chunks: Buffer[] = []
  for await (const chunk of request) {
    size += chunk.length
    if (size > 1_000_000) throw new InputError('Request body exceeds 1 MB')
    chunks.push(Buffer.from(chunk))
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') }
  catch { throw new InputError('Request body must contain valid JSON') }
}
function send(response: ServerResponse, status: number, value: unknown, contentType = 'application/json; charset=utf-8'): void {
  response.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
  response.end(Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value))
}
export async function startDashboard(engine: Engine, port = 0): Promise<Dashboard> {
  const token = randomBytes(32).toString('hex')
  const uiDirectory = fileURLToPath(new URL('../ui/', import.meta.url))
  let origin = ''
  let demoFixed = false
  let demoName = 'My workspace'
  const server = createServer((request, response) => {
    void (async () => {
      const path = new URL(request.url ?? '/', origin).pathname
      const method = request.method ?? 'GET'
      if (request.headers.host !== new URL(origin).host) return send(response, 403, { error: 'Unexpected Host header' })
      const requestOrigin = request.headers.origin
      if (requestOrigin && requestOrigin !== origin) return send(response, 403, { error: 'Cross-origin access is not allowed' })
      if (path.startsWith('/api/')) {
        const actual = Buffer.from(request.headers.authorization?.replace(/^Bearer /, '') ?? '')
        const expected = Buffer.from(token)
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return send(response, 401, { error: 'Open the complete workbench URL, including its #token fragment' })
        const parts = path.split('/').filter(Boolean)
        const id = parts[2]
        if (path === '/api/bootstrap' && method === 'GET') return send(response, 200, { cases: await engine.store.cases(), ...engine.status(), demoFixed, version: '0.2.0' })
        if (path === '/api/cases' && method === 'POST') return send(response, 201, await engine.create(await body(request)))
        if (parts[1] === 'cases' && id) {
          if (parts.length === 3 && method === 'GET') return send(response, 200, { case: await engine.store.case(id), runs: await engine.store.runs(id) })
          if (parts.length === 3 && method === 'PUT') return send(response, 200, await engine.update(id, await body(request)))
          if (parts[3] === 'record' && method === 'POST') return send(response, 200, await engine.startRecording(id))
          if (parts[3] === 'run' && method === 'POST') {
            const input = record(await body(request))
            const kind = input.kind ?? 'verification'
            if (kind !== 'baseline' && kind !== 'verification') throw new InputError('kind must be baseline or verification')
            return send(response, 200, await engine.run(id, kind))
          }
          if (parts[3] === 'baseline' && method === 'POST') {
            const input = record(await body(request))
            return send(response, 200, await engine.baseline(id, string(input.runId, 'runId')))
          }
          if (parts[3] === 'export' && method === 'GET') {
            const item = await engine.store.case(id)
            return send(response, 200, playwrightTest(item), 'text/plain; charset=utf-8')
          }
        }
        if (path === '/api/recording/stop' && method === 'POST') return send(response, 200, await engine.stopRecording())
        if (parts[1] === 'runs' && id && method === 'GET') {
          const run = await engine.store.run(id)
          const item = await engine.store.case(run.caseId)
          const baseline = item.baselineRunId ? await engine.store.run(item.baselineRunId) : undefined
          if (parts[3] === 'markdown') return send(response, 200, markdown(run, baseline), 'text/markdown; charset=utf-8')
          if (parts[3] === 'html') {
            const image = async (id: string): Promise<string | undefined> => {
              try { return (await readFile(engine.store.artifact(id, 'screenshot.png'))).toString('base64') } catch { return undefined }
            }
            return send(response, 200, htmlReport(run, baseline, { current: await image(run.id), baseline: baseline ? await image(baseline.id) : undefined }), 'text/html; charset=utf-8')
          }
          return send(response, 200, { run, baseline: baseline ?? null, comparison: comparison(baseline, run) })
        }
        if (parts[1] === 'artifacts' && id && parts[3] === 'screenshot.png' && method === 'GET') {
          return send(response, 200, await readFile(engine.store.artifact(id, parts[3])), 'image/png')
        }
        if (path === '/api/demo' && method === 'POST') {
          demoFixed = false; demoName = 'My workspace'
          const item = await engine.create({
            title: 'Saved settings survive refresh', url: `${origin}/demo`,
            description: 'Reproduce a settings form that reports success but loses its data on refresh. Run a baseline, apply the demo fix, then verify the same case.',
            steps: [
              { action: 'navigate', url: `${origin}/demo` },
              { action: 'fill', selector: '[data-testid="workspace-name"]', value: 'Frontend Replay workspace' },
              { action: 'click', selector: '[data-testid="save"]' },
              { action: 'wait', selector: '#status', value: 'Saved.' },
              { action: 'click', selector: '#refresh' },
            ],
            assertions: [
              { type: 'text', selector: '#persisted', expected: 'Frontend Replay workspace' },
              { type: 'visible', selector: '#settings' },
              { type: 'no_page_errors' },
            ],
          })
          return send(response, 201, item)
        }
        if (path === '/api/demo/fix' && method === 'POST') {
          const input = record(await body(request))
          if (typeof input.fixed !== 'boolean') throw new InputError('fixed must be a boolean')
          demoFixed = input.fixed; demoName = 'My workspace'
          return send(response, 200, { fixed: demoFixed })
        }
        return send(response, 404, { error: 'Unknown API route' })
      }
      response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
      if (path === '/demo/api/settings') {
        if (method === 'POST') {
          const input = record(await body(request))
          const name = string(input.name, 'name', 200)
          if (demoFixed) demoName = name
        }
        if (method === 'GET' || method === 'POST') return send(response, 200, { name: demoName })
      }
      if (method !== 'GET') return send(response, 405, { error: 'Method not allowed' })
      if (path === '/demo') return send(response, 200, demoHtml, 'text/html; charset=utf-8')
      if (path === '/demo.js') return send(response, 200, demoJs, 'application/javascript; charset=utf-8')
      if (path === '/demo.css') return send(response, 200, demoCss, 'text/css; charset=utf-8')
      const assets: Record<string, [string, string]> = {
        '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'application/javascript; charset=utf-8'],
        '/style.css': ['style.css', 'text/css; charset=utf-8'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'],
      }
      const asset = assets[path]
      if (!asset) return send(response, 404, 'Not found', 'text/plain')
      send(response, 200, await readFile(join(uiDirectory, asset[0])), asset[1])
    })().catch((error: unknown) => {
      const value = error as { status?: number; code?: string; message?: string }
      const status = value.status ?? (value.code === 'ENOENT' ? 404 : 500)
      if (!response.headersSent) send(response, status, { error: status === 500 ? 'Operation failed; inspect the local terminal for details' : value.message ?? 'Request failed' })
      if (status === 500) console.error('[dsh-frontend-replay]', error)
    })
  })
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve) })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Cannot determine workbench address')
  origin = `http://127.0.0.1:${address.port}`
  return {
    origin, url: `${origin}/#token=${token}`,
    close: async () => {
      server.closeAllConnections()
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    },
  }
}
