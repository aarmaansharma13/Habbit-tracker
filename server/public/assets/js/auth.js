// ── Toast ──
function toast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 350);
  }, 3000);
}

// ── User Storage ──
function getUser()       { try { return JSON.parse(localStorage.getItem('ht_user') || 'null'); } catch { return null; } }
function setUser(u)      { localStorage.setItem('ht_user', JSON.stringify(u)); }
function getToken()      { return localStorage.getItem('ht_token'); }
function setToken(t)     { localStorage.setItem('ht_token', t); }
function clearSession()  { localStorage.removeItem('ht_token'); localStorage.removeItem('ht_user'); }

// ── Route Guards ──
function requireAuth() {
  if (!getToken()) { window.location.href = '/index.html'; return false; }
  return true;
}
function redirectIfAuth() {
  if (getToken()) window.location.href = '/dashboard.html';
}

// ── Logout ──
function logout() {
  clearSession();
  toast('Logged out', 'info');
  setTimeout(() => window.location.href = '/index.html', 400);
}

// ── Render Sidebar ──
function renderSidebar(activePage) {
  const user = getUser();
  const avatarHtml = user?.avatar
    ? `<img src="${user.avatar}" class="avatar-img" alt="avatar">`
    : `<div class="avatar-init">${(user?.name?.[0] || '?').toUpperCase()}</div>`;

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = `
    <div>
      <div class="sidebar-logo">✅ <span>HabitFlow</span></div>
      <p class="sidebar-tagline">Stay consistent. Grow daily.</p>
      <nav class="sidebar-nav">
        <a href="/dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
        <a href="/habits.html"    class="${activePage === 'habits'    ? 'active' : ''}">✅ My Habits</a>
      </nav>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        ${avatarHtml}
        <div>
          <p class="user-name">${user?.name || 'User'}</p>
          <p class="user-email">${user?.email || ''}</p>
        </div>
      </div>
      <button class="btn-logout" onclick="logout()">🚪 Sign Out</button>
    </div>
  `;
}

// ── Spinner ──
function spinner() {
  return `<div class="loading-wrap"><div class="spinner"></div></div>`;
}