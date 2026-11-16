import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { Engine } from '../dist/engine.js'
import { startDashboard } from '../dist/server.js'
import { comparison, playwrightTest } from '../dist/report.js'

async function fixture(){
  const root=await mkdtemp(join(tmpdir(),'repro-browser-'))
  const engine=new Engine({dataDir:root,headless:true,timeoutMs:1200});await engine.init()
  const dashboard=await startDashboard(engine)
  const token=new URLSearchParams(new URL(dashboard.url).hash.slice(1)).get('token')
  const api=async(path,body)=>{
    const response=await fetch(dashboard.origin+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})})
    assert.ok(response.ok,await response.clone().text());return response.json()
  }
  return {root,engine,dashboard,api,async close(){await engine.close();await dashboard.close();await rm(root,{recursive:true,force:true})}}
}

test('real browser: the same case fails before the fix and passes afterwards',async()=>{
  const f=await fixture()
  try{
    const item=await f.api('/api/demo',{})
    const baseline=await f.engine.run(item.id,'baseline')
    assert.equal(baseline.status,'failed',JSON.stringify(baseline,null,2))
    assert.equal(baseline.checks[0].status,'failed')
    assert.ok(baseline.evidence.some(item=>item.kind==='request'&&item.method==='POST'&&item.status===200))
    await f.api('/api/demo/fix',{fixed:true})
    const verified=await f.engine.run(item.id)
    assert.equal(verified.status,'passed',JSON.stringify(verified,null,2))
    assert.equal(verified.checks.length,3)
    assert.equal(comparison(baseline,verified).comparable,true)
    assert.ok((await readFile(f.engine.store.artifact(verified.id,'screenshot.png'))).length>1000)
    await f.engine.update(item.id,{title:'updated after run',assertions:[{type:'visible',selector:'#settings'}]})
    assert.equal((await f.engine.store.run(baseline.id)).snapshot.title,item.title)
    const changed=await f.engine.run(item.id)
    assert.equal(comparison(baseline,changed).comparable,false)
    const report=await fetch(`${f.dashboard.origin}/api/runs/${verified.id}/html`,{headers:{Authorization:`Bearer ${new URLSearchParams(new URL(f.dashboard.url).hash.slice(1)).get('token')}`}})
    const html=await report.text();assert.match(html,/data:image\/png;base64,/);assert.match(html,/PASSED/)
  }finally{await f.close()}
})

test('manual browser recording captures trusted actions, merges fill events and replays',async()=>{
  const f=await fixture()
  try{
    await f.api('/api/demo/fix',{fixed:true})
    const item=await f.engine.create({title:'recorded flow',url:f.dashboard.origin+'/demo'})
    await f.engine.startRecording(item.id)
    const page=f.engine.recording.session.page
    await page.locator('#name').fill('Recorded workspace')
    await page.locator('[data-testid="save"]').click()
    await page.locator('#status').filter({hasText:'Saved.'}).waitFor()
    await page.locator('#refresh').click()
    await page.locator('#persisted').filter({hasText:'Recorded workspace'}).waitFor()
    await delay(100)
    const result=await f.engine.stopRecording()
    assert.equal(result.run.status,'unverified')
    assert.deepEqual(result.case.steps.map(step=>step.action),['navigate','fill','click','click'])
    assert.equal(result.case.steps[1].value,'Recorded workspace')
    await f.engine.update(item.id,{assertions:[{type:'text',selector:'#persisted',expected:'Recorded workspace'}]})
    const run=await f.engine.run(item.id)
    assert.equal(run.status,'passed',JSON.stringify(run,null,2))
  }finally{await f.close()}
})

test('failed steps cannot pass acceptance; empty conditions remain unverified; cancellation stops the browser',async()=>{
  const f=await fixture()
  try{
    const item=await f.engine.create({title:'boundary',url:f.dashboard.origin+'/demo',steps:[{action:'navigate',url:f.dashboard.origin+'/demo'}]})
    assert.equal((await f.engine.run(item.id)).status,'unverified')
    await f.engine.update(item.id,{steps:[{action:'navigate',url:f.dashboard.origin+'/demo'},{action:'click',selector:'#missing'},{action:'reload'}],assertions:[{type:'visible',selector:'body'}]})
    const failed=await f.engine.run(item.id)
    assert.equal(failed.status,'failed');assert.equal(failed.steps[1].status,'failed');assert.equal(failed.steps[2].status,'skipped');assert.equal(failed.checks[0].status,'skipped')
    const controller=new AbortController()
    const pending=f.engine.run(item.id,'verification',controller.signal)
    await delay(200);controller.abort()
    const cancelled=await pending
    assert.equal(cancelled.status,'failed');assert.equal(f.engine.status().busy,'')
  }finally{await f.close()}
})

test('capture actual page errors, failed HTTP calls and redacted console credentials',async()=>{
  const f=await fixture()
  const target=createServer((req,res)=>{
    if(req.url==='/broken'){res.writeHead(503);res.end('broken');return}
    res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body><p>Diagnostics</p><script>for(let i=0;i<1050;i++)console.log("routine "+i);console.error("access_token=sensitive");fetch("/broken");setTimeout(()=>{throw new Error("save failed /src/Settings.vue:42:7")},20)</script></body></html>')
  })
  await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve))
  try{
    const item=await f.engine.create({title:'diagnostics',url:`http://127.0.0.1:${target.address().port}`,steps:[{action:'navigate',url:`http://127.0.0.1:${target.address().port}`}],assertions:[{type:'no_page_errors'},{type:'no_console_errors'},{type:'no_failed_requests'},{type:'request',expected:'/broken',status:503}]})
    const run=await f.engine.run(item.id)
    assert.equal(run.status,'failed');assert.deepEqual(run.checks.map(check=>check.status),['failed','failed','failed','passed'])
    assert.ok(!JSON.stringify(run.evidence).includes('sensitive'))
    assert.ok(run.sourceHints.some(hint=>hint.includes('Settings.vue:42:7')))
  }finally{await new Promise(resolve=>target.close(resolve));await f.close()}
})

test('workbench UI: create case, edit actions and conditions, run sample and download report',async()=>{
  const f=await fixture();const browser=await chromium.launch({headless:true})
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1050}});const errors=[];page.on('pageerror',error=>errors.push(error.message))
    const expired=new URL(f.dashboard.url);expired.hash='token=expired'
    await page.goto(expired.href)
    await page.locator('.fatal').waitFor()
    await page.goto(f.dashboard.url)
    await page.locator('.sidebar').waitFor()
    await page.locator('[data-action=language]').click() // Test both translations through actual UI.
    await page.locator('[data-action=demo]').first().click()
    await page.locator('[data-action=baseline]').waitFor()
    await page.locator('[data-action=baseline]').click()
    await page.locator('.run-summary .badge.failed').waitFor({timeout:15000})
    await page.locator('[data-action=demo-fix]').click()
    await page.locator('[data-action=verify]:not([disabled])').waitFor()
    await page.locator('[data-action=verify]').click()
    await page.locator('.run-summary .badge.passed').waitFor({timeout:15000})
    const downloadPromise=page.waitForEvent('download')
    await page.locator('[data-action=export-html]').click()
    assert.equal((await downloadPromise).suggestedFilename(),'repro-report.html')
    await page.locator('[data-action=add-check]').click()
    await page.locator('select[name=type]').selectOption('url')
    await page.locator('[name=expected]').fill('/demo')
    await page.locator('#edit-form [type=submit]').click()
    await page.locator('#editor').waitFor({state:'hidden'})
    assert.equal(await page.locator('.assertion').count(),4)
    await page.locator('[data-action=new]').click()
    await page.locator('[name=title]').fill('UI case')
    await page.locator('[name=url]').fill(f.dashboard.origin+'/demo')
    await page.locator('#edit-form [type=submit]').click()
    await page.locator('#editor').waitFor({state:'hidden'})
    assert.equal(await page.locator('h1').textContent(),'UI case')
    await page.locator('[data-action=add-step]').click()
    await page.locator('[name=action]').selectOption('navigate')
    await page.locator('#edit-form [type=submit]').click()
    await page.locator('#editor').waitFor({state:'hidden'})
    assert.equal(await page.locator('.step').count(),1)
    await page.setViewportSize({width:390,height:844})
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth))
    assert.deepEqual(errors,[])
  }finally{await browser.close();await f.close()}
})

test('password recording uses distinct environment references and records input submit buttons',async()=>{
  const f=await fixture()
  const target=createServer((_req,res)=>{
    res.writeHead(200,{'Content-Type':'text/html'})
    res.end('<!doctype html><form onsubmit="event.preventDefault();document.querySelector(\'#result\').textContent=\'Submitted\'"><input id="password" type="password"><input id="api_key"><input id="submit" type="submit" value="Save"></form><p id="result"></p>')
  })
  await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve))
  const previous=[process.env.REPRO_SECRET_1,process.env.REPRO_SECRET_2]
  try{
    const item=await f.engine.create({title:'secret form',url:`http://127.0.0.1:${target.address().port}`})
    await f.engine.startRecording(item.id)
    const page=f.engine.recording.session.page
    await page.locator('#password').fill('test-password-value')
    await page.locator('#api_key').fill('test-api-key-value')
    await page.locator('#submit').click()
    await page.locator('#result').filter({hasText:'Submitted'}).waitFor()
    const recorded=await f.engine.stopRecording()
    assert.deepEqual(recorded.case.steps.map(step=>step.action),['navigate','fill','fill','click'])
    assert.deepEqual(recorded.case.steps.filter(step=>step.secret).map(step=>step.value),['${ENV:REPRO_SECRET_1}','${ENV:REPRO_SECRET_2}'])
    assert.ok(!JSON.stringify(recorded).includes('test-password-value'))
    assert.ok(!JSON.stringify(recorded).includes('test-api-key-value'))
    await f.engine.update(item.id,{assertions:[{type:'text',selector:'#result',expected:'Submitted'}]})
    const missing=await f.engine.run(item.id)
    assert.equal(missing.status,'failed')
    assert.match(missing.steps[1].error,/Set environment variable/)
    process.env.REPRO_SECRET_1='test-password-value';process.env.REPRO_SECRET_2='test-api-key-value'
    assert.equal((await f.engine.run(item.id)).status,'passed')
  }finally{
    for(let i=0;i<previous.length;i++){if(previous[i]===undefined)delete process.env[`REPRO_SECRET_${i+1}`];else process.env[`REPRO_SECRET_${i+1}`]=previous[i]}
    await new Promise(resolve=>target.close(resolve));await f.close()
  }
})

test('exported Playwright test independently fails on the bug and passes after the fix',async()=>{
  const f=await fixture()
  const root=await mkdtemp(fileURLToPath(new URL('./.export-',import.meta.url)))
  try{
    const item=await f.api('/api/demo',{})
    await writeFile(join(root,'repro.spec.ts'),playwrightTest(item))
    await writeFile(join(root,'playwright.config.mjs'),`export default {testDir:'.',testMatch:'repro.spec.ts',workers:1,retries:0,expect:{timeout:1200},outputDir:${JSON.stringify(join(root,'results'))}}`)
    const replay=()=>new Promise((resolve,reject)=>{
      const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/@playwright/test/cli.js',import.meta.url)),'test','--config',join(root,'playwright.config.mjs'),'--reporter=line'],{stdio:['ignore','pipe','pipe']})
      let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk)
      const timer=setTimeout(()=>child.kill('SIGTERM'),45000)
      child.on('error',reject);child.on('close',code=>{clearTimeout(timer);resolve({code,output})})
    })
    const broken=await replay()
    assert.equal(broken.code,1,broken.output);assert.match(broken.output,/1 failed/)
    await f.api('/api/demo/fix',{fixed:true})
    const fixed=await replay()
    assert.equal(fixed.code,0,fixed.output);assert.match(fixed.output,/1 passed/)
  }finally{await rm(root,{recursive:true,force:true});await f.close()}
})
