#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { Engine } from './engine.js'
import { startDashboard } from './server.js'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args[0] === 'install-browser') {
    const require = createRequire(import.meta.url)
    const cli = join(dirname(require.resolve('playwright/package.json')), 'cli.js')
    const child = spawn(process.execPath, [cli, 'install', 'chromium', ...args.slice(1)], { stdio: 'inherit' })
    process.exitCode = await new Promise<number>((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)) })
    return
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: dsh-repro [--port 4317] [--data-dir .dsh-repro] [--headless] [--open]\n       dsh-repro install-browser [--with-deps]')
    return
  }
  const options: { dataDir?: string; headless?: boolean; executablePath?: string } = {}
  let port = 0
  let open = false
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--headless') options.headless = true
    else if (arg === '--open') open = true
    else if (['--port', '--data-dir', '--browser-path'].includes(arg!)) {
      const value = args[++index]
      if (!value) throw new Error(`${arg} needs a value`)
      if (arg === '--port') { port = Number(value); if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('port must be 0–65535') }
      else if (arg === '--data-dir') options.dataDir = value
      else options.executablePath = value
    } else throw new Error(`Unknown option: ${arg}. Run dsh-repro --help`)
  }
  const engine = new Engine(options)
  await engine.init()
  const dashboard = await startDashboard(engine, port)
  console.log(`\n  REPRO / Frontend evidence workbench\n\n  ${dashboard.url}\n\n  Data: ${engine.store.root}\n  Press Ctrl+C to stop.\n`)
  if (open) {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open'
    const child = spawn(command, [dashboard.url], { stdio: 'ignore' })
    child.on('error', () => console.log('Open the URL above in your browser.'))
    child.unref()
  }
  let closing = false
  const close = (): void => {
    if (closing) return
    closing = true
    void engine.close().then(() => dashboard.close()).catch(error => { console.error(error); process.exitCode = 1 })
  }
  process.once('SIGINT', close); process.once('SIGTERM', close)
}
main().catch(error => { console.error(`[dsh-repro] ${String(error)}`); process.exitCode = 1 })
