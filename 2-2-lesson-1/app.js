(function(){
'use strict';
const KEY='apl-22-lesson1-v1';
const parts=[['01','相似推薦與排序'],['02','數據、AI與資訊缺口'],['03','老師示範AI腳本'],['04','審稿與發布判斷'],['05','資料核對與留言回覆']];
const fields=new Map();
let values={},active=0,storageOK=true,timerStart=0,timerElapsed=0,timerInterval=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{const stored=JSON.parse(localStorage.getItem(KEY)||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))values=stored;}catch{storageOK=false;}
function field(id,label,hint,example,{type='textarea',options=[],rows=3,cls=''}={}){
  fields.set(id,{id,label,part:active,type});
  const h=`<details class="hint" id="hint-${id}"><summary>提示與例句</summary><p>${esc(hint)}</p><p class="example">例：${esc(example)}</p></details>`;
  let input;
  if(type==='select')input=`<select id="${id}" data-field="${id}" aria-describedby="hint-${id}"><option value="">請選擇</option>${options.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>`;
  else if(type==='number'||type==='text')input=`<input id="${id}" data-field="${id}" type="${type}" ${type==='number'?'step="any"':''} aria-describedby="hint-${id}" autocomplete="off">`;
  else input=`<textarea id="${id}" data-field="${id}" rows="${rows}" class="${cls}" aria-describedby="hint-${id}" spellcheck="false"></textarea>`;
  return `<div class="field"><label for="${id}">${esc(label)}</label>${input}${h}</div>`;
}
const select=(id,label,h,e,options)=>field(id,label,h,e,{type:'select',options});
const ref=(title,body)=>`<details class="reference"><summary>${title}</summary>${body}</details>`;
const ex=(title,slides,body)=>`<details class="exercise activity-step"><summary><span class="exercise-meta">PPT ${slides} · ${active===2||active===3?'觀看示範／個人判斷':'個人作答'}</span><strong>${title}</strong></summary><div class="activity-body">${body}</div></details>`;
const check=(id,label='核對這一題')=>`<div class="check-row"><button type="button" data-check="${id}"><i data-lucide="check"></i>${label}</button><span id="feedback-${id}" class="feedback" role="status"></span></div>`;
const scores=(prefix,labels)=>`<div class="table-wrap"><table class="score-table"><caption>各項條件只算一次；同分按編號由小至大。</caption><thead><tr><th>內容／題材</th>${labels.map(l=>`<th>${esc(l[1])}</th>`).join('')}</tr></thead><tbody>${[['V01','運動'],['V02','穿搭'],['V03','學習'],['V04','運動']].map(([v,t],i)=>`<tr><th scope="row">${v}／${t}</th>${labels.map(([key,name])=>`<td>${field(`${prefix}-${key}-${i}`,`${name} ${v}分數`,'把興趣、曾看完、不感興趣三項分數相加。','符合興趣及曾看完：3＋2＋0＝5。',{type:'number'})}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const product=`<div class="product"><div><h4>山角校園用品店（虛構）</h4><ul><li>低筒學生運動鞋</li><li>黑色、白色兩種</li><li>每對 HK$399</li><li>讀者：香港中學生</li></ul><p><strong>未提供：</strong>尺碼、庫存、優惠、送貨、退換、實測防滑或其他功效。</p></div><figure><img src="assets/fictional-shoes.png" alt="AI生成的黑白低筒運動鞋虛構示意" width="800" height="600"><figcaption>AI生成虛構商品示意，不是商品或功效證據。</figcaption></figure></div>`;
const templates=[
()=>ex('01A 行為是線索，不是結論','4–7',`<p>阿晴今天看了3條跑步影片，其中2條完整看完、1條收藏。這是虛構資料。</p>${field('observation','你直接看到的行為','只寫卡上有的紀錄，先不猜身分。','她看完了其中2條跑步影片。')}${field('inference','你的推測及依據','用「可能」，並說明引用哪項行為。','她可能對跑步有興趣，因為她收藏了其中1條。')}${field('alternative','另一種解釋與仍不能確定的事','同一行為可能有別的原因。','她也可能為功課找資料，所以不能確定她每天跑步。')}${ref('作答後看參考方向','<p>合理推測不只一個。要分開已看到的行為、推測及未知；不能由觀看直接確定跑手身分或購買意願。</p>')}`)+
ex('01B 親手為內容排序','8–14',`<p><strong>教師假規則，並非真實平台權重：</strong>符合興趣＋3；曾看完同題材＋2；不感興趣題材−4；其他0。</p><div class="table-wrap"><table><thead><tr><th>內容</th><th>題材</th></tr></thead><tbody><tr><td>V01 運動鞋整理方法</td><td>運動</td></tr><tr><td>V02 校服外套配搭</td><td>穿搭</td></tr><tr><td>V03 考試筆記整理</td><td>學習</td></tr><tr><td>V04 跑步熱身介紹</td><td>運動</td></tr></tbody></table></div><p>甲：興趣運動／曾看完運動／不感興趣學習。<br>乙：興趣穿搭／曾看完學習／不感興趣運動。</p>${scores('sort',[['a','甲'],['b','乙']])}<div class="two-col">${field('rank-a','甲的排序','由高分到低分，寫四個編號。','格式：V01、V04、V02、V03。',{type:'text'})}${field('rank-b','乙的排序','同分按編號小的先。','格式：V02、V03、V01、V04。',{type:'text'})}</div>${field('score-reason','自己解釋其中一列','說出哪項加分或減分，以及哪項不符合。','甲的V01符合興趣及曾看完，因此3＋2＝5。')}${check('sort','核對分數及排序')}<p class="small">兩人可各算一個角色，再交換解釋；每人仍保留自己的理由。</p>`)+
ex('01C 只改一項，重新推算','15–16',`<p>只把甲的「興趣」改成穿搭；曾看完運動、不感興趣學習不變。</p>${scores('change',[['a','新甲']])}${field('rank-change','新的排序','不要把沒有改的欄位也重設。','例如先算V01還有沒有「曾看完」的加分。',{type:'text'})}${field('change-reason','為甚麼第一名改變？這能證明真平台嗎？','指出變了的規則，並說明活動界線。','V02得到興趣加分；這只能解釋課堂假規則，不能推算真實推薦。')}${check('change','核對變式')}`),
()=>ex('02A 數量、比例，還是意向？','17',`<div class="three-col">${select('type-count','30次讚好','想想有沒有分母，或是否只是打算做。','次數是在數有多少次。',['數量','比例','意向'])}${select('type-ratio','40%完整播放','比例需要清楚分母及統計口徑。','完整播放佔全部播放的百分比。',['數量','比例','意向'])}${select('type-intent','我覺得自己會看完','有沒有真的記錄完成觀看？','「我打算」描述尚未發生的意向。',['數量','比例','意向'])}</div>${check('types','核對分類')}`)+
ex('02B 用正確分母計算','18–20',`<div class="table-wrap"><table><caption>教師虛構資料；播放次數不等於不同觀眾人數。</caption><thead><tr><th>短片</th><th>播放次數</th><th>完整播放次數</th><th>讚好次數</th></tr></thead><tbody><tr><th>P</th><td>100</td><td>60</td><td>20</td></tr><tr><th>Q</th><td>200</td><td>80</td><td>30</td></tr></tbody></table></div><p class="callout">完整播放次數 ÷ 播放次數 × 100%</p><div class="three-col">${field('denominator','Q的分母','分母是這次比較的全部播放，不是讚好。','小例子：5次完整／10次播放，分母是10。',{type:'number'})}${field('q-percent','Q完整播放比例（%）','先相除，再乘100。','小例子：5÷10×100%＝50%。',{type:'number'})}${field('p-percent','P完整播放比例（%）','用P自己的播放次數作分母。','不要用Q的200替P計算。',{type:'number'})}</div>${field('metric-comparison','用一句話比較，並說明分母','先說比較哪個指標，不籠統說全部較好。','Q讚好次數較多，但P完整播放比例較高。')}${check('metrics','核對算式')}`)+
ex('02C 8位說想看完，可以當80%完成率？','21–24',`${select('intention-answer','你的判斷','先問有沒有實際播放及完整播放紀錄。','受訪者表態與實際觀看是兩種資料。',['可以直接稱平台完成率80%','不可以，只是這10人的意向'])}${field('intention-reason','記了甚麼、仍欠甚麼？','不是否定意向，而是命名要準確。','這次記了8人想看完，仍欠實際播放與完整播放次數。')}${field('check-behaviour','收藏跑步片，能否確定是跑手？加一句理由。','回想一個可能的其他原因。','不能確定，也可能是為功課找資料。')}${field('check-weights','＋3、＋2、−4是真實平台權重嗎？加一句理由。','這組數字從哪裡來？','不是，它們是教師用來解釋排序的假規則。')}${ref('完成後看核對方向','<p>意向不是實際完成率。收藏不能確定跑手身分；課堂權重不是平台公式。Q的比例40%，分母200次播放。</p>')}`)+
ex('02D 缺甚麼資訊？向誰補？','26–27',`<div class="table-wrap"><table><thead><tr><th>虛構清單A</th><th>虛構清單B</th></tr></thead><tbody><tr><td>新色介紹</td><td>款式介紹</td></tr><tr><td>開箱讚賞</td><td>尺碼選擇問題</td></tr><tr><td>穿搭展示</td><td>不同預算考量</td></tr><tr><td>另一則開箱讚賞</td><td>未提供商品資料的提醒</td></tr></tbody></table></div>${field('information-gap','如果只看A，還欠甚麼？','挑一項真正影響選購的未知。','大家說好看，仍不知道有沒有適合自己的尺碼。')}${field('information-source','你會找甚麼來源補充？為甚麼？','來源要能回答你的缺口；商品是虛構，不用真的購物。','我會向店舖查尺碼表，因為開箱讚賞回答不了尺寸。')}${ref('回音室：簡單說明及界線','<p>相近觀點反覆流通、被強化，不同聲音較少出現。兩張虛構清單只能練習找資訊缺口，不能單憑它們證明回音室、偏見或算法因果。</p>')}<p class="source">概念來源：<a href="https://pmc.ncbi.nlm.nih.gov/articles/7936330/" target="_blank" rel="noopener">The echo chamber effect on social media（2021）</a></p>`),
()=>'',()=>'',()=>''
];
function note(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('visible');clearTimeout(note.id);note.id=setTimeout(()=>t.classList.remove('visible'),3800);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(values));storageOK=true;}catch{storageOK=false;}updateSave();}
function updateSave(){document.getElementById('save-state').textContent=storageOK?'答案保存在此瀏覽器，不是已提交':'本機儲存未成功；請下載或複製紀錄保留';}
const get=id=>String(values[id]??'').trim();
function draft(){return window.PartFour.draft();}
function buildPrompt(){return window.PartThree.prompt;}
function followup(){return '只調整說法，不新增產品卡資料；最多提供兩個短句方案。';}

function syncDerived(){const p=document.getElementById('prompt-output');if(p)p.value=buildPrompt();const f=document.getElementById('followup-output');if(f)f.value=followup();const d=document.getElementById('draft-preview');if(d)d.value=draft();}
function syncDownloadVisibility(){const last=active===parts.length-1;document.getElementById('download-all').hidden=!last;document.getElementById('export-status').hidden=!last;}
function render(){stopTimer();const index=parts.findIndex(p=>p[0]===location.hash.replace('#',''));active=index<0?0:index;document.getElementById('part-nav').innerHTML=parts.map(([n,t],i)=>`<a class="part-link" href="#${n}" ${active===i?'aria-current="page"':''}><span>${n}</span>${t}</a>`).join('');document.getElementById('main').innerHTML=`<span class="section-number">PART ${parts[active][0]}</span><h2>${parts[active][1]}</h2><p class="part-description">${['不同人為何看到相似內容？先猜、問AI，再算一張及親手排序。','先看數據、親自問AI，再改一個數字追問；休息後找出買前缺少的資料。','分清生成與推薦；看老師由簡單指令補上要求，再由你選改一個目的，觀察AI輸出。','你是帳戶編輯：審核貼文、按店舖新資料修正發布判斷，再選合適的成效紀錄。','先判斷推薦說法有沒有資料支持，再用一次Gemini協助核對；選顧客留言回覆，組成發布決定卡。'][active]}</p><p class="activity-guide">一次做一個小活動；按活動標題開啟下一項。展開不代表已完成。</p><p class="privacy-note">按自己的判斷作答；使用虛構例子，不填姓名、帳號或私人對話。作答後再核對。</p>${templates[active]()}<details class="record-fallback"><summary>查看／複製全堂文字紀錄</summary><label for="record-text" class="small">下載未成功時可保留以下文字（唯讀）</label><textarea id="record-text" readonly class="long"></textarea><button type="button" id="copy-record"><i data-lucide="copy"></i>複製文字紀錄</button></details>`;document.querySelectorAll('[data-field]').forEach(el=>el.value=typeof values[el.dataset.field]==='string'?values[el.dataset.field]:'');document.getElementById('previous').disabled=active===0;document.getElementById('next').disabled=active===4;syncDownloadVisibility();updateSave();syncDerived();updateTimerDisplay();refreshRecord();if(window.lucide)lucide.createIcons();}
// Each revised activity module shares the existing storage and export helpers.
templates[0]=()=>window.PartOne.create({get,fields,field,select,ex,ref,esc});
templates[1]=()=>window.PartTwo.create({get,fields,field,select,ex,ref,esc});
templates[2]=()=>window.PartThree.create({get,fields,field,select,ex,ref,esc});
templates[3]=()=>window.PartFour.create({get,fields,field,select,ex,ref,esc});
templates[4]=()=>window.PartFive.create({get,fields,field,select,ex,ref,esc,draft});
const activityOpen={};
function setupActivities(){const steps=[...document.querySelectorAll('details.activity-step')];steps.forEach((step,i)=>step.open=i===(activityOpen[active]??0));}
document.addEventListener('toggle',e=>{if(!e.target.matches?.('details.activity-step')||!e.target.open)return;const steps=[...document.querySelectorAll('details.activity-step')];activityOpen[active]=steps.indexOf(e.target);steps.forEach(step=>{if(step!==e.target)step.open=false;});},true);
const renderWorkshop=render;
render=function(){
  renderWorkshop();
  setupActivities();
  if(active===0)window.PartOne.bind({get,fields,setField,note,copyText});
  if(active===1)window.PartTwo.bind({get,fields,setField,note,copyText});
  if(active===2)window.PartThree.bind({get,fields,setField,note,copyText,buildPrompt,followup,draft});
  if(active===3)window.PartFour.bind({get,fields,setField,note,copyText,draft});
  if(active===4)window.PartFive.bind({get,fields,setField,note,copyText,draft,esc});
};
// Register every field once, even before a student has visited its part.
for(let i=0;i<parts.length;i++){active=i;templates[i]();}active=0;
function record(indices){
 const lines=['# 2.2 第1堂 演算法點選中你？','學習紀錄；下載不等於提交。','未填欄位如實標示，不代表已完成或已學會。',''];
 for(const i of indices){
  lines.push(`## 第${parts[i][0]}部分 ${parts[i][1]}`);
  for(const f of fields.values())if(f.part===i)lines.push(f.label+'：',get(f.id)||'〔未填〕','');
  if(i===4)lines.push('發布決定卡版本核對：',window.PartFive.briefVersion(),'');
  if(i===0){
   const old=['observation','inference','alternative','score-reason','rank-a','rank-b','rank-change','change-reason',...['sort-a','sort-b','change-a'].flatMap(p=>[0,1,2,3].map(n=>p+'-'+n))];
   const filled=old.filter(id=>get(id));
   if(filled.length){lines.push('舊版第一部分答案（保留，不代入新版完成狀態）：');for(const id of filled)lines.push(id+'：'+get(id));lines.push('');}
  }
  if(i===2)lines.push('教師示範prompt（不代表學生個人操作或已送出）：',buildPrompt(),'第1輪簡單指令：',window.PartThree.simple,'第3輪修改指令（不代表已送出）：',window.PartThree.changePrompt(),'');
 }
 return lines.join('\n');
}
function refreshRecord(){const el=document.getElementById('record-text');if(el)el.value=record([0,1,2,3,4]);}
document.addEventListener('input',e=>{const id=e.target.dataset.field;if(!id)return;values[id]=e.target.value;save();syncDerived();refreshRecord();});
document.addEventListener('change',e=>{const id=e.target.dataset.field;if(!id)return;values[id]=e.target.value;save();syncDerived();refreshRecord();});
function ranks(id){return get(id).toUpperCase().match(/V0[1-4]/g)?.join(',')||'';}
function runCheck(kind){let result='';if(kind==='sort'||kind==='change'){const checks=kind==='sort'?[['sort-a',[5,0,-4,5]],['sort-b',[-4,3,2,-4]]]:[['change-a',[2,3,-4,2]]];const missing=[],wrong=[];for(const [prefix,expected]of checks)expected.forEach((v,i)=>{const id=prefix+'-'+i;if(get(id)==='')missing.push(id);else if(Number(get(id))!==v)wrong.push(`${id.includes('-b-')?'乙':'甲'} V0${i+1}`);});const rankChecks=kind==='sort'?[['rank-a','V01,V04,V02,V03'],['rank-b','V02,V03,V01,V04']]:[['rank-change','V02,V01,V04,V03']];for(const[id,exp]of rankChecks){if(!get(id))missing.push(id);else if(ranks(id)!==exp)wrong.push(fields.get(id).label);}result=missing.length?`還有${missing.length}個分數／排序未填。先完成再核對。`:wrong.length?'請再檢查：'+wrong.join('、')+'。逐項對照規則；同分按編號。':'分數與排序符合課堂假規則。再檢查你自己的理由；這不是真實平台公式。';}else if(kind==='types'){const ids=['type-count','type-ratio','type-intent'];result=ids.some(id=>!get(id))?'先為三項資料選類別。':ids.every((id,i)=>get(id)===['數量','比例','意向'][i])?'分類相符：數量／比例／意向。請用自己的話解釋其中一項。':'再想想：次數有沒有分母？「會看完」是否已有實際完成紀錄？';}else if(kind==='metrics'){const ids=['denominator','q-percent','p-percent'];result=ids.some(id=>!get(id))?'先填分母及兩個比例。':ids.every((id,i)=>Number(get(id))===[200,40,60][i])?'算式相符：Q 80÷200＝40%；P 60÷100＝60%。記得另寫比較及分母理由。':'再核對分母：Q的全部播放200次，P的全部播放100次。讚好不是這條公式的分母。';}else if(kind==='claim')result=!get('claim-choice')?'先選一句。':get('claim-choice')==='黑／白兩色，每對HK$399'?'這句符合產品卡。未知資料可改成問題，不可代店舖承諾。':'這句含產品卡未提供的資料；請找只用已知顏色及售價的一句。';document.getElementById('feedback-'+kind).textContent=result;}
async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);note('已複製。');return;}}catch{}const box=document.createElement('textarea');box.value=text;box.style.position='fixed';box.style.top='0';box.style.left='0';document.body.append(box);box.select();let ok=false;try{ok=document.execCommand('copy');}catch{}box.remove();if(ok)note('已複製。');else note('瀏覽器未允許複製，請選取唯讀文字框中的文字手動複製。');}
function stopTimer(){if(timerStart){timerElapsed+=performance.now()-timerStart;timerStart=0;}if(timerInterval){clearInterval(timerInterval);timerInterval=null;}updateTimerDisplay();}
function elapsed(){return (timerElapsed+(timerStart?performance.now()-timerStart:0))/1000;}
function updateTimerDisplay(){const d=document.getElementById('timer-display');if(d)d.textContent=elapsed().toFixed(1)+' 秒';}
function setField(id,value){values[id]=value;const el=document.getElementById(id);if(el)el.value=value;save();refreshRecord();}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.check){runCheck(b.dataset.check);return;}switch(b.id){case'previous':if(active>0)location.hash=parts[active-1][0];break;case'next':if(active<4)location.hash=parts[active+1][0];break;case'copy-record':await copyText(record([0,1,2,3,4]));break;case'download-all':if(active===parts.length-1)await download();break;case'clear':document.getElementById('clear-dialog').showModal();break;case'cancel-clear':document.getElementById('clear-dialog').close();break;case'confirm-clear':try{localStorage.removeItem(KEY);values={};stopTimer();timerElapsed=0;document.getElementById('clear-dialog').close();render();note('已清除本機本堂紀錄。');}catch{note('瀏覽器未允許清除儲存；現有答案未改動。');}break;}});
async function pdfBytes(text,title){if(!window.PDFLib)throw Error('PDF程式庫未載入');await document.fonts.ready;const doc=await PDFLib.PDFDocument.create();const canvas=document.createElement('canvas');const W=794,H=1123,M=54;canvas.width=W*2;canvas.height=H*2;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas不可用');ctx.scale(2,2);const font=(size,bold)=>`${bold?700:400} ${size}px "Microsoft JhengHei","Noto Sans TC",sans-serif`;const rows=[];for(const line of text.replace(/\r\n?/g,'\n').split('\n')){const heading=/^#{1,2} /.test(line),size=line.startsWith('# ')?20:heading?17:14;const value=line.replace(/^#{1,2} /,'');ctx.font=font(size,heading);let current='';for(const char of Array.from(value)){if(current&&ctx.measureText(current+char).width>W-M*2){rows.push({text:current,size,heading});current=char;}else current+=char;}rows.push({text:current,size,heading});}const pages=[[]];let y=90;rows.forEach((r,i)=>{const step=r.text?r.size+8:10,reserve=r.heading?step+(rows[i+1]?.size||14)+8:step;if(y+reserve>H-70){pages.push([]);y=90;}pages.at(-1).push({...r,y});y+=step;});for(let i=0;i<pages.length;i++){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#000';ctx.textBaseline='top';ctx.font=font(12,false);ctx.fillText(title,M,36);for(const row of pages[i]){ctx.font=font(row.size,row.heading);ctx.fillText(row.text,M,row.y);}ctx.font=font(12,false);ctx.fillText(`${i+1} / ${pages.length}`,M,H-40);const jpg=await doc.embedJpg(canvas.toDataURL('image/jpeg',.94));const p=doc.addPage([595.28,841.89]);p.drawImage(jpg,{x:0,y:0,width:595.28,height:841.89});}canvas.width=canvas.height=0;doc.setTitle(title);doc.setSubject('本機學習紀錄；下載不等於提交。');return doc.save();}
async function download(){const indices=[0,1,2,3,4],suffix='全堂';save();refreshRecord();const title=`2.2第1堂 ${suffix} 學習紀錄`;const status=document.getElementById('export-status');const buttons=[document.getElementById('download-all')];buttons.forEach(b=>b.disabled=true);status.textContent='正在產生全堂PDF（五部分），答案不會上傳。';try{const text=record(indices),bytes=await pdfBytes(text,title),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`2.2_第1堂_${suffix}_學習紀錄.pdf`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='已發出PDF下載請求；請確認收到檔案，再按教師指定方式提交。';}catch(error){status.textContent='PDF未能產生；請展開下方全堂文字紀錄保留五部分答案。';const area=document.querySelector('.record-fallback');area.open=true;document.getElementById('record-text').value=record(indices);console.error('PDF export failed',error);}finally{buttons.forEach(b=>b.disabled=false);}}
window.addEventListener('hashchange',()=>{render();document.getElementById('main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});});
render();
})();
