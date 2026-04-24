// ── 主题切换 ──────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
(function initThemeBtn() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
})();

// ── Tab 切换 ──────────────────────────────────────────────────
function showPage(n, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page' + n).classList.add('active');
  btn.classList.add('active');
}

// ── 工具函数 ──────────────────────────────────────────────────
function pad(n, l = 2) { return String(n).padStart(l, '0'); }

// ── PAGE 1：实时时间戳 ────────────────────────────────────────
const digitsEl = document.getElementById('digits');
let prevDigs = '';
for (let i = 0; i < 10; i++) {
  const s = document.createElement('span');
  s.className = 'ts-digit'; s.id = `d${i}`; s.textContent = '0';
  digitsEl.appendChild(s);
}

function tzLabel() {
  const off = -new Date().getTimezoneOffset();
  const s = off >= 0 ? '+' : '-';
  return `UTC${s}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`;
}

function tick() {
  const now = new Date(), ts = Math.floor(now.getTime() / 1000), ms = now.getMilliseconds();
  const str = String(ts).padStart(10, '0');
  for (let i = 0; i < 10; i++) {
    const el = document.getElementById(`d${i}`);
    if (str[i] !== prevDigs[i]) {
      el.textContent = str[i];
      el.classList.remove('flip'); void el.offsetWidth;
      el.classList.add('flip');
      setTimeout(() => el.classList.remove('flip'), 120);
    }
  }
  prevDigs = str;
  document.getElementById('ms').textContent = pad(ms, 3);
  const Y = now.getFullYear(), Mo = pad(now.getMonth() + 1), D = pad(now.getDate());
  const H = pad(now.getHours()), Mi = pad(now.getMinutes()), S = pad(now.getSeconds());
  document.getElementById('human').textContent    = `${Y}-${Mo}-${D} ${H}:${Mi}:${S}`;
  document.getElementById('utc-date').textContent = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  document.getElementById('utc-time').textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
  document.getElementById('tz').textContent       = tzLabel();
}
tick(); setInterval(tick, 50);

function copyText(text) {
  if (navigator.clipboard && location.protocol !== 'file:') {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); document.body.removeChild(ta);
  return Promise.resolve();
}

function copyTS() {
  const ts = Math.floor(Date.now() / 1000);
  const btn = document.getElementById('copyBtn');
  copyText(String(ts)).then(() => {
    btn.textContent = 'COPIED  ✓'; btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'COPY TIMESTAMP'; btn.classList.remove('ok'); }, 1500);
  });
}

function fillNow(id) { document.getElementById(id).value = Math.floor(Date.now() / 1000); }

function ts2dt() {
  const v = parseInt(document.getElementById('ts2dt-in').value);
  const out = document.getElementById('ts2dt-out');
  if (isNaN(v)) { out.textContent = '请输入有效的时间戳'; out.className = 'conv-result err'; return; }
  const d = new Date(v * 1000);
  if (isNaN(d)) { out.textContent = '无效时间戳'; out.className = 'conv-result err'; return; }
  const Y = d.getFullYear(), Mo = pad(d.getMonth() + 1), D = pad(d.getDate());
  const H = pad(d.getHours()), Mi = pad(d.getMinutes()), S = pad(d.getSeconds());
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  out.textContent = `本地: ${Y}-${Mo}-${D} ${H}:${Mi}:${S}（周${days[d.getDay()]}）  |  UTC: ${d.toUTCString()}`;
  out.className = 'conv-result';
}

function fillNowDT() {
  const now = new Date(), local = new Date(now - now.getTimezoneOffset() * 60000);
  document.getElementById('dt2ts-in').value = local.toISOString().slice(0, 19);
}

function dt2ts() {
  const v = document.getElementById('dt2ts-in').value;
  const out = document.getElementById('dt2ts-out');
  if (!v) { out.textContent = '请选择日期时间'; out.className = 'conv-result err'; return; }
  const ts = Math.floor(new Date(v).getTime() / 1000);
  if (isNaN(ts)) { out.textContent = '无效日期'; out.className = 'conv-result err'; return; }
  out.textContent = `Unix 时间戳: ${ts}  （毫秒: ${ts * 1000}）`;
  out.className = 'conv-result';
}

// ── PAGE 2：时间间隔记录 ──────────────────────────────────────
let recState = 0, tsStart = null, tsEnd = null;

function record() {
  const now = Date.now(), btn = document.getElementById('recBtn');
  if (recState === 0) {
    tsStart = now; tsEnd = null;
    renderSlot('A', now); clearSlot('B'); clearInterval_display();
    btn.textContent = '✅ 开始已记录 — 点击记录结束时间';
    btn.classList.add('armed'); recState = 1;
  } else {
    tsEnd = now; renderSlot('B', now);
    btn.textContent = '点击记录开始时间';
    btn.classList.remove('armed'); recState = 0; showInterval();
  }
}

function renderSlot(ab, ms) {
  const d = new Date(ms), ts = Math.floor(ms / 1000);
  const Y = d.getFullYear(), Mo = pad(d.getMonth() + 1), D = pad(d.getDate());
  const H = pad(d.getHours()), Mi = pad(d.getMinutes()), S = pad(d.getSeconds()), MS = pad(d.getMilliseconds(), 3);
  document.getElementById(`ts${ab}`).textContent = `${ts}.${MS}`;
  document.getElementById(`ht${ab}`).textContent = `${Y}-${Mo}-${D} ${H}:${Mi}:${S}.${MS}`;
  document.getElementById(`slot${ab}`).classList.add('set');
}

function clearSlot(ab) {
  document.getElementById(`ts${ab}`).textContent = '—';
  document.getElementById(`ht${ab}`).textContent = '—';
  document.getElementById(`slot${ab}`).classList.remove('set');
}

function clearInterval_display() {
  document.getElementById('ivVal').textContent = '—';
  document.getElementById('ivUnit').textContent = '';
  document.getElementById('ivBreak').textContent = '';
}

function showInterval() {
  if (!tsStart || !tsEnd) return;
  const diffMs = Math.abs(tsEnd - tsStart), diffS = diffMs / 1000;
  const h = Math.floor(diffS / 3600), m = Math.floor((diffS % 3600) / 60), s = Math.floor(diffS % 60), ms = diffMs % 1000;
  let mainVal, mainUnit;
  if (diffMs < 1000)    { mainVal = diffMs.toFixed(0);      mainUnit = 'ms（毫秒）'; }
  else if (diffS < 60)  { mainVal = diffS.toFixed(3);       mainUnit = 's（秒）'; }
  else if (diffS < 3600){ mainVal = (diffS / 60).toFixed(2);mainUnit = 'min（分钟）'; }
  else                  { mainVal = (diffS / 3600).toFixed(3); mainUnit = 'h（小时）'; }
  document.getElementById('ivVal').textContent   = mainVal;
  document.getElementById('ivUnit').textContent  = mainUnit;
  document.getElementById('ivBreak').textContent = `${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm ' : ''}${s}s ${ms}ms  ·  共 ${diffMs} ms`;
}

function resetRec() {
  tsStart = tsEnd = null; recState = 0;
  clearSlot('A'); clearSlot('B'); clearInterval_display();
  const btn = document.getElementById('recBtn');
  btn.textContent = '点击记录开始时间'; btn.classList.remove('armed');
}

function fillInterval() {
  if (!tsStart || !tsEnd) { alert('请先在上方完成时间间隔记录'); return; }
  document.getElementById('xferTime').value = Math.abs(tsEnd - tsStart);
  document.getElementById('timeUnit').value = 'ms';
}

// ── PAGE 2：传输速率计算 ──────────────────────────────────────
const historyRecords = [];

function calcRate() {
  const sizeRaw  = parseFloat(document.getElementById('fileSize').value);
  const sizeUnit = document.getElementById('sizeUnit').value;
  const timeRaw  = parseFloat(document.getElementById('xferTime').value);
  const timeUnit = document.getElementById('timeUnit').value;
  if (isNaN(sizeRaw) || sizeRaw <= 0 || isNaN(timeRaw) || timeRaw <= 0) {
    alert('请输入有效的文件大小和传输时间'); return;
  }
  const unitMap = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
  const bytes   = sizeRaw * unitMap[sizeUnit];
  const timeMap = { ms: 0.001, s: 1, min: 60 };
  const seconds = timeRaw * timeMap[timeUnit];
  const kbs = (bytes / 1024) / seconds, mbs = kbs / 1024;
  const kbps = (bytes * 8) / 1000 / seconds, mbps = kbps / 1000;
  function fmt(n) { return n >= 1000 ? n.toFixed(1) : n >= 10 ? n.toFixed(2) : n.toFixed(4); }
  document.getElementById('r-kbs').textContent  = fmt(kbs)  + ' KB/s';
  document.getElementById('r-mbs').textContent  = fmt(mbs)  + ' MB/s';
  document.getElementById('r-kbps').textContent = fmt(kbps) + ' Kbps';
  document.getElementById('r-mbps').textContent = fmt(mbps) + ' Mbps';
  let td;
  if (seconds < 1)       td = (seconds * 1000).toFixed(1) + ' ms';
  else if (seconds < 60) td = seconds.toFixed(3) + ' s';
  else                   td = (seconds / 60).toFixed(2) + ' min';
  document.getElementById('r-time').textContent = td;
  let sd;
  if (bytes < 1024)          sd = bytes.toFixed(0) + ' B';
  else if (bytes < 1024**2)  sd = (bytes / 1024).toFixed(2) + ' KB';
  else if (bytes < 1024**3)  sd = (bytes / 1024**2).toFixed(3) + ' MB';
  else                       sd = (bytes / 1024**3).toFixed(4) + ' GB';
  document.getElementById('r-size').textContent = sd;

  // 保存历史记录
  historyRecords.unshift({
    startTime: document.getElementById('htA').textContent,
    endTime:   document.getElementById('htB').textContent,
    interval:  document.getElementById('ivBreak').textContent || '—',
    fileSize:  sd,
    rate:      fmt(mbs) + ' MB/s  ·  ' + fmt(mbps) + ' Mbps',
    time:      new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  });
  renderHistory();
}

function renderHistory() {
  const list  = document.getElementById('hist-list');
  const empty = document.getElementById('hist-empty');
  const count = document.getElementById('hist-count');
  count.textContent = historyRecords.length + ' 条';
  if (historyRecords.length === 0) {
    empty.style.display = 'block';
    list.querySelectorAll('.hist-item').forEach(el => el.remove());
    return;
  }
  empty.style.display = 'none';
  list.querySelectorAll('.hist-item').forEach(el => el.remove());
  historyRecords.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'hist-item';
    div.innerHTML = `
      <div class="hist-item-num"># ${historyRecords.length - i}  <span style="float:right;opacity:.5">${r.time}</span></div>
      <div class="hist-row"><span class="hist-lbl">开始时间</span><span class="hist-val">${r.startTime}</span></div>
      <div class="hist-row"><span class="hist-lbl">结束时间</span><span class="hist-val">${r.endTime}</span></div>
      <div class="hist-divider"></div>
      <div class="hist-row"><span class="hist-lbl">时间间隔</span><span class="hist-val">${r.interval}</span></div>
      <div class="hist-row"><span class="hist-lbl">文件大小</span><span class="hist-val">${r.fileSize}</span></div>
      <div class="hist-row"><span class="hist-lbl">传输速率</span><span class="hist-val hi">${r.rate}</span></div>`;
    list.appendChild(div);
  });
}

function clearHistory() {
  historyRecords.length = 0;
  renderHistory();
}

// ── PAGE 3：自定义倒计时 ──────────────────────────────────────
const MAX_TIMERS = 5;
let timerNextId = 1;
const timers = {};

function fmtCountdown(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function humanTime(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function playAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .35, .7].forEach(delay => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + delay + .3);
      gain.gain.setValueAtTime(.6, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + delay + .4);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + .4);
    });
  } catch (e) {}
}

function addTimer() {
  if (Object.keys(timers).length >= MAX_TIMERS) return;
  const id = timerNextId++;
  timers[id] = { totalSec: 0, running: false, startMs: null, endMs: null, ivId: null, done: false };
  const card = document.createElement('div');
  card.className = 'card'; card.id = `timer-card-${id}`; card.style.width = '100%';
  card.innerHTML = `
    <div class="timer-header">
      <input class="timer-name-inp" id="tname-${id}" placeholder="计时器名称（可选）" maxlength="20">
      <button class="timer-del-btn" id="tdel-${id}" onclick="removeTimer(${id})">删除</button>
    </div>
    <div class="timer-block" style="margin-top:16px">
      <div class="duration-row">
        <span class="duration-label">设定时长</span>
        <input class="duration-inp" id="th-${id}" type="number" min="0" max="23" value="0">
        <span class="duration-unit">时</span>
        <span class="duration-sep">:</span>
        <input class="duration-inp" id="tm-${id}" type="number" min="0" max="59" value="25">
        <span class="duration-unit">分</span>
        <span class="duration-sep">:</span>
        <input class="duration-inp" id="ts-${id}" type="number" min="0" max="59" value="0">
        <span class="duration-unit">秒</span>
      </div>
      <div class="countdown-display" id="cd-display-${id}">
        <div class="countdown-num" id="cd-num-${id}">—:——</div>
        <div class="countdown-unit">剩余时间</div>
        <div class="countdown-sub" id="cd-sub-${id}">尚未开始</div>
      </div>
      <div class="ring-msg" id="cd-ring-${id}">🔔 时间到！</div>
      <div class="timer-start-info" id="cd-info-${id}" style="display:none">
        <div style="margin-right:32px">开始时间：<span id="cd-start-${id}">—</span></div>
        <div>到期时间：<span id="cd-end-${id}">—</span></div>
      </div>
      <div class="timer-btn-row">
        <button class="timer-start-btn" id="cd-btn-${id}" onclick="timerAction(${id})">开始计时</button>
        <button class="timer-reset-btn" onclick="timerReset(${id})">重置</button>
      </div>
    </div>`;
  document.getElementById('timer-list').appendChild(card);
  updateTimerCountUI();
}

function removeTimer(id) {
  const st = timers[id];
  if (st && st.running) return;
  if (st && st.ivId) clearInterval(st.ivId);
  delete timers[id];
  const card = document.getElementById(`timer-card-${id}`);
  if (card) card.remove();
  updateTimerCountUI();
}

function updateTimerCountUI() {
  const count = Object.keys(timers).length;
  const lbl = document.getElementById('timer-count-lbl');
  const addBtn = document.getElementById('add-timer-btn');
  if (lbl) lbl.textContent = `${count} / ${MAX_TIMERS}`;
  if (addBtn) addBtn.disabled = count >= MAX_TIMERS;
}

function getTimerTotalSec(id) {
  const h = Math.max(0, parseInt(document.getElementById(`th-${id}`).value) || 0);
  const m = Math.max(0, parseInt(document.getElementById(`tm-${id}`).value) || 0);
  const s = Math.max(0, parseInt(document.getElementById(`ts-${id}`).value) || 0);
  return h * 3600 + m * 60 + s;
}

function timerTick(id) {
  const st = timers[id];
  const remain = Math.max(0, (st.endMs - Date.now()) / 1000);
  document.getElementById(`cd-num-${id}`).textContent = fmtCountdown(remain);
  const pct = st.totalSec > 0 ? Math.round((1 - remain / st.totalSec) * 100) : 0;
  document.getElementById(`cd-sub-${id}`).textContent = `已用 ${pct}%`;
  if (remain <= 0 && !st.done) {
    st.done = true; clearInterval(st.ivId); st.running = false;
    document.getElementById(`cd-num-${id}`).textContent = fmtCountdown(0);
    document.getElementById(`cd-sub-${id}`).textContent = '已完成！';
    document.getElementById(`cd-display-${id}`).classList.add('ringing');
    const label = document.getElementById(`tname-${id}`).value.trim() || '计时';
    document.getElementById(`cd-ring-${id}`).textContent = `🔔 时间到！${label}已到达`;
    document.getElementById(`cd-ring-${id}`).classList.add('show');
    const btn = document.getElementById(`cd-btn-${id}`);
    btn.textContent = '已到时 — 重新开始'; btn.classList.remove('running'); btn.classList.add('done');
    document.getElementById(`tdel-${id}`).disabled = false;
    playAlert(); setTimeout(playAlert, 1500); setTimeout(playAlert, 3000);
  }
}

function timerAction(id) {
  const st = timers[id], btn = document.getElementById(`cd-btn-${id}`);
  if (st.done) { timerReset(id); timerAction(id); return; }
  if (!st.running) {
    if (st._pausedRemainMs !== undefined) {
      st.running = true; st.endMs = Date.now() + st._pausedRemainMs; delete st._pausedRemainMs;
      btn.textContent = '计时中 — 点击暂停'; btn.classList.add('running');
      timerTick(id); st.ivId = setInterval(() => timerTick(id), 500);
    } else {
      const total = getTimerTotalSec(id); if (total <= 0) return;
      st.totalSec = total; st.running = true; st.done = false;
      st.startMs = Date.now(); st.endMs = st.startMs + total * 1000;
      ['th', 'tm', 'ts'].forEach(p => { document.getElementById(`${p}-${id}`).disabled = true; });
      document.getElementById(`tdel-${id}`).disabled = true;
      document.getElementById(`cd-info-${id}`).style.display = 'flex';
      document.getElementById(`cd-start-${id}`).textContent = humanTime(st.startMs);
      document.getElementById(`cd-end-${id}`).textContent   = humanTime(st.endMs);
      btn.textContent = '计时中 — 点击暂停'; btn.classList.add('running'); btn.classList.remove('done');
      timerTick(id); st.ivId = setInterval(() => timerTick(id), 500);
    }
  } else {
    clearInterval(st.ivId); st.running = false;
    st._pausedRemainMs = Math.max(0, st.endMs - Date.now());
    btn.textContent = '继续计时'; btn.classList.remove('running');
  }
}

function timerReset(id) {
  const st = timers[id]; if (!st) return;
  clearInterval(st.ivId);
  Object.assign(st, { totalSec: 0, running: false, startMs: null, endMs: null, ivId: null, done: false });
  delete st._pausedRemainMs;
  ['th', 'tm', 'ts'].forEach(p => { document.getElementById(`${p}-${id}`).disabled = false; });
  document.getElementById(`tdel-${id}`).disabled = false;
  document.getElementById(`cd-num-${id}`).textContent = '—:——';
  document.getElementById(`cd-sub-${id}`).textContent = '尚未开始';
  document.getElementById(`cd-display-${id}`).classList.remove('ringing');
  document.getElementById(`cd-ring-${id}`).classList.remove('show');
  document.getElementById(`cd-info-${id}`).style.display = 'none';
  const btn = document.getElementById(`cd-btn-${id}`);
  btn.textContent = '开始计时'; btn.classList.remove('running', 'done');
}

// 初始化：默认一个 25 分钟计时器
addTimer();

// ── PAGE 4：录音时间记录 ──────────────────────────────────────
const rec4 = { running: false, startMs: null, endMs: null, elapsedIv: null, marks: [], nextAutoMs: null };

function rec4Fmt(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
function rec4AbsTime(ms) {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function rec4AbsFull(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function rec4AddMark(type) {
  const now = Date.now(), elapsed = (now - rec4.startMs) / 1000;
  rec4.marks.push({ ms: now, elapsed, type });
  rec4RenderMarks();
  if (type === 'auto') { playAlert(); setTimeout(playAlert, 1000); }
}

function rec4RenderMarks() {
  const list = document.getElementById('rec4-marks-list');
  const empty = document.getElementById('rec4-empty');
  document.getElementById('rec4-marks-count').textContent = `${rec4.marks.length} 个标记`;
  if (rec4.marks.length === 0) {
    empty.style.display = 'block';
    list.querySelectorAll('.rec4-mark-item').forEach(el => el.remove());
    return;
  }
  empty.style.display = 'none';
  list.querySelectorAll('.rec4-mark-item').forEach(el => el.remove());
  rec4.marks.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = `rec4-mark-item ${m.type}`;
    div.innerHTML = `
      <span class="rec4-mark-idx">#${i + 1}</span>
      <span class="rec4-mark-elapsed">${Math.floor(m.elapsed)}s</span>
      <span class="rec4-mark-abs">${rec4AbsTime(m.ms)}</span>
      <span class="rec4-mark-type">${m.type === 'auto' ? '自动' : '手动'}</span>`;
    list.appendChild(div);
  });
  list.scrollTop = list.scrollHeight;
}

function rec4Tick() {
  if (!rec4.running) return;
  document.getElementById('rec4-elapsed').textContent = rec4Fmt((Date.now() - rec4.startMs) / 1000);
  if (rec4.nextAutoMs && Date.now() >= rec4.nextAutoMs) {
    rec4AddMark('auto');
    const intervalMs = (parseInt(document.getElementById('rec4-interval').value) || 5)
                     * (parseInt(document.getElementById('rec4-interval-unit').value) || 60) * 1000;
    rec4.nextAutoMs += intervalMs;
  }
}

function rec4Start() {
  if (rec4.running) {
    rec4.running = false; rec4.endMs = Date.now(); clearInterval(rec4.elapsedIv);
    const statusEl = document.getElementById('rec4-status');
    statusEl.classList.remove('recording'); statusEl.classList.add('stopped');
    document.getElementById('rec4-state-txt').textContent = '录音已结束';
    document.getElementById('rec4-elapsed').textContent = rec4Fmt((rec4.endMs - rec4.startMs) / 1000);
    const btn = document.getElementById('rec4-start-btn');
    btn.textContent = '● 开始录音'; btn.classList.add('idle');
    document.getElementById('rec4-mark-btn').disabled = true;
    document.getElementById('rec4-interval').disabled = false;
    document.getElementById('rec4-interval-unit').disabled = false;
    rec4ShowSummary();
  } else {
    rec4.running = true; rec4.startMs = Date.now(); rec4.endMs = null; rec4.marks = [];
    rec4RenderMarks();
    const intervalVal = parseInt(document.getElementById('rec4-interval').value) || 5;
    const unitSec     = parseInt(document.getElementById('rec4-interval-unit').value) || 60;
    rec4.nextAutoMs = rec4.startMs + intervalVal * unitSec * 1000;
    document.getElementById('rec4-interval').disabled = true;
    document.getElementById('rec4-interval-unit').disabled = true;
    document.getElementById('rec4-start-info').style.display = 'flex';
    document.getElementById('rec4-start-human').textContent = rec4AbsFull(rec4.startMs);
    document.getElementById('rec4-start-unix').textContent  = Math.floor(rec4.startMs / 1000);
    const statusEl = document.getElementById('rec4-status');
    statusEl.classList.remove('stopped'); statusEl.classList.add('recording');
    document.getElementById('rec4-state-txt').textContent = '录音中';
    const btn = document.getElementById('rec4-start-btn');
    btn.textContent = '■ 结束录音'; btn.classList.remove('idle');
    document.getElementById('rec4-mark-btn').disabled = false;
    document.getElementById('rec4-summary').classList.remove('show');
    rec4.elapsedIv = setInterval(rec4Tick, 500);
  }
}

function rec4ManualMark() { if (!rec4.running) return; rec4AddMark('manual'); }

function rec4ShowSummary() {
  const duration    = (rec4.endMs - rec4.startMs) / 1000;
  const autoCount   = rec4.marks.filter(m => m.type === 'auto').length;
  const manualCount = rec4.marks.filter(m => m.type === 'manual').length;
  document.getElementById('sum-start').textContent    = rec4AbsFull(rec4.startMs);
  document.getElementById('sum-end').textContent      = rec4AbsFull(rec4.endMs);
  document.getElementById('sum-duration').textContent = rec4Fmt(duration);
  document.getElementById('sum-marks').textContent    = rec4.marks.length + ' 次';
  document.getElementById('sum-auto').textContent     = autoCount + ' 次';
  document.getElementById('sum-manual').textContent   = manualCount + ' 次';
  document.getElementById('rec4-summary').classList.add('show');
}

// ── PAGE 5：动作标记 ──────────────────────────────────────────
const FALLBACK_PRESETS = ['开始录音','Ble连接','结束录音','Ble断连','WIFI快传','上云','导出日志','绑定'];
const mark5Presets = [];
const mark5Marks = [];
let mark5PresetsOpen = false;

async function mark5LoadPresets() {
  // 用户自定义 → 优先
  try {
    const raw = localStorage.getItem('mark5_presets');
    const saved = raw ? JSON.parse(raw) : null;
    if (Array.isArray(saved) && saved.length) {
      saved.forEach(p => mark5Presets.push(p));
      mark5LoadLocalMarks(); mark5UpdateSelect(); mark5RenderQuick(); mark5RenderRecords();
      return;
    }
  } catch(e) {}
  // 读 presets.json 作为默认值
  try {
    const res = await fetch('presets.json');
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (Array.isArray(data) && data.length) data.forEach(p => mark5Presets.push(p));
    else FALLBACK_PRESETS.forEach(p => mark5Presets.push(p));
  } catch {
    FALLBACK_PRESETS.forEach(p => mark5Presets.push(p));
  }
  mark5LoadLocalMarks(); mark5UpdateSelect(); mark5RenderQuick(); mark5RenderRecords();
}

function mark5SavePresets() {
  try { localStorage.setItem('mark5_presets', JSON.stringify(mark5Presets)); } catch(e) {}
}

function mark5SaveLocalMarks() {
  try { localStorage.setItem('mark5_marks', JSON.stringify(mark5Marks)); } catch(e) {}
}

function mark5LoadLocalMarks() {
  try {
    const raw = localStorage.getItem('mark5_marks');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      mark5Marks.length = 0;
      data.forEach(m => { if (m && m.ts && m.action) mark5Marks.push(m); });
    }
  } catch(e) {}
}

function mark5Init() { mark5LoadPresets(); }

function mark5OnChange() {
  const val = document.getElementById('mark5-sel').value;
  document.getElementById('mark5-custom-wrap').style.display = val === '__custom__' ? 'flex' : 'none';
}

function mark5GetLabel() {
  const sel = document.getElementById('mark5-sel');
  if (sel.value === '__custom__') {
    return document.getElementById('mark5-custom-inp').value.trim() || '自定义';
  }
  return sel.value;
}

function mark5DoMark(label) {
  const action = label !== undefined ? label : mark5GetLabel();
  mark5Marks.push({ ts: Date.now(), action });
  mark5SaveLocalMarks();
  mark5RenderRecords();
  // 按钮闪烁反馈
  const btn = label !== undefined
    ? document.querySelector(`.mark5-quick-btn[data-label="${label}"]`)
    : document.getElementById('mark5-do-btn');
  if (btn) {
    btn.classList.add('mark5-flash');
    setTimeout(() => btn.classList.remove('mark5-flash'), 350);
  }
}

function mark5RenderQuick() {
  const row = document.getElementById('mark5-quick-row');
  row.innerHTML = '';
  mark5Presets.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'mark5-quick-btn';
    btn.dataset.label = p;
    btn.textContent = p;
    btn.onclick = () => mark5DoMark(p);
    row.appendChild(btn);
  });
}

function mark5UpdateSelect() {
  const sel = document.getElementById('mark5-sel');
  const cur = sel.value;
  sel.innerHTML = '';
  mark5Presets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    sel.appendChild(opt);
  });
  const customOpt = document.createElement('option');
  customOpt.value = '__custom__'; customOpt.textContent = '✏️  自定义...';
  sel.appendChild(customOpt);
  if (mark5Presets.includes(cur)) sel.value = cur;
  mark5OnChange();
}

function mark5RenderPresetTags() {
  const tags = document.getElementById('mark5-preset-tags');
  tags.innerHTML = '';
  mark5Presets.forEach((p, i) => {
    const tag = document.createElement('div');
    tag.className = 'mark5-preset-tag';
    tag.innerHTML = `<span>${p}</span><button class="mark5-tag-del" onclick="mark5RemovePreset(${i})">×</button>`;
    tags.appendChild(tag);
  });
}

function mark5TogglePresets() {
  mark5PresetsOpen = !mark5PresetsOpen;
  document.getElementById('mark5-preset-body').style.display = mark5PresetsOpen ? 'block' : 'none';
  document.getElementById('mark5-preset-icon').textContent = mark5PresetsOpen ? '▲' : '▼';
  if (mark5PresetsOpen) mark5RenderPresetTags();
}

function mark5AddPreset() {
  const inp = document.getElementById('mark5-new-preset-inp');
  const name = inp.value.trim();
  if (!name || mark5Presets.includes(name)) return;
  mark5Presets.push(name);
  inp.value = '';
  mark5RenderPresetTags();
  mark5RenderQuick();
  mark5UpdateSelect();
  mark5SavePresets();
}

function mark5SaveAsPreset() {
  const name = document.getElementById('mark5-custom-inp').value.trim();
  if (!name || mark5Presets.includes(name)) return;
  mark5Presets.push(name);
  if (mark5PresetsOpen) mark5RenderPresetTags();
  mark5RenderQuick();
  mark5UpdateSelect();
  document.getElementById('mark5-sel').value = name;
  mark5OnChange();
  mark5SavePresets();
}

function mark5RemovePreset(idx) {
  mark5Presets.splice(idx, 1);
  mark5RenderPresetTags();
  mark5RenderQuick();
  mark5UpdateSelect();
  mark5SavePresets();
}

function mark5RenderRecords() {
  const list = document.getElementById('mark5-records-list');
  const empty = document.getElementById('mark5-empty');
  document.getElementById('mark5-count').textContent = `${mark5Marks.length} 个标记`;
  list.querySelectorAll('.mark5-record-item').forEach(el => el.remove());
  if (mark5Marks.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  mark5Marks.forEach((m, i) => {
    const d = new Date(m.ts);
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const msStr   = pad(d.getMilliseconds(), 3);
    const div = document.createElement('div');
    div.className = 'mark5-record-item';
    div.innerHTML = `
      <span class="mark5-rec-idx">#${i + 1}</span>
      <span class="mark5-rec-action">${m.action}</span>
      <span class="mark5-rec-time">${timeStr}<span class="mark5-rec-ms">.${msStr}</span></span>
      <span class="mark5-rec-ts">${Math.floor(m.ts / 1000)}</span>
      <button class="mark5-rec-del" onclick="mark5DeleteMark(${i})">×</button>`;
    list.appendChild(div);
  });
  list.scrollTop = list.scrollHeight;
}

function mark5DeleteMark(idx) {
  mark5Marks.splice(idx, 1);
  mark5SaveLocalMarks();
  mark5RenderRecords();
}

function mark5Clear() {
  if (!mark5Marks.length) return;
  mark5Marks.length = 0;
  mark5SaveLocalMarks();
  mark5RenderRecords();
}

function mark5CopyAll() {
  if (!mark5Marks.length) return;
  const lines = mark5Marks.map((m, i) => {
    const d = new Date(m.ts);
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
    return `#${i + 1}\t${m.action}\t${t}\t${Math.floor(m.ts / 1000)}`;
  });
  const btn = document.getElementById('mark5-copy-btn');
  copyText(lines.join('\n')).then(() => {
    btn.textContent = '已复制 ✓'; btn.style.color = 'var(--accent)';
    setTimeout(() => { btn.textContent = '复制全部记录'; btn.style.color = ''; }, 1800);
  });
}

mark5Init();

function rec4Reset() {
  if (rec4.running) { clearInterval(rec4.elapsedIv); rec4.running = false; }
  Object.assign(rec4, { running: false, startMs: null, endMs: null, elapsedIv: null, marks: [], nextAutoMs: null });
  const statusEl = document.getElementById('rec4-status');
  statusEl.classList.remove('recording', 'stopped');
  document.getElementById('rec4-elapsed').textContent = '00:00:00';
  document.getElementById('rec4-state-txt').textContent = '等待开始';
  const btn = document.getElementById('rec4-start-btn');
  btn.textContent = '● 开始录音'; btn.classList.add('idle');
  document.getElementById('rec4-mark-btn').disabled = true;
  document.getElementById('rec4-interval').disabled = false;
  document.getElementById('rec4-interval-unit').disabled = false;
  document.getElementById('rec4-summary').classList.remove('show');
  document.getElementById('rec4-start-info').style.display = 'none';
  rec4RenderMarks();
}
