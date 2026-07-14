/* global state */
let state = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
};

/* DOM refs */
const $ = (sel) => document.querySelector(sel);
const authSection = $('#authSection');
const dashboardSection = $('#dashboardSection');
const navbar = $('#navbar');
const authTitle = $('#authTitle');
const authSubtitle = $('#authSubtitle');
const authForm = $('#authForm');
const authSubmit = $('#authSubmit');
const authToggle = $('#authToggle');
const authToggleText = $('#authToggleText');
const nameField = $('#nameField');
const nameInput = $('#nameInput');
const emailInput = $('#emailInput');
const passwordInput = $('#passwordInput');
const authError = $('#authError');
const userDisplay = $('#userDisplay');
const taskForm = $('#taskForm');
const taskTitle = $('#taskTitle');
const taskDesc = $('#taskDesc');
const taskStatus = $('#taskStatus');
const taskPriority = $('#taskPriority');
const taskList = $('#taskList');
const filterStatus = $('#filterStatus');
const logoutBtn = $('#logoutBtn');
const toast = $('#toast');

let isRegister = false;
let toastTimer = null;

/* ── Event listeners ── */

authToggle.addEventListener('click', toggleAuth);
logoutBtn.addEventListener('click', logout);
filterStatus.addEventListener('change', loadTasks);

/* Event delegation for task cards */
taskList.addEventListener('change', (e) => {
  const checkbox = e.target.closest('.task-card input[type="checkbox"]');
  if (checkbox) {
    const card = checkbox.closest('.task-card');
    toggleDone(card.dataset.id, checkbox.checked);
  }
});

taskList.addEventListener('click', (e) => {
  const card = e.target.closest('.task-card');
  if (!card) return;
  if (e.target.closest('.btn-icon.danger')) {
    deleteTask(card.dataset.id);
  } else if (e.target.closest('.btn-icon:not(.danger)')) {
    editTask(card.dataset.id);
  }
});

/* ── API helpers ── */

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error?.message || 'Request failed');
  }

  return body;
}

/* ── Toast ── */

function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3000);
}

/* ── Auth ── */

function toggleAuth(e) {
  if (e) e.preventDefault();
  isRegister = !isRegister;

  if (isRegister) {
    authTitle.textContent = 'Create account';
    authSubtitle.textContent = 'to start using TaskHub';
    authSubmit.textContent = 'Create account';
    authToggleText.textContent = 'Already have an account?';
    authToggle.textContent = 'Sign in';
    nameField.classList.remove('hidden');
  } else {
    authTitle.textContent = 'Sign in';
    authSubtitle.textContent = 'to continue to TaskHub';
    authSubmit.textContent = 'Sign in';
    authToggleText.textContent = "Don't have an account?";
    authToggle.textContent = 'Create one';
    nameField.classList.add('hidden');
  }

  authError.classList.add('hidden');
}

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.classList.add('hidden');
  authSubmit.disabled = true;
  authSubmit.textContent = isRegister ? 'Creating...' : 'Signing in...';

  try {
    const body = {
      email: emailInput.value.trim(),
      password: passwordInput.value,
    };
    if (isRegister) {
      body.name = nameInput.value.trim();
      if (!body.name) throw new Error('Name is required');
    }

    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const data = await api(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    showDashboard();
  } catch (err) {
    authError.textContent = err.message;
    authError.classList.remove('hidden');
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = isRegister ? 'Create account' : 'Sign in';
  }
});

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showAuth();
}

/* ── UI state ── */

function showAuth() {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  navbar.classList.add('hidden');
  // Reset form
  authForm.reset();
  if (isRegister) toggleAuth();
}

function showDashboard() {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  navbar.classList.remove('hidden');
  userDisplay.textContent = state.user?.name || state.user?.email || '';
  loadTasks();
}

/* ── Tasks ── */

async function loadTasks() {
  try {
    const tasks = await api('/tasks');
    renderTasks(tasks);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTasks(tasks) {
  const status = filterStatus.value;
  if (status !== 'all') {
    tasks = tasks.filter((t) => t.status === status);
  }

  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="empty-state">No tasks found.</p>';
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (t) => `
    <div class="task-card" data-id="${t.id}">
      <div class="task-check">
        <input type="checkbox" ${t.status === 'done' ? 'checked' : ''}>
      </div>
      <div class="task-body">
        <div class="task-title">${esc(t.title)}</div>
        ${t.description ? `<div class="task-desc">${esc(t.description)}</div>` : ''}
        <div class="task-meta">
          <span class="badge badge-${t.status}">${esc(t.status.replace('_', ' '))}</span>
          <span class="badge badge-${t.priority}">${esc(t.priority)}</span>
          ${t.attachment_url ? `<span class="badge">📎 file</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon" title="Edit">✏️</button>
        <button class="btn-icon danger" title="Delete">🗑️</button>
      </div>
    </div>
  `
    )
    .join('');
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitle.value.trim();
  if (!title) return;

  try {
    await api('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        description: taskDesc.value.trim() || null,
        status: taskStatus.value,
        priority: taskPriority.value,
      }),
    });

    taskTitle.value = '';
    taskDesc.value = '';
    taskStatus.value = 'todo';
    taskPriority.value = 'medium';
    showToast('Task created');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function toggleDone(id, checked) {
  try {
    await api(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: checked ? 'done' : 'todo' }),
    });
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    await api(`/tasks/${id}`, { method: 'DELETE' });
    showToast('Task deleted');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function editTask(id) {
  const title = prompt('Task title:');
  if (!title || !title.trim()) return;
  try {
    await api(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: title.trim() }),
    });
    showToast('Task updated');
    loadTasks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Init ── */

if (state.token) {
  showDashboard();
} else {
  showAuth();
}
