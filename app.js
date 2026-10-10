const STORAGE_KEY = 'kanban_flow_manager_data';
const SEED_DATA = {
  tasks: [
    { id: 't1', title: 'Design user onboarding flow', description: 'Create wireframes and user journey maps for first-time login.', priority: 'high', status: 'todo' },
    { id: 't2', title: 'Fix navigation header bug on mobile', description: 'Menu collapses incorrectly on viewports under 400px width.', priority: 'medium', status: 'in-progress' },
    { id: 't3', title: 'Setup local storage persistence', description: 'Ensure all tasks save seamlessly without data loss on refresh.', priority: 'high', status: 'done' },
    { id: 't4', title: 'Update documentation for API', description: 'Document new endpoints for task categorization.', priority: 'low', status: 'todo' }
  ],
  categories: ['Engineering', 'Design', 'Product']
};

let currentFilter = 'all';
let taskToDelete = null;

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveData(SEED_DATA);
    return SEED_DATA;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.categories) {
      parsed.categories = SEED_DATA.categories;
    }
    return parsed;
  } catch (e) {
    saveData(SEED_DATA);
    return SEED_DATA;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function initRouter() {
  const routes = document.querySelectorAll('.app-section');
  const navLinks = document.querySelectorAll('.nav-link');

  function handleRoute() {
    const hash = window.location.hash || '#board';
    routes.forEach(section => {
      if ('#' + section.id === hash) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
    navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    if (hash === '#analytics') {
      updateAnalytics();
    }
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function renderBoard() {
  const data = loadData();
  const listTodo = document.getElementById('list-todo');
  const listProgress = document.getElementById('list-in-progress');
  const listDone = document.getElementById('list-done');

  listTodo.innerHTML = '';
  listProgress.innerHTML = '';
  listDone.innerHTML = '';

  let total = data.tasks.length;
  let inProgress = 0;
  let completed = 0;

  data.tasks.forEach(task => {
    if (task.status === 'in-progress') inProgress++;
    if (task.status === 'done') completed++;

    if (currentFilter !== 'all' && task.priority !== currentFilter) {
      return;
    }

    const card = createTaskCard(task);
    if (task.status === 'todo') listTodo.appendChild(card);
    else if (task.status === 'in-progress') listProgress.appendChild(card);
    else if (task.status === 'done') listDone.appendChild(card);
  });

  document.getElementById('metric-total').textContent = total;
  document.getElementById('metric-progress').textContent = inProgress;
  document.getElementById('metric-completed').textContent = completed;
}

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  
  const header = document.createElement('div');
  header.className = 'task-header';
  
  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;
  
  const badge = document.createElement('span');
  badge.className = `badge badge-${task.priority}`;
  badge.textContent = task.priority;
  
  header.appendChild(title);
  header.appendChild(badge);
  card.appendChild(header);

  if (task.description) {
    const desc = document.createElement('p');
    desc.className = 'task-desc';
    desc.textContent = task.description;
    card.appendChild(desc);
  }

  const footer = document.createElement('div');
  footer.className = 'task-footer';
  
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  if (task.status !== 'todo') {
    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn btn-secondary btn-sm';
    btnPrev.textContent = '←';
    btnPrev.title = 'Move Back';
    btnPrev.addEventListener('click', () => moveTask(task.id, getPrevStatus(task.status)));
    actions.appendChild(btnPrev);
  }

  if (task.status !== 'done') {
    const btnNext = document.createElement('button');
    btnNext.className = 'btn btn-secondary btn-sm';
    btnNext.textContent = '→';
    btnNext.title = 'Move Forward';
    btnNext.addEventListener('click', () => moveTask(task.id, getNextStatus(task.status)));
    actions.appendChild(btnNext);
  }

  footer.appendChild(actions);

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn btn-danger btn-sm';
  btnDelete.textContent = 'Delete';
  btnDelete.addEventListener('click', () => promptDelete(task.id));
  footer.appendChild(btnDelete);

  card.appendChild(footer);
  return card;
}

function getNextStatus(status) {
  if (status === 'todo') return 'in-progress';
  if (status === 'in-progress') return 'done';
  return 'done';
}

function getPrevStatus(status) {
  if (status === 'done') return 'in-progress';
  if (status === 'in-progress') return 'todo';
  return 'todo';
}

function moveTask(id, newStatus) {
  const data = loadData();
  data.tasks = data.tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
  saveData(data);
  renderBoard();
}

function promptDelete(id) {
  taskToDelete = id;
  document.getElementById('confirm-modal').classList.add('active');
}

function updateAnalytics() {
  const data = loadData();
  const total = data.tasks.length;
  const completed = data.tasks.filter(t => t.status === 'done').length;
  const highPending = data.tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('stat-completion-rate').textContent = rate + '%';
  document.getElementById('stat-high-pending').textContent = highPending;

  let workload = 'Balanced';
  if (total > 8) workload = 'Heavy';
  else if (total < 3) workload = 'Light';
  document.getElementById('stat-workload').textContent = workload;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveData(SEED_DATA);
  }
  initRouter();
  renderBoard();

  // Mobile navigation toggle
  const navToggle = document.getElementById('nav-toggle');
  const appNav = document.getElementById('app-nav');
  if (navToggle && appNav) {
    navToggle.addEventListener('click', () => {
      appNav.classList.toggle('open');
    });
    // Close nav on click link
    appNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        appNav.classList.remove('open');
      });
    });
  }

  const modal = document.getElementById('task-modal');
  const openModalBtn = document.getElementById('open-task-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelTaskBtn = document.getElementById('cancel-task');
  const taskForm = document.getElementById('task-form');

  openModalBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
    taskForm.reset();
    document.getElementById('err-title').style.display = 'none';
  };

  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const priorityInput = document.getElementById('task-priority');
    const errTitle = document.getElementById('err-title');

    if (!titleInput.value.trim()) {
      errTitle.textContent = 'Task title is required.';
      errTitle.style.display = 'block';
      return;
    }
    errTitle.style.display = 'none';

    const newTask = {
      id: 't_' + Date.now(),
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      priority: priorityInput.value,
      status: 'todo'
    };

    const data = loadData();
    data.tasks.push(newTask);
    saveData(data);
    renderBoard();
    closeModal();
  });

  document.getElementById('priority-filter').addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderBoard();
  });

  const confirmModal = document.getElementById('confirm-modal');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');

  confirmNo.addEventListener('click', () => {
    confirmModal.classList.remove('active');
    taskToDelete = null;
  });

  confirmYes.addEventListener('click', () => {
    if (taskToDelete) {
      const data = loadData();
      data.tasks = data.tasks.filter(t => t.id !== taskToDelete);
      saveData(data);
      renderBoard();
    }
    confirmModal.classList.remove('active');
    taskToDelete = null;
  });

  document.getElementById('btn-reset-seed').addEventListener('click', () => {
    saveData(SEED_DATA);
    renderBoard();
    alert('Tasks restored to default seed state.');
  });

  document.getElementById('btn-clear-all').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all tasks?')) {
      const data = loadData();
      data.tasks = [];
      saveData(data);
      renderBoard();
    }
  });
});