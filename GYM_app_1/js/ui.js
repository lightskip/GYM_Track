/* ============================================================
   ui.js — Shared UI utilities
   ============================================================ */

// ---- Toast ----
let _toastTimer = null;
function showToast(msg, duration = 2500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

// ---- Modal helpers ----
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  // Only restore scroll if no other modals are open
  const anyOpen = [...document.querySelectorAll('.modal-overlay')].some(m => !m.classList.contains('hidden'));
  if (!anyOpen) document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
  document.body.style.overflow = '';
}

// Each overlay click closes ONLY that overlay (not all modals)
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// Each close button closes ONLY its own modal
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const overlay = btn.closest('.modal-overlay');
    if (overlay) closeModal(overlay.id);
  });
});

// ---- Page navigation ----
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Trigger page-specific refresh
  window.dispatchEvent(new CustomEvent('pagechange', { detail: pageId }));
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

// ---- Dark mode ----
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  document.getElementById('btn-dark-toggle').textContent = dark ? '☀️' : '🌙';
}

document.getElementById('btn-dark-toggle').addEventListener('click', async () => {
  const isDark = document.body.classList.contains('dark');
  applyTheme(!isDark);
  await DB.setSetting('darkMode', !isDark);
});

// ---- Settings modal ----
document.getElementById('btn-settings').addEventListener('click', () => {
  loadSettings();
  openModal('modal-settings');
});

async function loadSettings() {
  const unit = await DB.getSetting('unit', 'kg');
  const rest = await DB.getSetting('restTimer', 90);
  document.getElementById('setting-unit').value = unit;
  document.getElementById('setting-rest').value = rest;
}

document.getElementById('setting-unit').addEventListener('change', async e => {
  await DB.setSetting('unit', e.target.value);
  showToast('Unit saved');
});

document.getElementById('setting-rest').addEventListener('change', async e => {
  await DB.setSetting('restTimer', parseInt(e.target.value));
  showToast('Rest timer saved');
});

// ---- Export ----
document.getElementById('btn-export').addEventListener('click', async () => {
  const data = await DB.exportAll();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymtrack-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported');
});

// ---- Import ----
document.getElementById('btn-import').addEventListener('change', async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.workouts) throw new Error('Invalid file');
    await DB.importAll(data);
    showToast('Data imported successfully');
    closeAllModals();
    window.location.reload();
  } catch (err) {
    showToast('Import failed: ' + err.message);
  }
  e.target.value = '';
});

// ---- Clear data ----
document.getElementById('btn-clear-data').addEventListener('click', async () => {
  if (!confirm('Delete all workouts and templates? The exercise library will be kept. This cannot be undone.')) return;
  await DB.clear('workouts');
  await DB.clear('templates');
  showToast('All workouts and templates cleared');
  closeAllModals();
  window.location.reload();
});

// ---- Rest Timer ----
let _timerInterval = null;
let _timerRemaining = 90;
let _timerTotal = 90;

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent = formatTimer(_timerRemaining);
}

document.getElementById('btn-timer-start').addEventListener('click', () => {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
    document.getElementById('btn-timer-start').textContent = '▶ Start';
    return;
  }
  document.getElementById('btn-timer-start').textContent = '⏸ Pause';
  _timerInterval = setInterval(() => {
    _timerRemaining--;
    updateTimerDisplay();
    if (_timerRemaining <= 0) {
      clearInterval(_timerInterval);
      _timerInterval = null;
      document.getElementById('btn-timer-start').textContent = '▶ Start';
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      showToast('⏰ Rest time is up!');
    }
  }, 1000);
});

document.getElementById('btn-timer-reset').addEventListener('click', () => {
  clearInterval(_timerInterval);
  _timerInterval = null;
  _timerRemaining = _timerTotal;
  updateTimerDisplay();
  document.getElementById('btn-timer-start').textContent = '▶ Start';
});

document.querySelectorAll('.timer-presets .btn').forEach(btn => {
  btn.addEventListener('click', () => {
    clearInterval(_timerInterval);
    _timerInterval = null;
    _timerTotal = parseInt(btn.dataset.secs);
    _timerRemaining = _timerTotal;
    updateTimerDisplay();
    document.getElementById('btn-timer-start').textContent = '▶ Start';
  });
});

async function openTimer() {
  const defaultRest = await DB.getSetting('restTimer', 90);
  _timerTotal = defaultRest;
  _timerRemaining = defaultRest;
  updateTimerDisplay();
  openModal('modal-timer');
}

// ---- Exercise Picker ----
let _pickerCallback = null;
let _pickerFilter = 'All';

async function openExercisePicker(callback) {
  _pickerCallback = callback;
  _pickerFilter = 'All';
  document.getElementById('picker-search').value = '';

  // Reset filter chips
  document.querySelectorAll('#picker-filter-tags .tag-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.tag === 'All');
  });

  await renderPickerList('', 'All');
  openModal('modal-exercise-picker');
  setTimeout(() => document.getElementById('picker-search').focus(), 100);
}

async function renderPickerList(query, muscle) {
  const exercises = await DB.getAll('exercises');
  const list = document.getElementById('picker-list');

  let filtered = exercises;
  if (muscle && muscle !== 'All') {
    filtered = filtered.filter(e => e.muscle === muscle);
  }
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(e => e.name.toLowerCase().includes(q));
  }
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No exercises found</p></div>`;
    return;
  }

  list.innerHTML = filtered.map(e => `
    <div class="picker-item" data-name="${e.name}" data-equipment="${e.equipment || ''}">
      <div>
        <div class="picker-item-name">${e.name}</div>
        <div class="picker-item-meta">${e.muscle} · ${e.equipment || ''}</div>
      </div>
      <span class="exercise-item-tag">${e.muscle}</span>
    </div>
  `).join('');

  list.querySelectorAll('.picker-item').forEach(item => {
    item.addEventListener('click', () => {
      if (_pickerCallback) {
        _pickerCallback({ name: item.dataset.name, equipment: item.dataset.equipment });
      }
      closeModal('modal-exercise-picker');
    });
  });
}

document.getElementById('picker-search').addEventListener('input', e => {
  renderPickerList(e.target.value, _pickerFilter);
});

document.querySelectorAll('#picker-filter-tags .tag-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#picker-filter-tags .tag-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    _pickerFilter = chip.dataset.tag;
    renderPickerList(document.getElementById('picker-search').value, _pickerFilter);
  });
});

// ---- Workout Detail Modal ----
let _detailWorkoutId = null;

async function openWorkoutDetail(workoutId) {
  _detailWorkoutId = workoutId;
  const workout = await DB.get('workouts', workoutId);
  if (!workout) return;

  const unit = await DB.getSetting('unit', 'kg');

  document.getElementById('detail-title').textContent =
    `${workout.name || 'Workout'} — ${formatDate(workout.date)}`;

  const content = document.getElementById('detail-content');

  if (workout.tags && workout.tags.length) {
    content.innerHTML = `<div class="tag-row" style="margin-bottom:12px">${
      workout.tags.map(t => `<span class="tag-chip active">${t}</span>`).join('')
    }</div>`;
  } else {
    content.innerHTML = '';
  }

  workout.exercises.forEach(ex => {
    const div = document.createElement('div');
    div.className = 'detail-exercise';

    const SET_TYPE_LABEL = { normal: '', warmup: 'W', failure: 'F', drop: 'D' };
    const SET_TYPE_COLOR = { warmup: 'var(--blue)', failure: 'var(--accent)', drop: 'var(--yellow)' };

    div.innerHTML = `
      <div class="detail-ex-name">${ex.name} <span class="text-muted" style="font-weight:400;font-size:0.85rem">${ex.equipment || ''}</span></div>
      ${ex.sets.map((s, i) => {
        const typeLabel = SET_TYPE_LABEL[s.type] || '';
        const typeColor = SET_TYPE_COLOR[s.type] || '';
        const repsDisplay = s.type === 'failure' && (!s.reps || s.reps === 0)
          ? '<strong style="color:var(--accent)">Failure</strong>'
          : `<strong>${s.reps} reps</strong>`;
        return `
        <div class="detail-set-row">
          <span class="detail-set-num">Set ${i + 1}</span>
          ${typeLabel ? `<span class="detail-set-type" style="color:${typeColor}">${typeLabel}</span>` : ''}
          <strong>${s.weight} ${unit}</strong>
          <span>×</span>
          ${repsDisplay}
          ${s.notes ? `<span class="text-muted">— ${s.notes}</span>` : ''}
        </div>`;
      }).join('')}
      <div class="text-muted" style="font-size:0.78rem;margin-top:4px">
        Volume: ${calcVolume(ex.sets).toFixed(1)} ${unit}
      </div>
    `;
    content.appendChild(div);
  });

  if (workout.notes) {
    const notesDiv = document.createElement('div');
    notesDiv.className = 'card';
    notesDiv.style.marginTop = '12px';
    notesDiv.innerHTML = `<div class="card-title">Notes</div><p style="font-size:0.9rem">${workout.notes}</p>`;
    content.appendChild(notesDiv);
  }

  openModal('modal-workout-detail');
}

document.getElementById('btn-detail-duplicate').addEventListener('click', async () => {
  if (!_detailWorkoutId) return;
  const workout = await DB.get('workouts', _detailWorkoutId);
  if (!workout) return;

  closeAllModals();
  navigateTo('log');

  // Pre-fill log form with this workout
  setTimeout(() => prefillLogFromWorkout(workout), 100);
});

document.getElementById('btn-detail-delete').addEventListener('click', async () => {
  if (!_detailWorkoutId) return;
  if (!confirm('Delete this workout?')) return;
  await DB.delete('workouts', _detailWorkoutId);
  closeAllModals();
  showToast('Workout deleted');
  window.dispatchEvent(new CustomEvent('workoutschanged'));
});

// ---- Tag chip toggle (log page) ----
document.querySelectorAll('#log-tags .tag-chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});

// ---- Utility: get selected tags ----
function getSelectedTags(containerId) {
  return [...document.querySelectorAll(`#${containerId} .tag-chip.selected`)].map(c => c.dataset.tag);
}

function setSelectedTags(containerId, tags) {
  document.querySelectorAll(`#${containerId} .tag-chip`).forEach(c => {
    c.classList.toggle('selected', tags.includes(c.dataset.tag));
  });
}
