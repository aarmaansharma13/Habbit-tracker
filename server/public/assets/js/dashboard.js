// ── State ──
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_ABBR   = ['M','T','W','T','F','S','S'];
const WEEK_BG    = ['#eff6ff','#fdf2f8','#fefce8','#f0fdf4','#f5f3ff'];
const WEEK_COLORS= ['#93c5fd','#f9a8d4','#fde68a','#6ee7b7','#c4b5fd'];

let state = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  habits: [],
  stats: null,
  chart: null
};

// ── Utilities ──
const pad  = (n) => String(n).padStart(2, '0');
const fmtD = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayStr = fmtD(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const esc  = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function getWeeks(year, month) {
  const days = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const offset = (first + 6) % 7;
  const weeks = [];
  let week = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

function isDone(habit, dateStr) {
  return habit.logs.some(l => l.date === dateStr && l.completed);
}

// ── Data Fetching ──
async function fetchData() {
  const [hr, sr] = await Promise.all([
    HabitAPI.getAll(),
    HabitAPI.stats(state.year, state.month)
  ]);
  state.habits = hr;
  state.stats  = sr;
}

// ── Render: Full Dashboard ──
async function renderDashboard() {
  const el = document.getElementById('dashboardContent');
  el.innerHTML = spinner();
  try {
    await fetchData();
    el.innerHTML = buildDashboard();
    attachGridEvents();
    renderChart();
  } catch (e) {
    toast('Failed to load dashboard', 'error');
    el.innerHTML = `<p style="color:#ef4444;padding:20px">Error: ${e.message}</p>`;
  }
}

// ── Build Dashboard HTML ──
function buildDashboard() {
  const { year, month, stats } = state;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dp = stats?.dailyProgress ?? 0;
  const tc = stats?.totalCompleted ?? 0;
  const tp = stats?.totalPossible  ?? 0;
  const user = getUser();

  return `
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2>${MONTHS[month]} ${year}</h2>
        <p>Habit Tracker</p>
      </div>
      <div class="month-nav">
        <button class="btn-nav" onclick="changeMonth(-1)">‹</button>
        <button class="btn-today" onclick="goToday()">Today</button>
        <button class="btn-nav" onclick="changeMonth(1)">›</button>
      </div>
    </div>

    <!-- Top Row -->
    <div class="dash-top">
      <!-- Trust Card -->
      <div class="trust-card">
        <div>
          <p class="trust-month">${MONTHS[month].slice(0,3).toUpperCase()} ${year}</p>
          <h3 class="trust-title">trust<br>the<br>process</h3>
          <div class="trust-bar"></div>
        </div>
        <div>
          <p class="trust-sub">I am ...</p>
          <p class="trust-affirmation">${esc(user?.affirmation || 'Focused, intentional, and ready for the month ahead.')}</p>
        </div>
      </div>

      <!-- Weekly Chart -->
      <div class="weekly-card">
        <p class="card-label">Weekly Breakdown</p>
        <div class="chart-wrap">
          <canvas id="weeklyChart"></canvas>
        </div>
        <div class="week-rings" id="weekRings">${buildWeekRings()}</div>
      </div>

      <!-- Right Column: Progress Ring + Top Habits -->
      <div style="display:flex;flex-direction:column;gap:12px">
        ${buildProgressRing(dp, tc, tp)}
        ${buildTopHabits()}
      </div>
    </div>

    <!-- Habit Grid -->
    <div class="grid-card">
      <div class="grid-card-header"><p>Daily Habits</p></div>
      <div class="grid-scroll">
        ${state.habits.length ? buildGrid() : `<div class="empty-state"><div class="emoji">🌱</div><p>No habits yet. <a href="/habits.html" style="color:#7c3aed;font-weight:600">Add your first!</a></p></div>`}
      </div>
    </div>

    <!-- Daily Progress Summary -->
    ${state.stats?.habitStats?.length ? buildProgressTable() : ''}
  `;
}

// ── Progress Ring (SVG) ──
function buildProgressRing(pct, completed, possible) {
  const r = 44, cx = 60, cy = 60, circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return `
    <div class="progress-card">
      <div class="progress-inner">
        <div class="progress-label">
          <p>Daily Progress</p>
          <h3>${pct}%</h3>
        </div>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fce7f3" stroke-width="10"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ec4899" stroke-width="10"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
            stroke-linecap="round" transform="rotate(-90 60 60)"/>
          <text x="${cx}" y="52" text-anchor="middle" font-size="9" fill="#9ca3af">HABITS</text>
          <text x="${cx}" y="67" text-anchor="middle" font-size="12" font-weight="800" fill="#1f2937">${completed}/${possible}</text>
        </svg>
      </div>
    </div>`;
}

// ── Week Rings ──
function buildWeekRings() {
  const weeks = state.stats?.weeks || [];
  if (!weeks.length) return '';
  return weeks.map((w, i) => {
    const r = 22, cx = 28, cy = 28, circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(w.progress, 100) / 100) * circ;
    const col = WEEK_COLORS[i] || '#93c5fd';
    return `
      <div class="week-ring-item">
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f3f4f6" stroke-width="6"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="6"
            stroke-dasharray="${circ}" stroke-dashoffset="${offset}"
            stroke-linecap="round" transform="rotate(-90 28 28)"/>
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="700" fill="#374151">${w.progress}%</text>
        </svg>
        <p>week ${w.week}</p>
      </div>`;
  }).join('');
}

// ── Top Habits Table ──
function buildTopHabits() {
  const top = (state.stats?.habitStats || []).slice(0, 10);
  const rows = top.length
    ? top.map((h, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><span class="top-dot" style="background:${h.color}"></span>${esc(h.name)}</td>
          <td style="text-align:right;font-weight:600">${h.progress}%</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="text-align:center;color:#d1d5db;padding:16px">No data yet</td></tr>`;

  return `
    <div class="top-card">
      <div class="top-card-header"><p>Top 10 Habits</p></div>
      <div style="padding:4px 4px">
        <table class="top-table">
          <thead><tr>
            <th style="width:20px">#</th>
            <th>daily habit</th>
            <th style="text-align:right">progress</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

// ── Habit Grid ──
function buildGrid() {
  const { habits, year, month } = state;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = getWeeks(year, month);

  let html = `<table class="habit-table">`;

  // Week header row
  html += `<thead><tr>
    <th class="sticky-col" style="padding:0"></th>`;
  weeks.forEach((_, wi) => {
    html += `<th colspan="7" class="week-th" style="background:${WEEK_BG[wi]}">week ${wi + 1}</th>`;
  });
  html += `</tr>`;

  // Day header row
  html += `<tr><th class="sticky-col" style="padding:0"></th>`;
  weeks.forEach((week, wi) => {
    week.forEach((d, di) => {
      const isToday = d && fmtD(year, month, d) === todayStr;
      html += `<th class="day-th" style="background:${WEEK_BG[wi]}">
        <div class="day-abbr">${d ? DAY_ABBR[di] : ''}</div>
        <div class="day-num ${isToday ? 'today' : ''}">${d || ''}</div>
      </th>`;
    });
  });
  html += `</tr></thead><tbody>`;

  // Habit rows
  habits.forEach((habit, hi) => {
    html += `<tr>
      <td class="sticky-col">
        <div class="habit-label-cell">
          <span class="habit-num">${hi + 1}</span>
          <span class="habit-dot" style="background:${habit.color}"></span>
          <span class="habit-text" title="${esc(habit.name)}">${esc(habit.name)}</span>
        </div>
      </td>`;
    weeks.forEach((week, wi) => {
      week.forEach((d) => {
        if (!d) {
          html += `<td style="background:${WEEK_BG[wi]}33"></td>`;
        } else {
          const dateStr = fmtD(year, month, d);
          const done = isDone(habit, dateStr);
          html += `<td class="cell" style="background:${WEEK_BG[wi]}33">
            <div class="habit-cell ${done ? 'done' : ''}"
              style="${done ? `background:${habit.color}` : ''}"
              data-id="${habit._id}" data-date="${dateStr}">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </td>`;
        }
      });
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

// ── Attach Grid Click Events ──
function attachGridEvents() {
  document.querySelectorAll('.habit-cell[data-id]').forEach(cell => {
    cell.addEventListener('click', async () => {
      const id = cell.dataset.id;
      const date = cell.dataset.date;
      const wasDone = cell.classList.contains('done');
      const habit = state.habits.find(h => h._id === id);

      // Optimistic update
      cell.classList.toggle('done', !wasDone);
      if (!wasDone) cell.style.background = habit?.color || '#7c3aed';
      else cell.style.background = '';

      try {
        const updated = await HabitAPI.toggle(id, date);
        state.habits = state.habits.map(h => h._id === id ? updated : h);
        // Refresh stats silently
        state.stats = await HabitAPI.stats(state.year, state.month);
        // Update rings + ring card + top habits without full re-render
        document.getElementById('weekRings').innerHTML = buildWeekRings();
        document.querySelector('.progress-card').outerHTML; // trigger read
        refreshStatsUI();
      } catch {
        // Revert on error
        cell.classList.toggle('done', wasDone);
        cell.style.background = wasDone ? (habit?.color || '#7c3aed') : '';
        toast('Failed to update', 'error');
      }
    });
  });
}

function refreshStatsUI() {
  const dp = state.stats?.dailyProgress ?? 0;
  const tc = state.stats?.totalCompleted ?? 0;
  const tp = state.stats?.totalPossible  ?? 0;
  document.querySelector('.progress-card').outerHTML = buildProgressRing(dp, tc, tp);
  document.querySelector('.top-card').outerHTML = buildTopHabits();
  document.getElementById('weekRings').innerHTML = buildWeekRings();
  if (document.getElementById('progressTable')) {
    document.getElementById('progressTable').outerHTML = buildProgressTable();
  }
  renderChart();
}

// ── Daily Progress Summary ──
function buildProgressTable() {
  const { stats, habits, year, month } = state;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows = (stats?.habitStats || []).map((h, i) => {
    const habit = habits.find(hb => hb._id === h._id);
    const streak = calcStreak(habit, year, month);
    return `<tr>
      <td>${i + 1}</td>
      <td><span class="habit-dot" style="background:${h.color};display:inline-block;margin-right:6px"></span>${esc(h.name)}</td>
      <td>${daysInMonth}</td>
      <td>
        <div class="progress-bar-wrap">
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${h.progress}%;background:${h.color}"></div></div>
          <span style="font-size:11px;color:#6b7280;min-width:36px;text-align:right">${h.progress}%</span>
        </div>
      </td>
      <td>${h.completed}/${daysInMonth}</td>
      <td>${streak} 🔥</td>
    </tr>`;
  }).join('');

  return `
    <div class="progress-table-card" id="progressTable">
      <div class="grid-card-header"><p>Daily Progress</p></div>
      <div style="overflow-x:auto">
        <table class="prog-table">
          <thead><tr>
            <th>#</th><th>Habit</th><th>Goal</th><th>Progress</th><th>Count</th><th>Streak</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function calcStreak(habit, year, month) {
  if (!habit) return 0;
  const today = new Date();
  let d = new Date(year, month + 1, 0); // last day of month
  if (d > today) d = new Date(today);
  let streak = 0;
  while (d.getMonth() === month) {
    const ds = fmtD(d.getFullYear(), d.getMonth(), d.getDate());
    if (habit.logs.find(l => l.date === ds && l.completed)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

// ── Chart.js Bar Chart ──
function renderChart() {
  const canvas = document.getElementById('weeklyChart');
  if (!canvas) return;
  if (state.chart) { state.chart.destroy(); state.chart = null; }

  const { habits, year, month } = state;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = getWeeks(year, month);

  const labels = [], data = [], colors = [];
  weeks.forEach((week, wi) => {
    week.forEach(d => {
      if (!d) return;
      const dateStr = fmtD(year, month, d);
      const completed = habits.filter(h => isDone(h, dateStr)).length;
      const pct = habits.length ? Math.round((completed / habits.length) * 100) : 0;
      labels.push(d);
      data.push(pct);
      colors.push(WEEK_COLORS[wi] || '#93c5fd');
    });
  });

  state.chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data, backgroundColor: colors, borderRadius: 3, barThickness: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw}%` } } },
      scales: {
        x: { ticks: { font: { size: 9 }, color: '#9ca3af' }, grid: { display: false } },
        y: { display: false, max: 100 }
      }
    }
  });
}

// ── Month Navigation ──
function changeMonth(dir) {
  let m = state.month + dir, y = state.year;
  if (m < 0)  { m = 11; y--; }
  if (m > 11) { m = 0;  y++; }
  state.month = m; state.year = y;
  renderDashboard();
}
function goToday() {
  state.year = new Date().getFullYear();
  state.month = new Date().getMonth();
  renderDashboard();
}

// ── Init ──
(async () => {
  if (!requireAuth()) return;
  renderSidebar('dashboard');
  // Refresh user from server
  try { const u = await AuthAPI.getMe(); setUser(u); renderSidebar('dashboard'); } catch {}
  renderDashboard();
})();