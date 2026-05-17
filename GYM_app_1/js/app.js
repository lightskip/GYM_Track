/* ============================================================
   app.js — App initialization & page routing
   ============================================================ */

async function init() {
  // Open DB and seed data
  await DB.open();
  await initSeedData();

  // Load theme preference
  const darkMode = await DB.getSetting('darkMode', true);
  applyTheme(darkMode);

  // Render initial page (dashboard)
  await renderDashboard();

  // Page change handler
  window.addEventListener('pagechange', async e => {
    const page = e.detail;
    switch (page) {
      case 'dashboard': await renderDashboard(); break;
      case 'log':       initLogPage();           break;
      case 'history':   await renderHistory();   break;
      case 'progress':  await renderProgress();  break;
      case 'plan':      await renderPlan();      break;
      case 'exercises': await renderExercises(); break;
    }
  });

  // Workouts changed (after save/delete)
  window.addEventListener('workoutschanged', async () => {
    const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
    if (activePage === 'dashboard') await renderDashboard();
    if (activePage === 'history')   await renderHistory();
    if (activePage === 'progress')  await renderProgress();
  });

  // Log page: navigate to log with today's date
  document.getElementById('btn-log-new').addEventListener('click', () => {
    navigateTo('log');
  });

  // Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// Start the app
init().catch(err => {
  console.error('GymTrack init error:', err);
  document.getElementById('main-content').innerHTML = `
    <div class="card" style="margin-top:20px;text-align:center">
      <div style="font-size:2rem">⚠️</div>
      <p style="margin-top:8px">Failed to start GymTrack. Please refresh the page.</p>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${err.message}</p>
    </div>
  `;
});
