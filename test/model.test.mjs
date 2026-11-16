import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { makeCase, steps, assertions, redact, evidenceUrl, sourceHints } from '../dist/model.js'
import { Store } from '../dist/store.js'
import { comparison, htmlReport, markdown, playwrightTest } from '../dist/report.js'

test('reject invalid cases, actions, acceptance conditions and secret values', () => {
  for (const value of [null, [], {}, { title:'a',url:'javascript:alert(1)' }, { title:'a',url:'https://user:pass@example.com' }]) assert.throws(()=>makeCase(value))
  assert.throws(()=>steps([{action:'evaluate',value:'process.exit()'}]))
  assert.throws(()=>steps([{action:'fill',selector:'#password',value:'plain password',secret:true}]))
  assert.throws(()=>steps([{id:'same',action:'reload'},{id:'same',action:'reload'}]))
  assert.throws(()=>assertions([{type:'request',expected:'/api',status:0}]))
  assert.throws(()=>assertions([{type:'text',selector:'#value',expected:''}]))
  assert.throws(()=>assertions([{type:'unknown'}]))
  const item=makeCase({title:'save',url:'http://localhost:5173',steps:[{action:'fill',selector:'#password',value:'${ENV:PASS}',secret:true}],assertions:[{type:'no_page_errors'}]})
  assert.equal(item.steps[0].secret,true)
  assert.equal(makeCase({title:'updated'},item).id,item.id)
})

test('redact credential evidence and extract source candidates', () => {
  const value=redact('Authorization: Bearer abc.def password=topsecret access_token=123 explicit-secret',['explicit-secret'])
  for(const secret of ['abc.def','topsecret','123','explicit-secret'])assert.ok(!value.includes(secret))
  const url=evidenceUrl('https://user:pass@example.com/api?access_token=sensitive&name=test#secret')
  assert.ok(!url.includes('sensitive'));assert.ok(!url.includes('user'));assert.ok(!url.includes('#secret'))
  assert.match(url,/name=test/)
  assert.deepEqual(sourceHints([{kind:'pageerror',at:'now',text:'at save (http://localhost:5173/src/views/Settings.vue:42:7)'}]),['http://localhost:5173/src/views/Settings.vue:42:7'])
})

test('persistent store validates identifiers and leaves run snapshots immutable', async () => {
  const root=await mkdtemp(join(tmpdir(),'repro-store-'))
  try{
    const store=new Store(root);await store.init()
    const item=makeCase({title:'original',url:'http://localhost:5173'})
    await store.saveCase(item)
    const run={id:'run-1',caseId:item.id,snapshot:structuredClone(item),startedAt:new Date().toISOString()}
    await store.saveRun(run)
    await store.saveCase(makeCase({title:'changed'},item))
    assert.equal((await store.run('run-1')).snapshot.title,'original')
    assert.equal((await store.cases())[0].title,'changed')
    await assert.rejects(store.case('../../outside'))
    assert.throws(()=>store.artifact('run-1','../outside'))
  }finally{await rm(root,{recursive:true,force:true})}
})

test('reports flag changed definitions, escape HTML and generate data-driven tests', () => {
  const item=makeCase({title:'</script><img src=x onerror=alert(1)>',url:'http://localhost:5173',steps:[{action:'navigate',url:'http://localhost:5173'}],assertions:[]})
  const run={id:'a',caseId:item.id,kind:'verification',status:'unverified',startedAt:'now',durationMs:1,snapshot:item,steps:[],checks:[],evidence:[],sourceHints:[]}
  const changed={...run,id:'b',snapshot:makeCase({steps:[{action:'reload'}]},item)}
  assert.equal(comparison(run,run).comparable,true)
  assert.equal(comparison(run,changed).comparable,false)
  const html=htmlReport(run)
  assert.ok(!html.includes('<img src=x onerror'))
  assert.match(html,/&lt;\/script&gt;/)
  assert.match(markdown(run),/No acceptance conditions/)
  const script=playwrightTest(item)
  assert.match(script,/test\.skip\(scenario.assertions.length === 0/)
  assert.match(script,/switch \(step.action\)/)
})
