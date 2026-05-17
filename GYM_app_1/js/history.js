/* ============================================================
   history.js — History & Calendar page
   ============================================================ */

let _calYear    = new Date().getFullYear();
let _calMonth   = new Date().getMonth(); // 0-indexed
let _selectedDate = null;
let _allWorkoutDates = {}; // date -> [workout, ...]

async function renderHistory() {
  const workouts = await DB.getAll('workouts');
  _allWorkoutDates = {};
  workouts.forEach(w => {
    if (!_allWorkoutDates[w.date]) _allWorkoutDates[w.date] = [];
    _allWorkoutDates[w.date].push(w);
  });

  renderCalendar();

  // If a date is selected, show that day; otherwise show all recent
  renderHistoryList(workouts, _selectedDate);
}

function renderCalendar() {
  const label = document.getElementById('cal-month-label');
  label.textContent = new Date(_calYear, _calMonth, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Day headers — start week on Monday (European)
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dayHeaders.forEach(d => {
    const h = document.createElement('div');
    h.className = 'cal-day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  // firstDay: 0=Sun…6=Sat → convert to Mon-based (0=Mon…6=Sun)
  const firstDayRaw = new Date(_calYear, _calMonth, 1).getDay(); // 0=Sun
  const firstDay = (firstDayRaw + 6) % 7; // shift so Mon=0
  const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(_calYear, _calMonth, 0).getDate();
  const todayStr_ = todayStr();

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.textContent = daysInPrevMonth - i;
    grid.appendChild(d);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${_calYear}-${String(_calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday      = ds === todayStr_;
    const hasWorkout   = !!_allWorkoutDates[ds];
    const isSelected   = ds === _selectedDate;

    const d = document.createElement('div');
    d.className = [
      'cal-day',
      isToday    ? 'today'       : '',
      hasWorkout ? 'has-workout' : '',
      isSelected ? 'selected'    : '',
    ].filter(Boolean).join(' ');
    d.textContent = day;

    d.addEventListener('click', () => {
      if (_selectedDate === ds) {
        // Second click on same day → deselect, show all
        _selectedDate = null;
      } else {
        _selectedDate = ds;
      }
      renderCalendar();
      DB.getAll('workouts').then(ws => renderHistoryList(ws, _selectedDate));
    });

    grid.appendChild(d);
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const d = document.createElement('div');
    d.className = 'cal-day other-month';
    d.textContent = i;
    grid.appendChild(d);
  }
}

function renderHistoryList(workouts, filterDate) {
  const list = document.getElementById('history-list');

  let filtered = [...workouts];
  if (filterDate) {
    filtered = filtered.filter(w => w.date === filterDate);
  }
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📅</div>
      <p>${filterDate ? `No workout on ${formatDateShort(filterDate)}` : 'No workouts logged yet'}</p>
    </div>`;
    return;
  }

  // Show a heading when a specific date is selected
  let html = '';
  if (filterDate) {
    html += `<div class="history-day-heading">
      <span>${formatDate(filterDate)}</span>
      <button class="btn btn-outline btn-sm" id="btn-history-show-all">Show all</button>
    </div>`;
  }

  list.innerHTML = html;

  filtered.forEach(w => {
    const item = document.createElement('div');
    item.className = 'workout-item';

    const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0);
    const totalVol  = w.exercises.reduce((s, e) => s + calcVolume(e.sets), 0);

    item.innerHTML = `
      <div class="workout-item-header">
        <div class="workout-item-name">${w.name || 'Workout'}</div>
        <div class="workout-item-date">${formatDate(w.date)}</div>
      </div>
      ${(w.tags || []).length
        ? `<div class="workout-item-tags">${w.tags.map(t => `<span class="tag-chip active">${t}</span>`).join('')}</div>`
        : ''}
      <div class="workout-item-summary">
        ${w.exercises.length} exercises · ${totalSets} sets · ${totalVol.toFixed(0)} kg volume
      </div>
      <div class="workout-item-actions">
        <button class="btn btn-outline btn-sm btn-history-view">👁 View</button>
        <button class="btn btn-outline btn-sm btn-history-duplicate">📋 Duplicate</button>
        <button class="btn btn-danger  btn-sm btn-history-delete">🗑 Delete</button>
      </div>
    `;

    // View detail
    item.querySelector('.btn-history-view').addEventListener('click', e => {
      e.stopPropagation();
      openWorkoutDetail(w.id);
    });

    // Duplicate → go to log page pre-filled
    item.querySelector('.btn-history-duplicate').addEventListener('click', e => {
      e.stopPropagation();
      navigateTo('log');
      setTimeout(() => prefillLogFromWorkout(w), 100);
    });

    // Delete inline
    item.querySelector('.btn-history-delete').addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm(`Delete "${w.name || 'Workout'}" on ${formatDate(w.date)}?`)) return;
      await DB.delete('workouts', w.id);
      showToast('Workout deleted');
      window.dispatchEvent(new CustomEvent('workoutschanged'));
      await renderHistory();
    });

    // Click row body → open detail
    item.addEventListener('click', () => openWorkoutDetail(w.id));

    list.appendChild(item);
  });

  // Wire up "Show all" button if present
  const showAllBtn = document.getElementById('btn-history-show-all');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      _selectedDate = null;
      renderCalendar();
      DB.getAll('workouts').then(ws => renderHistoryList(ws, null));
    });
  }
}

// Calendar navigation
document.getElementById('cal-prev').addEventListener('click', async () => {
  _calMonth--;
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  _selectedDate = null;
  await renderHistory();
});

document.getElementById('cal-next').addEventListener('click', async () => {
  _calMonth++;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  _selectedDate = null;
  await renderHistory();
});
