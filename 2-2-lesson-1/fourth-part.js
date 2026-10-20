(function(){
'use strict';
let ctx;
const timing=['p4-timing-status','seconds-first','seconds-second','timing-change','p4-timing-script'];
const peer=['peer-status','p4-peer-focus','peer-feedback','peer-decision','p4-peer-reason','p4-self-check','feedback-limit','p4-peer-script'];
const ai=['p4-ai-line','p4-ai-copy','p4-ai-sent','p4-ai-status','p4-ai-response','p4-ai-decision','p4-ai-script'];
let teardown=()=>{};
function choice(id,label,options,hint='選一項，老師可口頭問你的依據。'){
 const saved=ctx.get(id);return ctx.select(id,label,hint,'按實際情況選擇，不把選項當已完成。',saved&&!options.includes(saved)?[...options,saved]:options);
}
function register(id,label){ctx.fields.set(id,{id,label,part:3,type:'activity'});}
function aiPrompt(){return `你是課堂文字修訂助手。\n產品卡：虛構山角校園用品店，低筒學生運動鞋，黑／白兩色，每對HK$399；讀者是香港中學生。\n尺碼、庫存、優惠、送貨、退換及功效未提供。\n我目前的三段稿：\n${ctx.get('final-script')||'〔未填〕'}\n我想縮短的原句：「${ctx.get('p4-ai-line')||'〔貼自己的原句〕'}」。\n只為這一句提供最多兩個較短方案，保留原意及原句中的必要產品資料；若原句含未提供的承諾，指出並刪除該承諾。\n不代寫整份稿，不新增產品事實，不保證推薦或購買；不要聲稱已實測秒數。只輸出文字，實際用時由我們讀劇測量。`;}
function create(context){ctx=context;const {ex,field:f,ref,esc}=ctx;
for(const [id,label] of [['p4-revision-evidence','原稿回饋與修訂依據（不是修訂稿互評）'],['p4-timing-origin','原稿實讀紀錄（不是修訂稿用時）'],['p4-source-draft','帶入修改時的初稿快照'],['p4-source-purpose','帶入時的溝通目的'],['p4-timing-script','計時所對應的稿'],['p4-peer-script','回饋所對應的稿'],['p4-ai-copy','最近複製的縮句prompt（不代表已送出）'],['p4-ai-sent','確認實際送出的縮句prompt'],['p4-ai-script','AI縮句所對應的稿'],['p4-archive','改稿或改狀態前紀錄（不是當前結果）']])register(id,label);
return `<div id="p4-root">`+ex('04A 聽一次，哪句聽得出產品？','42',`<p>請老師讀兩句，先不用看答案：</p><p><strong>A：</strong>「這對鞋很棒，快來看看！」<br><strong>B：</strong>「黑色還是白色？這款低筒運動鞋每對HK$399。」</p>${choice('p4-demo-choice','哪句直接交代鞋款和售價？',['A','B','兩句都有'])}<button type="button" id="p4-demo-check">核對句子</button><p id="p4-demo-feedback" class="feedback" role="status"></p><p class="small">教師預備例句，不是AI實測。B資料較具體，但仍需實讀；不能由此保證流量。</p>`)+
ex('04B 把自己的稿改一處','43',`<p>先保留初稿，再人手改一處；已有依據也可以保留。</p><button type="button" id="p4-bring">把第03部分初稿帶入修改框</button><p id="p4-source-status" class="small" role="status"></p><label for="p4-draft-preview"><strong>帶入時的初稿（唯讀快照）</strong></label><textarea id="p4-draft-preview" readonly class="long"></textarea>${f('final-script','三段定稿／有依據保留的稿','從帶入的稿改一句，保留畫面、台詞與節奏。','不填「已改」；要留下實際會讀出的稿。',{cls:'long',rows:8})}<div class="two-col">${choice('p4-revision-target','你主要核對哪一段？',['開場','商品介紹','結尾問題','整份稿'])}${choice('p4-revision-action','這次怎樣處理？',['改寫一處','保留原稿','待查資料，暫保留有依據的內容'])}</div>${choice('revision-reason','修改或保留的依據',['讓開場更清楚說出產品','保留產品卡已提供的顏色與售價','刪去未提供的承諾或功效','結尾改成相關買前問題','原稿已符合產品卡，先保留並試讀','其他，已口頭向老師說明'])}${ref('可選AI實操：一句太長才請AI幫忙',`<p>先選自己稿內的一句，複製貼入下欄；向校方允許的AI索取最多兩個縮句方案。自己選擇，再人手修改及實讀。此步不是必做。</p>${f('p4-ai-line','貼自己想縮短的原句','直接從上方定稿複製一句，不用另寫理由。','必須是目前稿內真正出現的一句。',{rows:2})}<div class="check-row"><button type="button" id="p4-ai-copy-button">複製縮句prompt</button><a href="https://gemini.google.com/" target="_blank" rel="noopener">開啟 Gemini</a></div><label for="p4-ai-preview"><strong>縮句prompt（唯讀）</strong></label><textarea id="p4-ai-preview" readonly class="prompt"></textarea><button type="button" id="p4-ai-confirm">我已原封不動送出剛複製的版本</button><p class="small">若在AI中改過prompt，可手動貼回真正版本；按確認及複製都不代表已取得回答。</p>${f('p4-ai-sent','實際送出的縮句prompt','原封不動送出可按確認；有改動貼回工具中的版本。','沒送出就留空。',{rows:3})}${choice('p4-ai-status','實際縮句操作狀態',['自己取得','教師實測示例','未取得','尚未嘗試'])}${f('p4-ai-response','如有操作，貼回真實AI回答','保留原文，未取得留空。','教師預備例句不是AI回答。',{rows:3})}${choice('p4-ai-decision','你怎樣處理縮句方案？',['選一個方案後人手修改，再實讀','不採用，保留自己的句子','待確認，先核對資料'])}<button type="button" id="p4-ai-check">核對縮句紀錄</button><p id="p4-ai-feedback" class="feedback" role="status"></p><p class="small">改稿會把這次AI紀錄連同原稿保存至舊版本；不把舊回答當新稿的核對結果。</p>`)}`)+
ex('04C 真的讀一次，記下秒數','44',`<p>一人讀、一人計時，換卡和停頓也算；可由同伴代讀，不用錄影。</p><div class="timer"><output id="p4-timer-display" aria-label="計時秒數">0.0 秒</output><button type="button" id="p4-timer-start">開始</button><button type="button" id="p4-timer-stop">停止</button><button type="button" id="p4-timer-reset">重設</button></div><div class="check-row"><button type="button" id="p4-use-first">記入第一次</button><button type="button" id="p4-use-second">記入第二次（有再測才用）</button></div><p class="small">每次實讀前先重設。第二次必須重新計時，不能把同一次讀劇重複記入。重設只清計時器，不清已記秒數。</p>${choice('p4-timing-status','實際讀劇狀態',['已實際讀劇計時','修訂稿未再計時，保留舊稿實讀紀錄','未計時，已口頭告訴老師原因'])}<div class="two-col">${f('seconds-first','第一次實際用時（秒）','可用本頁或自己的計時器；只填大於0的實測秒數。','外部計時器實測17.2秒才填17.2。',{type:'number'})}${f('seconds-second','第二次實際用時（可選）','重新實讀才填，沒有再測就留空。','第二次若實測14.8秒才填14.8。',{type:'number'})}</div>${choice('timing-change','根據實讀，你打算怎樣做？',['用時合適，先保留','縮短重複句，再實讀','調整換卡或停頓，再實讀','未計時，暫時不能判斷'])}<p id="p4-timing-note" class="small" role="status"></p>`)+
ex('04D 同伴聽一次，留一句真實回饋','45',`<p><strong>相鄰兩組交換：</strong>一邊讀、一邊聽，之後換角色。每人選一項觀察，指出相關台詞並說一句回饋；不用上台或評演技。</p>${choice('peer-status','回饋取得狀態',['已取得同學回饋','已有舊稿回饋；修訂稿未再互評','只做自查','未取得'],'按真正發生的情況選擇。')}<div id="p4-peer-obtained" hidden>${choice('p4-peer-focus','這次回饋主要談哪一項？',['開場是否聽得出產品','產品資料是否符合卡片','結尾問題是否與選購相關'])}${f('peer-feedback','記一句同學實際說的回饋','記實際原話，可由同伴協助輸入；不要照抄例子當成果。','例如對方真的說「我聽到價錢，但未聽清哪種鞋」才記下。',{rows:2})}${choice('peer-decision','你怎樣處理這個回饋？',['修改一處後再實讀','保留原稿','待查證或再測'])}${choice('p4-peer-reason','選一項處理依據',['對方指出的地方確實不清楚','產品卡支持原句，先保留','建議涉及未知資料，不能直接加入','需要再讀或補資料才能判斷','其他，已口頭說明'])}</div><div id="p4-self-only" hidden>${choice('p4-self-check','這次只做了哪項自查？',['自己讀一次，檢查開場是否清楚','對照產品卡，檢查顏色與售價','檢查結尾問題是否相關'])}</div><p id="p4-peer-note" class="small" role="status"></p><details class="reference"><summary>原稿回饋 → 我的修訂 → 新稿是否再測</summary><p>先前回饋仍是修訂依據；新稿沒有再測就如實標示，不必為填滿而重跑整輪。</p><p id="p4-lineage-text" class="m2-archive"></p></details>`)+
ex('04E 這次回饋能支持甚麼？','46',`${choice('feedback-limit','即使同學聽懂價格，仍不能證明甚麼？',['不能證明平台一定推薦或觀眾一定購買','已能證明平台一定推薦','已能證明所有觀眾都會買'],'少量課堂回饋只反映這些同學這次聽到甚麼。')}<button type="button" id="p4-record-check">核對本部分紀錄</button><p id="p4-record-feedback" class="feedback" role="status"></p>${ref('查看改稿前的計時、回饋及AI紀錄',`<p id="p4-archive-text" class="m2-archive">${esc(ctx.get('p4-archive')||'暫無舊版本。')}</p>`)}<p class="notice">修改定稿後，舊計時和回饋會獨立保存；新稿是否再測另記，不把舊結果冒充新測試。網站只核對紀錄齊全，不判讀腳本品質或證明你已理解。</p>`)+'</div>';
}
function bind(context){teardown();ctx=context;const get=ctx.get,set=ctx.setField,el=id=>document.getElementById(id),root=el('p4-root');
let start=null,ms=0,interval=null,runScript='',sample=0,usedSample=-1,lastScript=get('final-script');
const seconds=()=> (ms+(start===null?0:performance.now()-start))/1000;
function showClock(){if(!el('p4-timer-display')){stop();return;}el('p4-timer-display').textContent=seconds().toFixed(1)+' 秒';}
function stop(){if(start!==null){ms+=performance.now()-start;start=null;}if(interval!==null){clearInterval(interval);interval=null;}if(el('p4-timer-display'))el('p4-timer-display').textContent=seconds().toFixed(1)+' 秒';}
teardown=stop;
function archive(ids,title,script=lastScript){const filled=ids.filter(id=>get(id));if(!filled.length)return;set('p4-archive',[get('p4-archive'),`【${title}】\n對應稿：\n${script||'〔版本未核實〕'}\n`+filled.map(id=>`${ctx.fields.get(id)?.label||id}：${get(id)}`).join('\n')].filter(Boolean).join('\n\n'));filled.forEach(id=>set(id,''));}
function display(){
 el('p4-draft-preview').value=get('p4-source-draft')||'';
 el('p4-source-status').textContent=!get('p4-source-draft')?'尚未保存初稿快照；已有舊定稿也不會自動覆蓋。':get('p4-source-draft')!==ctx.draft()?'第03部分初稿已有變動；這裡保留上次帶入的版本。重新帶入會先要求確認。':'已保存帶入時的初稿；修改框的內容由你決定。';
 el('p4-ai-preview').value=aiPrompt();
 el('p4-peer-obtained').hidden=get('peer-status')!=='已取得同學回饋';el('p4-self-only').hidden=get('peer-status')!=='只做自查';
 el('p4-peer-note').textContent=get('peer-status')==='已有舊稿回饋；修訂稿未再互評'?'已保留原稿回饋作修訂依據；修訂稿尚未再互評。':get('peer-status')==='未取得'?'未取得就如實保留，不代填同伴說話。':get('peer-feedback')&&!get('p4-peer-script')?'保留了舊回饋，但對應稿版本未核實；請向同伴核對。':'';
 el('p4-timing-note').textContent=get('p4-timing-status')==='修訂稿未再計時，保留舊稿實讀紀錄'?'舊稿實讀已保留；目前修訂稿未再計時，不沿用舊秒數。':(get('seconds-first')||get('seconds-second'))&&!get('p4-timing-script')?'保留了舊秒數，但對應稿版本未核實；新稿需實讀。':'15秒是目標；超時先看哪一句或動作可縮短，不只加快語速。';
 el('p4-lineage-text').textContent=[get('p4-revision-evidence')||'尚無原稿同伴回饋作修訂依據。',get('p4-timing-origin')||'尚無原稿實讀紀錄。',`目前新稿：\n${get('final-script')||'未填'}`,`新稿互評：${get('peer-status')||'未標示'}；新稿計時：${get('p4-timing-status')||'未標示'}`].join('\n\n');
 el('p4-archive-text').textContent=get('p4-archive')||'暫無舊版本。';
}
function feedback(id,t){el('p4-'+id).textContent=t;}
function resetClock(){stop();ms=0;runScript='';sample++;showClock();}
function changedFinal(){const current=get('final-script');if(current===lastScript)return;
if(get('peer-status')==='已取得同學回饋'&&get('peer-feedback')&&get('p4-peer-script')===lastScript)set('p4-revision-evidence',`原稿版本：\n${lastScript}\n同伴實際原話：${get('peer-feedback')}\n當時決定：${get('peer-decision')||'未選'}\n依據：${get('p4-peer-reason')||'未選'}\n此回饋供修訂參考，不代表修訂稿已互評。`);
if((get('seconds-first')||get('seconds-second'))&&get('p4-timing-script')===lastScript)set('p4-timing-origin',`原稿版本：\n${lastScript}\n第一次${get('seconds-first')||'未測'}秒；第二次${get('seconds-second')||'未測'}秒。修訂稿用時未測。`);
const ids=[...timing,...peer,...ai].filter(id=>!(id==='peer-status'&&get(id)==='已有舊稿回饋；修訂稿未再互評')&&!(id==='p4-timing-status'&&get(id)==='修訂稿未再計時，保留舊稿實讀紀錄'));
archive(ids,'改定稿前的紀錄',lastScript);if(current&&get('p4-revision-evidence'))set('peer-status','已有舊稿回饋；修訂稿未再互評');if(current&&get('p4-timing-origin'))set('p4-timing-status','修訂稿未再計時，保留舊稿實讀紀錄');lastScript=current;resetClock();display();}

function checkAi(){const status=get('p4-ai-status');if(!status||status==='尚未嘗試')return '可選活動尚未完成，沒有當作已操作。';if(status==='未取得')return '已記未取得；可先人手修稿及實讀。';if(!get('p4-ai-sent')||!get('p4-ai-response')||!get('p4-ai-decision'))return '已取得時，請保留實際prompt、真實回答及自己的決定。';return '縮句紀錄已填；仍由你核對資料、選擇方案及實讀。';}
root.addEventListener('input',e=>{const id=e.target.dataset.field;if(!id)return;set(id,e.target.value);if(id==='final-script')changedFinal();else if(id==='p4-ai-line'){archive(ai.filter(x=>x!=='p4-ai-line'),'更換縮句原句前的AI紀錄',get('final-script'));display();}else if(id==='seconds-first'||id==='seconds-second'){if(get('final-script')&&get(id)&&Number(get(id))>0&&Number.isFinite(Number(get(id)))){set('p4-timing-script',get('final-script'));set('p4-timing-status','已實際讀劇計時');}display();}else if(id==='peer-feedback'){if(get('final-script')&&get(id))set('p4-peer-script',get('final-script'));display();}});
let previousPeer=get('peer-status');
root.addEventListener('change',e=>{const id=e.target.dataset.field;if(!id)return;set(id,e.target.value);if(id==='final-script')changedFinal();if(id==='peer-status'){if(previousPeer==='已取得同學回饋'&&get(id)!==previousPeer)archive(peer.filter(x=>x!=='peer-status'&&x!=='feedback-limit'),'切換回饋狀態前紀錄',get('p4-peer-script')||get('final-script'));previousPeer=get(id);}if(id==='p4-timing-status'&&get(id)==='未計時，已口頭告訴老師原因'){archive(timing.filter(x=>x!=='p4-timing-status'),'改為未計時前的紀錄',get('p4-timing-script')||get('final-script'));}display();});
root.addEventListener('click',async e=>{const button=e.target.closest('button');if(!button)return;switch(button.id){
case'p4-demo-check':feedback('demo-feedback',!get('p4-demo-choice')?'先選一句。':get('p4-demo-choice')==='B'?'B直接說出低筒運動鞋與399元；資料較具體仍不能保證推薦。':'再聽哪句直接說了鞋款及售價。');break;
case'p4-bring':{
const needed=[1,2,3].flatMap(n=>['draft-visual-'+n,'draft-line-'+n]);if(needed.some(id=>!get(id))||!get('rhythm')){ctx.note('先到第03部分完成三段畫面、台詞及節奏。');return;}
if(get('final-script')&&!confirm('重新帶入會覆蓋修改框，並把現有稿及紀錄保存至舊版本。要繼續嗎？'))return;
if(get('final-script')){archive([...timing,...peer,...ai,'p4-revision-evidence','p4-timing-origin','revision-reason','p4-revision-target','p4-revision-action'],'重新帶入前的稿及紀錄',get('final-script'));if(!get('p4-archive').includes(get('final-script')))set('p4-archive',get('p4-archive')+'\n\n【重新帶入前的定稿】\n'+get('final-script'));}
set('p4-source-draft',ctx.draft());set('p4-source-purpose',get('purpose'));set('final-script',ctx.draft());lastScript=get('final-script');resetClock();display();ctx.note('已保存初稿快照；現在人手改一處，或選有依據保留。');break;}
case'p4-timer-start':if(!get('final-script')){ctx.note('先保留實際要讀的稿，再開始計時。');return;}if(start===null){if(!runScript)runScript=get('final-script');if(runScript!==get('final-script'))resetClock();runScript=get('final-script');start=performance.now();interval=setInterval(showClock,50);}break;
case'p4-timer-stop':stop();break;
case'p4-timer-reset':resetClock();break;
case'p4-use-first':case'p4-use-second':{
if(start!==null){ctx.note('先停止計時，再記入秒數。');return;}if(ms<50||Number(seconds().toFixed(1))<=0||runScript!==get('final-script')){ctx.note('先用目前的稿實際計時，不能把0秒或舊稿用時記入。');return;}if(usedSample===sample){ctx.note('這次讀劇已記入；請重設並重新實讀，才記另一次。');return;}
const id=button.id==='p4-use-first'?'seconds-first':'seconds-second';if(id==='seconds-second'&&!get('seconds-first')){ctx.note('先記第一次實讀；第二次要重新實讀。');return;}if(get(id)&&!confirm('要用剛才實讀的秒數取代這欄嗎？'))return;
set(id,seconds().toFixed(1));set('p4-timing-status','已實際讀劇計時');set('p4-timing-script',runScript);usedSample=sample;display();ctx.note('已記入實際秒數；若再測，先重設。');break;}
case'p4-ai-copy-button':if(!get('final-script')||!get('p4-ai-line')||!get('final-script').includes(get('p4-ai-line'))){ctx.note('先從目前定稿複製一句到縮句原句欄。');return;}set('p4-ai-copy',aiPrompt());set('p4-ai-script',get('final-script'));await ctx.copyText(aiPrompt());break;
case'p4-ai-confirm':if(!get('p4-ai-copy')||get('p4-ai-copy')!==aiPrompt()){ctx.note('先複製目前版本，到AI原封不動送出後才確認。');return;}set('p4-ai-sent',get('p4-ai-copy'));set('p4-ai-script',get('final-script'));ctx.note('已保存你確認送出的版本；回答狀態仍按實際選。');break;
case'p4-ai-check':feedback('ai-feedback',checkAi());break;
case'p4-record-check':{
const missing=['final-script','p4-revision-target','p4-revision-action','revision-reason','p4-timing-status','timing-change','peer-status','feedback-limit'].filter(id=>!get(id));
if((get('p4-timing-status')==='已實際讀劇計時'||get('seconds-first'))&&(!get('seconds-first')||!Number.isFinite(Number(get('seconds-first')))||Number(get('seconds-first'))<=0))missing.push('第一次實測秒數');
if(get('seconds-second')&&(!Number.isFinite(Number(get('seconds-second')))||Number(get('seconds-second'))<=0))missing.push('第二次秒數須大於0');
if(get('peer-status')==='已取得同學回饋')for(const id of ['p4-peer-focus','peer-feedback','peer-decision','p4-peer-reason'])if(!get(id))missing.push(id);
if(get('peer-status')==='已有舊稿回饋；修訂稿未再互評'&&!get('p4-revision-evidence'))missing.push('原稿回饋依據');
if(get('p4-timing-status')==='修訂稿未再計時，保留舊稿實讀紀錄'&&!get('p4-timing-origin'))missing.push('原稿實讀紀錄');
if(get('peer-status')==='只做自查'&&!get('p4-self-check'))missing.push('自查項目');
feedback('record-feedback',missing.length?'還有紀錄未填或秒數無效；請核對修稿選項、實際讀劇及回饋狀態。':get('feedback-limit')!=='不能證明平台一定推薦或觀眾一定購買'?'再核對結論範圍：這些同學的回饋，不能保證平台或所有觀眾的反應。':((get('seconds-first')&&!get('p4-timing-script'))||(get('peer-feedback')&&!get('p4-peer-script')))?'欄位已填，但部分舊紀錄的稿版本未核實；請先核對或重測。':'必要紀錄已填；這不代表網站已判定腳本品質。未計時／未互評仍按所選狀態記錄。');break;}
}});display();showClock();
}
window.PartFour={create,bind,aiPrompt};
})();
