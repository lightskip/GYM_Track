/* ============================================================
   log.js — Log Workout page
   ============================================================ */

let _logExercises = []; // Array of exercise objects being built

function initLogPage() {
  // Set today's date
  document.getElementById('log-date').value = todayStr();

  // Clear exercises
  _logExercises = [];
  document.getElementById('log-exercises-container').innerHTML = '';
  document.getElementById('log-name').value = '';
  document.getElementById('log-notes').value = '';
  setSelectedTags('log-tags', []);
}

// ---- Add exercise button ----
document.getElementById('btn-add-exercise').addEventListener('click', () => {
  openExercisePicker(ex => addExerciseCard(ex.name, ex.equipment));
});

// ---- Load template button ----
document.getElementById('btn-load-template').addEventListener('click', async () => {
  const templates = await DB.getAll('templates');
  if (templates.length === 0) {
    showToast('No templates yet. Create one in the Plan tab.');
    return;
  }

  // Simple picker using a quick modal-like approach
  const names = templates.map(t => t.name);
  const choice = await quickPick('Load Template', templates.map(t => ({
    label: t.name,
    sub: t.exercises.length + ' exercises',
    value: t
  })));
  if (choice) prefillLogFromTemplate(choice);
});

// Quick pick helper (reuses exercise picker modal with custom items)
function quickPick(title, items) {
  return new Promise(resolve => {
    const list = document.getElementById('picker-list');
    const header = document.querySelector('#modal-exercise-picker .modal-header h2');
    const searchEl = document.getElementById('picker-search');
    const tagsEl = document.getElementById('picker-filter-tags');

    header.textContent = title;
    searchEl.style.display = 'none';
    tagsEl.style.display = 'none';

    function restorePicker() {
      header.textContent = 'Pick Exercise';
      searchEl.style.display = '';
      tagsEl.style.display = '';
    }

    // One-time cleanup: called whenever the picker closes (pick or dismiss)
    function onDone(value) {
      restorePicker();
      // Remove the temporary overlay listener we added
      overlay.removeEventListener('click', onOverlayClick);
      resolve(value);
    }

    list.innerHTML = items.map((item, i) => `
      <div class="picker-item" data-idx="${i}">
        <div>
          <div class="picker-item-name">${item.label}</div>
          <div class="picker-item-meta">${item.sub || ''}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.picker-item').forEach(el => {
      el.addEventListener('click', () => {
        closeModal('modal-exercise-picker');
        onDone(items[parseInt(el.dataset.idx)].value);
      });
    });

    // Catch overlay-backdrop click (fires before ui.js handler, same event)
    const overlay = document.getElementById('modal-exercise-picker');
    function onOverlayClick(e) {
      if (e.target === overlay) {
        onDone(null);
      }
    }
    overlay.addEventListener('click', onOverlayClick);

    openModal('modal-exercise-picker');
  });
}

function prefillLogFromTemplate(template) {
  document.getElementById('log-name').value = template.name || '';
  if (template.day !== undefined && template.day !== '') {
    // Don't set date from template
  }

  _logExercises = [];
  document.getElementById('log-exercises-container').innerHTML = '';

  template.exercises.forEach(ex => {
    addExerciseCard(ex.name, ex.equipment, ex.sets, ex.reps, ex.weight);
  });
}

async function prefillLogFromWorkout(workout) {
  document.getElementById('log-date').value = todayStr();
  document.getElementById('log-name').value = workout.name || '';
  document.getElementById('log-notes').value = '';
  setSelectedTags('log-tags', workout.tags || []);

  _logExercises = [];
  document.getElementById('log-exercises-container').innerHTML = '';

  for (const ex of workout.exercises) {
    // Add card with 0 default sets, then manually add the real sets
    await addExerciseCard(ex.name, ex.equipment, 0, 0, '');

    const container = document.getElementById('log-exercises-container');
    const cards = container.querySelectorAll('.exercise-card');
    const lastCard = cards[cards.length - 1];
    if (lastCard) {
      const exIdx = _logExercises.length - 1;
      ex.sets.forEach(s => {
        addSetRow(lastCard, exIdx, s.weight, s.reps, s.notes || '', s.type || 'normal');
      });
    }
  }
}

// ---- Add exercise card ----
async function addExerciseCard(name, equipment, defaultSets = 3, defaultReps = 10, defaultWeight = '') {
  const idx = _logExercises.length;
  _logExercises.push({ name, equipment: equipment || '', sets: [] });

  // Get last session for suggestion
  const lastSession = await getLastSession(name);
  const unit = await DB.getSetting('unit', 'kg');

  let suggestedWeight = defaultWeight;
  let prevHint = '';

  if (lastSession) {
    const suggested = suggestNextWeight(lastSession.sets, defaultReps);
    suggestedWeight = suggested || defaultWeight;
    const lastMax = calcMaxWeight(lastSession.sets);
    prevHint = `Last session: <strong>${lastMax} ${unit}</strong> × ${calcTotalReps(lastSession.sets)} reps (${formatDate(lastSession.date)})`;
    if (suggested && suggested > lastMax) {
      prevHint += ` <span class="suggestion-badge">↑ Try ${suggested} ${unit}</span>`;
    }
  }

  const card = document.createElement('div');
  card.className = 'exercise-card';
  card.dataset.idx = idx;
  card.innerHTML = `
    <div class="exercise-card-header">
      <div class="exercise-card-name">${name}</div>
      <div class="exercise-card-actions">
        <button class="icon-btn btn-timer-open" title="Rest timer">⏱</button>
        <button class="icon-btn btn-move-up" title="Move up">↑</button>
        <button class="icon-btn btn-move-down" title="Move down">↓</button>
        <button class="icon-btn btn-remove-exercise" title="Remove">✕</button>
      </div>
    </div>
    ${equipment ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">${equipment}</div>` : ''}
    ${prevHint ? `<div class="prev-hint">${prevHint}</div>` : ''}
    <table class="sets-table">
      <thead>
        <tr>
          <th style="width:28px">#</th>
          <th style="width:60px">Type</th>
          <th>Weight (${unit})</th>
          <th>Reps</th>
          <th>Notes</th>
          <th style="width:28px"></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div class="exercise-footer">
      <button class="btn btn-outline btn-sm btn-add-set">+ Set</button>
      <button class="btn btn-outline btn-sm btn-change-exercise">✏️ Change</button>
    </div>
    <div class="set-type-legend">
      <span><strong>N</strong> Normal</span>
      <span style="color:var(--blue)"><strong>W</strong> Warmup</span>
      <span style="color:var(--accent)"><strong>F</strong> Till Failure</span>
      <span style="color:var(--yellow)"><strong>D</strong> Drop set</span>
    </div>
  `;

  // Add default sets (skip if 0, caller will add manually)
  for (let i = 0; i < defaultSets; i++) {
    addSetRow(card, idx, suggestedWeight, defaultReps, '');
  }

  // Event: remove exercise
  card.querySelector('.btn-remove-exercise').addEventListener('click', () => {
    card.remove();
    _logExercises[idx] = null;
  });

  // Event: add set
  card.querySelector('.btn-add-set').addEventListener('click', () => {
    addSetRow(card, idx);
  });

  // Event: change exercise
  card.querySelector('.btn-change-exercise').addEventListener('click', () => {
    openExercisePicker(ex => {
      _logExercises[idx].name = ex.name;
      _logExercises[idx].equipment = ex.equipment;
      card.querySelector('.exercise-card-name').textContent = ex.name;
    });
  });

  // Event: timer
  card.querySelector('.btn-timer-open').addEventListener('click', openTimer);

  // Event: move up/down
  card.querySelector('.btn-move-up').addEventListener('click', () => {
    const prev = card.previousElementSibling;
    if (prev && prev.classList.contains('exercise-card')) {
      card.parentNode.insertBefore(card, prev);
    }
  });
  card.querySelector('.btn-move-down').addEventListener('click', () => {
    const next = card.nextElementSibling;
    if (next && next.classList.contains('exercise-card')) {
      card.parentNode.insertBefore(next, card);
    }
  });

  document.getElementById('log-exercises-container').appendChild(card);
  return card;
}

// ---- Add set row ----
function addSetRow(card, exIdx, weight = '', reps = '', notes = '', type = 'normal') {
  const tbody = card.querySelector('tbody');
  const setNum = tbody.querySelectorAll('tr').length + 1;

  const tr = document.createElement('tr');
  tr.dataset.type = type;
  tr.innerHTML = `
    <td class="set-num">${setNum}</td>
    <td>
      <select class="set-type-select" title="Set type">
        <option value="normal"  ${type==='normal'  ?'selected':''}>N</option>
        <option value="warmup"  ${type==='warmup'  ?'selected':''}>W</option>
        <option value="failure" ${type==='failure' ?'selected':''}>F</option>
        <option value="drop"    ${type==='drop'    ?'selected':''}>D</option>
      </select>
    </td>
    <td><input type="number" class="set-weight" value="${weight}" placeholder="0" min="0" step="0.5" inputmode="decimal" /></td>
    <td><input type="number" class="set-reps"   value="${reps}"   placeholder="0" min="0" step="1"   inputmode="numeric" /></td>
    <td><input type="text"   class="set-notes"  value="${notes}"  placeholder="…" /></td>
    <td><button class="btn-remove-set" title="Remove set">✕</button></td>
  `;

  // Update row styling when type changes
  const typeSelect = tr.querySelector('.set-type-select');
  typeSelect.addEventListener('change', () => {
    tr.dataset.type = typeSelect.value;
    applySetRowStyle(tr);
  });
  applySetRowStyle(tr);

  tr.querySelector('.btn-remove-set').addEventListener('click', () => {
    tr.remove();
    tbody.querySelectorAll('tr').forEach((r, i) => {
      r.querySelector('.set-num').textContent = i + 1;
    });
  });

  tbody.appendChild(tr);
}

function applySetRowStyle(tr) {
  tr.classList.remove('set-warmup', 'set-failure', 'set-drop');
  if (tr.dataset.type === 'warmup')  tr.classList.add('set-warmup');
  if (tr.dataset.type === 'failure') tr.classList.add('set-failure');
  if (tr.dataset.type === 'drop')    tr.classList.add('set-drop');
}

// ---- Collect exercise data from DOM ----
function collectExercises() {
  const container = document.getElementById('log-exercises-container');
  const cards = container.querySelectorAll('.exercise-card');
  const exercises = [];

  cards.forEach(card => {
    const idx = parseInt(card.dataset.idx);
    const ex = _logExercises[idx];
    if (!ex) return;

    const sets = [];
    card.querySelectorAll('tbody tr').forEach(tr => {
      const weight = parseFloat(tr.querySelector('.set-weight').value) || 0;
      const reps   = parseInt(tr.querySelector('.set-reps').value)   || 0;
      const notes  = tr.querySelector('.set-notes').value.trim();
      const type   = tr.querySelector('.set-type-select').value || 'normal';
      // Allow failure sets with 0 reps (reps field can be blank for "till failure")
      if (weight > 0 || reps > 0 || type === 'failure') {
        sets.push({ weight, reps, notes, type });
      }
    });

    if (sets.length > 0) {
      exercises.push({ name: ex.name, equipment: ex.equipment, sets });
    }
  });

  return exercises;
}

// ---- Save workout ----
document.getElementById('btn-save-workout').addEventListener('click', async () => {
  const date = document.getElementById('log-date').value;
  if (!date) { showToast('Please select a date'); return; }

  const exercises = collectExercises();
  if (exercises.length === 0) { showToast('Add at least one exercise'); return; }

  const name  = document.getElementById('log-name').value.trim() || 'Workout';
  const notes = document.getElementById('log-notes').value.trim();
  const tags  = getSelectedTags('log-tags');

  const workout = { date, name, tags, notes, exercises };

  // Check if workout already exists for this date (same name)
  const existing = await DB.getAll('workouts');
  const dup = existing.find(w => w.date === date && w.name === name);
  if (dup) {
    if (!confirm(`A workout "${name}" already exists for ${formatDate(date)}. Save anyway?`)) return;
  }

  await DB.add('workouts', workout);
  showToast('Workout saved! 💪');

  // Check for new PRs
  await checkForPRs(exercises);

  // Reset form
  initLogPage();
  navigateTo('dashboard');
  window.dispatchEvent(new CustomEvent('workoutschanged'));
});

async function checkForPRs(exercises) {
  const unit = await DB.getSetting('unit', 'kg');
  const records = await getPersonalRecords();
  const newPRs = [];

  exercises.forEach(ex => {
    const maxW = calcMaxWeight(ex.sets);
    const prev = records[ex.name];
    if (!prev || maxW > prev.weight) {
      newPRs.push(`${ex.name}: ${maxW} ${unit}`);
    }
  });

  if (newPRs.length > 0) {
    setTimeout(() => showToast('🏆 New PR: ' + newPRs.join(', '), 4000), 500);
  }
}
