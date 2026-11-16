import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { safeId, uid } from './model.js'
import type { Case, Run } from './model.js'

export class Store {
  readonly root: string
  constructor(root: string) { this.root = resolve(root) }
  async init(): Promise<void> {
    await Promise.all(['cases', 'runs', 'artifacts'].map(dir => mkdir(join(this.root, dir), { recursive: true, mode: 0o700 })))
  }
  private async read<T>(dir: string, id: string): Promise<T> {
    return JSON.parse(await readFile(join(this.root, dir, `${safeId(id)}.json`), 'utf8')) as T
  }
  private async write(dir: string, id: string, value: unknown): Promise<void> {
    const file = join(this.root, dir, `${safeId(id)}.json`)
    const temporary = `${file}.${uid()}.tmp`
    await writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600 })
    await rename(temporary, file)
  }
  async cases(): Promise<Case[]> {
    const names = await readdir(join(this.root, 'cases'))
    return (await Promise.all(names.filter(name => name.endsWith('.json')).map(name => this.read<Case>('cases', name.slice(0, -5)))))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
  case(id: string): Promise<Case> { return this.read('cases', id) }
  saveCase(value: Case): Promise<void> { return this.write('cases', value.id, value) }
  run(id: string): Promise<Run> { return this.read('runs', id) }
  saveRun(value: Run): Promise<void> { return this.write('runs', value.id, value) }
  async runs(caseId: string): Promise<Run[]> {
    safeId(caseId)
    const names = await readdir(join(this.root, 'runs'))
    return (await Promise.all(names.filter(name => name.endsWith('.json')).map(name => this.read<Run>('runs', name.slice(0, -5)))))
      .filter(run => run.caseId === caseId).sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  }
  async artifactDirectory(runId: string): Promise<string> {
    const path = join(this.root, 'artifacts', safeId(runId))
    await mkdir(path, { recursive: true, mode: 0o700 })
    return path
  }
  artifact(runId: string, file: string): string {
    if (!['screenshot.png'].includes(file)) throw new Error('Unknown artifact')
    return join(this.root, 'artifacts', safeId(runId), file)
  }
}
