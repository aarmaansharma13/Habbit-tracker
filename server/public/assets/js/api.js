const API = '/api';

async function request(method, endpoint, body = null) {
  const token = localStorage.getItem('ht_token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ── Auth ──
const AuthAPI = {
  register: (d)  => request('POST', '/auth/register', d),
  login:    (d)  => request('POST', '/auth/login', d),
  getMe:    ()   => request('GET',  '/auth/me'),
  updateAffirmation: (a) => request('PUT', '/auth/affirmation', { affirmation: a })
};

// ── Habits ──
const HabitAPI = {
  getAll:  ()          => request('GET',    '/habits'),
  create:  (d)         => request('POST',   '/habits', d),
  update:  (id, d)     => request('PUT',    `/habits/${id}`, d),
  remove:  (id)        => request('DELETE', `/habits/${id}`),
  toggle:  (id, date)  => request('POST',   `/habits/${id}/toggle`, { date }),
  stats:   (y, m)      => request('GET',    `/habits/stats?year=${y}&month=${m}`)
};