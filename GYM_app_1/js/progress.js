/* ============================================================
   progress.js — Progress tracking & charts
   ============================================================ */

let _progressChart = null;
let _currentExercise = null;

async function renderProgress() {
  // If no exercise selected, try to pick the most-logged one
  if (!_currentExercise) {
    const workouts = await DB.getAll('workouts');
    const counts = {};
    workouts.forEach(w => w.exercises.forEach(e => {
      counts[e.name] = (counts[e.name] || 0) + 1;
    }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      _currentExercise = top[0];
      document.getElementById('progress-search').value = _currentExercise;
    }
  }

  if (_currentExercise) {
    await updateProgressChart();
  }
}

// ---- Search autocomplete ----
document.getElementById('progress-search').addEventListener('input', async e => {
  const q = e.target.value.trim();
  const dropdown = document.getElementById('progress-search-results');

  if (!q) { dropdown.classList.add('hidden'); return; }

  const names = await getAllExerciseNames();
  const matches = names.filter(n => n.toLowerCase().includes(q.toLowerCase())).slice(0, 8);

  if (matches.length === 0) { dropdown.classList.add('hidden'); return; }

  dropdown.innerHTML = matches.map(n => `<div class="search-dropdown-item">${n}</div>`).join('');
  dropdown.classList.remove('hidden');

  dropdown.querySelectorAll('.search-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      _currentExercise = item.textContent;
      document.getElementById('progress-search').value = _currentExercise;
      dropdown.classList.add('hidden');
      updateProgressChart();
    });
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('#progress-search') && !e.target.closest('#progress-search-results')) {
    document.getElementById('progress-search-results').classList.add('hidden');
  }
});

document.getElementById('progress-metric').addEventListener('change', updateProgressChart);
document.getElementById('progress-range').addEventListener('change', updateProgressChart);

async function updateProgressChart() {
  if (!_currentExercise) return;

  const metric = document.getElementById('progress-metric').value;
  const rangeDays = parseInt(document.getElementById('progress-range').value);
  const unit = await DB.getSetting('unit', 'kg');

  document.getElementById('progress-ex-name').textContent = _currentExercise;

  let history = await getExerciseHistory(_currentExercise);

  // Filter by date range
  if (rangeDays > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    history = history.filter(h => h.date >= cutoffStr);
  }

  if (history.length === 0) {
    renderEmptyChart();
    renderProgressStats([], unit);
    renderProgressHistory([], unit);
    return;
  }

  const labels = history.map(h => {
    const [y, m, d] = h.date.split('-');
    return `${d}/${m}`;
  });

  let values;
  let yLabel;
  switch (metric) {
    case 'weight':
      values = history.map(h => h.maxWeight);
      yLabel = `Max Weight (${unit})`;
      break;
    case 'volume':
      values = history.map(h => h.totalVolume);
      yLabel = `Volume (${unit})`;
      break;
    case 'reps':
      values = history.map(h => h.totalReps);
      yLabel = 'Total Reps';
      break;
  }

  renderChart(labels, values, yLabel);
  renderProgressStats(history, unit);
  renderProgressHistory(history, unit);
}

function renderChart(labels, values, yLabel) {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  const isDark = document.body.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#888' : '#6c757d';

  if (_progressChart) {
    _progressChart.destroy();
    _progressChart = null;
  }

  _progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: yLabel,
        data: values,
        borderColor: '#e63946',
        backgroundColor: 'rgba(230,57,70,0.12)',
        borderWidth: 2.5,
        pointBackgroundColor: '#e63946',
        pointRadius: values.length > 20 ? 2 : 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          titleColor: isDark ? '#f0f0f0' : '#212529',
          bodyColor: '#e63946',
          borderColor: isDark ? '#2e2e2e' : '#dee2e6',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y.toFixed(1)} ${yLabel.includes('Reps') ? 'reps' : yLabel.split('(')[1]?.replace(')', '') || ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, maxTicksLimit: 8, font: { size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: false,
        }
      }
    }
  });
}

function renderEmptyChart() {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  if (_progressChart) { _progressChart.destroy(); _progressChart = null; }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = 'var(--text-muted)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('No data for this exercise in the selected range', ctx.canvas.width / 2, 80);
}

function renderProgressStats(history, unit) {
  const el = document.getElementById('progress-stats');
  if (history.length === 0) {
    el.innerHTML = '<div class="text-muted" style="font-size:0.9rem">No data available</div>';
    return;
  }

  const maxWeight = Math.max(...history.map(h => h.maxWeight));
  const maxVol    = Math.max(...history.map(h => h.totalVolume));
  const firstW    = history[0].maxWeight;
  const lastW     = history[history.length - 1].maxWeight;
  const improvement = lastW - firstW;

  el.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${maxWeight} ${unit}</div>
      <div class="stat-label">Best Weight 🏆</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${history.length}</div>
      <div class="stat-label">Sessions</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${maxVol.toFixed(0)}</div>
      <div class="stat-label">Best Volume</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" class="${improvement >= 0 ? 'text-green' : 'text-accent'}">${improvement >= 0 ? '+' : ''}${improvement} ${unit}</div>
      <div class="stat-label">Progress</div>
    </div>
  `;
}

function renderProgressHistory(history, unit) {
  const el = document.getElementById('progress-history-list');
  if (history.length === 0) {
    el.innerHTML = '<div class="text-muted" style="font-size:0.9rem">No sessions found</div>';
    return;
  }

  const sorted = [...history].reverse().slice(0, 10);
  const maxW = Math.max(...history.map(h => h.maxWeight));

  el.innerHTML = sorted.map(h => `
    <div class="ex-history-item">
      <div>
        <div class="ex-history-date">${formatDate(h.date)}</div>
        <div class="ex-history-detail">
          ${h.maxWeight} ${unit} × ${h.totalReps} reps
          ${h.maxWeight === maxW ? '<span class="pr-badge">PR</span>' : ''}
        </div>
      </div>
      <div class="ex-history-vol">${h.totalVolume.toFixed(0)} ${unit} vol</div>
    </div>
  `).join('');
}
