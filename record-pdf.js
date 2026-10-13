(function () {
  'use strict';
  const parts = {
    'index.html': ['01', 'Prompt實作', 'export', 'export-fallback', 'export-status'],
    'recognition.html': ['02', '作品辨認', 'download-record', 'export-area'],
    'generation.html': ['03', '生成原理', 'download-record', 'record-area'],
    'detective.html': ['04', '來源偵探', 'download-record', 'record-area'],
    'responsibility.html': ['05', '用途風險與責任', 'download-record', 'record-area', 'download-status']
  };
  const config = parts[location.pathname.split('/').pop() || 'index.html'];
  if (!config) return;

  // Rasterize locally so Chinese text works offline without uploading answers or fonts.
  async function createPDF(text) {
    if (!window.PDFLib) throw new Error('PDF library unavailable');
    await document.fonts.ready;
    const doc = await PDFLib.PDFDocument.create();
    const width = 794, height = 1123, margin = 54, bottom = height - 70;
    const canvas = document.createElement('canvas');
    canvas.width = width * 3;
    canvas.height = height * 3;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.scale(3, 3);
    const font = (size, bold) => `${bold ? '700' : '400'} ${size}px "Microsoft JhengHei", "Noto Sans TC", sans-serif`;
    const maxWidth = width - margin * 2;
    const rows = [];
    const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('zh-Hant', {granularity:'grapheme'}) : null;
    for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
      const heading = /^#{1,2} /.test(line);
      const value = line.replace(/^#{1,2} /, '').replace(/\t/g, '    ');
      const size = line.startsWith('# ') ? 20 : heading ? 16 : 14;
      const step = size + 8;
      ctx.font = font(size, heading);
      const chars = segmenter ? [...segmenter.segment(value)].map(s => s.segment) : Array.from(value);
      let current = '';
      const wrapped = [];
      for (const char of chars) {
        if (current && ctx.measureText(current + char).width > maxWidth) {
          wrapped.push(current);
          current = char;
        } else current += char;
      }
      wrapped.push(current);
      wrapped.forEach((value, index) => rows.push({value, size, heading, step: value ? step : 10, first: index === 0}));
    }
    const sheets = [[]];
    let y = 92;
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const reserve = row.heading && row.first ? row.step + (rows[index + 1]?.step || 0) : row.step;
      if (y + reserve > bottom) {
        if (!row.value) continue;
        sheets.push([]);
        y = 92;
      }
      sheets.at(-1).push({...row, y});
      y += row.step;
    }
    for (let index = 0; index < sheets.length; index++) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#000';
      ctx.textBaseline = 'top';
      ctx.font = font(12, false);
      ctx.fillText(`第一堂 · 第${config[0]}部分 · ${config[1]}`, margin, 38);
      for (const row of sheets[index]) {
        ctx.font = font(row.size, row.heading);
        ctx.fillText(row.value, margin, row.y);
      }
      ctx.font = font(12, false);
      ctx.fillText(`${index + 1} / ${sheets.length}`, margin, height - 42);
      const image = await doc.embedJpg(canvas.toDataURL('image/jpeg', 0.94));
      const page = doc.addPage([595.28, 841.89]);
      page.drawImage(image, {x:0, y:0, width:595.28, height:841.89});
    }
    canvas.width = canvas.height = 0;
    doc.setTitle(`第一堂 第${config[0]}部分 ${config[1]} 學習紀錄`);
    doc.setSubject('個人學習紀錄；下載不等於提交。');
    return doc.save();
  }

  document.addEventListener('DOMContentLoaded', () => {
    let button = document.getElementById(config[2]);
    if (!button) {
      button = document.createElement('button');
      button.id = config[2];
      const build = document.getElementById('build-record');
      build.after(button);
    }
    button.innerHTML = '<i data-lucide="download"></i>下載學習紀錄 PDF';
    let status = document.getElementById(config[4] || 'download-status');
    if (!status) {
      status = document.createElement('span');
      status.id = 'download-status';
      status.setAttribute('role', 'status');
      button.after(status);
    }
    if (window.lucide) lucide.createIcons();
    button.onclick = async () => {
      if (config[0] === '01') {
        const state = document.querySelector('input[name="completion"]:checked')?.value;
        if (!state || (state !== '已取得兩次結果' && !document.getElementById('blocker').value.trim())) {
          notify('先選實操狀態；未完成者填卡在哪一步。');
          document.getElementById('blocker').focus();
          return;
        }
      }
      save();
      const text = record();
      document.getElementById('record-text').value = text;
      document.getElementById(config[3]).hidden = false;
      button.disabled = true;
      status.textContent = '正在產生 PDF…';
      try {
        const bytes = await createPDF(text);
        const url = URL.createObjectURL(new Blob([bytes], {type:'application/pdf'}));
        const link = document.createElement('a');
        link.href = url;
        link.download = `第一堂_第${config[0]}部分_${config[1]}_學習紀錄.pdf`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        status.textContent = '已發出 PDF 下載請求；若未收到檔案，可複製下方紀錄。';
        notify('PDF 紀錄已產生，下載不等於提交。');
      } catch (error) {
        status.textContent = 'PDF 未能產生，請重試或複製下方完整紀錄。';
        console.error('Learning record PDF export failed:', error);
      } finally { button.disabled = false; }
    };
  });
})();
