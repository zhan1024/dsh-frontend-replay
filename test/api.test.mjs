import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { request as httpRequest } from 'node:http'
import { Engine } from '../dist/engine.js'
import { startDashboard } from '../dist/server.js'
import { createTools, apply } from '../dist/index.js'

test('loopback API requires a token, rejects foreign origins and validates editing', async () => {
  const root=await mkdtemp(join(tmpdir(),'repro-api-'));const engine=new Engine({dataDir:root,headless:true});await engine.init()
  const dashboard=await startDashboard(engine)
  const token=new URLSearchParams(new URL(dashboard.url).hash.slice(1)).get('token')
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'}
  try{
    assert.equal((await fetch(dashboard.origin+'/api/bootstrap')).status,401)
    assert.equal((await fetch(dashboard.origin+'/api/bootstrap',{headers:{...headers,Origin:'https://evil.example'}})).status,403)
    const hostStatus=await new Promise((resolve,reject)=>{const req=httpRequest(dashboard.origin+'/api/bootstrap',{headers:{...headers,Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end()})
    assert.equal(hostStatus,403)
    assert.equal((await fetch(dashboard.origin+'/api/cases',{method:'POST',headers,body:'{'})).status,400)
    const response=await fetch(dashboard.origin+'/api/cases',{method:'POST',headers,body:JSON.stringify({title:'example',url:'http://localhost:5173'})})
    assert.equal(response.status,201);const item=await response.json()
    const data=await(await fetch(dashboard.origin+'/api/bootstrap',{headers})).json()
    assert.equal(data.cases[0].id,item.id)
    assert.equal((await fetch(dashboard.origin+`/api/cases/${item.id}/run`,{method:'POST',headers,body:JSON.stringify({kind:'unknown'})})).status,400)
    const exportResponse=await fetch(dashboard.origin+`/api/cases/${item.id}/export`,{headers})
    assert.match(await exportResponse.text(),/import \{ test, expect \}/)
    assert.equal((await fetch(dashboard.origin+'/api/artifacts/../outside/screenshot.png',{headers})).status,404)
    const home=await fetch(dashboard.origin)
    assert.match(home.headers.get('content-security-policy'),/frame-ancestors 'none'/)
    assert.match(await home.text(),/app.js/)
  }finally{await engine.close();await dashboard.close();await rm(root,{recursive:true,force:true})}
})

test('DSH tool contracts validate inputs, persist results and clean up on unload', async () => {
  const root=await mkdtemp(join(tmpdir(),'repro-tools-'));const engine=new Engine({dataDir:root});await engine.init()
  try{
    const tools=createTools(engine,async()=>({url:'http://127.0.0.1:1/#token=test'}))
    const run=(name,args)=>tools.find(tool=>tool.name===`repro_${name}`).execute(args,{signal:new AbortController().signal})
    assert.equal(tools.length,9)
    const result=await run('create',{title:'bug',url:'http://localhost:5173'})
    assert.ok((await run('list',{})).cases.some(item=>item.id===result.case.id))
    await assert.rejects(run('export',{case_id:result.case.id,format:'shell'}))
    await assert.rejects(run('run',{case_id:result.case.id,kind:'unknown'}))
    const controller=new AbortController();controller.abort();await assert.rejects(tools[0].execute({},{signal:controller.signal}))
    const cleanups=[],registered=[]
    await apply({tools:{register:tool=>registered.push(tool.name)},effect:callback=>cleanups.push(callback()),logger:{info(){}}},{dataDir:root})
    assert.equal(registered.length,9);await cleanups[0]()
  }finally{await engine.close();await rm(root,{recursive:true,force:true})}
})
