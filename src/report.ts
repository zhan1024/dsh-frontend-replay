import type { Case, Run } from './model.js'

export function comparison(baseline: Run | undefined, current: Run): {
  comparable: boolean; baselineId: string | null; currentId: string;
  checks: { id: string; type: string; before: string; after: string; changed: boolean }[]
} {
  const definition = (item: Case): string => JSON.stringify({ url: item.url, steps: item.steps, assertions: item.assertions })
  return {
    comparable: !!baseline && definition(baseline.snapshot) === definition(current.snapshot),
    baselineId: baseline?.id ?? null, currentId: current.id,
    checks: current.checks.map(check => ({
      id: check.assertionId, type: check.type,
      before: baseline?.checks.find(previous => previous.assertionId === check.assertionId)?.status ?? 'not_run',
      after: check.status,
      changed: !!baseline && JSON.stringify(baseline.snapshot.assertions.find(item => item.id === check.assertionId)) !== JSON.stringify(current.snapshot.assertions.find(item => item.id === check.assertionId)),
    })),
  }
}
const cell = (value: string): string => value.replaceAll('|', '\\|').replace(/[\r\n]/g, ' ').replaceAll('<', '&lt;')
export function markdown(run: Run, baseline?: Run): string {
  const compare = comparison(baseline, run)
  const lines = [
    `# Repro · ${cell(run.snapshot.title)}`, '',
    `- Result: **${run.status.toUpperCase()}**`, `- URL: ${run.snapshot.url}`,
    `- Run: ${run.id}`, `- Started: ${run.startedAt}`, `- Duration: ${run.durationMs} ms`,
    ...(baseline ? [`- Baseline: ${baseline.id}`, `- Same steps and acceptance conditions: ${compare.comparable ? 'yes' : 'NO — test definition changed; compare with care'}`] : []),
    '', '## Acceptance', '', '| Condition | Before | After | Evidence |', '| --- | --- | --- | --- |',
    ...run.checks.map(check => {
      const before = compare.checks.find(item => item.id === check.assertionId)?.before ?? 'not_run'
      return `| ${cell(check.type)} | ${before} | ${check.status} | ${cell(check.detail)} |`
    }),
    ...(!run.checks.length ? ['No acceptance conditions were evaluated. Successful actions alone do not verify a fix.'] : []),
    '', '## Replay steps', '', '| Action | Result | Duration | Detail |', '| --- | --- | --- | --- |',
    ...run.steps.map(step => `| ${step.action} | ${step.status} | ${step.durationMs} ms | ${cell(step.error ?? '')} |`),
    ...(run.error ? ['', `Run error: ${cell(run.error)}`] : []),
    '', '## Browser evidence', '',
    ...run.evidence.map(item => `- ${item.at} **${item.kind}${item.level ? `/${item.level}` : ''}** ${cell(item.text ?? `${item.method ?? ''} ${item.status ?? item.failure ?? ''} ${item.url ?? ''}`)}`),
    '', '## Source candidates', '',
    'These locations come from browser evidence; they are investigation hints, not a confirmed root cause.',
    ...run.sourceHints.map(hint => `- ${cell(hint)}`),
    '', '## Screenshot', '',
    ...(run.screenshot ? [`![Run screenshot](artifacts/${run.screenshot})`] : ['No screenshot available.']),
    '', '## Recorded case', '', '````json', JSON.stringify(run.snapshot, null, 2), '````', '',
  ]
  return lines.join('\n')
}

export function htmlReport(run: Run, baseline?: Run, images: { current?: string; baseline?: string } = {}): string {
  const escape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!))
  const compare = comparison(baseline, run)
  const image = (data: string | undefined, label: string): string => data ? `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${data}" alt="${label}"></figure>` : ''
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Repro · ${escape(run.snapshot.title)}</title><style>body{max-width:1100px;margin:45px auto;padding:0 25px;background:#f5f5ef;color:#29382c;font:14px/1.7 Georgia,serif}header{border-bottom:1px solid #cdd7c2;padding-bottom:25px}h1{font-size:38px;font-weight:400;line-height:1.2}h2{margin-top:35px;font-size:22px;font-weight:400}.brand{font:12px monospace;letter-spacing:.15em;color:#6b875d}.status{display:inline-block;padding:6px 12px;background:#e5edda;border-radius:5px;font:12px monospace}.failed{background:#f4ded4;color:#944b38}.unverified{background:#efe7c7;color:#877033}.meta{font:11px/1.9 monospace;overflow-wrap:anywhere;color:#738269}table{width:100%;border-collapse:collapse;background:#fffefa}td,th{text-align:left;padding:12px;border:1px solid #dbe2d1;font-size:12px}.shots{display:flex;gap:20px;align-items:flex-start}figure{margin:0;flex:1;min-width:0}figcaption{font:11px monospace;padding:12px 0}img{width:100%;border:1px solid #d0dbc4}pre{padding:20px;background:#fffefa;border:1px solid #dbe2d1;white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.8 monospace}summary{cursor:pointer}p.warning{padding:15px;background:#efe7c7} @media(max-width:650px){.shots{display:block}}@media print{body{margin:0;background:white}pre{font-size:9px}details{display:block}img{max-height:600px;object-fit:contain}}</style></head><body><header><div class="brand">REPRO / ACCEPTANCE REPORT</div><h1>${escape(run.snapshot.title)}</h1><span class="status ${run.status}">${run.status.toUpperCase()}</span><p class="meta">${escape(run.snapshot.url)}<br>${escape(run.startedAt)} · ${run.durationMs} ms · ${escape(run.id)}</p></header>${baseline&&!compare.comparable?'<p class="warning">The steps or acceptance conditions changed. These runs do not establish the same test.</p>':''}${run.error?`<pre>${escape(run.error)}</pre>`:''}<h2>Acceptance conditions</h2>${run.checks.length?`<table><thead><tr><th>Condition</th><th>Baseline</th><th>Current</th><th>Evidence</th></tr></thead><tbody>${run.checks.map(check=>`<tr><td>${escape(check.type)}</td><td>${escape(compare.checks.find(item=>item.id===check.assertionId)?.before)}</td><td>${escape(check.status)}</td><td>${escape(check.detail)}</td></tr>`).join('')}</tbody></table>`:'<p>No acceptance conditions were evaluated. Successful actions alone do not verify a fix.</p>'}<h2>Before / after</h2><div class="shots">${baseline&&baseline.id!==run.id?image(images.baseline,'BASELINE'):''}${image(images.current,'CURRENT')}</div><h2>Replay steps</h2><table><thead><tr><th>Action</th><th>Result</th><th>Detail</th></tr></thead><tbody>${run.steps.map(step=>`<tr><td>${escape(step.action)}</td><td>${escape(step.status)}</td><td>${escape(step.error??`${step.durationMs} ms`)}</td></tr>`).join('')}</tbody></table><h2>Browser evidence</h2><pre>${escape(run.evidence.map(item=>`${item.at} ${item.kind}/${item.level??item.status??''} ${item.text??`${item.method??''} ${item.url??''} ${item.failure??''}`}`).join('\n')||'No browser evidence.')}</pre><h2>Source candidates</h2><p>Locations from browser evidence; investigation hints, not a confirmed root cause.</p><pre>${escape(run.sourceHints.join('\n')||'No locations found.')}</pre><details><summary>Immutable case snapshot</summary><pre>${escape(JSON.stringify(run.snapshot,null,2))}</pre></details><footer><p class="meta">Generated by dsh-repro · Evidence stored locally · No external assets or scripts</p></footer></body></html>`
}

/** Generate data-driven code. User input is serialized, never interpolated as executable code. */
export function playwrightTest(item: Case): string {
  return `// Generated by dsh-repro. Install @playwright/test, then: npx playwright test repro.spec.ts\n`
    + `import { test, expect } from '@playwright/test'\n\n`
    + `const scenario = ${JSON.stringify(item, null, 2)}\n\n`
    + `test(scenario.title, async ({ page }) => {\n`
    + `  test.setTimeout(Math.max(30000, scenario.steps.length * 10000 + scenario.assertions.length * 5000))\n`
    + `  test.skip(scenario.assertions.length === 0, 'No acceptance conditions: this case is unverified')\n`
    + `  const pageErrors: string[] = [], consoleErrors: string[] = [], failedRequests: string[] = []\n`
    + `  const responses: { url: string; status: number }[] = []\n`
    + `  const writes = new Set<unknown>()\n`
    + `  page.on('request', request => { if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.add(request) })\n`
    + `  page.on('response', response => writes.delete(response.request()))\n`
    + `  page.on('requestfailed', request => writes.delete(request))\n`
    + `  page.on('requestfinished', request => writes.delete(request))\n`
    + `  page.on('pageerror', error => pageErrors.push(error.message))\n`
    + `  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()) })\n`
    + `  page.on('requestfailed', request => failedRequests.push(request.url()))\n`
    + `  page.on('response', response => { responses.push({ url: response.url(), status: response.status() }); if (response.status() >= 400) failedRequests.push(response.url()) })\n`
    + `  if (scenario.steps[0]?.action !== 'navigate') await page.goto(scenario.url)\n`
    + `  for (const step of scenario.steps as any[]) {\n`
    + `    if (['reload', 'navigate', 'click'].includes(step.action)) await expect.poll(() => writes.size).toBe(0)\n`
    + `    const target = step.selector ? page.locator(step.selector) : undefined\n`
    + `    let value = step.value ?? ''\n`
    + `    const secret = /^\\$\\{ENV:([A-Z_][A-Z0-9_]*)\\}$/.exec(value)\n`
    + `    if (secret) { if (process.env[secret[1]] === undefined) throw new Error('Missing environment variable: ' + secret[1]); value = process.env[secret[1]]! }\n`
    + `    switch (step.action) {\n`
    + `      case 'navigate': await page.goto(step.url); break\n`
    + `      case 'reload': await page.reload(); break\n`
    + `      case 'click': await target!.click(); break\n`
    + `      case 'fill': await target!.fill(value); break\n`
    + `      case 'select': await target!.selectOption(value); break\n`
    + `      case 'check': await target!.setChecked(step.checked); break\n`
    + `      case 'press': await target!.press(step.key); break\n`
    + `      case 'wait': await (step.value ? target!.filter({ hasText: step.value }) : target!).waitFor({ state: 'visible' }); break\n`
    + `    }\n  }\n`
    + `  await page.waitForTimeout(350)\n`
    + `  const checks = [...scenario.assertions].sort((a, b) => Number(a.type.startsWith('no_')) - Number(b.type.startsWith('no_')))\n`
    + `  for (const check of checks as any[]) {\n`
    + `    const target = check.selector ? page.locator(check.selector) : undefined\n`
    + `    switch (check.type) {\n`
    + `      case 'visible': await expect(target!).toBeVisible(); break\n`
    + `      case 'hidden': await expect(target!).toBeHidden(); break\n`
    + `      case 'text': await expect(target!).toContainText(check.expected); break\n`
    + `      case 'url': await expect.poll(() => page.url()).toContain(check.expected); break\n`
    + `      case 'request': await expect.poll(() => responses.some(item => item.url.includes(check.expected) && item.status === check.status)).toBe(true); break\n`
    + `      case 'no_page_errors': expect(pageErrors).toEqual([]); break\n`
    + `      case 'no_console_errors': expect(consoleErrors).toEqual([]); break\n`
    + `      case 'no_failed_requests': expect(failedRequests).toEqual([]); break\n`
    + `    }\n  }\n})\n`
}
