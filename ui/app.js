const copy = {
  tagline:['FRONTEND EVIDENCE WORKBENCH','前端故障复现与验收'],local:['LOCAL WORKSPACE','本地工作台'],library:['CASE LIBRARY','故障用例'],newCase:['New case','新建用例'],noCases:['Your next bug starts here.','从第一个故障用例开始。'],import:['Import case JSON','导入用例 JSON'],tryDemo:['Try the sample bug','体验示例故障'],sidebarNote:['Keep the steps. Keep the evidence. Know when it is fixed.','留下步骤与证据，让修复有据可查。'],workspace:['Workspace','工作区'],case:['Case','用例'],edit:['Edit case','编辑用例'],record:['Record steps','录制步骤'],stop:['Stop & save','停止并保存'],baseline:['Run baseline','运行复现基线'],verify:['Verify fix','验收修复'],steps:['Replay steps','复现步骤'],checks:['Acceptance conditions','验收条件'],addStep:['Add step','添加步骤'],addCheck:['Add condition','添加条件'],noSteps:['Record a browser interaction or add a step to begin.','启动浏览器录制，或手动添加一个步骤。'],noChecks:['Add an explicit condition before verifying a fix.','请先添加明确的验收条件。'],checkNote:['Actions running successfully do not prove a fix. Every condition must pass.','步骤执行成功不等于故障已修复，所有验收条件都需要通过。'],scenario:['Scenario','步骤与条件'],evidence:['Evidence','浏览器证据'],history:['Run history','运行历史'],evidencePanel:['EVIDENCE / LATEST RUN','运行证据'],emptyEvidence:['Evidence belongs here.','让结果有证据。'],emptyEvidenceBody:['Run the case to capture a screenshot, browser errors, network activity, and the result of every acceptance condition.','运行用例后，这里会展示截图、浏览器异常、网络请求和每项条件的验收结果。'],flow:['01  Reproduce → 02  Fix → 03  Verify','01  复现 → 02  修复 → 03  验收'],passed:['Passed','通过'],failed:['Failed','失败'],unverified:['Unverified','尚未验证'],skipped:['Skipped','未执行'],not_run:['Not run','未运行'],recording:['Recording','正在录制'],verification:['Verification','修复验收'],duration:['DURATION','运行耗时'],started:['STARTED','开始时间'],screenshot:['SCREENSHOT','页面截图'],before:['BASELINE','修复前'],after:['CURRENT','当前运行'],conditions:['CONDITIONS','验收条件'],export:['Export','导出'],json:['Case JSON','用例 JSON'],markdown:['Markdown report','Markdown 报告'],playwright:['Playwright test','Playwright 测试'],useBaseline:['Use as baseline','设为复现基线'],source:['SOURCE CANDIDATES','源码位置候选'],sourceNote:['Locations from browser evidence; investigate before assigning a root cause.','根据浏览器证据提取，仅作为排查线索。'],noScreenshot:['No screenshot available','暂无截图'],all:['All','全部'],errors:['Errors','错误'],requests:['Requests','网络'],noEvidence:['No browser evidence in this run.','本次运行没有浏览器证据。'],noRuns:['Run a baseline to start the history.','先运行一次复现基线。'],changed:['The steps or conditions have changed since the baseline. These runs do not establish the same test.','步骤或验收条件已发生变化，两次运行不能视为同一项测试。'],emptyTitle:['Make the bug<br>repeat itself.','把故障<br>变成可重放的步骤。'],emptyBody:['Record what happened. Define what should happen. Give every fix a repeatable check.','记录发生了什么，明确应该发生什么，再用相同的步骤验收修复。'],createFirst:['Create your first case','创建第一个用例'],recordNode:['Record','录制'],evidenceNode:['Collect evidence','采集证据'],verifyNode:['Verify the fix','验收'],title:['Case title','用例名称'],target:['Target URL','目标地址'],description:['What went wrong?','故障描述'],cancel:['Cancel','取消'],save:['Save','保存'],create:['Create case','创建用例'],selector:['CSS selector','CSS 选择器'],value:['Value / expected text','值 / 期望文本'],url:['URL','页面地址'],key:['Keyboard key','键盘按键'],checked:['Checked','选中状态'],secret:['Value is an environment variable reference','值是环境变量引用'],action:['Action','操作'],condition:['Condition','验收类型'],expected:['Expected text / URL fragment','期望文本 / URL 片段'],httpStatus:['HTTP status','HTTP 状态码'],delete:['Delete','删除'],moveUp:['Move up','上移'],moveDown:['Move down','下移'],editStep:['Edit step','编辑步骤'],editCheck:['Edit condition','编辑条件'],saved:['Saved','已保存'],recordStarted:['Operate the Chromium window, then stop recording here.','请在新打开的 Chromium 窗口中操作，然后回到这里停止录制。'],recordSaved:['Recording saved. Define conditions, then replay it.','录制已保存。请设置验收条件后重放。'],busy:['Working…','正在处理…'],loading:['Loading…','正在加载…'],recordHelp:['Operate the target browser. Recording captures the top-level page.','请操作目标浏览器，当前录制顶层页面。'],recordLimit:['Supports top-level clicks, input, select, check, Enter and navigation. Add a Wait step for asynchronous UI transitions. Iframes, uploads, drag-and-drop and popups need manual adaptation.','支持顶层页面的点击、输入、选择、勾选、Enter 和导航。异步界面可添加“等待”步骤；iframe、上传、拖拽和弹窗流程需要手动适配。'],stepHint:['Prefer a stable data-testid or id. A Wait step waits until the element is visible and optionally contains the given text.','优先使用稳定的 data-testid 或 id。“等待”步骤会等待元素可见，并可指定其中需要出现的文本。'],secretHint:['Use ${ENV:REPRO_SECRET_1}; set that variable in the terminal before replay.','使用 ${ENV:REPRO_SECRET_1}，重放前在终端设置相应环境变量。'],demoBroken:['Sample application: save is broken','示例应用：保存故障已开启'],demoFixed:['Sample application: fix applied','示例应用：已应用修复'],applyFix:['Apply demo fix','应用示例修复'],restoreBug:['Restore sample bug','恢复示例故障'],demoNote:['This changes only the bundled sample application. Your application must be fixed in its own source code.','此操作仅切换内置示例；真实项目需要修改项目代码。'],baselineSet:['Baseline selected','已设置复现基线'],runDone:['Run finished','运行已结束'],openImage:['Open screenshot','查看截图'],noToken:['Open the complete workbench URL printed in your terminal. It includes a #token fragment.','请打开终端输出的完整工作台地址，其中包含 #token 片段。'],reconnect:['Reconnect','重新连接'],html:['HTML report','HTML 报告'],comparison:['BEFORE / AFTER','修复前后对比'],snapshot:['Run snapshot','运行时快照'],unverifiedBody:['This run has no evaluated acceptance conditions. No fix has been verified.','本次没有已执行的验收条件，尚不能确认修复。'],passedBody:['All replay steps and acceptance conditions passed.','复现步骤和验收条件全部通过。'],failedBody:['A replay step or acceptance condition failed. Inspect the evidence below.','存在未通过的步骤或验收条件，请检查下方证据。'],recordingBody:['Actions and evidence captured. Replay with acceptance conditions to verify.','已记录操作和证据，请添加验收条件并重放。'],downloaded:['Export downloaded','导出文件已下载'],invalidImport:['Choose a JSON case exported from Repro.','请选择 Repro 导出的用例 JSON。'],deleteConfirm:['Remove this item?','移除此条目？'],runSnapshotNote:['Showing results from an immutable run snapshot.','结果来自该次运行保存的快照。']
}
const actionCopy = {navigate:['Navigate','打开页面'],click:['Click','点击'],fill:['Fill','输入'],select:['Select','选择'],check:['Check','勾选'],press:['Press','按键'],reload:['Reload','刷新'],wait:['Wait','等待']}
const checkCopy = {visible:['Element is visible','元素可见'],hidden:['Element is hidden','元素隐藏'],text:['Element contains text','元素包含文本'],url:['URL contains','URL 包含'],request:['Request returned status','请求返回指定状态'],no_page_errors:['No uncaught page errors','没有未捕获页面异常'],no_console_errors:['No console errors','没有控制台错误'],no_failed_requests:['No failed requests / HTTP errors','没有失败请求或 HTTP 错误']}
let lang = localStorage.getItem('repro-language') || (navigator.language.startsWith('zh') ? 'zh' : 'en')
const t = key => copy[key]?.[lang === 'zh' ? 1 : 0] ?? key
const actionLabel = key => actionCopy[key]?.[lang === 'zh' ? 1 : 0] ?? key
const checkLabel = key => checkCopy[key]?.[lang === 'zh' ? 1 : 0] ?? key
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const paths = {plus:'M8 3v10M3 8h10',record:'M8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10',play:'m5 3 8 5-8 5Z',check:'m3 8 3 3 7-7',arrow:'M3 8h10m-4-4 4 4-4 4',link:'m6 10 4-4M6 5l1-1a3 3 0 0 1 4 4l-1 1M10 11l-1 1a3 3 0 0 1-4-4l1-1',edit:'m10 3 3 3-7 7-4 1 1-4ZM9 4l3 3',trash:'M3 4h10M6 4V2h4v2M4 4l1 10h6l1-10M7 7v4m2-4v4',up:'m4 10 4-4 4 4',down:'m4 6 4 4 4-4',close:'m4 4 8 8m0-8-8 8',globe:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM1 8h14M8 1c4 4 4 10 0 14C4 11 4 5 8 1Z',reload:'M13 6a5 5 0 1 0 0 5M13 2v4H9',cursor:'m3 2 10 7-5 1-2 4Z',input:'M2 4h12v8H2ZM5 6v4',select:'m4 6 4 4 4-4',clock:'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 2v4l3 2',shield:'m8 1 6 3v4c0 4-6 7-6 7S2 12 2 8V4Zm-3 7 2 2 4-4',download:'M8 2v8m-3-3 3 3 3-3M3 11v3h10v-3',info:'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 6v4m0-7v1',folder:'M1 4h5l2 2h7v8H1Zm0 0V2h5l2 2h7v2',eye:'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5Zm7-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4',stop:'M4 4h8v8H4Z'}
const icon = name => `<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`
const button = (action, label, symbol, cls='', attrs='') => `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${symbol ? icon(symbol) : ''}${label}</button>`
const badge = status => `<span class="badge ${escape(status)}">${escape(t(status))}</span>`
const stamp = value => new Date(value).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-GB',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})
const app = document.querySelector('#app'), editor = document.querySelector('#editor')
const token = new URLSearchParams(location.hash.slice(1)).get('token') || sessionStorage.getItem('repro-token') || ''
if (token) sessionStorage.setItem('repro-token', token)
window.addEventListener('hashchange', () => {
  const next = new URLSearchParams(location.hash.slice(1)).get('token')
  if (next && next !== token) location.reload()
})
const state = {cases:[],activeId:sessionStorage.getItem('repro-case'),item:null,runs:[],run:null,baseline:null,comparison:null,recording:null,serverBusy:'',busy:false,tab:'scenario',filter:'all',demoFixed:false}
const imageUrls = new Map()
let toastTimer
function toast(message, error=false){const el=document.querySelector('#toast');el.textContent=message;el.className=`show${error?' error':''}`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='',5000)}
async function request(path, options={}){
  const response = await fetch(path,{...options,headers:{Authorization:`Bearer ${token}`,...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}})
  if (!response.ok){let reason;try{reason=(await response.json()).error}catch{reason=`HTTP ${response.status}`}throw new Error(reason)}
  if(options.blob)return response.blob()
  return response.headers.get('content-type')?.includes('application/json')?response.json():response.text()
}
const post = (path, value={}) => request(path,{method:'POST',body:JSON.stringify(value)})
async function load(id=state.activeId,runId){
  const data=await request('/api/bootstrap');state.cases=data.cases;state.recording=data.recording;state.serverBusy=data.busy;state.demoFixed=data.demoFixed
  state.activeId=state.cases.some(item=>item.id===id)?id:state.cases[0]?.id
  if(state.activeId){
    sessionStorage.setItem('repro-case',state.activeId)
    const selected=await request(`/api/cases/${state.activeId}`);state.item=selected.case;state.runs=selected.runs
    const chosen=runId||((state.run?.caseId===state.activeId&&state.runs.some(run=>run.id===state.run.id))?state.run.id:state.runs[0]?.id)
    if(chosen){const detail=await request(`/api/runs/${chosen}`);state.run=detail.run;state.baseline=detail.baseline;state.comparison=detail.comparison}else{state.run=null;state.baseline=null;state.comparison=null}
  }else{state.item=null;state.run=null;state.runs=[]}
  render()
}
function locked(){return state.busy||!!state.serverBusy||!!state.recording}
function sidebar(){return `<aside class="sidebar"><div class="sidebar-label"><span class="eyebrow">${t('library')}</span><span class="count">${state.cases.length.toString().padStart(2,'0')}</span></div>${button('new',t('newCase'),'plus','new-case soft')}<div class="case-list">${state.cases.length?state.cases.map((item,index)=>`<button class="case-item ${item.id===state.activeId?'selected':''}" data-action="select" data-id="${item.id}" aria-current="${item.id===state.activeId}"><span class="case-mark">${String(index+1).padStart(2,'0')}</span><span><span class="case-name">${escape(item.title)}</span><span class="case-date">${escape(stamp(item.updatedAt))}</span></span></button>`).join(''):`<div class="sidebar-empty">${t('noCases')}</div>`}</div><div class="sidebar-bottom">${button('import',t('import'),'folder','ghost')}${button('demo',t('tryDemo'),'play','ghost',locked()?'disabled':'')}<p>${t('sidebarNote')}</p><span class="eyebrow">LOCAL · PRIVATE · REPEATABLE</span></div></aside>`}
function emptyMain(){return `<main class="main"><div class="empty-main"><span class="eyebrow">A SMALL LAB FOR STUBBORN BUGS</span><h1>${t('emptyTitle')}</h1><p>${t('emptyBody')}</p><div class="empty-actions">${button('new',t('createFirst'),'plus','primary')}${button('demo',t('tryDemo'),'play','')}</div><div class="empty-illustration"><span class="flow-node">${t('recordNode')}</span><span class="flow-arrow">→</span><span class="flow-node">${t('evidenceNode')}</span><span class="flow-arrow">→</span><span class="flow-node">${t('verifyNode')}</span></div><p class="shortcut-note">DSH / repro_open → repro_create → repro_run</p></div></main>`}
function stepRows(){return state.item.steps.length?`<ol class="step-list">${state.item.steps.map((step,index)=>{
  const result=state.run?.steps.find(item=>item.stepId===step.id)
  const symbols={navigate:'globe',click:'cursor',fill:'input',select:'select',check:'check',press:'input',reload:'reload',wait:'clock'}
  return `<li class="step"><span class="step-number">${String(index+1).padStart(2,'0')}</span><span class="step-symbol">${icon(symbols[step.action])}</span><div class="step-info"><div class="step-action"><strong>${escape(actionLabel(step.action))}</strong><code>${escape(step.selector||step.url||'')}</code></div>${step.value!==undefined?`<span class="step-value">${escape(step.value)}</span>`:''}${step.key?`<span class="step-value">${escape(step.key)}</span>`:''}${step.action==='check'?`<span class="step-value">${step.checked?'true':'false'}</span>`:''}${result?`<span class="row-status ${result.status}">${escape(t(result.status))} · ${result.durationMs}ms</span>`:''}</div><div class="row-actions">${['up','down','edit','delete'].map(action=>button(`step-${action}`,'',action==='delete'?'trash':action,'',`data-index="${index}" aria-label="${t(action==='up'?'moveUp':action==='down'?'moveDown':action==='edit'?'editStep':'delete')}" title="${t(action==='up'?'moveUp':action==='down'?'moveDown':action==='edit'?'editStep':'delete')}" ${locked()?'disabled':''}`)).join('')}</div></li>`
}).join('')}</ol>`:`<p class="section-note">${t('noSteps')}</p>`}
function conditionRows(){return state.item.assertions.length?state.item.assertions.map((check,index)=>{
  const result=state.run?.checks.find(item=>item.assertionId===check.id)
  return `<div class="assertion"><span class="assertion-icon">${icon(result?.status==='failed'?'close':'check')}</span><div class="assertion-text"><strong>${escape(checkLabel(check.type))}</strong>${check.selector||check.expected?`<code>${escape([check.selector,check.expected,check.status].filter(v=>v!==undefined).join(' → '))}</code>`:''}${result?`<div class="check-detail">${escape(result.detail)}</div>`:''}</div><div class="row-actions">${button('check-edit','','edit','',`data-index="${index}" aria-label="${t('editCheck')}" ${locked()?'disabled':''}`)}${button('check-delete','','trash','',`data-index="${index}" aria-label="${t('delete')}" ${locked()?'disabled':''}`)}</div></div>`
}).join(''):`<p class="section-note">${t('noChecks')}</p>`}
function scenario(){return `<section><div class="section-head">${icon('cursor')}<h2>${t('steps')}</h2><span class="section-count">${state.item.steps.length.toString().padStart(2,'0')}</span>${button('add-step',t('addStep'),'plus','ghost',locked()?'disabled':'')}</div>${stepRows()}<div class="section-note">${t('recordLimit')}</div></section><section class="assertions"><div class="section-head">${icon('shield')}<h2>${t('checks')}</h2><span class="section-count">${state.item.assertions.length.toString().padStart(2,'0')}</span>${button('add-check',t('addCheck'),'plus','ghost',locked()?'disabled':'')}</div>${conditionRows()}<div class="condition-note">${icon('info')}<span>${t('checkNote')}</span></div></section>`}
function evidenceList(){
  const entries=(state.recording?.caseId===state.activeId?state.recording.evidence:state.run?.evidence)||[]
  const filtered=entries.filter(item=>state.filter==='all'||(state.filter==='requests'?item.kind==='request':item.kind==='pageerror'||item.level==='error'||item.failure||item.status>=400))
  return `<div class="filterbar">${['all','errors','requests'].map(filter=>button('filter',t(filter),'',state.filter===filter?'active':'',`data-filter="${filter}"`)).join('')}</div><div class="evidence-list">${filtered.length?filtered.map(item=>`<article class="evidence ${item.kind==='pageerror'||item.level==='error'||item.failure||item.status>=400?'error':''}"><div class="evidence-head"><span>${escape(item.kind.toUpperCase())}${item.level?` / ${escape(item.level)}`:''}</span><span>${escape(new Date(item.at).toLocaleTimeString())}</span>${item.status?`<span>${item.status}</span>`:''}</div><pre class="evidence-content">${escape(item.text||`${item.method||''} ${item.url||''}${item.failure?'\n'+item.failure:''}`)}</pre></article>`).join(''):`<p class="section-note">${t('noEvidence')}</p>`}</div>`
}
function history(){return `<div class="history">${state.runs.length?state.runs.map(run=>`<button data-action="select-run" data-id="${run.id}" class="history-item ${state.run?.id===run.id?'active':''}">${icon('clock')}<span class="history-info"><strong>${t(run.kind)}</strong><small>${escape(stamp(run.startedAt))} · ${(run.durationMs/1000).toFixed(1)}s</small></span>${run.id===state.item.baselineRunId?`<span class="history-baseline">${t('before')}</span>`:''}${badge(run.status)}</button>`).join(''):`<p class="section-note">${t('noRuns')}</p>`}</div>`}
function main(){
  if(!state.item)return emptyMain()
  const item=state.item,recording=state.recording
  const demo=item.url===`${location.origin}/demo`
  const disabled=locked()?'disabled':''
  return `<main class="main"><div class="breadcrumb">${t('workspace')}<span>/</span><strong>${t('case')} ${escape(item.id.slice(0,8))}</strong></div><div class="case-heading"><h1>${escape(item.title)}</h1>${button('edit-case','','edit','ghost icon-button',`aria-label="${t('edit')}" ${disabled}`)}</div><p class="description">${escape(item.description)}</p><div class="target">${icon('globe')}<code title="${escape(item.url)}">${escape(item.url)}</code></div>${recording?`<div class="recording-strip"><span class="recording-dot"></span><div><strong>${t('recording')}</strong><div class="muted" id="record-count">${recording.steps.length} ${t('steps')} · ${recording.evidence.length} ${t('evidence')}</div></div>${button('stop',t('stop'),'stop','danger',state.busy?'disabled':'')}</div><p class="section-note">${t('recordHelp')}</p>`:''}<div class="actionbar">${button('record',t('record'),'record','',disabled)}${button('baseline',t('baseline'),'play','',`${disabled} ${!item.steps.length?'disabled':''}`)}${button('verify',state.busy?t('busy'):t('verify'),'shield','primary',`${disabled} ${!item.steps.length?'disabled':''}`)}</div>${demo?`<div class="demo-control">${icon('info')}<span>${t(state.demoFixed?'demoFixed':'demoBroken')}</span>${button('demo-fix',t(state.demoFixed?'restoreBug':'applyFix'),'','',''+disabled)}</div><p class="section-note">${t('demoNote')}</p>`:''}<div class="case-stats"><span><strong>${item.steps.length}</strong> ${t('steps')}</span><span><strong>${item.assertions.length}</strong> ${t('checks')}</span><span><strong>${state.runs.length}</strong> ${t('history')}</span></div><div class="tabs">${['scenario','evidence','history'].map(tab=>button('tab',t(tab),'',`tab ${state.tab===tab?'active':''}`,`data-tab="${tab}"`)).join('')}</div>${state.tab==='scenario'?scenario():state.tab==='evidence'?evidenceList():history()}</main>`
}
function screenshot(run,label){return `<div class="inspector-label"><span>${label}</span><span>${run.id.slice(0,8)}</span></div><div class="screenshot">${run.screenshot?`<div class="image-placeholder" data-image="${run.id}">${t('loading')}</div>`:`<div class="image-placeholder">${t('noScreenshot')}</div>`}</div><div class="screenshot-caption"><span>${escape(stamp(run.startedAt))}</span><span>1440 × 960</span></div>`}
function inspector(){
  const run=state.run
  if(!run)return `<aside class="inspector"><div class="inspector-header"><span class="eyebrow">${t('evidencePanel')}</span>${icon('eye')}</div><div class="inspector-empty"><div class="large-icon">${icon('shield')}</div><h3>${t('emptyEvidence')}</h3><p>${t('emptyEvidenceBody')}</p><div class="flow">${t('flow')}</div></div></aside>`
  const compare=state.comparison
  return `<aside class="inspector"><div class="inspector-header"><span class="eyebrow">${t('evidencePanel')}</span>${icon('eye')}</div><div class="run-summary"><div class="result-title"><span>${t(run.status)}</span>${badge(run.status)}</div><div class="result-description">${t(run.kind==='recording'?'recordingBody':`${run.status}Body`)}</div><div class="run-meta"><span>${t('duration')}<strong>${(run.durationMs/1000).toFixed(2)}s</strong></span><span>${t('checks')}<strong>${run.checks.filter(check=>check.status==='passed').length} / ${run.checks.length}</strong></span><span>${t('started')}<strong>${escape(new Date(run.startedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}))}</strong></span></div></div>${run.error?`<pre class="run-error">${escape(run.error)}</pre>`:''}${run.steps.filter(step=>step.status==='failed').map(step=>`<pre class="run-error">${escape(step.error)}</pre>`).join('')}${state.baseline&&state.baseline.id!==run.id?screenshot(state.baseline,t('before')):''}${screenshot(run,t(state.baseline?.id===run.id?'before':'after'))}${run.checks.length?`<div class="inspector-label">${t('comparison')}</div>${state.baseline&&!compare?.comparable?`<div class="notice">${t('changed')}</div>`:''}<div class="comparison"><div class="compare-head"><span>${t('condition')}</span><span>${t('before')}</span><span>${t('after')}</span></div>${run.checks.map(check=>`<div class="compare-row"><span title="${escape(check.detail)}">${escape(checkLabel(check.type))}</span>${badge(compare?.checks.find(item=>item.id===check.assertionId)?.before||'not_run')}${badge(check.status)}</div>`).join('')}</div>`:''}<div class="export-actions">${button('export-html',t('html'),'download')}${button('export-markdown',t('markdown'),'download')}${button('export-json',t('json'),'download')}${button('export-playwright',t('playwright'),'download')}${run.kind!=='recording'&&run.id!==state.item.baselineRunId?button('set-baseline',t('useBaseline'),'clock','ghost',locked()?'disabled':''):''}</div>${run.sourceHints.length?`<div class="inspector-label">${t('source')}</div><p class="section-note">${t('sourceNote')}</p><ul class="source-hints">${run.sourceHints.map(hint=>`<li>${escape(hint)}</li>`).join('')}</ul>`:''}<p class="section-note">${t('runSnapshotNote')}</p></aside>`
}
function render(){
  document.documentElement.lang=lang==='zh'?'zh-CN':'en'
  app.innerHTML=`<header class="topbar"><a class="brand" href="/" aria-label="Repro"><img src="/favicon.svg" alt=""><span class="brand-name">repro<span>.</span></span></a><span class="brand-tag">${t('tagline')}</span><div class="top-actions"><span class="connection"><span class="dot"></span>${t('local')}</span><span class="version">v0.1.0</span>${button('language',lang==='zh'?'EN':'中文','','ghost',`aria-label="${lang==='zh'?'Switch to English':'切换中文'}"`)}</div></header><div class="workspace">${sidebar()}${main()}${inspector()}</div>`
  void loadImages()
}
async function loadImages(){for(const placeholder of document.querySelectorAll('[data-image]')){
  const id=placeholder.dataset.image
  try{
    if(!imageUrls.has(id))imageUrls.set(id,URL.createObjectURL(await request(`/api/artifacts/${id}/screenshot.png`,{blob:true})))
    if(!placeholder.isConnected)continue
    const image=new Image();image.src=imageUrls.get(id);image.alt=t('screenshot');image.title=t('openImage');image.addEventListener('click',()=>window.open(image.src,'_blank','noopener'));placeholder.replaceWith(image)
  }catch{placeholder.textContent=t('noScreenshot')}
}}
async function work(task){
  if(state.busy)return
  state.busy=true;render()
  try{await task()}catch(error){toast(error.message,true)}finally{state.busy=false;try{await load()}catch(error){toast(error.message,true);render()}}
}
async function saveCase(change){const updated=await request(`/api/cases/${state.activeId}`,{method:'PUT',body:JSON.stringify(change)});state.item=updated;await load(updated.id);toast(t('saved'))}
function field(name,label,value='',type='text',hint=''){return `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${escape(value)}" ${name==='title'||name==='url'?'required':''}>${hint?`<small>${hint}</small>`:''}</label>`}
function select(name,label,values,value){return `<label class="field"><span>${label}</span><select name="${name}">${values.map(([key,label])=>`<option value="${escape(key)}" ${key===value?'selected':''}>${escape(label)}</option>`).join('')}</select></label>`}
function openDialog(title,content,submit,label=t('save')){
  editor.innerHTML=`<form id="edit-form"><div class="dialog-head"><h2 id="dialog-title">${title}</h2>${button('close-dialog','','close','ghost icon-button',`aria-label="${t('cancel')}"`)}</div>${content}<div class="dialog-error" role="alert"></div><div class="dialog-actions">${button('close-dialog',t('cancel'),'','ghost')}<button type="submit" class="primary">${label}</button></div></form>`
  editor.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const submitButton=editor.querySelector('[type=submit]');submitButton.disabled=true
    try{await submit(new FormData(event.target));editor.close()}catch(error){editor.querySelector('.dialog-error').textContent=error.message}finally{submitButton.disabled=false}
  });editor.showModal()
}
function caseDialog(edit=false){const item=edit?state.item:{};openDialog(t(edit?'edit':'newCase'),field('title',t('title'),item.title||'')+field('url',t('target'),item.url||'http://localhost:5173','url')+`<label class="field"><span>${t('description')}</span><textarea name="description">${escape(item.description||'')}</textarea></label>`,async form=>{
  const input=Object.fromEntries(form)
  if(edit)await saveCase(input);else{const item=await post('/api/cases',input);await load(item.id)}
},t(edit?'save':'create'))}
function stepDialog(index){
  const previous=index===undefined?{}:state.item.steps[index]
  openDialog(t(index===undefined?'addStep':'editStep'),select('action',t('action'),Object.keys(actionCopy).map(key=>[key,actionLabel(key)]),previous.action||'click')+`<div id="step-fields"></div><p class="section-note">${t('stepHint')}</p>`,async form=>{
    const action=form.get('action'),entry={...(previous.id?{id:previous.id}:{}),action}
    if(action==='navigate')entry.url=form.get('url')
    if(['click','fill','select','check','press','wait'].includes(action))entry.selector=form.get('selector')
    if(['fill','select','wait'].includes(action)&&form.get('value')!=='')entry.value=form.get('value')
    if(['fill','select'].includes(action)&&entry.value===undefined)entry.value=''
    if(action==='press')entry.key=form.get('key')
    if(action==='check')entry.checked=form.get('checked')==='on'
    if(action==='fill'&&form.get('secret')==='on')entry.secret=true
    const steps=structuredClone(state.item.steps);if(index===undefined)steps.push(entry);else steps[index]=entry
    await saveCase({steps})
  })
  const update=()=>{
    const action=editor.querySelector('[name=action]').value
    editor.querySelector('#step-fields').innerHTML=(action==='navigate'?field('url',t('url'),previous.url||state.item.url,'url'):'')+(['click','fill','select','check','press','wait'].includes(action)?field('selector',t('selector'),previous.selector||''):'')+(['fill','select','wait'].includes(action)?field('value',t('value'),previous.value||''):'')+(action==='press'?field('key',t('key'),previous.key||'Enter'):'')+(action==='check'?`<label class="checkbox-field"><input type="checkbox" name="checked" ${previous.checked!==false?'checked':''}>${t('checked')}</label>`:'')+(action==='fill'?`<label class="checkbox-field"><input type="checkbox" name="secret" ${previous.secret?'checked':''}>${t('secret')}</label><p class="section-note">${t('secretHint')}</p>`:'')
  };editor.querySelector('[name=action]').addEventListener('change',update);update()
}
function checkDialog(index){
  const previous=index===undefined?{}:state.item.assertions[index]
  openDialog(t(index===undefined?'addCheck':'editCheck'),select('type',t('condition'),Object.keys(checkCopy).map(key=>[key,checkLabel(key)]),previous.type||'visible')+`<div id="check-fields"></div>`,async form=>{
    const type=form.get('type'),entry={...(previous.id?{id:previous.id}:{}),type}
    if(['visible','hidden','text'].includes(type))entry.selector=form.get('selector')
    if(['text','url','request'].includes(type))entry.expected=form.get('expected')
    if(type==='request')entry.status=Number(form.get('status'))
    const assertions=structuredClone(state.item.assertions);if(index===undefined)assertions.push(entry);else assertions[index]=entry
    await saveCase({assertions})
  })
  const update=()=>{const type=editor.querySelector('[name=type]').value;editor.querySelector('#check-fields').innerHTML=(['visible','hidden','text'].includes(type)?field('selector',t('selector'),previous.selector||''):'')+(['text','url','request'].includes(type)?field('expected',t('expected'),previous.expected||''):'')+(type==='request'?field('status',t('httpStatus'),previous.status||200,'number'):'')};editor.querySelector('[name=type]').addEventListener('change',update);update()
}
function download(content,filename,type='text/plain'){const url=URL.createObjectURL(content instanceof Blob?content:new Blob([content],{type}));const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(t('downloaded'))}
async function dispatch(action,element){
  if(action==='close-dialog'){editor.close();return}
  if(action==='language'){lang=lang==='zh'?'en':'zh';localStorage.setItem('repro-language',lang);render();return}
  if(action==='new'){caseDialog();return}if(action==='edit-case'){caseDialog(true);return}
  if(action==='add-step'){stepDialog();return}if(action==='add-check'){checkDialog();return}
  if(action==='step-edit'){stepDialog(Number(element.dataset.index));return}if(action==='check-edit'){checkDialog(Number(element.dataset.index));return}
  if(action==='tab'){state.tab=element.dataset.tab;render();return}if(action==='filter'){state.filter=element.dataset.filter;render();return}
  if(action==='select'){state.tab='scenario';state.run=null;await load(element.dataset.id);return}
  if(action==='select-run'){await load(state.activeId,element.dataset.id);return}
  if(action==='import'){
    const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.addEventListener('change',()=>void work(async()=>{const file=input.files?.[0];if(!file)return;const data=JSON.parse(await file.text());const candidate=data.snapshot||data.case||data;const created=await post('/api/cases',candidate);await load(created.id)}));input.click();return
  }
  if(action.startsWith('step-')||action==='check-delete'){
    if(action.endsWith('delete')&&!confirm(t('deleteConfirm')))return
    const index=Number(element.dataset.index),key=action.startsWith('step-')?'steps':'assertions',items=structuredClone(state.item[key])
    if(action.endsWith('delete'))items.splice(index,1)
    else{const next=action.endsWith('up')?index-1:index+1;if(next<0||next>=items.length)return;[items[index],items[next]]=[items[next],items[index]]}
    await work(()=>saveCase({[key]:items}));return
  }
  if(action==='export-json'){download(JSON.stringify(state.item,null,2),'repro.case.json','application/json');return}
  if(action==='export-playwright'){download(await request(`/api/cases/${state.activeId}/export`),'repro.spec.ts');return}
  if(action==='export-markdown'){download(await request(`/api/runs/${state.run.id}/markdown`),'repro-report.md','text/markdown');return}
  if(action==='export-html'){download(await request(`/api/runs/${state.run.id}/html`),'repro-report.html','text/html');return}
  await work(async()=>{
    if(action==='demo'){const item=await post('/api/demo');state.tab='scenario';state.run=null;await load(item.id)}
    else if(action==='demo-fix'){await post('/api/demo/fix',{fixed:!state.demoFixed});await load()}
    else if(action==='record'){await post(`/api/cases/${state.activeId}/record`);toast(t('recordStarted'))}
    else if(action==='stop'){const result=await post('/api/recording/stop');await load(result.case.id,result.run.id);toast(t('recordSaved'))}
    else if(action==='baseline'||action==='verify'){const run=await post(`/api/cases/${state.activeId}/run`,{kind:action==='baseline'?'baseline':'verification'});await load(state.activeId,run.id);toast(`${t('runDone')}: ${t(run.status)}`,run.status==='failed')}
    else if(action==='set-baseline'){await post(`/api/cases/${state.activeId}/baseline`,{runId:state.run.id});toast(t('baselineSet'))}
  })
}
document.addEventListener('click',event=>{const element=event.target.closest('[data-action]');if(element&&!element.disabled)void dispatch(element.dataset.action,element).catch(error=>toast(error.message,true))})
editor.addEventListener('click',event=>{if(event.target===editor){const bounds=editor.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)editor.close()}})
async function start(){
  if(!token)throw new Error(t('noToken'))
  await load()
  setInterval(async()=>{
    if(state.busy||editor.open)return
    try{
      const fresh=await request('/api/bootstrap')
      const changed=JSON.stringify(fresh.cases)!==JSON.stringify(state.cases)||!!fresh.recording!==!!state.recording||fresh.busy!==state.serverBusy||fresh.demoFixed!==state.demoFixed
      if(changed){await load();return}
      state.recording=fresh.recording
      const count=document.querySelector('#record-count');if(count&&fresh.recording)count.textContent=`${fresh.recording.steps.length} ${t('steps')} · ${fresh.recording.evidence.length} ${t('evidence')}`
    }catch{}
  },2000)
}
start().catch(error=>{app.innerHTML=`<main class="fatal"><img src="/favicon.svg" width="40" alt=""><h1>Repro</h1><p>${escape(error.message)}</p><button data-action="reconnect">${t('reconnect')}</button></main>`;document.querySelector('[data-action=reconnect]')?.addEventListener('click',()=>location.reload())})
