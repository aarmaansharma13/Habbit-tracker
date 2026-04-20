// ─────────────────────────────────────────────
//  HabitFlow — habits.js
//  Manage Habits page: Add / Edit / Delete
// ─────────────────────────────────────────────

const COLORS = [
  '#93c5fd', '#f9a8d4', '#fde68a', '#6ee7b7',
  '#c4b5fd', '#fb923c', '#a5f3fc', '#fca5a5',
  '#d9f99d', '#fbcfe8', '#bfdbfe', '#99f6e4'
];

// ── Page State ──
let habits       = [];
let selectedColor = COLORS[0];
let editingId    = null;
let editColor    = null;

// ── Escape HTML ──
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Spinner HTML ──
function spinnerHTML() {
  return `<div style="padding:40px;text-align:center">
    <div class="spinner" style="margin:auto"></div>
  </div>`;
}

// ─────────────────────────────────────────────
//  RENDER PAGE SHELL
// ─────────────────────────────────────────────
function renderPage() {
  document.getElementById('habitsContent').innerHTML = `
    <div class="habits-page">

      <h2 class="section-title">My Habits</h2>
      <p class="section-sub">Manage your daily habits and their tracking colors</p>

      <!-- ── Add Habit Card ── -->
      <div class="card">
        <h3>➕ Add New Habit</h3>
        <div class="add-form-grid">

          <div class="form-group" style="margin:0">
            <label for="habitNameInput">Habit Name</label>
            <input
              type="text"
              id="habitNameInput"
              placeholder="e.g. Read 1 Hour, Drink 3L Water, Workout…"
              style="width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;
                     border-radius:10px;font-size:14px;outline:none;
                     transition:border-color .2s;font-family:inherit"
              onfocus="this.style.borderColor='#7c3aed'"
              onblur="this.style.borderColor='#e5e7eb'"
            />
          </div>

          <div>
            <label style="font-size:13px;font-weight:500;color:#374151;
                          display:block;margin-bottom:8px">Choose Color</label>
            <div class="color-picker" id="colorPicker">
              ${buildColorSwatches(selectedColor)}
            </div>
          </div>

          <button class="btn-add" id="addBtn" onclick="addHabit()">
            + Add Habit
          </button>

        </div>
      </div>

      <!-- ── Habits List Card ── -->
      <div class="habits-list-card">
        <div class="habits-list-header">
          <p id="habitCount">Loading…</p>
        </div>
        <div id="habitsList">${spinnerHTML()}</div>
      </div>

    </div>
  `;

  // Color picker click (add form)
  document.getElementById('colorPicker').addEventListener('click', (e) => {
    const sw = e.target.closest('.color-swatch');
    if (!sw) return;
    selectedColor = sw.dataset.color;
    document.getElementById('colorPicker').innerHTML = buildColorSwatches(selectedColor);
  });

  // Enter key on name input
  document.getElementById('habitNameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addHabit();
  });

  loadHabits();
}

// ─────────────────────────────────────────────
//  BUILD COLOR SWATCHES HTML
// ─────────────────────────────────────────────
function buildColorSwatches(activeColor) {
  return COLORS.map(c => `
    <div
      class="color-swatch ${c === activeColor ? 'selected' : ''}"
      data-color="${c}"
      style="background:${c}"
      title="${c}"
    ></div>
  `).join('');
}

// ─────────────────────────────────────────────
//  BUILD EDIT-ROW COLOR SWATCHES (smaller)
// ─────────────────────────────────────────────
function buildEditSwatches(activeColor) {
  return COLORS.map(c => `
    <div
      class="color-swatch ${c === activeColor ? 'selected' : ''}"
      data-c="${c}"
      style="background:${c};width:20px;height:20px;cursor:pointer;
             border-radius:50%;border:2px solid ${c === activeColor ? '#374151' : 'transparent'};
             transition:transform .15s;display:inline-block"
      onclick="pickEditColor('${c}')"
      title="${c}"
    ></div>
  `).join('');
}

// ─────────────────────────────────────────────
//  LOAD HABITS FROM API
// ─────────────────────────────────────────────
async function loadHabits() {
  try {
    habits = await HabitAPI.getAll();
    renderList();
  } catch (err) {
    toast('Failed to load habits: ' + err.message, 'error');
    document.getElementById('habitsList').innerHTML = `
      <p style="padding:20px;color:#ef4444;font-size:14px">
        ❌ Could not load habits. Please refresh.
      </p>`;
  }
}

// ─────────────────────────────────────────────
//  RENDER THE HABITS LIST
// ─────────────────────────────────────────────
function renderList() {
  const count = habits.length;
  document.getElementById('habitCount').textContent =
    `${count} Habit${count !== 1 ? 's' : ''} Tracked`;

  if (!count) {
    document.getElementById('habitsList').innerHTML = `
      <div class="empty-state">
        <div class="emoji">🌱</div>
        <p>No habits yet. Add your first one above!</p>
      </div>`;
    return;
  }

  document.getElementById('habitsList').innerHTML =
    habits.map((h, i) => buildRow(h, i)).join('');

  // Attach edit buttons
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => startEdit(btn.dataset.edit));
  });

  // Attach delete buttons
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () =>
      deleteHabit(btn.dataset.delete, btn.dataset.name)
    );
  });
}

// ─────────────────────────────────────────────
//  BUILD A SINGLE HABIT ROW
// ─────────────────────────────────────────────
function buildRow(h, i) {
  if (editingId === h._id) return buildEditRow(h, i);

  return `
    <div class="habit-list-item" id="row-${h._id}">
      <span class="habit-idx">${i + 1}</span>
      <span class="habit-color-dot" style="background:${h.color}"></span>
      <span class="habit-name">${esc(h.name)}</span>
      <div class="item-actions">
        <button
          class="btn-icon edit"
          data-edit="${h._id}"
          title="Edit habit"
          style="transition:all .2s"
          onmouseover="this.style.background='#ede9fe';this.style.color='#7c3aed'"
          onmouseout="this.style.background='';this.style.color=''"
        >✏️</button>
        <button
          class="btn-icon delete"
          data-delete="${h._id}"
          data-name="${esc(h.name)}"
          title="Delete habit"
          style="transition:all .2s"
          onmouseover="this.style.background='#fef2f2';this.style.color='#ef4444'"
          onmouseout="this.style.background='';this.style.color=''"
        >🗑️</button>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
//  BUILD INLINE EDIT ROW
// ─────────────────────────────────────────────
function buildEditRow(h, i) {
  // Use current editColor if set, otherwise the habit's own color
  const active = editColor !== null ? editColor : h.color;

  return `
    <div class="habit-edit-row" id="row-${h._id}">

      <span class="habit-idx">${i + 1}</span>

      <input
        type="text"
        id="editInput"
        value="${esc(h.name)}"
        style="flex:1;min-width:130px;padding:8px 12px;
               border:1.5px solid #7c3aed;border-radius:10px;
               font-size:13px;outline:none;font-family:inherit"
        onkeydown="if(event.key==='Enter') saveEdit('${h._id}');
                   if(event.key==='Escape') cancelEdit()"
      />

      <!-- Color swatches (small) -->
      <div id="editColorPicker"
        style="display:flex;flex-wrap:wrap;gap:4px;max-width:200px">
        ${buildEditSwatches(active)}
      </div>

      <button class="btn-save"   onclick="saveEdit('${h._id}')">Save</button>
      <button class="btn-cancel" onclick="cancelEdit()">Cancel</button>

    </div>`;
}

// ─────────────────────────────────────────────
//  PICK EDIT COLOR (called from inline onclick)
// ─────────────────────────────────────────────
function pickEditColor(color) {
  editColor = color;
  // Update swatch styles without full re-render
  document.querySelectorAll('[data-c]').forEach(el => {
    const isActive = el.dataset.c === color;
    el.classList.toggle('selected', isActive);
    el.style.border = `2px solid ${isActive ? '#374151' : 'transparent'}`;
    el.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
  });
}

// ─────────────────────────────────────────────
//  START EDITING A HABIT
// ─────────────────────────────────────────────
function startEdit(id) {
  editingId = id;
  editColor = null; // will be set to habit color in buildEditRow
  renderList();
  // Focus the input after render
  const input = document.getElementById('editInput');
  if (input) {
    input.focus();
    input.select();
  }
}

// ─────────────────────────────────────────────
//  CANCEL EDITING
// ─────────────────────────────────────────────
function cancelEdit() {
  editingId = null;
  editColor = null;
  renderList();
}

// ─────────────────────────────────────────────
//  SAVE EDIT
// ─────────────────────────────────────────────
async function saveEdit(id) {
  const input = document.getElementById('editInput');
  if (!input) return;
  const name = input.value.trim();

  if (!name) {
    toast('Habit name cannot be empty', 'error');
    input.focus();
    return;
  }

  // Use editColor if changed, otherwise keep original
  const habit = habits.find(h => h._id === id);
  const color = editColor !== null ? editColor : habit?.color;

  const btn = document.querySelector('.btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    const updated = await HabitAPI.update(id, { name, color });
    habits = habits.map(h => h._id === id ? updated : h);
    editingId = null;
    editColor = null;
    renderList();
    toast('Habit updated! ✅');
  } catch (err) {
    toast('Failed to update: ' + err.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
  }
}

// ─────────────────────────────────────────────
//  ADD HABIT
// ─────────────────────────────────────────────
async function addHabit() {
  const input = document.getElementById('habitNameInput');
  const name  = input.value.trim();

  if (!name) {
    toast('Please enter a habit name', 'error');
    input.focus();
    return;
  }

  const btn = document.getElementById('addBtn');
  btn.disabled    = true;
  btn.textContent = 'Adding…';

  try {
    const habit = await HabitAPI.create({ name, color: selectedColor });
    habits.push(habit);

    // Reset input
    input.value   = '';
    selectedColor = COLORS[habits.length % COLORS.length];
    document.getElementById('colorPicker').innerHTML =
      buildColorSwatches(selectedColor);

    renderList();
    toast(`"${name}" added! 🎉`);
    input.focus();
  } catch (err) {
    toast('Failed to add habit: ' + err.message, 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '+ Add Habit';
  }
}

// ─────────────────────────────────────────────
//  DELETE HABIT
// ─────────────────────────────────────────────
async function deleteHabit(id, name) {
  const confirmed = confirm(
    `Delete "${name}"?\n\nAll daily logs for this habit will be permanently removed. This cannot be undone.`
  );
  if (!confirmed) return;

  try {
    await HabitAPI.remove(id);
    habits = habits.filter(h => h._id !== id);
    // If we were editing this item, cancel edit state
    if (editingId === id) { editingId = null; editColor = null; }
    renderList();
    toast(`"${name}" deleted`);
  } catch (err) {
    toast('Failed to delete: ' + err.message, 'error');
  }
}

// ─────────────────────────────────────────────
//  INIT — runs when page loads
// ─────────────────────────────────────────────
(() => {
  if (!requireAuth()) return;   // redirect to login if no token
  renderSidebar('habits');      // draw sidebar with "My Habits" active

  // Refresh user info from server (updates name/avatar if changed)
  AuthAPI.getMe()
    .then(u => { setUser(u); renderSidebar('habits'); })
    .catch(() => {}); // silent fail — already guarded above

  renderPage();
})();