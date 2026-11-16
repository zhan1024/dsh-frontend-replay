import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const installDir=process.env.DSH_INSTALL_DIR||join(tmpdir(),'dsh-repro-harness')
const spec=process.env.DSH_PACKAGE_SPEC||'@deepseek-ai/dsh@0.2.2-rc.1'
const transcript=[]
const log=value=>{transcript.push(value);console.log(value)}
async function command(bin,args,options={}){
  return await new Promise((resolveRun,reject)=>{
    const child=spawn(bin,args,{cwd:options.cwd||packageDir,env:{...process.env,...options.env},stdio:['ignore','pipe','pipe']})
    let stdout='',stderr=''
    child.stdout.on('data',part=>stdout+=part);child.stderr.on('data',part=>stderr+=part)
    const timer=setTimeout(()=>child.kill('SIGTERM'),180000)
    child.on('error',error=>{clearTimeout(timer);reject(error)})
    child.on('close',code=>{clearTimeout(timer);resolveRun({code,stdout,stderr})})
  })
}
function emit(response,model,delta,finish_reason=null){response.write(`data: ${JSON.stringify({id:'chatcmpl-repro-e2e',object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model,choices:[{index:0,delta,finish_reason}]})}\n\n`)}
function tool(response,model,name,args){
  emit(response,model,{role:'assistant',content:null,tool_calls:[{index:0,id:`call_${name}`,type:'function',function:{name,arguments:''}}]})
  emit(response,model,{tool_calls:[{index:0,function:{arguments:JSON.stringify(args)}}]});emit(response,model,{},'tool_calls');response.end('data: [DONE]\n\n')
}
function text(response,model,value){emit(response,model,{role:'assistant',content:value});emit(response,model,{},'stop');response.end('data: [DONE]\n\n')}
const requests=[]
let targetUrl
const model=createServer((req,res)=>{
  const chunks=[];req.on('data',part=>chunks.push(part));req.on('end',()=>{
    try{
      const input=JSON.parse(Buffer.concat(chunks).toString())
      const messages=input.messages||[]
      const called=messages.filter(item=>item.role==='assistant').flatMap(item=>(item.tool_calls||[]).map(call=>call.function?.name))
      const results=messages.filter(item=>item.role==='tool').map(item=>typeof item.content==='string'?item.content:(item.content||[]).map(part=>part.text||'').join('\n'))
      requests.push({offered:(input.tools||[]).map(item=>item.function?.name),called,results})
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'})
      if(!called.includes('repro_create'))return tool(res,input.model,'repro_create',{
        title:'Real DSH browser acceptance',url:targetUrl,
        steps:[{action:'navigate',url:targetUrl}],
        assertions:[{type:'text',selector:'h1',expected:'Verified by Repro'},{type:'no_page_errors'}],
      })
      const caseId=/"case"\s*:\s*\{\s*"id"\s*:\s*"([^"]+)"/.exec(results.join('\n'))?.[1]
      if(!caseId)return text(res,input.model,'ERROR: no case id in tool result '+results.join('\n'))
      if(!called.includes('repro_run'))return tool(res,input.model,'repro_run',{case_id:caseId,kind:'verification'})
      const runId=/"run"\s*:\s*\{\s*"id"\s*:\s*"([^"]+)"/.exec(results.join('\n'))?.[1]
      if(!called.includes('repro_report')&&runId)return tool(res,input.model,'repro_report',{run_id:runId})
      return text(res,input.model,`REPRO_E2E_COMPLETE: ${results.some(value=>/"status"\s*:\s*"passed"/.test(value))?'passed':'NOT_PASSED'}`)
    }catch(error){res.writeHead(500);res.end(String(error))}
  })
})
const target=createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><h1>Verified by Repro</h1>')})
const home=await mkdtemp(join(tmpdir(),'repro-dsh-home-'))
let tarball
try{
  await new Promise(resolve=>model.listen(0,'127.0.0.1',resolve));await new Promise(resolve=>target.listen(0,'127.0.0.1',resolve))
  targetUrl=`http://127.0.0.1:${target.address().port}`
  let dsh=process.env.DSH_BIN||join(installDir,'node_modules','.bin','dsh')
  if(!existsSync(dsh)){
    await mkdir(installDir,{recursive:true});await writeFile(join(installDir,'package.json'),'{}')
    const install=await command('npm',['install','--legacy-peer-deps=false','--no-audit','--no-fund',spec],{cwd:installDir})
    assert.equal(install.code,0,install.stderr)
  }
  const pack=await command('npm',['pack','--json','--loglevel=error'])
  assert.equal(pack.code,0,pack.stderr)
  const packed=JSON.parse(pack.stdout.slice(pack.stdout.indexOf('[\n')))[0]
  tarball=join(packageDir,packed.filename)
  for(const required of ['dist/index.js','dist/cli.js','ui/index.html','ui/app.js','ui/style.css','cordis.patch.yml','LICENSE'])assert.ok(packed.files.some(file=>file.path===required),`tarball missing ${required}`)
  assert.ok(!packed.files.some(file=>file.path.startsWith('test/')||file.path.includes('.dsh-repro')))
  const env={DSH_HOME:home,DSH_REPRO_DIR:join(home,'evidence'),DSH_REPRO_HEADLESS:'1',DSH_TELEMETRY_MODE:'OFF',DSH_PERMISSION_MODE:'danger-full-access',REPRO_TEST_MODEL_KEY:'test-only'}
  const install=await command(dsh,['plugin','--profile','headless','add',tarball],{env})
  log(`$ dsh plugin --profile headless add <tarball>\n${install.stdout}\n${install.stderr}`)
  assert.equal(install.code,0,'install packed plugin')
  const patch=[
    {id:'agent-default-model',config:{provider:'repro-e2e',model:'repro-test'}},
    {id:'llm-pi-ai',config:{providers:{'repro-e2e':{displayName:'Repro deterministic test',apiKeyEnv:'REPRO_TEST_MODEL_KEY',api:'openai-completions',baseURL:`http://127.0.0.1:${model.address().port}/v1`,models:[{id:'repro-test',name:'Repro test',contextWindow:65536,maxTokens:4096}]}}}},
    {id:'session-telemetry-otel',disabled:true},
  ]
  await writeFile(join(home,'profiles','headless','cordis.patch.yml'),JSON.stringify(patch,null,2))
  const dump=await command(dsh,['headless','--dump-config'],{env});assert.equal(dump.code,0,dump.stderr);assert.match(dump.stdout,/name: ['"]?dsh-repro/)
  const run=await command(dsh,['headless','Create a frontend case, replay it, inspect the report, then state its result.'],{env})
  log(`$ dsh headless <task>\n${run.stdout}\n${run.stderr}`)
  assert.equal(run.code,0,'harness exits successfully')
  assert.match(run.stdout,/REPRO_E2E_COMPLETE: passed/)
  const offered=requests[0]?.offered||[]
  for(const name of ['repro_open','repro_list','repro_create','repro_update','repro_record','repro_stop_recording','repro_run','repro_report','repro_export'])assert.ok(offered.includes(name),`${name} offered to model`)
  assert.ok(requests.some(item=>item.called.includes('repro_report')))
  const caseResult=requests.flatMap(item=>item.results).find(value=>/"case"\s*:\s*\{/.test(value))
  const id=/"case"\s*:\s*\{\s*"id"\s*:\s*"([^"]+)"/.exec(caseResult)[1]
  const persisted=JSON.parse(await readFile(join(home,'evidence','cases',id+'.json'),'utf8'))
  assert.equal(persisted.title,'Real DSH browser acceptance')
  log(`PASS: ${offered.filter(name=>name.startsWith('repro_')).length} tools registered; create → Chromium replay → report reached the model.`)
}finally{
  await Promise.all([new Promise(resolve=>model.close(resolve)),new Promise(resolve=>target.close(resolve))])
  if(process.env.DSH_E2E_LOG)await writeFile(process.env.DSH_E2E_LOG,transcript.join('\n'))
  if(!process.env.DSH_E2E_KEEP_HOME)await rm(home,{recursive:true,force:true})
  if(tarball)await rm(tarball,{force:true})
}
