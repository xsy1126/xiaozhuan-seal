'use strict';
const input = document.getElementById('sealInput');
const status = document.getElementById('status');
const cells = [...document.querySelectorAll('.cell')];
let revision = 0;
let composing = false;
function message(text, error = false) {
  status.textContent = text;
  status.classList.toggle('error', error);
}
function supported(char) {
  const code = char.codePointAt(0);
  return [...document.fonts].some(face => face.family.replace(/["']/g, '') === '峄山碑篆体' && face.unicodeRange.split(',').some(range => {
    const parts = range.trim().replace(/^U\+/i, '').split('-');
    return code >= parseInt(parts[0], 16) && code <= parseInt(parts[1] || parts[0], 16);
  }));
}
async function render() {
  const token = ++revision;
  const chars = Array.from(input.value.replace(/\s/g, ''));
  cells.forEach(cell => { cell.textContent = ''; cell.removeAttribute('aria-label'); });
  document.getElementById('caption').textContent = '等待生成';
  if (chars.length !== 4 || !chars.every(char => /^\p{Script=Han}$/u.test(char))) {
    message(`请输入恰好四个汉字（当前 ${chars.length} 个字符），空格和换行会自动忽略。`, true);
    return;
  }
  const missing = [...new Set(chars.filter(char => !supported(char)))];
  if (missing.length) { message(`当前小篆字体未收录：${missing.join('、')}。请换成其他汉字。`, true); return; }
  message('正在加载小篆字体…');
  try {
    const faces = await document.fonts.load('150px "峄山碑篆体"', chars.join(''));
    if (token !== revision) return;
    if (!faces.length) throw new Error('Font unavailable');
    cells.forEach((cell, i) => {
      const char = chars[[0, 2, 1, 3][i]];
      cell.textContent = char;
      cell.setAttribute('aria-label', `${cell.dataset.position}：${char}`);
    });
    document.getElementById('caption').textContent = chars.join('');
    document.dispatchEvent(new Event('seal-rendered'));
    message('已生成：第一个字左上，第二个字左下，第三个字右上，第四个字右下。');
  } catch (error) {
    if (token === revision) message('小篆字体加载失败，请刷新页面后重试。', true);
  }
}
document.getElementById('sealForm').addEventListener('submit', event => { event.preventDefault(); render(); });
input.addEventListener('compositionstart', () => { composing = true; ++revision; });
input.addEventListener('compositionend', () => { composing = false; render(); });
input.addEventListener('input', () => { if (!composing) render(); });
document.querySelectorAll('[data-text]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.text; render(); }));
render();
