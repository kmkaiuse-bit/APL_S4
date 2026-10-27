(function(root){
 'use strict';
 const P=root.PromptKit||(typeof module!=='undefined'?require('./prompt-kit.js'):null);
 const VERSION=1, LESSON='hkit-social-20261028';
 const fields={
  studentId:'',name:'',viewWinner:'',viewHigh:'',viewLow:'',likeWinner:'',likeHigh:'',likeLow:'',limit:'',supported:[],evidence:'',checkClaim:'',missing:'',
  tool:'',sentPrompt:'',sentConfirmed:false,answer:'',operation:'',source:'本人對話',blocker:'',outputRank:false,outputRatio:false,outputComments:false,outputLimit:false,
  rankCheck:'',ratioCheck:'',commentCheck:'',quickTopic:'',quickQuote:'',quickEvidence:'',quickResult:'',
  deepQuote:'',sentenceType:'',deepEvidence:'',deepMissing:'',decision:'',resolution:'',followPrompt:'',followAnswer:'',goal:'',recommendation:'',recommendationLimit:'',
  finalSupport:'',finalReason:'',finalComment:'',finalCondition:'',explainChoice:'',finalExplanation:'',revisionChoice:'',revisionReason:''
 };
 const groups=[['viewWinner','viewHigh','viewLow','likeWinner','likeHigh','likeLow','limit','supported','evidence','checkClaim','missing'],['tool','operation','rankCheck','ratioCheck','commentCheck','quickTopic','quickQuote','quickEvidence','quickResult'],['deepQuote','sentenceType','deepEvidence','decision','resolution','goal','recommendation','recommendationLimit'],['finalSupport','finalReason','finalComment','finalCondition','explainChoice','finalExplanation']];
 const finalKeys=groups[3];
 function blank(){return {schemaVersion:VERSION,lesson:LESSON,fields:JSON.parse(JSON.stringify(fields)),promptActivities:P.blank(),stamps:{},firstInitial:null,finalInitial:null,updatedAt:null};}
 function present(v){return Array.isArray(v)?v.length>0:typeof v==='string'?v.trim().length>0:v===true;}
 function progress(record,n){const f=record.fields;let keys=groups[n-1];let done=keys.filter(k=>present(f[k])).length;let total=keys.length;
  if(n===2){total+=4;if(f.sentConfirmed&&present(f.sentPrompt))done++;if(present(f.answer))done++;if(present(f.source))done++;if(P.unlocked('analysis',rPrompt(record,'analysis')))done++;}
  if(n===4&&record.finalInitial){done=keys.filter(k=>present(record.finalInitial.fields[k])).length;total=keys.length;}
  return {done,total,complete:done===total};
 }
 function validate(raw){
  if(!raw||raw.schemaVersion!==VERSION||raw.lesson!==LESSON||!raw.fields)throw Error('這不是本堂課的紀錄檔。');
  const r=blank();for(const k of Object.keys(fields)){const v=raw.fields[k];if(v===undefined)continue;if(Array.isArray(fields[k])){if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error('紀錄欄位格式不符。');r.fields[k]=v.slice(0,10);}else if(typeof v===typeof fields[k])r.fields[k]=v;else throw Error('紀錄欄位格式不符。');}
  for(const n of ['1','2','3','4'])if(typeof raw.stamps?.[n]==='string')r.stamps[n]=raw.stamps[n];
  r.promptActivities=P.normalize(raw.promptActivities);
  if(raw.firstInitial){if(!raw.firstInitial.fields||typeof raw.firstInitial.sealedAt!=='string')throw Error('第一段初答格式不符。');const fs={};for(const k of groups[0]){const v=raw.firstInitial.fields[k];if(k==='supported'){if(!Array.isArray(v)||v.some(x=>typeof x!=='string'))throw Error('第一段初答選項格式不符。');fs[k]=v.slice(0,10);}else{if(typeof v!=='string')throw Error('第一段初答不完整。');fs[k]=v;}}r.firstInitial={sealedAt:raw.firstInitial.sealedAt,fields:fs};}
  if(raw.finalInitial){if(!raw.finalInitial.fields||typeof raw.finalInitial.sealedAt!=='string')throw Error('初答紀錄格式不符。');const fs={};for(const k of finalKeys){if(typeof raw.finalInitial.fields[k]!=='string')throw Error('初答紀錄不完整。');fs[k]=raw.finalInitial.fields[k];}r.finalInitial={sealedAt:raw.finalInitial.sealedAt,fields:fs};}
  r.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt:null;return r;
 }
 function rPrompt(r,id){return r.promptActivities?.[id]||P.empty();}
 function promptSummary(r,id){const s=rPrompt(r,id),d=P.definitions[id];return '<h3>'+safe(d.title)+'：元素配對紀錄</h3><p>'+safe(P.unlocked(id,s)?'已完成配對':'尚未完成配對')+'，檢查次數：'+s.checks+'</p><pre>'+P.slots.map(slot=>safe(slot.label+'：'+(d.cards.find(c=>c.id===s.placements[slot.id])?.text||'尚未放置'))).join('\n\n')+'</pre>';}
 function seal(r,now=new Date().toISOString()){if(r.finalInitial)return r;const f={};for(const k of finalKeys)f[k]=r.fields[k];r.finalInitial={sealedAt:now,fields:f};return r;}
 function safe(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 const DECISION_QUESTION='你會建議7仔下一次怎樣安排影片？';
 function decisionReady(r){return !!r.finalInitial&&present(r.fields.revisionChoice)&&present(r.fields.revisionReason);}
 function decisionCard(r){const f=r.fields;return `<article class="snapshot recommendation-card" aria-label="給7仔的最終建議卡"><h3>給7仔的最終建議卡</h3><p><strong>${safe(DECISION_QUESTION)}</strong></p><dl><dt>我的目標</dt><dd>${safe(f.goal||'未填寫')}</dd><dt>我的安排與數字依據</dt><dd>${safe(f.recommendation||'未填寫')}</dd><dt>我的限制與待查資料</dt><dd>${safe(f.recommendationLimit||'未填寫')}</dd></dl><p class="muted">這是任務03已填內容的摘要，沒有新增作業或代填答案；匯出後仍需按老師指定方式提交。</p></article>`;}
 function report(r){const names=windowFieldLabels();let out='';for(let n=1;n<=4;n++){const keys=n===1?groups[0]:n===2?['tool','operation','source','blocker','sentConfirmed','sentPrompt','answer','outputRank','outputRatio','outputComments','outputLimit',...groups[1].slice(2)]:n===3?[...groups[2],'deepMissing','followPrompt','followAnswer']:[...groups[3],'revisionChoice','revisionReason'];out+=`<h2>任務 ${n}</h2>`;if(n===1&&r.firstInitial)out+='<h3>第一段保存時的初答</h3><pre>'+safe(JSON.stringify(r.firstInitial.fields,null,2))+'</pre><h3>目前紀錄（如有補充，與初答分開）</h3>';if(n===4)out+=`<h3>已保存個人初答</h3><p>${safe(r.finalInitial?.sealedAt||'尚未封存初答')}</p>`;for(const k of keys){const v=n===4&&finalKeys.includes(k)&&r.finalInitial?r.finalInitial.fields[k]:r.fields[k];const text=Array.isArray(v)?v.join('、'):typeof v==='boolean'?(v?'已勾選':'未勾選'):v;out+=`<h3>${safe(names[k]||k)}</h3><pre>${safe(text||'未填寫')}</pre>`;}}
  out=out.replace('<h2>任務 2</h2>','<h2>任務 2</h2>'+promptSummary(r,'analysis')).replace('<h2>任務 3</h2>','<h2>任務 3</h2>'+promptSummary(r,'follow'));
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>社交影片分析紀錄</title><style>body{font:16px/1.8 system-ui;max-width:900px;margin:40px auto;padding:24px;color:#17372f}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;background:#f3f5ef;padding:14px}h2{border-top:2px solid;padding-top:22px}h3{font-size:16px}.recommendation-card{border:1px solid #9bad9d;padding:18px;margin:24px 0}.recommendation-card dt{font-weight:bold}.recommendation-card dd{margin:0 0 12px;white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0}}</style><h1>7仔社交影片分析紀錄</h1><p>${safe(r.fields.studentId)} · ${safe(r.fields.name)}</p><p>資料：2026年10月26日固定快照。紀錄更新：${safe(r.updatedAt)}。本檔為匯出備份，不代表已提交。</p>${decisionCard(r)}${out}</html>`;
 }
 function windowFieldLabels(){return {studentId:'學號／識別碼',name:'姓名',viewWinner:'觀看較多的版本',viewHigh:'較多觀看數',viewLow:'另一版觀看數',likeWinner:'讚好較多的版本',likeHigh:'較多讚好數',likeLow:'另一版讚好數',limit:'整體判斷的限制',supported:'有資料支持的說法',evidence:'數字依據',checkClaim:'要查證的說法',missing:'需要補收的資料',tool:'使用的AI工具',sentPrompt:'實際指令',sentConfirmed:'已確認送出指令',answer:'實際AI回答',operation:'操作狀態',source:'回答來源',blocker:'操作卡點',outputRank:'回答有排名',outputRatio:'回答有比值與公式',outputComments:'回答有留言狀態',outputLimit:'回答有發現與未知',rankCheck:'排名核對',ratioCheck:'比值核對',commentCheck:'留言核對',quickTopic:'選定核對項目',quickQuote:'AI原句',quickEvidence:'數字或公式依據',quickResult:'核對結果',deepQuote:'深入核對原句',sentenceType:'句子類別',deepEvidence:'支持依據',deepMissing:'證據缺口',decision:'保留／修正／待查',resolution:'理由、修正句或待查資料',followPrompt:'追問指令',followAnswer:'追問後的回答',goal:'建議目標',recommendation:'自己的建議',recommendationLimit:'自己的限制',finalSupport:'訂單判斷',finalReason:'訂單判斷理由',finalComment:'留言記錄選擇',finalCondition:'需要查的比較條件',explainChoice:'選哪題解釋',finalExplanation:'解釋理由',revisionChoice:'核對後保留／修正',revisionReason:'核對後理由'};}
 const api={VERSION,LESSON,blank,present,progress,validate,seal,safe,report,labels:windowFieldLabels,groups,finalKeys,DECISION_QUESTION,decisionReady,decisionCard};
 if(typeof module!=='undefined')module.exports=api;root.LabCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
