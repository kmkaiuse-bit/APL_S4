(() => {
  'use strict';
  const DATA = window.LESSON_DATA;
  if (!DATA || DATA.posts.length !== 32 || DATA.comments.length !== 48) {
    document.getElementById('main').textContent = '課堂資料未能載入，請通知老師使用紙本工作紙。';
    return;
  }
  const KEY = 'hkit-apl-2026-11-18-v1';
  const TYPES = ['產品介紹','限時優惠','穿搭教學','幕後花絮','迷因／趣味','顧客分享'];
  const TOPICS = ['產品／查詢','物流','服務','價格','品質'];
  const SENTIMENTS = ['正面','負面','中性'];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizeType = s => String(s || '').trim().replaceAll('/', '／').replaceAll(' ', '');
  const normalizeTopic = s => {
    const value = String(s || '').trim().replaceAll('/', '／').replaceAll(' ', '');
    return ['產品','查詢','產品／查詢'].includes(value) ? '產品／查詢' : value;
  };
  const blankAudit = () => ({id:'',status:'',topic:'',sentiment:'',reason:''});
  const fresh = () => ({lesson:'2026-11-18 APL 2.2 第3堂',version:2,fields:{},postAnswers:{},boundaries:{},aiRows:{},rawClassification:'',rawImports:[],audits:Array.from({length:5},blankAudit)});
  let state;
  try { state = {...fresh(), ...JSON.parse(localStorage.getItem(KEY) || 'null')}; }
  catch { state = fresh(); }
  if (!state || state.lesson !== '2026-11-18 APL 2.2 第3堂') state = fresh();
  state.fields ||= {}; state.postAnswers ||= {}; state.boundaries ||= {}; state.aiRows ||= {};
  if(!Array.isArray(state.rawImports)) state.rawImports=[];
  if(state.version<2 && state.rawClassification && !state.rawImports.length) state.rawImports=[{label:'舊版保存的原始回答',text:state.rawClassification}];
  state.version=2;
  state.audits = Array.from({length:5}, (_,i) => ({...blankAudit(), ...(state.audits?.[i] || {})}));
  let timer;
  function persist() {
    clearTimeout(timer);
    try { localStorage.setItem(KEY, JSON.stringify(state)); $('#save-status').textContent = '已保存在此瀏覽器'; }
    catch { $('#save-status').textContent = '瀏覽器無法保存，請下載JSON紀錄'; }
    updateCompletion();
  }
  function save() {
    clearTimeout(timer);
    $('#save-status').textContent = '正在保存…';
    timer = setTimeout(persist, 200);
  }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.style.display = 'block'; clearTimeout(el._timer); el._timer = setTimeout(() => el.style.display = 'none', 3300); }
  function feedback(selector, message, bad=false) { const el=$(selector); el.textContent=message; el.classList.toggle('bad',bad); }
  function field(name) { return String(state.fields[name] || '').trim(); }
  function number(value) { const x=Number(String(value || '').replaceAll(',','').replaceAll('%','').trim()); return Number.isFinite(x) ? x : NaN; }
  function total(row) { return ['likes','comments','shares','saves'].reduce((sum,k) => sum + Number(row[k]),0); }
  function selectOptions(options,value='',empty='請選擇') { return `<option value="">${empty}</option>`+options.map(x=>`<option value="${esc(x)}"${x===value?' selected':''}>${esc(x)}</option>`).join(''); }
  async function copy(value) { try { await navigator.clipboard.writeText(value); toast('已複製，請到Gemini貼上。'); } catch { toast('複製失敗；可展開Prompt手動複製。'); } }
  function download(name, content, mime='application/json;charset=utf-8') { const blob=new Blob([content],{type:mime}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500); }

  const stats = Object.fromEntries(TYPES.map(name => {
    const rows = DATA.posts.filter(p => normalizeType(p.post_type) === name);
    return [name,{count:rows.length, sum:rows.reduce((s,p)=>s+total(p),0), avg:rows.reduce((s,p)=>s+total(p),0)/rows.length, rate:rows.reduce((s,p)=>s+total(p)/Number(p.reach)*100,0)/rows.length}];
  }));
  const classificationRules='主題只能選：產品／查詢（產品、尺碼、分店或優惠查詢）、物流（送貨、到貨、活動補貨／缺貨）、服務（員工、客服、退貨流程、贈品）、價格（售價貴平、折扣是否抵買）、品質（物料、耐用、瑕疵、包裝、App／網頁體驗）。情感只能選正面、負面、中性。每則只選一個主要主題，按原文判斷；無法判斷時標「需人手檢查」，不得猜測。';
  function classificationPrompt(first,last) {
    const range=`${first}–${last}`;
    const batch=first==='C001'&&last==='C048' ? '必須列出48個不同comment_id，從C001到C048各一次。' : `這次只列${range}的24個不同comment_id；其餘留待另一批。`;
    return `請根據我上載的學生版48則留言CSV，分類${range}。${classificationRules}${batch}每個ID只輸出一行短標籤，格式為C001|物流|負面。不要重複留言原文，不要原文依據、解說、Markdown表格、合計或建議。網站會自行檢查ID與計算交叉表；稍後我們只抽查五則原文。`;
  }
  $('#prompt-b').textContent=classificationPrompt('C001','C048');
  $('#prompt-b1').textContent=classificationPrompt('C001','C024');
  $('#prompt-b2').textContent=classificationPrompt('C025','C048');
  function renderPosts() {
    $('#post-table tbody').innerHTML = TYPES.map(name => {
      const r=state.postAnswers[name] || {};
      return `<tr data-type="${esc(name)}"><th scope="row">${esc(name)}</th><td><input aria-label="${esc(name)}篇數" data-post="count" inputmode="numeric" value="${esc(r.count || '')}"></td><td><input aria-label="${esc(name)}平均互動" data-post="avg" inputmode="decimal" value="${esc(r.avg || '')}"></td><td><input aria-label="${esc(name)}平均單篇互動率" data-post="rate" inputmode="decimal" value="${esc(r.rate || '')}"></td></tr>`;
    }).join('');
  }
  function renderPostSelect() {
    $('#post-id').innerHTML = selectOptions(DATA.posts.map(r=>r.post_id),field('aPostId'),'選擇一篇');
    const row=DATA.posts.find(r=>r.post_id===field('aPostId'));
    $('#post-source').textContent = row ? `原表 ${row.post_id}：likes ${row.likes}、comments ${row.comments}、shares ${row.shares}、saves ${row.saves}；reach ${row.reach} 另作分母。` : '先選一個post_id，原表四項互動會顯示在這裏。';
  }
  function renderBoundary() {
    $('#boundary-cards').innerHTML = ['C009','C027'].map(id => {
      const row=DATA.comments.find(x=>x.comment_id===id), r=state.boundaries[id] || {};
      return `<div class="boundary" data-boundary="${id}"><strong>${id}</strong><blockquote>${esc(row.comment_text)}</blockquote><div class="two"><label>主要主題<select data-boundary-field="topic">${selectOptions(TOPICS,r.topic)}</select></label><label>情感<select data-boundary-field="sentiment">${selectOptions(SENTIMENTS,r.sentiment)}</select></label></div><label>原句中哪個詞支持你的判斷？<textarea data-boundary-field="reason">${esc(r.reason || '')}</textarea></label></div>`;
    }).join('');
  }
  function renderClassification() {
    $('#classification-table tbody').innerHTML = DATA.comments.map(row => {
      const r=state.aiRows[row.comment_id] || {};
      return `<tr data-id="${row.comment_id}"><th scope="row">${row.comment_id}</th><td class="comment-text">${esc(row.comment_text)}</td><td><select aria-label="${row.comment_id} AI主題" data-ai="topic">${selectOptions(TOPICS,r.topic)}</select></td><td><select aria-label="${row.comment_id} AI情感" data-ai="sentiment">${selectOptions(SENTIMENTS,r.sentiment)}</select></td></tr>`;
    }).join('');
    renderCrosstabs(); renderAudits();
  }
  function counts(revised=false) {
    const matrix=Object.fromEntries(TOPICS.map(t=>[t,Object.fromEntries(SENTIMENTS.map(s=>[s,0]))]));
    let classified=0;
    for(const row of DATA.comments) {
      let label=state.aiRows[row.comment_id] || {};
      if(revised) {
        const audit=state.audits.find(a=>a.id===row.comment_id && a.status==='修改' && TOPICS.includes(a.topic) && SENTIMENTS.includes(a.sentiment));
        if(audit) label={topic:audit.topic,sentiment:audit.sentiment};
      }
      if(TOPICS.includes(label.topic) && SENTIMENTS.includes(label.sentiment)) { matrix[label.topic][label.sentiment]++; classified++; }
    }
    return {matrix,classified};
  }
  function tableForCounts(revised=false) {
    const {matrix,classified}=counts(revised);
    const rows=TOPICS.map(t=> { const x=matrix[t],n=SENTIMENTS.reduce((s,k)=>s+x[k],0); return `<tr><th scope="row">${t}</th>${SENTIMENTS.map(k=>`<td>${x[k]}</td>`).join('')}<td>${n}</td><td>${n ? (x['負面']/n*100).toFixed(1)+'%' : '—'}</td></tr>`; }).join('');
    return `<p><span class="status-pill ${classified===48?'':'warn'}">${classified}/48 則有完整標籤</span>${revised?'　人手修訂後（只替換標為「修改」且兩項標籤完整的列）':''}</p><div class="table-wrap"><table><thead><tr><th>主題</th><th>正面</th><th>負面</th><th>中性</th><th>合計</th><th>類別內負面率</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  function renderCrosstabs() { $('#cross-tab').innerHTML=tableForCounts(false); $('#revised-cross-tab').innerHTML='<h4>抽查修訂後的交叉表</h4>'+tableForCounts(true); }
  function missingIds() { return DATA.comments.map(c=>c.comment_id).filter(id=>!TOPICS.includes(state.aiRows[id]?.topic)||!SENTIMENTS.includes(state.aiRows[id]?.sentiment)); }
  function renderMissing(force=false) {
    const missing=missingIds(), show=missing.length>0&&(force||state.rawImports.length>0);
    $('#missing-panel').hidden=!show;
    if(!show)return;
    $('#missing-list').textContent=`待補或標籤不完整：${missing.join('、')}（${missing.length}則）。先對照下表原文，再請Gemini只補這些ID。`;
    $('#missing-prompt').textContent=`請只根據剛才上載的學生版48則留言CSV，補齊以下comment_id：${missing.join('、')}。${classificationRules}每個ID只輸出一行，格式為C001|物流|負面；只列這${missing.length}則，不重複原文或解說，不重做其他ID，不要猜測。`;
  }
  function renderImportHistory() {
    $('#import-count').textContent=String(state.rawImports.length);
    $('#import-history').innerHTML=state.rawImports.map((item,i)=>`<details class="saved-import"><summary>第${i+1}次：${esc(item.label||'Gemini原始回答')}（${(item.ids||[]).length}個可辨識ID）</summary><pre class="plain-pre">${esc(item.text||'')}</pre></details>`).join('')||'<p class="muted">尚未匯入Gemini回答。</p>';
  }
  function renderAudits() {
    const options=DATA.comments.map(r=>r.comment_id);
    $('#audit-rows').innerHTML=state.audits.map((a,i)=> {
      const row=DATA.comments.find(r=>r.comment_id===a.id), ai=state.aiRows[a.id] || {};
      return `<div class="audit" data-audit="${i}"><div class="audit-head"><strong>抽查 ${i+1}</strong><select aria-label="抽查${i+1}留言編號" data-audit-field="id">${selectOptions(options,a.id,'選擇comment_id')}</select></div><p class="original">${row?esc(row.comment_text):'選擇ID後顯示原句。'}</p><p class="ai-label">AI標籤：${esc(ai.topic || '未填')}＋${esc(ai.sentiment || '未填')}</p><div class="two"><label>人手判斷<select data-audit-field="status">${selectOptions(['同意','修改','待討論'],a.status)}</select></label><label>人手主題<select data-audit-field="topic">${selectOptions(TOPICS,a.topic)}</select></label><label>人手情感<select data-audit-field="sentiment">${selectOptions(SENTIMENTS,a.sentiment)}</select></label></div><label>原句線索、同意或修改理由<textarea data-audit-field="reason">${esc(a.reason)}</textarea></label></div>`;
    }).join('');
    const chosen=state.audits.map(a=>a.id).filter(Boolean);
    const repeated=[...new Set(chosen.filter((id,i)=>chosen.indexOf(id)!==i))];
    feedback('#audit-feedback',repeated.length?`重複ID：${repeated.join('、')}。請改選不同留言，五則抽查才有五個獨立例子。`:'',repeated.length>0);
    renderCrosstabs();
  }
  function renderFields() { document.querySelectorAll('[data-field]').forEach(el => { if(el.id==='post-id') return; el.value=state.fields[el.dataset.field] || ''; }); $('#paste-classification').value=state.rawClassification || ''; $('#final-count').textContent=`定稿字數：${field('cFinal').length}`; }
  function updateCompletion() {
    const classified=counts().classified;
    const completedAudits=state.audits.filter(a=>a.id && a.status && a.reason.trim() && a.topic && a.sentiment);
    const auditDone=new Set(completedAudits.map(a=>a.id)).size;
    const reportDone=['cPosts','cComments','cActions','cValidation','cFinal'].filter(k=>field(k)).length;
    $('#completion').innerHTML=`<strong>目前紀錄：</strong> 影片短答 ${['videoV1','videoV2','videoV3'].filter(k=>field(k)).length}/3；A5 三句洞察 ${['aInsight1','aInsight2','aInsight3'].filter(k=>field(k)).length}/3；B2 分類 ${classified}/48；B3 不同ID且有理由的抽查 ${auditDone}/5；C2 月報欄位 ${reportDone}/5。<br>請同時交工作紙、Gemini原稿和人手定稿；這裏的數字表示有沒有填寫，不代表答案正確。`;
  }
  function parseClassification(raw) {
    const output={}; let duplicates=0;
    for(const line of raw.split(/\r?\n/)) {
      const id=(line.match(/\bC\d{3}\b/i)||[])[0]?.toUpperCase();
      if(!id || !DATA.comments.some(c=>c.comment_id===id)) continue;
      const cells=line.includes('|') ? line.split('|') : line.includes('\t') ? line.split('\t') : splitCsv(line);
      const cleaned=cells.map(x=>x.trim().replace(/^\*\*|\*\*$/g,'').replace(/^['"`]|['"`]$/g,'').replace(/^[：:]+|[。；;]+$/g,'').trim());
      const topic=cleaned.map(normalizeTopic).find(t=>TOPICS.includes(t));
      const sentiment=cleaned.find(s=>SENTIMENTS.includes(s));
      if(topic && sentiment) { if(output[id]) duplicates++; output[id]={topic,sentiment}; }
    }
    return {output,duplicates};
  }
  function splitCsv(line) { const out=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&quoted){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===','&&!quoted){out.push(cell);cell='';}else cell+=c;}out.push(cell);return out; }
  function printRecord() {
    const rows=DATA.comments.map(c=>{const r=state.aiRows[c.comment_id]||{};return `<tr><td>${c.comment_id}</td><td>${esc(c.comment_text)}</td><td>${esc(r.topic||'—')}</td><td>${esc(r.sentiment||'—')}</td></tr>`;}).join('');
    const fields=Object.entries(state.fields).filter(([k])=>k!=='members').map(([k,v])=>`<p><strong>${esc(k)}：</strong>${esc(v)}</p>`).join('');
    const audits=state.audits.map((a,i)=>`<p>${i+1}. ${esc(a.id||'—')}｜${esc(a.status||'—')}｜${esc(a.topic||'—')}＋${esc(a.sentiment||'—')}｜${esc(a.reason||'—')}</p>`).join('');
    const originals=state.rawImports.map((item,i)=>`<h3>第${i+1}次：${esc(item.label||'Gemini原始回答')}</h3><p>${esc(item.text||'')}</p>`).join('');
    const html=`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>11月18日學習紀錄</title><style>body{font:12px/1.5 "Microsoft JhengHei",sans-serif;margin:18mm}h2{margin-top:25px}table{border-collapse:collapse;width:100%;font-size:9px}td,th{border:1px solid #888;padding:4px;vertical-align:top}tr{break-inside:avoid}p{white-space:pre-wrap}</style><h1>11月18日｜2.2第3堂學習紀錄</h1><p>組別：${esc(field('groupId'))}　組員：${esc(field('members'))}</p><h2>作答</h2>${fields}<h2>Gemini原始分類</h2><table><tr><th>ID</th><th>原文</th><th>AI主題</th><th>AI情感</th></tr>${rows}</table><h2>五則人手抽查</h2>${audits}<h2>Gemini每次原始回答</h2>${originals||'<p>尚未匯入。</p>'}</html>`;
    const popup=window.open('','_blank');if(!popup){toast('瀏覽器擋住新視窗；可先下載JSON紀錄。');return;}popup.document.write(html);popup.document.close();popup.focus();setTimeout(()=>popup.print(),500);
  }

  document.addEventListener('input', event => {
    const el=event.target;
    if(el.dataset.field){state.fields[el.dataset.field]=el.value;if(el.dataset.field==='cFinal')$('#final-count').textContent=`定稿字數：${el.value.length}`;save();}
    if(el.dataset.post){const name=el.closest('[data-type]').dataset.type;state.postAnswers[name]||={};state.postAnswers[name][el.dataset.post]=el.value;save();}
    if(el.dataset.boundaryField){const id=el.closest('[data-boundary]').dataset.boundary;state.boundaries[id]||={};state.boundaries[id][el.dataset.boundaryField]=el.value;save();}
    if(el.dataset.auditField && el.tagName==='TEXTAREA'){state.audits[Number(el.closest('[data-audit]').dataset.audit)][el.dataset.auditField]=el.value;save();}
    if(el.id==='paste-classification'){state.rawClassification=el.value;save();}
  });
  document.addEventListener('change', event => {
    const el=event.target;
    if(el.dataset.field){state.fields[el.dataset.field]=el.value;if(el.id==='post-id')renderPostSelect();save();}
    if(el.dataset.boundaryField){const id=el.closest('[data-boundary]').dataset.boundary;state.boundaries[id]||={};state.boundaries[id][el.dataset.boundaryField]=el.value;save();}
    if(el.dataset.ai){const id=el.closest('[data-id]').dataset.id;state.aiRows[id]||={};state.aiRows[id][el.dataset.ai]=el.value;save();renderCrosstabs();renderAudits();renderMissing();}
    if(el.dataset.auditField){const idx=Number(el.closest('[data-audit]').dataset.audit);state.audits[idx][el.dataset.auditField]=el.value;save();if(el.dataset.auditField==='id')renderAudits();else renderCrosstabs();}
  });
  $('#copy-prompt-a').addEventListener('click',()=>copy($('#prompt-a').textContent.trim()));
  $('#copy-prompt-b').addEventListener('click',()=>copy($('#prompt-b').textContent.trim()));
  $('#copy-prompt-b1').addEventListener('click',()=>copy($('#prompt-b1').textContent.trim()));
  $('#copy-prompt-b2').addEventListener('click',()=>copy($('#prompt-b2').textContent.trim()));
  $('#copy-missing-prompt').addEventListener('click',()=>copy($('#missing-prompt').textContent.trim()));
  $('#check-a1').addEventListener('click',()=>{const goal=field('aGoal'),metric=field('aMetric'),den=field('aDenominator');if(!goal||!metric||!den){feedback('#feedback-a1','請先選目標、指標，並填寫分母。',true);return;}if(goal!==metric){feedback('#feedback-a1','目標與指標不相扣；回看S08的兩個分母。',true);return;}const norm=den.replace(/\s/g,'');const valid=metric==='avg'?/篇數|貼文數|每篇/.test(norm):/觸及|reach/i.test(norm);feedback('#feedback-a1',valid?'目標、指標及分母相扣。寫入工作紙時，說清楚是哪一類貼文的分母。':metric==='avg'?'目標與指標相扣，但「平均互動」的分母應是該類貼文篇數。':'目標與指標相扣，但「單篇互動率」應先用每篇的觸及人數作分母，再求該類平均。',!valid);});
  $('#check-a2').addEventListener('click',()=>{let complete=0,correct=0;for(const name of TYPES){const r=state.postAnswers[name]||{},s=stats[name];let rowFilled=0;for(const key of ['count','avg','rate']){if(String(r[key]||'').trim()){complete++;rowFilled++;const expected=s[key];if(Math.abs(number(r[key])-expected)<(key==='count'?0.01:0.025))correct++;}}const tr=[...document.querySelectorAll('#post-table tbody tr')].find(x=>x.dataset.type===name);tr.className=rowFilled===3&&['count','avg','rate'].every(k=>Math.abs(number(r[k])-s[k])<(k==='count'?0.01:0.025))?'match':rowFilled?'mismatch':'';}feedback('#feedback-a2',`已填${complete}/18格，其中${correct}格與原CSV重算一致。不同時先查原表與分母；迷因的半形／全形斜線是同一類。`,correct!==complete||complete<18);});
  $('#check-a4').addEventListener('click',()=>{const row=DATA.posts.find(r=>r.post_id===field('aPostId'));if(!row||!field('aAiTotal')){feedback('#feedback-a4','先選貼文並填入Gemini數值。',true);return;}const n=total(row),ok=number(field('aAiTotal'))===n;feedback('#feedback-a4',ok?`一致：原表四項相加為${n}。記下計算過程。`:`不一致：原表四項相加為${n}，請找出AI漏了哪欄或是否把reach加入。`,!ok);});
  $('#import-classification').addEventListener('click',()=>{const raw=$('#paste-classification').value;const {output,duplicates}=parseClassification(raw);const ids=Object.keys(output),n=ids.length;if(!n){feedback('#feedback-b2','未找到可辨識的ID、主題和情感。請檢查欄位，或逐列用下拉選單填寫。',true);return;}const overlap=ids.filter(id=>TOPICS.includes(state.aiRows[id]?.topic)&&SENTIMENTS.includes(state.aiRows[id]?.sentiment));state.rawClassification=raw;state.rawImports.push({label:`${ids[0]}–${ids[ids.length-1]}`,ids,text:raw});state.aiRows={...state.aiRows,...output};save();renderClassification();renderImportHistory();renderMissing();const total=counts().classified;feedback('#feedback-b2',`本次匯入${n}個不同ID；累計${total}/48列完整${duplicates?`。本次輸入有${duplicates}個重複ID，保留最後一列`:''}${overlap.length?`。有${overlap.length}個ID曾匯入，已用本次標籤覆蓋`:''}。請對照原文核對。`,total<48||duplicates>0||overlap.length>0);});
  $('#check-b2').addEventListener('click',()=>{const n=counts().classified,missing=missingIds();feedback('#feedback-b2',n===48?`48個ID都有完整主題與情感。現在抽五則對原文核對；這不代表分類全部正確。`:`目前${n}/48列完整。待補：${missing.join('、')}。可用下方指令只補實際缺漏ID。`,n!==48);renderCrosstabs();renderMissing(true);});
  $('#copy-prompt-c').addEventListener('click',()=>{const keys=['cPosts','cComments','cActions','cValidation'];if(keys.some(k=>!field(k))){feedback('#feedback-c','先填妥四格內容，再交給Gemini整理。',true);return;}const prompt=`請把以下由我們核對的資料整理成120–160字「月報格式練習（跨期模擬資料）」。貼文只有相對第1–8週，留言日期為2026年5–6月；兩組均為學校模擬資料。分開寫資料期間、指標與分母。不得新增品牌、銷量、因果或未提供數字。保留我們的兩項行動與資料限制。\n貼文：${field('cPosts')}\n留言：${field('cComments')}\n兩項行動：${field('cActions')}\n下一階段指標及限制：${field('cValidation')}`;copy(prompt);feedback('#feedback-c','已用四格內容組成Prompt；取得AI稿後仍須人手核對及定稿。');});
  $('#download-json').addEventListener('click',()=>{persist();const id=field('groupId').replace(/[^\w-]/g,'_')||'未填組別';download(`APL_2026-11-18_${id}.json`,JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2));toast('已下載JSON。請按老師指定方式提交。');});
  $('#print-record').addEventListener('click',printRecord);
  $('#import-json').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(parsed.lesson!==fresh().lesson)throw Error('lesson');state={...fresh(),...parsed};if(!Array.isArray(state.rawImports))state.rawImports=[];if(state.version<2&&state.rawClassification&&!state.rawImports.length)state.rawImports=[{label:'舊版保存的原始回答',text:state.rawClassification}];state.version=2;state.audits=Array.from({length:5},(_,i)=>({...blankAudit(),...(state.audits?.[i]||{})}));renderAll();save();toast('已匯入本堂紀錄。');}catch{toast('這不是有效的11月18日紀錄。');}event.target.value='';});
  $('#clear-record').addEventListener('click',()=>{if(!confirm('確定已下載紀錄，並清除此機的11月18日作答？'))return;localStorage.removeItem(KEY);state=fresh();renderAll();toast('已清除此機紀錄。');});
  function renderAll(){renderFields();renderPosts();renderPostSelect();renderBoundary();renderClassification();renderImportHistory();renderMissing();updateCompletion();}
  renderAll();
})();
