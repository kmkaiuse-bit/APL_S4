(function(root){
 'use strict';
 const RECORD_NAME='learning-record.json';
 function blocks(record){const dom=new DOMParser().parseFromString(root.LabCore.report(record),'text/html'),out=[];function walk(node){if(node.nodeType!==1)return;const tag=node.tagName;if(['STYLE','SCRIPT'].includes(tag))return;if(['H1','H2','H3','P','PRE','DT','DD'].includes(tag)){out.push({kind:tag,text:node.textContent.replace(/\r\n?/g,'\n')});return;}for(const child of node.children)walk(child);}walk(dom.body);return out;}
 async function create(record){
  if(!root.PDFLib)throw Error('PDF程式庫未載入，請重新整理後再試。');
  await document.fonts.ready;const doc=await PDFLib.PDFDocument.create(),W=794,H=1123,M=54,bottom=H-68;
  const canvas=document.createElement('canvas');canvas.width=W*2;canvas.height=H*2;const ctx=canvas.getContext('2d');if(!ctx)throw Error('瀏覽器未能建立PDF畫面。');ctx.scale(2,2);ctx.textBaseline='top';
  const font=(size,bold)=>`${bold?700:400} ${size}px "Microsoft JhengHei","Noto Sans TC",sans-serif`,segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('zh-Hant',{granularity:'grapheme'}):null;
  const rows=[];
  for(const block of blocks(record)){const size=block.kind==='H1'?22:block.kind==='H2'?19:15,bold=['H1','H2','H3','DT'].includes(block.kind);ctx.font=font(size,bold);let first=true;
   for(const line of block.text.replace(/\t/g,'    ').split('\n')){const chars=segmenter?[...segmenter.segment(line)].map(s=>s.segment):Array.from(line);let text='';for(const char of chars){if(text&&ctx.measureText(text+char).width>W-M*2){rows.push({text,size,bold,step:size+9,section:first&&block.kind==='H2'});first=false;text=char;}else text+=char;}rows.push({text,size,bold,step:text?size+9:12,section:first&&block.kind==='H2'});first=false;}rows.push({text:'',size:15,bold:false,step:7,section:false});
  }
  const sheets=[[]];let y=86;
  for(let i=0;i<rows.length;i++){const row=rows[i];let reserve=row.step;if(row.bold){for(let j=i+1;j<rows.length;j++){reserve+=rows[j].step;if(rows[j].text&&!rows[j].bold)break;}}if((row.section&&sheets.at(-1).length)||(y+reserve>bottom&&sheets.at(-1).length)){sheets.push([]);y=86;}if(!row.text&&y===86)continue;sheets.at(-1).push({...row,y});y+=row.step;}
  const header='2.2 第2堂｜7仔社交影片分析紀錄';
  try{for(let i=0;i<sheets.length;i++){ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#222';ctx.font=font(12,false);ctx.fillText(header,M,34);for(const row of sheets[i]){ctx.font=font(row.size,row.bold);ctx.fillText(row.text,M,row.y);}ctx.font=font(12,false);ctx.fillText(`${i+1} / ${sheets.length}　下載不等於CMS已提交`,M,H-40);const image=await doc.embedJpg(canvas.toDataURL('image/jpeg',.93));const page=doc.addPage([595.28,841.89]);page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});}
   await doc.attach(new TextEncoder().encode(JSON.stringify(record)),RECORD_NAME,{mimeType:'application/json',description:'本堂原始學習紀錄，供教師工具匯入；不代表已提交或已驗證。'});
   doc.setTitle(header);doc.setSubject('四段主要任務、個人初答、核對後修訂及選做Bonus；附原始紀錄。');doc.setCreator('HKIT APL S4 本機互動站');return await doc.save();
  }finally{canvas.width=canvas.height=0;}
 }
 async function read(bytes){
  if(!root.PDFLib)throw Error('PDF程式庫未載入。');const {PDFDocument,PDFName,PDFDict,PDFArray,PDFRawStream,decodePDFRawStream}=PDFLib;
  const pdf=await PDFDocument.load(bytes,{updateMetadata:false});const names=pdf.catalog.lookupMaybe(PDFName.of('Names'),PDFDict),embedded=names?.lookupMaybe(PDFName.of('EmbeddedFiles'),PDFDict),list=embedded?.lookupMaybe(PDFName.of('Names'),PDFArray);
  if(!list)throw Error('此PDF沒有本站的原始學習紀錄附件；請直接閱讀PDF，或匯入JSON備份。');
  for(let i=0;i+1<list.size();i+=2){const name=list.lookup(i);if(typeof name.decodeText!=='function'||name.decodeText()!==RECORD_NAME)continue;const spec=list.lookup(i+1,PDFDict),ef=spec.lookup(PDFName.of('EF'),PDFDict),stream=ef.lookup(PDFName.of('F'),PDFRawStream),data=decodePDFRawStream(stream).decode();if(data.length>6e6)throw Error('PDF內的原始紀錄過大。');return root.LabCore.validate(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data)));}
  throw Error('找不到本站的原始學習紀錄附件。');
 }
 root.LabPDF={create,read,blocks};
})(typeof globalThis!=='undefined'?globalThis:this);
