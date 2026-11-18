const ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const BASE = ORIGIN + '/api';
export const imgSrc = (u) => (u ? (u.startsWith('http') ? u : ORIGIN + u) : null);
let token = localStorage.getItem('tw-token');
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('tw-user'));
  } catch {
    return null;
  }
};
async function call(path, method = 'GET', body) {
  const r = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok)
    throw Object.assign(new Error(d.error || 'Something went wrong'), { status: r.status });
  return d;
}
async function upload(file) {
  const fd = new FormData();
  fd.append('file', file);
  const r = await fetch(BASE + '/admin/uploads', {
    method: 'POST',
    headers: token ? { Authorization: 'Bearer ' + token } : {},
    body: fd,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Upload failed');
  return d;
}
const keep = (r) => {
  token = r.token;
  localStorage.setItem('tw-token', token);
  localStorage.setItem('tw-user', JSON.stringify(r.user));
  return r;
};
export const api = {
  login: (email, password) => call('/auth/login', 'POST', { email, password }).then(keep),
  signup: (name, email, password) =>
    call('/auth/signup', 'POST', { name, email, password }).then(keep),
  logout() {
    token = null;
    localStorage.removeItem('tw-token');
    localStorage.removeItem('tw-user');
  },
  products: () => call('/products'),
  message: (b) => call('/messages', 'POST', b),
  ai: (prompt) => call('/ai/generate', 'POST', { prompt }),
  order: (b) => call('/orders', 'POST', b),
  admin: {
    upload,
    orders: () => call('/admin/orders'),
    status: (id, s) => call('/admin/orders/' + id + '/status', 'PATCH', { status: s }),
    products: () => call('/admin/products'),
    addProduct: (b) => call('/admin/products', 'POST', b),
    saveProduct: (id, b) => call('/admin/products/' + id, 'PUT', b),
    delProduct: (id) => call('/admin/products/' + id, 'DELETE'),
    users: () => call('/admin/users'),
    role: (id, r) => call('/admin/users/' + id + '/role', 'PATCH', { role: r }),
    messages: () => call('/admin/messages'),
  },
};
