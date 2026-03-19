/**
 * app.js — 小篆字典应用逻辑
 */

/* ══════════════════════ 状态 ══════════════════════ */
const state = {
  view: 'dictionary',
  search: '',
  filter: '全部',
  page: 1,
  pageSize: 120,
  selectedCat: null,
  quiz: { pool:[], current:0, score:0, answered:false, total:10 }
};

/* ══════════════════════ 初始化 ══════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  buildFilterBtns();
  buildCatGrid();
  renderDict();
  renderHeroStats();
  startHeroRotation();
  bindEvents();
});

/* ══════════════════════ Hero 轮播 ══════════════════════ */
const heroPool = CHARS.filter((_, i) => i % 7 === 0);
let heroIdx = 0;

function renderHeroStats() {
  const catCount = Object.keys(CAT_ICONS).length;
  document.getElementById('heroStats').innerHTML = `
    <div class="hero-stat"><span class="hero-stat-num">${CHARS.length}</span><span class="hero-stat-label">收录字数</span></div>
    <div class="hero-stat"><span class="hero-stat-num">${catCount}</span><span class="hero-stat-label">主题分类</span></div>
    <div class="hero-stat"><span class="hero-stat-num">9353</span><span class="hero-stat-label">说文解字总字</span></div>
  `;
}

function startHeroRotation() {
  updateHero(CHARS[0]);
  setInterval(() => {
    heroIdx = (heroIdx + 1) % heroPool.length;
    const d = heroPool[heroIdx];
    const el = document.getElementById('heroSealChar');
    el.style.opacity = '0';
    setTimeout(() => {
      updateHero(d);
      el.style.opacity = '1';
    }, 400);
  }, 4000);
}

function updateHero(d) {
  document.getElementById('heroSealChar').textContent  = d.c;
  document.getElementById('heroSimpChar').textContent  = d.c;
  document.getElementById('heroPinyin').textContent    = d.py;
  document.getElementById('heroMeaning').textContent   =
    d.desc ? d.desc.split('，')[0] + '…' : d.m;
}

/* ══════════════════════ 构建筛选按钮 ══════════════════════ */
function buildFilterBtns() {
  const wrap = document.getElementById('filterBtns');
  const cats = ['全部', ...CAT_ORDER];
  wrap.innerHTML = cats.map(c =>
    `<button class="filter-btn${c==='全部'?' active':''}" data-cat="${c}">${c}</button>`
  ).join('');
  wrap.querySelectorAll('.filter-btn').forEach(b =>
    b.addEventListener('click', () => {
      state.filter = b.dataset.cat;
      state.page = 1;
      wrap.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderDict();
    })
  );
}

/* ══════════════════════ 字典视图 ══════════════════════ */
function renderDict() {
  const q = state.search.toLowerCase().trim();
  const cat = state.filter;
  const list = CHARS.filter(d => {
    const matchCat = cat === '全部' || d.cat === cat;
    const matchSrch = !q ||
      d.c.includes(q) ||
      d.py.toLowerCase().includes(q) ||
      (d.m && d.m.includes(q));
    return matchCat && matchSrch;
  });

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const pageList = list.slice(start, start + state.pageSize);

  document.getElementById('dictCount').textContent = `共 ${total} 字`;
  const grid = document.getElementById('dictGrid');
  if (!total) {
    grid.innerHTML = '<div class="empty-state">未找到相关字符，请尝试其他关键词</div>';
    renderPagination(0, 0);
    return;
  }
  grid.innerHTML = pageList.map((d, i) => buildCard(d, i * 15)).join('');
  renderPagination(state.page, totalPages);
}

/* ══════════════════════ 分页控件 ══════════════════════ */
function renderPagination(cur, total) {
  let wrap = document.getElementById('dictPagination');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'dictPagination';
    wrap.className = 'pagination';
    document.getElementById('view-dictionary').appendChild(wrap);
  }
  if (total <= 1) { wrap.innerHTML = ''; return; }

  const pages = [];
  // Always show first, last, cur-1, cur, cur+1
  const show = new Set([1, total, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total));
  const sorted = [...show].sort((a, b) => a - b);

  let html = `<button class="page-btn" onclick="goPage(${cur - 1})" ${cur <= 1 ? 'disabled' : ''}>‹</button>`;
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) html += `<span class="page-ellipsis">…</span>`;
    html += `<button class="page-btn${p === cur ? ' active' : ''}" onclick="goPage(${p})">${p}</button>`;
    prev = p;
  }
  html += `<button class="page-btn" onclick="goPage(${cur + 1})" ${cur >= total ? 'disabled' : ''}>›</button>`;
  html += `<span class="page-info">${cur} / ${total} 页</span>`;
  wrap.innerHTML = html;
}

function goPage(p) {
  state.page = p;
  renderDict();
  document.getElementById('view-dictionary').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ══════════════════════ 字卡模板 ══════════════════════ */
function buildCard(d, delay = 0) {
  return `
  <div class="char-card" style="animation-delay:${delay}ms" onclick="openModal('${d.c}')">
    <div class="card-seal-area">
      <div class="card-seal-badge">小篆</div>
      <div class="card-seal">
        <span class="card-seal-char seal-font">${d.c}</span>
      </div>
    </div>
    <div class="card-simp-area">
      <div class="card-simp-row">
        <span class="card-simp-badge">简体</span>
        <span class="card-simp-char">${d.c}</span>
      </div>
      <div class="card-pinyin">${d.py}</div>
      <div class="card-cat-tag">${d.cat}</div>
    </div>
  </div>`;
}

/* ══════════════════════ 分类视图 ══════════════════════ */
function buildCatGrid() {
  const groups = {};
  CHARS.forEach(d => { groups[d.cat] = (groups[d.cat] || 0) + 1; });

  const grid = document.getElementById('catGrid');
  grid.innerHTML = CAT_ORDER.map(name => `
    <div class="cat-card" data-cat="${name}" onclick="selectCat('${name}')">
      <span class="cat-icon seal-font">${CAT_ICONS[name]}</span>
      <div class="cat-name">${name}</div>
      <div class="cat-count">${groups[name] || 0} 字</div>
    </div>`).join('');
}

function selectCat(name) {
  state.selectedCat = state.selectedCat === name ? null : name;
  document.querySelectorAll('.cat-card').forEach(c =>
    c.classList.toggle('active', c.dataset.cat === state.selectedCat)
  );
  const sec = document.getElementById('catCharSection');
  if (state.selectedCat) {
    const list = CHARS.filter(d => d.cat === state.selectedCat);
    document.getElementById('catSectionTitle').textContent = state.selectedCat;
    document.getElementById('catCharGrid').innerHTML =
      list.map((d, i) => buildCard(d, i * 25)).join('');
    sec.style.display = 'block';
    setTimeout(() => sec.scrollIntoView({ behavior:'smooth', block:'nearest' }), 80);
  } else {
    sec.style.display = 'none';
  }
}

/* ══════════════════════ 测验 ══════════════════════ */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startQuiz() {
  state.quiz = {
    pool: shuffle(CHARS).slice(0, state.quiz.total || 10),
    current: 0, score: 0, answered: false, total: 10
  };
  document.getElementById('quizResult').classList.remove('show');
  document.getElementById('quizNextBtn').style.display = 'none';
  document.getElementById('quizFeedback').className = 'quiz-feedback';
  document.getElementById('quizProgressFill').style.width = '0%';
  renderQuizQ();
}

function renderQuizQ() {
  const qz = state.quiz;
  if (qz.current >= qz.total) { showQuizResult(); return; }
  const d = qz.pool[qz.current];
  state.quiz.answered = false;

  document.getElementById('quizProgress').textContent = `第 ${qz.current + 1} / ${qz.total} 题`;
  document.getElementById('quizScore').textContent     = `得分：${qz.score}`;
  document.getElementById('quizProgressFill').style.width = `${(qz.current / qz.total) * 100}%`;
  document.getElementById('quizChar').textContent  = d.c;
  document.getElementById('quizHint').textContent  = `笔画：${d.st} · 部首：${d.rad}`;
  document.getElementById('quizNextBtn').style.display = 'none';
  document.getElementById('quizFeedback').className = 'quiz-feedback';

  // 4 个选项：1 正确 + 3 错误
  const wrong = shuffle(CHARS.filter(x => x.c !== d.c)).slice(0, 3);
  const choices = shuffle([d, ...wrong]);
  document.getElementById('quizChoices').innerHTML = choices.map(ch =>
    `<button class="quiz-choice"
       onclick="answerQuiz('${ch.c}','${d.c}')">${ch.c}</button>`
  ).join('');
}

function answerQuiz(chosen, correct) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  document.querySelectorAll('.quiz-choice').forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    else if (b.textContent === chosen && chosen !== correct) b.classList.add('wrong');
  });
  const ok = chosen === correct;
  if (ok) state.quiz.score++;
  document.getElementById('quizScore').textContent = `得分：${state.quiz.score}`;
  const d = CHARS.find(x => x.c === correct);
  const fb = document.getElementById('quizFeedback');
  fb.className = `quiz-feedback show ${ok ? 'correct-fb' : 'wrong-fb'}`;
  fb.textContent = ok
    ? `✓ 正确！「${correct}」读 ${d.py}，${d.m.split('，')[0]}`
    : `✗ 正确答案是「${correct}」，读 ${d.py}。${d.m.split('，')[0]}`;
  document.getElementById('quizNextBtn').style.display = 'block';
  state.quiz.current++;
}

function quizNext() {
  document.getElementById('quizFeedback').className = 'quiz-feedback';
  renderQuizQ();
}

function showQuizResult() {
  const { score, total } = state.quiz;
  document.getElementById('quizResult').classList.add('show');
  document.getElementById('quizResultScore').textContent = `${score} / ${total}`;
  const msgs = ['继续练习，熟能生巧！','初显功力，继续加油！','表现不错，再接再厉！',
                '相当出色，篆学达人！','满分！古文大师！'];
  document.getElementById('quizResultMsg').textContent =
    msgs[score < 4 ? 0 : score < 6 ? 1 : score < 8 ? 2 : score < 10 ? 3 : 4];
  document.getElementById('quizProgressFill').style.width = '100%';
  document.getElementById('quizNextBtn').style.display = 'none';
}

/* ══════════════════════ 字符详情弹层 ══════════════════════ */
function openModal(ch) {
  const d = CHARS.find(x => x.c === ch);
  if (!d) return;

  document.getElementById('mSealChar').textContent = d.c;
  document.getElementById('mSimpChar').textContent = d.c;
  document.getElementById('mPinyin').textContent   = d.py;

  document.getElementById('mMeta').innerHTML = [
    `<span class="modal-tag">部首：${d.rad}</span>`,
    `<span class="modal-tag">笔画：${d.st}</span>`,
    `<span class="modal-tag">${d.cat}</span>`,
  ].join('');

  document.getElementById('mMeaning').textContent = d.m;

  // 说文字形演变（有则显示）
  const descSec = document.getElementById('mDescSection');
  if (d.desc) {
    document.getElementById('mDesc').textContent = d.desc;
    descSec.style.display = 'block';
  } else { descSec.style.display = 'none'; }

  // 说文解字
  const sdSec = document.getElementById('mShuowenSection');
  if (d.sd) {
    document.getElementById('mShuowen').textContent = '《说文解字》：' + d.sd;
    sdSec.style.display = 'block';
  } else { sdSec.style.display = 'none'; }

  // 词例
  const exSec = document.getElementById('mExSection');
  if (d.ex && d.ex.length) {
    document.getElementById('mExamples').innerHTML =
      d.ex.map(e => `<span class="modal-example-tag">${e}</span>`).join('');
    exSec.style.display = 'block';
  } else { exSec.style.display = 'none'; }

  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

/* ══════════════════════ 视图切换 ══════════════════════ */
function switchView(v) {
  if (state.view === v) return;
  state.view = v;

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById(`view-${v}`).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.view === v)
  );

  const hero  = document.getElementById('heroSection');
  const srch  = document.querySelector('.search-wrapper');

  if (v === 'quiz') {
    hero.style.display = 'none';
    srch.style.opacity = '.35';
    srch.style.pointerEvents = 'none';
    startQuiz();
  } else {
    hero.style.display = '';
    srch.style.opacity = '';
    srch.style.pointerEvents = '';
    if (v === 'dictionary') renderDict();
  }
}

/* ══════════════════════ 事件绑定 ══════════════════════ */
function bindEvents() {
  // 导航
  document.querySelectorAll('[data-view]').forEach(b =>
    b.addEventListener('click', () => switchView(b.dataset.view))
  );

  // 搜索
  document.getElementById('searchInput').addEventListener('input', e => {
    state.search = e.target.value;
    state.page = 1;
    if (state.view !== 'dictionary') switchView('dictionary');
    else renderDict();
  });

  // ESC 关闭弹层
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}
