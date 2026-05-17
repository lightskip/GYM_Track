/* ============================================================
   plan.js — Weekly Plan / Templates page
   ============================================================ */

let _editingTemplateId = null;
let _tmplExercises = [];

async function renderPlan() {
  const templates = await DB.getAll('templates');
  const list = document.getElementById('templates-list');

  if (templates.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No templates yet. Create one to plan your week.</p>
    </div>`;
    return;
  }

  // Sort by day
  templates.sort((a, b) => {
    const da = a.day !== '' ? parseInt(a.day) : 99;
    const db_ = b.day !== '' ? parseInt(b.day) : 99;
    return da - db_;
  });

  list.innerHTML = '';
  templates.forEach(t => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
      <div class="template-card-header">
        <div>
          <div class="template-card-name">${t.name}</div>
          <div class="template-card-day">${t.day !== '' && t.day !== undefined ? DAY_NAMES[parseInt(t.day)] : 'Any day'}</div>
        </div>
      </div>
      <div class="template-card-exercises">${t.exercises.map(e => e.name).join(' · ')}</div>
      <div class="template-card-actions">
        <button class="btn btn-primary btn-sm btn-use-template">▶ Use Today</button>
        <button class="btn btn-outline btn-sm btn-edit-template">✏️ Edit</button>
        <button class="btn btn-danger btn-sm btn-delete-template">🗑</button>
      </div>
    `;

    card.querySelector('.btn-use-template').addEventListener('click', () => {
      navigateTo('log');
      setTimeout(() => prefillLogFromTemplate(t), 100);
    });

    card.querySelector('.btn-edit-template').addEventListener('click', () => {
      openTemplateModal(t);
    });

    card.querySelector('.btn-delete-template').addEventListener('click', async () => {
      if (!confirm(`Delete template "${t.name}"?`)) return;
      await DB.delete('templates', t.id);
      showToast('Template deleted');
      renderPlan();
    });

    list.appendChild(card);
  });
}

// ---- New template button ----
document.getElementById('btn-new-template').addEventListener('click', () => {
  openTemplateModal(null);
});

function openTemplateModal(template) {
  _editingTemplateId = template ? template.id : null;
  _tmplExercises = [];

  document.getElementById('template-modal-title').textContent = template ? 'Edit Template' : 'New Template';
  document.getElementById('tmpl-name').value = template ? template.name : '';
  document.getElementById('tmpl-day').value  = template ? (template.day || '') : '';

  const container = document.getElementById('tmpl-exercises-container');
  container.innerHTML = '';

  if (template) {
    template.exercises.forEach(ex => addTmplExerciseRow(ex));
  }

  openModal('modal-template');
}

function addTmplExerciseRow(ex = {}) {
  const idx = _tmplExercises.length;
  _tmplExercises.push({ ...ex });

  const row = document.createElement('div');
  row.className = 'exercise-card';
  row.dataset.idx = idx;
  row.style.marginBottom = '8px';
  row.innerHTML = `
    <div class="exercise-card-header">
      <div class="exercise-card-name">${ex.name || 'Pick exercise…'}</div>
      <div class="exercise-card-actions">
        <button class="icon-btn btn-tmpl-remove">✕</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px">
      <div>
        <div class="field-label">Sets</div>
        <input type="number" class="input tmpl-sets" value="${ex.sets || 3}" min="1" max="20" />
      </div>
      <div>
        <div class="field-label">Reps</div>
        <input type="number" class="input tmpl-reps" value="${ex.reps || 10}" min="1" max="100" />
      </div>
      <div>
        <div class="field-label">Weight</div>
        <input type="number" class="input tmpl-weight" value="${ex.weight || ''}" placeholder="0" min="0" step="0.5" />
      </div>
      <div>
        <div class="field-label">Equipment</div>
        <input type="text" class="input tmpl-equipment" value="${ex.equipment || ''}" placeholder="Machine…" />
      </div>
    </div>
  `;

  // Click name to pick exercise
  row.querySelector('.exercise-card-name').addEventListener('click', () => {
    openExercisePicker(picked => {
      _tmplExercises[idx].name = picked.name;
      _tmplExercises[idx].equipment = picked.equipment;
      row.querySelector('.exercise-card-name').textContent = picked.name;
      row.querySelector('.tmpl-equipment').value = picked.equipment || '';
    });
  });

  row.querySelector('.btn-tmpl-remove').addEventListener('click', () => {
    row.remove();
    _tmplExercises[idx] = null;
  });

  document.getElementById('tmpl-exercises-container').appendChild(row);
}

document.getElementById('btn-tmpl-add-exercise').addEventListener('click', () => {
  openExercisePicker(ex => addTmplExerciseRow({ name: ex.name, equipment: ex.equipment }));
});

document.getElementById('btn-save-template').addEventListener('click', async () => {
  const name = document.getElementById('tmpl-name').value.trim();
  if (!name) { showToast('Enter a template name'); return; }

  const container = document.getElementById('tmpl-exercises-container');
  const rows = container.querySelectorAll('.exercise-card');
  const exercises = [];

  rows.forEach(row => {
    const idx = parseInt(row.dataset.idx);
    const ex = _tmplExercises[idx];
    if (!ex || !ex.name) return;

    exercises.push({
      name: ex.name,
      equipment: row.querySelector('.tmpl-equipment').value.trim(),
      sets:   parseInt(row.querySelector('.tmpl-sets').value)   || 3,
      reps:   parseInt(row.querySelector('.tmpl-reps').value)   || 10,
      weight: parseFloat(row.querySelector('.tmpl-weight').value) || 0,
      notes: '',
    });
  });

  if (exercises.length === 0) { showToast('Add at least one exercise'); return; }

  const template = {
    name,
    day: document.getElementById('tmpl-day').value,
    exercises,
  };

  if (_editingTemplateId) {
    template.id = _editingTemplateId;
    await DB.put('templates', template);
    showToast('Template updated');
  } else {
    await DB.add('templates', template);
    showToast('Template saved');
  }

  closeAllModals();
  renderPlan();
});
