(function(root){
'use strict';
const slots=[
 {id:'role',label:'Role 角色',hint:'AI以甚麼身份協助你？'},
 {id:'task',label:'Task 任務',hint:'AI要完成甚麼工作？'},
 {id:'context',label:'Context 背景',hint:'AI需要先知道甚麼資料或情境？'},
 {id:'constraint',label:'Constraint 限制',hint:'AI必須遵守甚麼規則或界線？'}
];
const definitions={
 analysis:{title:'分析指令A',cards:[
  {id:'a1',slot:'context',text:'以下是7-Eleven Hong Kong官方YouTube帳戶六則影片的公開頁面快照，觀察日期2026年10月26日。這六則不是六個獨立企劃，Y01及Y02是同一周年企劃的不同版本。'},
  {id:'a2',slot:'constraint',text:'只按附表分析，不上網補數字。每1000次觀看對應的讚好數保留四位小數，並說明公式；這是公開計數比值，不是完整互動率或購買轉換率。comments_status為disabled時，comments留空，不當成0。不要聲稱這是隨機實驗，不推論投放費用、自然流量、觀看完成率、創意因果或銷售。'},
  {id:'a3',slot:'role',text:'你是一名社交媒體數據分析助理，協助學生整理及核對公開數據。'},
  {id:'a4',slot:'task',text:'1. 按觀看數排序，再按讚好數排序，指出第一名是否相同。\n2. 比較Y01與Y02：列出觀看、讚好及留言的實際數字；計算每1000次觀看對應的讚好數。\n3. 指出Y04與Y05的留言狀態有何不同。\n4. 用最多三句：一項有數據支持的觀察、一項不能從資料知道的事，以及下一輪建議補收的資料。'}
 ]},
 follow:{title:'追問指令B',cards:[
  {id:'b1',slot:'task',text:'列出支持待查句子的原始數字或公式。如果涉及原因或建議，說明還欠甚麼證據。必要時提出較準確的修正。'},
  {id:'b2',slot:'role',text:'你是一名數據分析覆核員，負責檢查說法是否有證據支持。'},
  {id:'b3',slot:'constraint',text:'只根據已提供的資料核對，不編造數字或原因。資料不足的部分保留未知，分清觀察與推測。'},
  {id:'b4',slot:'context',text:'你正在覆核上一輪AI對7仔六則影片的分析，沿用2026年10月26日的資料快照。待查原句：「貼上實際原句」。'}
 ]}
};
function empty(){return {placements:Object.fromEntries(slots.map(s=>[s.id,null])),checks:0,completedAt:null};}
function blank(){return Object.fromEntries(Object.keys(definitions).map(id=>[id,empty()]));}
function correct(id,state){return slots.every(s=>definitions[id].cards.find(c=>c.id===state?.placements?.[s.id])?.slot===s.id);}
function unlocked(id,state){return Boolean(state?.completedAt&&correct(id,state));}
function normalize(raw){const out=blank();for(const id of Object.keys(out)){const incoming=raw?.[id],seen=new Set();if(!incoming)continue;for(const s of slots){const card=incoming.placements?.[s.id];if(definitions[id].cards.some(c=>c.id===card)&&!seen.has(card)){out[id].placements[s.id]=card;seen.add(card);}}out[id].checks=Number.isSafeInteger(incoming.checks)?Math.max(0,Math.min(100000,incoming.checks)):0;if(typeof incoming.completedAt==='string'&&Number.isFinite(Date.parse(incoming.completedAt))&&correct(id,out[id]))out[id].completedAt=incoming.completedAt;}return out;}
function place(id,state,cardId,slot){if(!definitions[id]||!slots.some(s=>s.id===slot)||!definitions[id].cards.some(c=>c.id===cardId))return false;if(state.placements[slot]===cardId)return false;for(const s of slots)if(state.placements[s.id]===cardId)state.placements[s.id]=null;state.placements[slot]=cardId;state.completedAt=null;return true;}
function check(id,state,now=new Date().toISOString()){state.checks++;const wrong=slots.filter(s=>definitions[id].cards.find(c=>c.id===state.placements[s.id])?.slot!==s.id).map(s=>s.id);state.completedAt=wrong.length?null:now;return wrong;}
function build(id,quote=''){return slots.map(s=>{let text=definitions[id].cards.find(c=>c.slot===s.id).text;if(id==='follow'&&quote.trim())text=text.replace('貼上實際原句',quote.trim());return `[${s.label}]\n${text}`;}).join('\n\n');}
const api={slots,definitions,empty,blank,correct,unlocked,normalize,place,check,build};
if(typeof module!=='undefined')module.exports=api;root.PromptKit=api;
if(root.LAB_DATA){root.LAB_DATA.promptA=build('analysis');root.LAB_DATA.promptB=build('follow');}
})(typeof globalThis!=='undefined'?globalThis:this);
