/* ============================================================
   data.js — Built-in exercise database & seed data
   ============================================================ */

const BUILT_IN_EXERCISES = [
  // CHEST
  { name: 'Bench Press',           muscle: 'Chest',     equipment: 'Barbell',    custom: false },
  { name: 'Incline Bench Press',   muscle: 'Chest',     equipment: 'Barbell',    custom: false },
  { name: 'Decline Bench Press',   muscle: 'Chest',     equipment: 'Barbell',    custom: false },
  { name: 'Chest Press Machine',   muscle: 'Chest',     equipment: 'Machine',    custom: false },
  { name: 'Incline Chest Press',   muscle: 'Chest',     equipment: 'Machine',    custom: false },
  { name: 'Cable Fly',             muscle: 'Chest',     equipment: 'Cable',      custom: false },
  { name: 'Pec Deck',              muscle: 'Chest',     equipment: 'Machine',    custom: false },
  { name: 'Dumbbell Fly',          muscle: 'Chest',     equipment: 'Dumbbell',   custom: false },
  { name: 'Push-Up',               muscle: 'Chest',     equipment: 'Bodyweight', custom: false },
  { name: 'Dips',                  muscle: 'Chest',     equipment: 'Bodyweight', custom: false },

  // BACK
  { name: 'Lat Pulldown',          muscle: 'Back',      equipment: 'Machine',    custom: false },
  { name: 'Seated Cable Row',      muscle: 'Back',      equipment: 'Cable',      custom: false },
  { name: 'Barbell Row',           muscle: 'Back',      equipment: 'Barbell',    custom: false },
  { name: 'Dumbbell Row',          muscle: 'Back',      equipment: 'Dumbbell',   custom: false },
  { name: 'T-Bar Row',             muscle: 'Back',      equipment: 'Machine',    custom: false },
  { name: 'Pull-Up',               muscle: 'Back',      equipment: 'Bodyweight', custom: false },
  { name: 'Chin-Up',               muscle: 'Back',      equipment: 'Bodyweight', custom: false },
  { name: 'Deadlift',              muscle: 'Back',      equipment: 'Barbell',    custom: false },
  { name: 'Romanian Deadlift',     muscle: 'Back',      equipment: 'Barbell',    custom: false },
  { name: 'Back Extension',        muscle: 'Back',      equipment: 'Machine',    custom: false },

  // SHOULDERS
  { name: 'Overhead Press',        muscle: 'Shoulders', equipment: 'Barbell',    custom: false },
  { name: 'Dumbbell Shoulder Press',muscle:'Shoulders', equipment: 'Dumbbell',   custom: false },
  { name: 'Shoulder Press Machine',muscle: 'Shoulders', equipment: 'Machine',    custom: false },
  { name: 'Lateral Raise',         muscle: 'Shoulders', equipment: 'Dumbbell',   custom: false },
  { name: 'Cable Lateral Raise',   muscle: 'Shoulders', equipment: 'Cable',      custom: false },
  { name: 'Front Raise',           muscle: 'Shoulders', equipment: 'Dumbbell',   custom: false },
  { name: 'Rear Delt Fly',         muscle: 'Shoulders', equipment: 'Dumbbell',   custom: false },
  { name: 'Face Pull',             muscle: 'Shoulders', equipment: 'Cable',      custom: false },
  { name: 'Arnold Press',          muscle: 'Shoulders', equipment: 'Dumbbell',   custom: false },

  // ARMS
  { name: 'Barbell Curl',          muscle: 'Arms',      equipment: 'Barbell',    custom: false },
  { name: 'Dumbbell Curl',         muscle: 'Arms',      equipment: 'Dumbbell',   custom: false },
  { name: 'Hammer Curl',           muscle: 'Arms',      equipment: 'Dumbbell',   custom: false },
  { name: 'Cable Curl',            muscle: 'Arms',      equipment: 'Cable',      custom: false },
  { name: 'Preacher Curl',         muscle: 'Arms',      equipment: 'Machine',    custom: false },
  { name: 'Tricep Pushdown',       muscle: 'Arms',      equipment: 'Cable',      custom: false },
  { name: 'Skull Crusher',         muscle: 'Arms',      equipment: 'Barbell',    custom: false },
  { name: 'Overhead Tricep Extension', muscle: 'Arms',  equipment: 'Dumbbell',   custom: false },
  { name: 'Tricep Dips',           muscle: 'Arms',      equipment: 'Bodyweight', custom: false },
  { name: 'Close-Grip Bench Press',muscle: 'Arms',      equipment: 'Barbell',    custom: false },

  // LEGS
  { name: 'Squat',                 muscle: 'Legs',      equipment: 'Barbell',    custom: false },
  { name: 'Leg Press',             muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Hack Squat',            muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Leg Extension',         muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Leg Curl',              muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Seated Leg Curl',       muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Calf Raise',            muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Seated Calf Raise',     muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Lunges',                muscle: 'Legs',      equipment: 'Dumbbell',   custom: false },
  { name: 'Bulgarian Split Squat', muscle: 'Legs',      equipment: 'Dumbbell',   custom: false },
  { name: 'Hip Thrust',            muscle: 'Legs',      equipment: 'Barbell',    custom: false },
  { name: 'Glute Kickback',        muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Adductor Machine',      muscle: 'Legs',      equipment: 'Machine',    custom: false },
  { name: 'Abductor Machine',      muscle: 'Legs',      equipment: 'Machine',    custom: false },

  // CORE
  { name: 'Plank',                 muscle: 'Core',      equipment: 'Bodyweight', custom: false },
  { name: 'Crunch',                muscle: 'Core',      equipment: 'Bodyweight', custom: false },
  { name: 'Cable Crunch',          muscle: 'Core',      equipment: 'Cable',      custom: false },
  { name: 'Leg Raise',             muscle: 'Core',      equipment: 'Bodyweight', custom: false },
  { name: 'Russian Twist',         muscle: 'Core',      equipment: 'Bodyweight', custom: false },
  { name: 'Ab Machine',            muscle: 'Core',      equipment: 'Machine',    custom: false },

  // CARDIO
  { name: 'Treadmill',             muscle: 'Cardio',    equipment: 'Machine',    custom: false },
  { name: 'Stationary Bike',       muscle: 'Cardio',    equipment: 'Machine',    custom: false },
  { name: 'Rowing Machine',        muscle: 'Cardio',    equipment: 'Machine',    custom: false },
  { name: 'Elliptical',            muscle: 'Cardio',    equipment: 'Machine',    custom: false },
  { name: 'Stair Climber',         muscle: 'Cardio',    equipment: 'Machine',    custom: false },
];

// Initialize DB — seed the exercise library only, no fake workouts or templates
async function initSeedData() {
  await DB.open();

  // Seed the built-in exercise library if it's empty
  const existingEx = await DB.getAll('exercises');
  if (existingEx.length === 0) {
    for (const ex of BUILT_IN_EXERCISES) {
      await DB.add('exercises', ex);
    }
  }
}

// ---- Utility functions ----

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Always DD/MM/YYYY European format
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function calcVolume(sets) {
  return sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0);
}

function calcMaxWeight(sets) {
  return Math.max(...sets.map(s => parseFloat(s.weight) || 0), 0);
}

function calcTotalReps(sets) {
  return sets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
}

// Get all exercise names from workouts (for autocomplete)
async function getAllExerciseNames() {
  const workouts = await DB.getAll('workouts');
  const names = new Set();
  workouts.forEach(w => w.exercises.forEach(e => names.add(e.name)));
  const dbEx = await DB.getAll('exercises');
  dbEx.forEach(e => names.add(e.name));
  return [...names].sort();
}

// Get history for a specific exercise
async function getExerciseHistory(exerciseName) {
  const workouts = await DB.getAll('workouts');
  const history = [];
  workouts.forEach(w => {
    w.exercises.forEach(e => {
      if (e.name.toLowerCase() === exerciseName.toLowerCase()) {
        history.push({
          date: w.date,
          workoutId: w.id,
          sets: e.sets,
          maxWeight: calcMaxWeight(e.sets),
          totalVolume: calcVolume(e.sets),
          totalReps: calcTotalReps(e.sets),
        });
      }
    });
  });
  history.sort((a, b) => a.date.localeCompare(b.date));
  return history;
}

// Get personal records across all exercises
async function getPersonalRecords() {
  const workouts = await DB.getAll('workouts');
  const records = {}; // exerciseName -> { weight, date, workoutId }

  workouts.forEach(w => {
    w.exercises.forEach(e => {
      const maxW = calcMaxWeight(e.sets);
      if (!records[e.name] || maxW > records[e.name].weight) {
        records[e.name] = { weight: maxW, date: w.date, workoutId: w.id };
      }
    });
  });

  return records;
}

// Get last session for an exercise (for suggestions)
async function getLastSession(exerciseName) {
  const history = await getExerciseHistory(exerciseName);
  return history.length > 0 ? history[history.length - 1] : null;
}

// Suggest next weight (simple progressive overload: +2.5kg if all reps completed)
function suggestNextWeight(lastSets, targetReps) {
  if (!lastSets || lastSets.length === 0) return null;
  const allCompleted = lastSets.every(s => parseInt(s.reps) >= targetReps);
  const maxW = calcMaxWeight(lastSets);
  if (allCompleted && maxW > 0) return maxW + 2.5;
  return maxW;
}

// Days of week labels
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
