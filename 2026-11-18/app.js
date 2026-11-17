(() => {
  'use strict';
  const DATA = window.LESSON_DATA;
  if (!DATA || DATA.posts.length !== 32 || DATA.comments.length !== 48) {
    document.getElementById('main').textContent = '課堂資料未能載入，請通知老師使用紙本工作紙。';
    return;
  }
  const KEY = 'hkit-apl-2026-11-18-v4';
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
  const fresh = () => ({lesson:'2026-11-18 APL 2.2 第3堂',version:4,fields:{},postAnswers:{},aiRows:{},rawClassification:'',rawImports:[],audits:Array.from({length:5},blankAudit)});
  let state;
  try { state = {...fresh(), ...JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('hkit-apl-2026-11-18-v1') || 'null')}; }
  catch { state = fresh(); }
  if (!state || state.lesson !== '2026-11-18 APL 2.2 第3堂') state = fresh();
  state.fields ||= {}; state.postAnswers ||= {}; state.aiRows ||= {};
  if (!Array.isArray(state.rawImports)) state.rawImports = [];
  state.version = 4;
  state.audits = Array.from({length:5}, (_,i) => ({...blankAudit(), ...(state.audits?.[i] || {})}));

  // Reference 48 labels for teacher 1-click demo
  const TEACHER_REF_LABELS = [
    'C001|產品／查詢|正面','C002|物流|負面','C003|服務|正面','C004|價格|負面','C005|產品／查詢|中性','C006|品質|負面',
    'C007|價格|正面','C008|物流|正面','C009|品質|負面','C010|產品／查詢|中性','C011|服務|負面','C012|品質|正面',
    'C013|品質|負面','C014|產品／查詢|正面','C015|服務|負面','C016|產品／查詢|正面','C017|價格|正面','C018|物流|負面',
    'C019|產品／查詢|中性','C020|服務|負面','C021|品質|正面','C022|物流|負面','C023|服務|正面','C024|服務|正面',
    'C025|價格|負面','C026|品質|正面','C027|品質|負面','C028|產品／查詢|中性','C029|品質|正面','C030|價格|負面',
    'C031|產品／查詢|中性','C032|服務|正面','C033|產品／查詢|正面','C034|品質|負面','C035|產品／查詢|中性','C036|服務|正面',
    'C037|價格|正面','C038|服務|負面','C039|物流|正面','C040|產品／查詢|正面','C041|物流|負面','C042|產品／查詢|中性',
    'C043|產品／查詢|負面','C044|品質|負面','C045|服務|正面','C046|價格|正面','C047|產品／查詢|中性','C048|品質|正面'
  ];

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
  function toast(message) { const el = $('#toast'); el.textContent = message; el.style.display = 'block'; clearTimeout(el._timer); el._timer = setTimeout(() => el.style.display = 'none', 3200); }
  function feedback(selector, message, bad=false) { const el=$(selector); if(!el) return; el.textContent=message; el.classList.toggle('bad',bad); }
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
    return `請根據我上載的學生版48則留言CSV，分類${range}。${classificationRules}${batch}每個ID只輸出一行短標籤，格式為ID|主題|情感。不要重複留言原文，不要原文依據、解說、Markdown表格、合計或建議。網站會自行檢查ID與計算交叉表；稍後我們只抽查五則原文。`;
  }
  $('#prompt-b').textContent = classificationPrompt('C001','C048');
  $('#prompt-b1').textContent = classificationPrompt('C001','C024');
  $('#prompt-b2').textContent = classificationPrompt('C025','C048');

  function renderPosts() {
    $('#post-table tbody').innerHTML = TYPES.map(name => {
      const r=state.postAnswers[name] || {};
      return `<tr data-type="${esc(name)}"><th scope="row">${esc(name)}</th><td><input aria-label="${esc(name)}篇數" data-post="count" inputmode="numeric" value="${esc(r.count || '')}"></td><td><input aria-label="${esc(name)}平均互動" data-post="avg" inputmode="decimal" value="${esc(r.avg || '')}"></td><td><input aria-label="${esc(name)}平均單篇互動率" data-post="rate" inputmode="decimal" value="${esc(r.rate || '')}"></td></tr>`;
    }).join('');
  }
  function renderPostSelect() {
    $('#post-id').innerHTML = selectOptions(DATA.posts.map(r=>r.post_id),field('aPostId'),'選擇一篇');
    const row=DATA.posts.find(r=>r.post_id===field('aPostId'));
    $('#post-source').textContent = row ? `原表 ${row.post_id}（${row.week} · ${row.post_type}）：likes ${row.likes} ＋ comments ${row.comments} ＋ shares ${row.shares} ＋ saves ${row.saves} ＝ ${total(row)} 次互動；reach ${row.reach} 另作分母。` : '先選一個 post_id（如 P001），原表四項互動會顯示在這裏。';
  }
  function renderBoundaryReadOnly() {
    $('#boundary-cards').innerHTML = ['C009','C027'].map(id => {
      const row=DATA.comments.find(x=>x.comment_id===id);
      return `<div class="boundary" data-boundary="${id}"><strong>${id}（${esc(row.platform)} · ${esc(row.date)}）</strong><blockquote>「${esc(row.comment_text)}」</blockquote><p class="muted">請對照上方五個主題字典，直接在<strong>紙本工作紙 B1</strong> 寫出主要主題、情感及原句詞語依據（此處唯讀，無須在網站重複填寫）。</p></div>`;
    }).join('');
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
    if(!classified)return '<p class="source-line">尚未匯入Gemini的精簡標籤。完成Gemini批量分類後一次貼上（或按上方「教師示範」按鈕），5×3 交叉表便會自動產生。</p>';
    let sumP=0, sumN=0, sumU=0;
    const rows=TOPICS.map(t=> {
      const x=matrix[t],n=SENTIMENTS.reduce((s,k)=>s+x[k],0);
      sumP+=x['正面']; sumN+=x['負面']; sumU+=x['中性'];
      return `<tr><th scope="row">${t}</th>${SENTIMENTS.map(k=>`<td>${x[k]}</td>`).join('')}<td><strong>${n}</strong></td><td>${n ? (x['負面']/n*100).toFixed(1)+'%' : '—'}</td></tr>`;
    }).join('');
    const totalRow = `<tr><th scope="row">總計</th><td><strong>${sumP}</strong></td><td><strong>${sumN}</strong></td><td><strong>${sumU}</strong></td><td><strong>${classified}</strong></td><td>—</td></tr>`;
    return `<p><span class="status-pill ${classified===48?'':'warn'}">${state.rawImports.some(x=>(x.source||x.label||'').includes('教師'))?'含教師示例，非純AI實測':'匯入標籤'} ${classified}/48 個ID</span>${revised?'　按五則人手抽查修訂後':''}</p><div class="table-wrap"><table><thead><tr><th>主題</th><th>正面</th><th>負面</th><th>中性</th><th>合計</th><th>類別內負面率</th></tr></thead><tbody>${rows}${totalRow}</tbody></table></div>`;
  }
  function renderCrosstabs() { $('#cross-tab').innerHTML=tableForCounts(false); $('#revised-cross-tab').innerHTML=counts().classified?'<h4>抽查修訂後的交叉表</h4>'+tableForCounts(true):''; }
  function missingIds() { return DATA.comments.map(c=>c.comment_id).filter(id=>!TOPICS.includes(state.aiRows[id]?.topic)||!SENTIMENTS.includes(state.aiRows[id]?.sentiment)); }
  function renderMissing(force=false) {
    const missing=missingIds(), show=missing.length>0&&(force||state.rawImports.length>0);
    $('#missing-panel').hidden=!show;
    if(!show)return;
    $('#missing-list').textContent=`待補或標籤不完整：${missing.join('、')}（共 ${missing.length} 則）。請複製下方指令，讓 Gemini 只補這幾個 ID。`;
    $('#missing-prompt').textContent=`請只根據剛才上載的學生版48則留言CSV，補齊以下實際缺漏comment_id：${missing.join('、')}。${classificationRules}每個ID只輸出一行，格式為ID|主題|情感；只列這${missing.length}則，不重複原文或解說，不重做其他ID，不要猜測。`;
  }
  function renderImportHistory() {
    $('#import-count').textContent=String(state.rawImports.length);
    $('#import-history').innerHTML=state.rawImports.map((item,i)=>`<details class="saved-import"><summary>第${i+1}次：${esc(item.label||'Gemini原始回答')}（${(item.ids||[]).length}個可辨識ID）</summary><pre class="plain-pre">${esc(item.text||'')}</pre></details>`).join('')||'<p class="muted">尚未匯入Gemini回答。</p>';
  }
  function renderAudits() {
    const options=DATA.comments.map(r=>r.comment_id);
    $('#audit-rows').innerHTML=state.audits.map((a,i)=> {
      const row=DATA.comments.find(r=>r.comment_id===a.id), ai=state.aiRows[a.id] || {};
      return `<div class="audit" data-audit="${i}"><div class="audit-head"><strong>抽查 ${i+1}</strong><select aria-label="抽查${i+1}留言編號" data-audit-field="id">${selectOptions(options,a.id,'選擇comment_id')}</select></div><p class="original">${row?`【${row.comment_id} 原句】「${esc(row.comment_text)}」`:'選擇ID後即時顯示留言原句（紙本B3只需記關鍵詞，不用抄全句）。'}</p><p class="ai-label">匯入標籤（來源見B2）：${esc(ai.topic || '未匯入')}＋${esc(ai.sentiment || '未匯入')}</p><div class="two"><label>人手判斷<select data-audit-field="status">${selectOptions(['同意','修改','待討論'],a.status)}</select></label><label>若修改，新主題<select data-audit-field="topic">${selectOptions(TOPICS,a.topic)}</select></label><label>若修改，新情感<select data-audit-field="sentiment">${selectOptions(SENTIMENTS,a.sentiment)}</select></label></div><label>原句關鍵詞與判斷理由（可記於紙本B3）<textarea data-audit-field="reason" placeholder="紙本已寫可免填；此處僅供預覽修訂後交叉表">${esc(a.reason)}</textarea></label></div>`;
    }).join('');
    const chosen=state.audits.map(a=>a.id).filter(Boolean);
    const repeated=[...new Set(chosen.filter((id,i)=>chosen.indexOf(id)!==i))];
    feedback('#audit-feedback',repeated.length?`重複ID：${repeated.join('、')}。請改選不同留言，五則抽查才有五個獨立例子。`:'',repeated.length>0);
    renderCrosstabs();
  }
  function renderFields() {
    document.querySelectorAll('[data-field]').forEach(el => { if(el.id==='post-id') return; el.value=state.fields[el.dataset.field] || ''; });
    $('#paste-classification').value=state.rawClassification || '';
    $('#final-count').textContent=`定稿字數：${field('cFinal').length}`;
  }
  function updateCompletion() {
    const classified=counts().classified;
    const chosenAudits=new Set(state.audits.map(a=>a.id).filter(Boolean)).size;
    const hasDraft = field('cAiDraft').length > 0;
    $('#completion').innerHTML=`<strong>目前電子紀錄狀態：</strong> B2 Gemini短標籤已匯入 <strong>${classified}/48</strong> 個ID；B3 已查閱原句 <strong>${chosenAudits}/5</strong> 則；C2 Gemini月報原稿 <strong>${hasDraft?'已保存':'未貼上'}</strong>。<br>請交回<strong>紙本短答；C2原稿、定稿及核對說明在此保存一次</strong>，並按老師指示下載此 JSON 紀錄備查。`;
  }
  function parseClassification(raw) {
    const output={}; let duplicates=0;
    for(const line of raw.split(/\r?\n/)) {
      const id=(line.match(/\bC\d{3}\b/i)||[])[0]?.toUpperCase();
      if(!id || !DATA.comments.some(c=>c.comment_id===id)) continue;
      const cells=line.includes('|') ? line.split('|') : line.includes('\t') ? line.split('\t') : line.split(',');
      const cleaned=cells.map(x=>x.trim().replace(/^\*\*|\*\*$/g,'').replace(/^['"`]|['"`]$/g,'').replace(/^[：:]+|[。；;]+$/g,'').trim());
      const topic=cleaned.map(normalizeTopic).find(t=>TOPICS.includes(t));
      const sentiment=cleaned.find(s=>SENTIMENTS.includes(s));
      if(topic && sentiment) { if(output[id]) duplicates++; output[id]={topic,sentiment}; }
    }
    return {output,duplicates};
  }
  function printRecord() {
    const html=`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>11月18日電子紀錄</title><style>body{font:12px/1.5 "Microsoft JhengHei",sans-serif;margin:18mm}h2{margin-top:20px}table{border-collapse:collapse;width:100%;font-size:10px}td,th{border:1px solid #888;padding:4px;vertical-align:top}p{white-space:pre-wrap}</style><h1>11月18日｜2.2第3堂電子輔助紀錄</h1><p>組別：${esc(field('groupId'))}　組員：${esc(field('members'))}</p><h2>B2｜Gemini分類交叉表</h2>${tableForCounts(false)}<h2>C2｜Gemini月報原稿與定稿</h2><p><strong>AI原稿：</strong>${esc(field('cAiDraft'))}</p><p><strong>定稿：</strong>${esc(field('cFinal'))}</p><p><strong>核對說明：</strong>${esc(field('cReview'))}</p></html>`;
    const popup=window.open('','_blank');if(!popup){toast('瀏覽器擋住新視窗；請直接下載JSON紀錄。');return;}popup.document.write(html);popup.document.close();popup.focus();setTimeout(()=>popup.print(),500);
  }

  // Teacher 1-click Demos
  $('#demo-fill-a2').addEventListener('click', () => {
    for (const name of TYPES) {
      const s = stats[name];
      state.postAnswers[name] = { count: String(s.count), avg: s.avg.toFixed(2), rate: s.rate.toFixed(2) };
    }
    state.fields.aP001Total = '159'; state.fields.aP001Reach = '2964'; state.fields.aP001Rate = '5.36';
    state.fields.aCategoryTotal = '32'; state.fields.aAvgGap = '4.37'; state.fields.aRateGap = '0.65';
    state.fields.aPostId = 'P001'; state.fields.aAiTotal = '159';
    renderPosts(); renderFields(); renderPostSelect(); save();
    $('#check-a2').click(); $('#check-a2-calcs').click();
    toast('已載入教師示範數據（32篇六類統計與P001算式）。');
  });

  $('#demo-fill-b2').addEventListener('click', () => {
    $('#paste-classification').value = TEACHER_REF_LABELS.join('\n');
    state.aiRows = {}; state.rawImports = []; state.nextImportSource = '教師示例（非Gemini實際輸出）';
    $('#import-classification').click();
    toast('已載入教師示範：完整 48 行短標籤與 5×3 交叉表。');
  });

  $('#demo-missing-b2').addEventListener('click', () => {
    const partial = TEACHER_REF_LABELS.filter(x => !x.startsWith('C014|') && !x.startsWith('C029|')).join('\n');
    state.aiRows = {}; state.rawImports = []; state.nextImportSource = '教師模擬缺漏（非Gemini實際輸出）';
    $('#paste-classification').value = partial;
    $('#import-classification').click();
    renderMissing(true);
    toast('已模擬漏掉 C014、C029（共46/48則），下方已自動生成只補這2個ID的指令。');
  });

  $('#demo-fill-c2').addEventListener('click', () => {
    state.fields.cPosts = '貼文第1–8週共32篇模擬資料，迷因／趣味7篇，平均每篇互動729.14次（平均單篇互動率8.34%）。';
    state.fields.cComments = '2026年5–6月共48則模擬留言，品質類負面6/11（54.5%）件數最多，物流類負面4/6（66.7%）比例最高。';
    state.fields.cActions = '內容安排：下一階段先測試迷因／趣味貼文；回應安排：優先核查品質（含App／網頁體驗）及物流投訴回覆流程。';
    state.fields.cValidation = '以同一口徑比較下一批同類貼文平均互動及品質／物流負面件數；兩表跨期且屬模擬資料，不推論因果或真實銷量。';
    state.fields.cAiDraft = '【月報格式練習（跨期模擬資料）】貼文第1–8週共32篇，迷因／趣味7篇，平均每篇互動729.14次（單篇互動率8.34%）。另在2026年5–6月48則模擬留言中，品質類負面件數最多（6/11，54.5%），物流類負面率最高（4/6，66.7%）。下階段建議先測試迷因內容，並優先核查品質及物流投訴流程；以同口徑追蹤平均互動及負面件數。兩表期間不同，不推論因果或真實品牌銷量。';
    state.fields.cAiDraft = "【教師示例，非Gemini實際輸出】" + state.fields.cAiDraft;
    state.fields.cFinal = "";
    renderFields(); save();
    toast('已載入教師示例（非Gemini輸出）；定稿請由人核對後填寫。');
  });

  document.addEventListener('input', event => {
    const el=event.target;
    if(el.dataset.field){state.fields[el.dataset.field]=el.value;if(el.dataset.field==='cFinal')$('#final-count').textContent=`定稿字數：${el.value.length}`;save();}
    if(el.dataset.post){const name=el.closest('[data-type]').dataset.type;state.postAnswers[name]||={};state.postAnswers[name][el.dataset.post]=el.value;save();}
    if(el.dataset.auditField && el.tagName==='TEXTAREA'){state.audits[Number(el.closest('[data-audit]').dataset.audit)][el.dataset.auditField]=el.value;save();}
    if(el.id==='paste-classification'){state.rawClassification=el.value;save();}
  });
  document.addEventListener('change', event => {
    const el=event.target;
    if(el.dataset.field){state.fields[el.dataset.field]=el.value;if(el.id==='post-id')renderPostSelect();save();}
    if(el.dataset.auditField){const idx=Number(el.closest('[data-audit]').dataset.audit);state.audits[idx][el.dataset.auditField]=el.value;save();if(el.dataset.auditField==='id')renderAudits();else renderCrosstabs();}
  });

  $('#copy-prompt-a').addEventListener('click',()=>copy($('#prompt-a').textContent.trim()));
  $('#copy-prompt-b').addEventListener('click',()=>copy($('#prompt-b').textContent.trim()));
  $('#copy-prompt-b1').addEventListener('click',()=>copy($('#prompt-b1').textContent.trim()));
  $('#copy-prompt-b2').addEventListener('click',()=>copy($('#prompt-b2').textContent.trim()));
  $('#copy-missing-prompt').addEventListener('click',()=>copy($('#missing-prompt').textContent.trim()));
  $('#copy-chart-1-p0').addEventListener('click',()=>copy($('#prompt-chart-1-p0').textContent.trim()));
  $('#copy-chart-1').addEventListener('click',()=>copy($('#prompt-chart-1').textContent.trim()));
  $('#copy-chart-2-p0').addEventListener('click',()=>copy($('#prompt-chart-2-p0').textContent.trim()));
  $('#copy-chart-2').addEventListener('click',()=>copy($('#prompt-chart-2').textContent.trim()));

  $('#check-a2').addEventListener('click',()=>{let complete=0,correct=0;for(const name of TYPES){const r=state.postAnswers[name]||{},s=stats[name];let rowFilled=0;for(const key of ['count','avg','rate']){if(String(r[key]||'').trim()){complete++;rowFilled++;const expected=s[key];if(Math.abs(number(r[key])-expected)<(key==='count'?0.01:0.025))correct++;}}const tr=[...document.querySelectorAll('#post-table tbody tr')].find(x=>x.dataset.type===name);tr.className=rowFilled===3&&['count','avg','rate'].every(k=>Math.abs(number(r[k])-s[k])<(k==='count'?0.01:0.025))?'match':rowFilled?'mismatch':'';}feedback('#feedback-a2',`已填${complete}/18格，其中${correct}格與原CSV重算一致。紙本工作紙A2只需抄兩行用於決策的比較類別，不用手抄18格。`,correct!==complete||complete===0);});
  $('#check-a2-calcs').addEventListener('click',()=>{const fields=[['aP001Total',159],['aP001Reach',2964],['aP001Rate',5.36],['aCategoryTotal',32],['aAvgGap',4.37],['aRateGap',0.65]];const filled=fields.filter(([k])=>field(k));if(filled.length<fields.length){feedback('#feedback-a2-calcs',`已填${filled.length}/6格；此組為教師示範核對，學生不必重填全部六格。`,true);return;}const errors=fields.filter(([k,v])=>Math.abs(number(field(k))-v)>0.015).map(([k])=>k);feedback('#feedback-a2-calcs',errors.length?`有${errors.length}格與原CSV重算不符；請查P001四項互動、觸及，以及兩類指標的單位。`:'六格都與原CSV重算一致！這是教師示範核對；紙本A2只記兩類比較，A4記原表抽查。',errors.length>0);});
  $('#check-a4').addEventListener('click',()=>{const row=DATA.posts.find(r=>r.post_id===field('aPostId'));if(!row||!field('aAiTotal')){feedback('#feedback-a4','先選貼文並填入四項互動合計。',true);return;}const n=total(row),ok=number(field('aAiTotal'))===n;feedback('#feedback-a4',ok?`一致：${row.post_id} 原表四項相加為 ${n}（reach ${row.reach} 不計入）。請記在紙本A4。`:`不一致：原表四項相加為 ${n}，請檢查是否漏欄或誤加 reach。`,!ok);});

  $('#import-classification').addEventListener('click',()=>{const raw=$('#paste-classification').value;const {output,duplicates}=parseClassification(raw);const ids=Object.keys(output),n=ids.length;if(!n){feedback('#feedback-b2','未找到可辨識的ID、主題和情感。請檢查格式為 C001|產品／查詢|正面。',true);return;}const overlap=ids.filter(id=>TOPICS.includes(state.aiRows[id]?.topic)&&SENTIMENTS.includes(state.aiRows[id]?.sentiment));state.rawClassification=raw;const source=state.nextImportSource||'Gemini實際輸出（使用者匯入）'; delete state.nextImportSource; state.rawImports.push({label:source+` ${ids[0]}–${ids[ids.length-1]}`,source,ids,text:raw});state.aiRows={...state.aiRows,...output};save();renderCrosstabs();renderAudits();renderImportHistory();renderMissing();const tot=counts().classified;feedback('#feedback-b2',`本次匯入 ${n} 個不同ID；累計 ${tot}/48 個ID有標籤${duplicates?`（含${duplicates}個重複ID）`:''}。紙本B2只記ID完整數及來源，不抄交叉表，再到 B3 選 5 個 ID 看原句。`,tot<48);});
  $('#check-b2').addEventListener('click',()=>{const n=counts().classified,missing=missingIds();feedback('#feedback-b2',n===48?`48個ID齊全！紙本B2只記ID完整數及來源，接著在 B3 選五則看原句。`:`目前 ${n}/48 列完整。待補：${missing.join('、')}。請用下方指令只補缺漏 ID。`,n!==48);renderCrosstabs();renderMissing(true);});
  $('#copy-prompt-c').addEventListener('click',()=>{const keys=['cPosts','cComments','cActions','cValidation'];if(keys.some(k=>!field(k))){feedback('#feedback-c','先填妥四格要點（或按上方教師示範按鈕），再合成 Prompt。',true);return;}const prompt=`請把以下由我們核對的資料整理成120–160字「月報格式練習（跨期模擬資料）」。貼文只有相對第1–8週，留言日期為2026年5–6月；兩組均為學校模擬資料。分開寫資料期間、指標與分母。不得新增品牌、銷量、因果或未提供數字。保留我們的兩項行動與資料限制。資料不足先列缺項，不自行補數字；字數與必要事實衝突時優先保留事實並說明。\n貼文：${field('cPosts')}\n留言：${field('cComments')}\n兩項行動：${field('cActions')}\n下一階段指標及限制：${field('cValidation')}`;copy(prompt);feedback('#feedback-c','已複製 S58 月報整理 Prompt！貼到 Gemini 後，把 AI 原稿貼回下方保存，並在本頁C2完成人手定稿及核對說明；不用抄回紙本。');});
  $('#download-json').addEventListener('click',()=>{persist();const id=field('groupId').replace(/[^\w-]/g,'_')||'未填組別';download(`APL_2026-11-18_${id}.json`,JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2));toast('已下載 JSON 紀錄。');});
  $('#print-record').addEventListener('click',printRecord);
  $('#import-json').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(parsed.lesson!==fresh().lesson)throw Error('lesson');state={...fresh(),...parsed};if(!Array.isArray(state.rawImports))state.rawImports=[];state.version=4;state.audits=Array.from({length:5},(_,i)=>({...blankAudit(),...(state.audits?.[i]||{})}));renderAll();save();toast('已匯入本堂紀錄。');}catch{toast('這不是有效的11月18日紀錄。');}event.target.value='';});
  $('#clear-record').addEventListener('click',()=>{if(!confirm('確定已下載紀錄，並清除此機的11月18日作答？'))return;localStorage.removeItem(KEY);state=fresh();renderAll();toast('已清除此機紀錄。');});
  function renderAll(){renderFields();renderPosts();renderPostSelect();renderBoundaryReadOnly();renderCrosstabs();renderAudits();renderImportHistory();renderMissing();updateCompletion();}
  renderAll();
})();
