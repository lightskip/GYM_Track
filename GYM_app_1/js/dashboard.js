/* ============================================================
   dashboard.js — Dashboard page logic
   ============================================================ */

async function renderDashboard() {
  const today = todayStr();
  const unit = await DB.getSetting('unit', 'kg');

  // Date display
  document.getElementById('dash-date').textContent = formatDate(today);

  // Load all workouts
  const workouts = await DB.getAll('workouts');
  workouts.sort((a, b) => b.date.localeCompare(a.date));

  // Today's workout
  const todayWorkout = workouts.find(w => w.date === today);
  const dashToday = document.getElementById('dash-today');
  const btnStart = document.getElementById('btn-start-today');

  if (todayWorkout) {
    dashToday.innerHTML = `
      <div style="font-weight:700;font-size:1.05rem;margin-bottom:6px">${todayWorkout.name || 'Workout'}</div>
      <div style="font-size:0.85rem;color:var(--text-muted)">${todayWorkout.exercises.length} exercises logged</div>
      <div class="tag-row" style="margin-top:6px">${
        (todayWorkout.tags || []).map(t => `<span class="tag-chip active">${t}</span>`).join('')
      }</div>
    `;
    btnStart.style.display = 'none';
  } else {
    // Check if there's a template for today
    const templates = await DB.getAll('templates');
    const todayDow = new Date().getDay().toString();
    const todayTemplate = templates.find(t => t.day === todayDow);

    if (todayTemplate) {
      dashToday.innerHTML = `
        <div style="color:var(--text-muted);font-size:0.9rem">Planned: <strong>${todayTemplate.name}</strong></div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-top:4px">${todayTemplate.exercises.length} exercises planned</div>
      `;
      btnStart.style.display = 'block';
      btnStart.onclick = () => {
        navigateTo('log');
        setTimeout(() => prefillLogFromTemplate(todayTemplate), 100);
      };
    } else {
      dashToday.innerHTML = `<div style="color:var(--text-muted);font-size:0.9rem">No workout logged yet today.</div>`;
      btnStart.style.display = 'none';
    }
  }

  // Last 7 days strip
  renderWeekStrip(workouts);

  // Personal records (top 5 recent)
  await renderPRs(workouts, unit);

  // Quick stats
  renderStats(workouts, unit);
}

function renderWeekStrip(workouts) {
  const strip = document.getElementById('dash-week');
  const today = new Date();
  const workoutDates = new Set(workouts.map(w => w.date));

  strip.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const hasWorkout = workoutDates.has(ds);

    const div = document.createElement('div');
    div.className = `week-day${hasWorkout ? ' has-workout' : ''}${isToday ? ' today' : ''}`;
    div.innerHTML = `
      <span class="week-day-label">${DAY_SHORT[d.getDay()]}</span>
      <span class="week-day-num">${d.getDate()}</span>
      ${hasWorkout ? '<span class="week-day-dot"></span>' : ''}
    `;
    div.addEventListener('click', () => {
      if (hasWorkout) {
        const w = workouts.find(x => x.date === ds);
        if (w) openWorkoutDetail(w.id);
      }
    });
    strip.appendChild(div);
  }
}

async function renderPRs(workouts, unit) {
  const prList = document.getElementById('dash-prs');
  const records = await getPersonalRecords();

  // Sort by date (most recent PR first)
  const sorted = Object.entries(records)
    .sort((a, b) => b[1].date.localeCompare(a[1].date))
    .slice(0, 5);

  if (sorted.length === 0) {
    prList.innerHTML = `<div class="empty-state"><p>Log workouts to see your records</p></div>`;
    return;
  }

  prList.innerHTML = sorted.map(([name, rec]) => `
    <div class="pr-item">
      <div>
        <div class="pr-name">${name}</div>
        <div class="pr-date">${formatDate(rec.date)}</div>
      </div>
      <div class="pr-value">${rec.weight} ${unit} 🏆</div>
    </div>
  `).join('');
}

function renderStats(workouts, unit) {
  const statsEl = document.getElementById('dash-stats');

  const totalWorkouts = workouts.length;
  const thisMonth = workouts.filter(w => w.date.startsWith(new Date().toISOString().slice(0, 7))).length;

  // Total volume this month
  const monthWorkouts = workouts.filter(w => w.date.startsWith(new Date().toISOString().slice(0, 7)));
  let monthVolume = 0;
  monthWorkouts.forEach(w => {
    w.exercises.forEach(e => { monthVolume += calcVolume(e.sets); });
  });

  // Streak (consecutive days with workouts)
  const workoutDates = new Set(workouts.map(w => w.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (workoutDates.has(ds)) streak++;
    else if (i > 0) break;
  }

  statsEl.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${totalWorkouts}</div>
      <div class="stat-label">Total Workouts</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${thisMonth}</div>
      <div class="stat-label">This Month</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${streak}</div>
      <div class="stat-label">Day Streak 🔥</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${(monthVolume / 1000).toFixed(1)}t</div>
      <div class="stat-label">Month Volume</div>
    </div>
  `;
}
