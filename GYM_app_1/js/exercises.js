/* ============================================================
   exercises.js — Exercise database page
   ============================================================ */

let _exFilter = 'All';
let _exSearch = '';
let _editingExerciseId = null;

async function renderExercises() {
  const exercises = await DB.getAll('exercises');
  const list = document.getElementById('exercises-list');

  let filtered = exercises;

  if (_exFilter !== 'All') {
    filtered = filtered.filter(e => e.muscle === _exFilter);
  }

  if (_exSearch) {
    const q = _exSearch.toLowerCase();
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.equipment || '').toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    // Custom exercises first, then alphabetical
    if (a.custom && !b.custom) return -1;
    if (!a.custom && b.custom) return 1;
    return a.name.localeCompare(b.name);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No exercises found</p>
    </div>`;
    return;
  }

  list.innerHTML = '';
  filtered.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'exercise-item';
    item.innerHTML = `
      <div style="flex:1;min-width:0">
        <div class="exercise-item-name">
          ${ex.name}
          ${ex.custom ? '<span class="custom-badge">Custom</span>' : ''}
        </div>
        <div class="exercise-item-meta">${ex.equipment || '—'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        <span class="exercise-item-tag">${ex.muscle}</span>
        ${ex.custom ? `<button class="icon-btn ex-edit-btn" data-id="${ex.id}" title="Edit">✏️</button>
                       <button class="icon-btn ex-delete-btn" data-id="${ex.id}" title="Delete">🗑</button>` : ''}
      </div>
    `;

    // Click row → go to progress for this exercise
    item.addEventListener('click', e => {
      if (e.target.closest('.ex-edit-btn') || e.target.closest('.ex-delete-btn')) return;
      _currentExercise = ex.name;
      document.getElementById('progress-search').value = ex.name;
      navigateTo('progress');
      setTimeout(updateProgressChart, 100);
    });

    // Edit button (custom only)
    const editBtn = item.querySelector('.ex-edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', e => {
        e.stopPropagation();
        openExerciseModal(ex);
      });
    }

    // Delete button (custom only)
    const delBtn = item.querySelector('.ex-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm(`Delete "${ex.name}"?`)) return;
        await DB.delete('exercises', ex.id);
        showToast('Exercise deleted');
        renderExercises();
      });
    }

    list.appendChild(item);
  });
}

// ---- Filter chips ----
document.querySelectorAll('#ex-filter-tags .tag-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#ex-filter-tags .tag-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    _exFilter = chip.dataset.tag;
    renderExercises();
  });
});

// ---- Search ----
document.getElementById('ex-search').addEventListener('input', e => {
  _exSearch = e.target.value.trim();
  renderExercises();
});

// ---- Add button → open modal ----
document.getElementById('btn-new-exercise').addEventListener('click', () => {
  openExerciseModal(null);
});

// ---- Exercise add/edit modal ----
function openExerciseModal(ex) {
  _editingExerciseId = ex ? ex.id : null;

  document.getElementById('ex-modal-title').textContent = ex ? 'Edit Exercise' : 'Add Exercise';
  document.getElementById('ex-modal-name').value      = ex ? ex.name      : '';
  document.getElementById('ex-modal-equipment').value = ex ? (ex.equipment || '') : '';

  // Set muscle select
  const muscleSelect = document.getElementById('ex-modal-muscle');
  muscleSelect.value = ex ? ex.muscle : 'Chest';

  openModal('modal-exercise-form');
  setTimeout(() => document.getElementById('ex-modal-name').focus(), 100);
}

document.getElementById('btn-save-exercise').addEventListener('click', async () => {
  const name      = document.getElementById('ex-modal-name').value.trim();
  const muscle    = document.getElementById('ex-modal-muscle').value;
  const equipment = document.getElementById('ex-modal-equipment').value.trim();

  if (!name) { showToast('Enter an exercise name'); return; }

  const exData = { name, muscle, equipment, custom: true };

  if (_editingExerciseId) {
    exData.id = _editingExerciseId;
    await DB.put('exercises', exData);
    showToast('Exercise updated');
  } else {
    // Check for duplicate name
    const all = await DB.getAll('exercises');
    if (all.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      showToast('An exercise with that name already exists');
      return;
    }
    await DB.add('exercises', exData);
    showToast('Exercise added ✓');
  }

  closeModal('modal-exercise-form');
  renderExercises();
});
