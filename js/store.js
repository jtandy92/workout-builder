(function () {
  const STORAGE_KEY = "exercise_app_db_v1";
  const DEFAULT_LIBRARY_VERSION = 1;
  const DEFAULT_LIBRARY_CREATED_AT = "2026-04-28T00:00:00.000Z";
  const DEFAULT_EXERCISES = [
    {
      id: "seed_push_up",
      name: "Push Up",
      description: "Keep a straight line from shoulders to heels. Lower under control, then press the floor away.",
      sets: 3,
      reps: 12,
      commentary: "Scale with incline push ups or knees-down reps if needed."
    },
    {
      id: "seed_bodyweight_squat",
      name: "Bodyweight Squat",
      description: "Sit the hips back and down, keep the chest tall, then drive through the feet to stand.",
      sets: 4,
      reps: 12,
      commentary: "Keep knees tracking over toes and pause briefly at the bottom."
    },
    {
      id: "seed_reverse_lunge",
      name: "Reverse Lunge",
      description: "Step one foot back, lower until both knees bend, then push through the front foot to return.",
      sets: 3,
      reps: 10,
      commentary: "Count reps per side. Use a wall or rack for balance if needed."
    },
    {
      id: "seed_glute_bridge",
      name: "Glute Bridge",
      description: "Lie on your back, brace the core, and squeeze the glutes to lift the hips.",
      sets: 3,
      reps: 15,
      commentary: "Pause at the top without over-arching the low back."
    },
    {
      id: "seed_plank_hold",
      name: "Plank Hold",
      description: "Hold a strong forearm plank with ribs tucked and glutes lightly squeezed.",
      sets: 3,
      reps: 30,
      commentary: "Treat reps as seconds for this exercise."
    },
    {
      id: "seed_dead_bug",
      name: "Dead Bug",
      description: "Keep the low back gently pressed down while extending opposite arm and leg.",
      sets: 3,
      reps: 10,
      commentary: "Count reps per side and move slowly."
    },
    {
      id: "seed_mountain_climber",
      name: "Mountain Climber",
      description: "Start in a high plank and drive knees forward while keeping shoulders stacked over hands.",
      sets: 3,
      reps: 20,
      commentary: "Count total reps. Keep the hips steady."
    },
    {
      id: "seed_burpee",
      name: "Burpee",
      description: "Drop to the floor, kick back to plank, return the feet under you, and stand or jump tall.",
      sets: 3,
      reps: 8,
      commentary: "Step the feet back instead of jumping for a lower-impact option."
    },
    {
      id: "seed_dumbbell_row",
      name: "Dumbbell Row",
      description: "Hinge with a flat back and pull the weight toward the hip, keeping the shoulder down.",
      sets: 3,
      reps: 10,
      commentary: "Count reps per side. Add load when you configure the workout."
    },
    {
      id: "seed_shoulder_press",
      name: "Shoulder Press",
      description: "Press weights overhead from shoulder height while keeping ribs down and core braced.",
      sets: 3,
      reps: 10,
      commentary: "Use dumbbells, kettlebells, or a barbell. Add load when you configure the workout."
    },
    {
      id: "seed_romanian_deadlift",
      name: "Romanian Deadlift",
      description: "Hinge at the hips with a soft knee bend, feel the hamstrings load, then stand tall.",
      sets: 3,
      reps: 10,
      commentary: "Keep the weight close and the spine neutral. Add load when you configure the workout."
    },
    {
      id: "seed_jumping_jack",
      name: "Jumping Jack",
      description: "Jump feet out while raising arms overhead, then return to a tall standing position.",
      sets: 3,
      reps: 30,
      commentary: "Step side to side for a quieter low-impact version."
    }
  ];

  function uid(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function createEmptyDB() {
    return {
      exercises: [],
      workouts: [],
      history: [],
      builderDraft: {
        name: "",
        exercises: []
      },
      ui: {
        selectedExerciseId: null,
        activeWorkoutSession: null
      },
      meta: {
        defaultLibrarySeeded: false,
        defaultLibraryVersion: 0
      }
    };
  }

  function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function asArray(value) {
    return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
  }

  function cleanString(value, fallback = "") {
    const cleaned = String(value || "").trim();
    return cleaned || fallback;
  }

  function toPositiveInteger(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
  }

  function toNonNegativeInteger(value, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
  }

  function toNonNegativeSeconds(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
  }

  function isRunnableExercise(exercise) {
    return toPositiveInteger(exercise.sets) > 0 && toPositiveInteger(exercise.reps) > 0;
  }

  function normalizeExercise(exercise) {
    return {
      id: cleanString(exercise.id, uid("exercise")),
      name: cleanString(exercise.name, "Untitled Exercise"),
      description: cleanString(exercise.description),
      sets: toPositiveInteger(exercise.sets),
      reps: toPositiveInteger(exercise.reps),
      load: cleanString(exercise.load),
      commentary: cleanString(exercise.commentary),
      image: cleanString(exercise.image),
      createdAt: cleanString(exercise.createdAt, new Date().toISOString())
    };
  }

  function normalizeWorkoutExercise(exercise) {
    return {
      id: cleanString(exercise.id, uid("workout_exercise")),
      exerciseId: cleanString(exercise.exerciseId),
      name: cleanString(exercise.name, "Exercise"),
      image: cleanString(exercise.image),
      description: cleanString(exercise.description),
      commentary: cleanString(exercise.commentary),
      sets: toPositiveInteger(exercise.sets),
      reps: toPositiveInteger(exercise.reps),
      load: cleanString(exercise.load)
    };
  }

  function normalizeWorkout(workout) {
    return {
      id: cleanString(workout.id, uid("workout")),
      name: cleanString(workout.name, "Untitled Workout"),
      exercises: asArray(workout.exercises).filter(isRunnableExercise).map(normalizeWorkoutExercise),
      createdAt: cleanString(workout.createdAt, new Date().toISOString())
    };
  }

  function normalizeHistoryEntry(entry) {
    return {
      id: cleanString(entry.id, uid("history")),
      workoutName: cleanString(entry.workoutName, "Workout"),
      completedAt: cleanString(entry.completedAt, new Date().toISOString()),
      durationSeconds: toNonNegativeSeconds(entry.durationSeconds)
    };
  }

  function normalizeSession(session) {
    if (!session || typeof session !== "object" || !Array.isArray(session.queue) || !session.queue.length) {
      return null;
    }

    const queue = asArray(session.queue)
      .filter(isRunnableExercise)
      .map((exercise) => ({
        ...normalizeWorkoutExercise(exercise),
        remainingSets: toPositiveInteger(exercise.remainingSets, toPositiveInteger(exercise.sets))
      }));

    if (!queue.length) return null;

    const currentExerciseIndex = Math.min(
      toNonNegativeInteger(session.currentExerciseIndex),
      queue.length
    );

    return {
      id: cleanString(session.id, uid("session")),
      workoutId: cleanString(session.workoutId),
      workoutName: cleanString(session.workoutName, "Workout"),
      startedAt: cleanString(session.startedAt, new Date().toISOString()),
      elapsedSeconds: toNonNegativeSeconds(session.elapsedSeconds),
      currentExerciseIndex,
      queue
    };
  }

  function normalizeDB(rawDB) {
    const empty = createEmptyDB();
    const parsed = asObject(rawDB);
    const parsedDraft = asObject(parsed.builderDraft);
    const parsedUi = asObject(parsed.ui);
    const parsedMeta = asObject(parsed.meta);

    return {
      ...empty,
      exercises: asArray(parsed.exercises).map(normalizeExercise),
      workouts: asArray(parsed.workouts).map(normalizeWorkout),
      history: asArray(parsed.history).map(normalizeHistoryEntry),
      builderDraft: {
        name: cleanString(parsedDraft.name),
        exercises: asArray(parsedDraft.exercises).map(normalizeWorkoutExercise)
      },
      ui: {
        selectedExerciseId: parsedUi.selectedExerciseId || null,
        activeWorkoutSession: normalizeSession(parsedUi.activeWorkoutSession)
      },
      meta: {
        defaultLibrarySeeded: parsedMeta.defaultLibrarySeeded === true,
        defaultLibraryVersion: toNonNegativeInteger(parsedMeta.defaultLibraryVersion)
      }
    };
  }

  function createDefaultExercises() {
    return DEFAULT_EXERCISES.map((exercise) => normalizeExercise({
      ...exercise,
      createdAt: DEFAULT_LIBRARY_CREATED_AT
    }));
  }

  function seedDefaultLibraryIfNeeded(db) {
    if (db.meta.defaultLibraryVersion >= DEFAULT_LIBRARY_VERSION) return db;

    const existingIds = new Set(db.exercises.map((exercise) => exercise.id));
    const existingNames = new Set(
      db.exercises.map((exercise) => exercise.name.toLowerCase())
    );
    const missingDefaults = createDefaultExercises().filter((exercise) => {
      return !existingIds.has(exercise.id) && !existingNames.has(exercise.name.toLowerCase());
    });

    db.exercises = [...db.exercises, ...missingDefaults];
    db.meta.defaultLibrarySeeded = true;
    db.meta.defaultLibraryVersion = DEFAULT_LIBRARY_VERSION;
    return db;
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = seedDefaultLibraryIfNeeded(createEmptyDB());
        saveDB(fresh);
        return fresh;
      }

      const parsed = JSON.parse(raw);
      const merged = seedDefaultLibraryIfNeeded(normalizeDB(parsed));

      if (JSON.stringify(parsed) !== JSON.stringify(merged)) {
        saveDB(merged);
      }

      return merged;
    } catch (error) {
      console.error("Failed to load DB, resetting.", error);
      const fresh = createEmptyDB();
      saveDB(fresh);
      return fresh;
    }
  }

  function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeDB(db)));
  }

  function getDB() {
    return loadDB();
  }

  function updateDB(mutator) {
    const db = loadDB();
    mutator(db);
    saveDB(db);
    return db;
  }

  function getExercises() {
    return getDB().exercises;
  }

  function getExerciseById(exerciseId) {
    return getDB().exercises.find((exercise) => exercise.id === exerciseId) || null;
  }

  function addExercise(exerciseData) {
    const exercise = normalizeExercise({
      id: uid("exercise"),
      name: exerciseData.name,
      description: exerciseData.description,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      load: exerciseData.load,
      commentary: exerciseData.commentary,
      image: exerciseData.image,
      createdAt: new Date().toISOString()
    });

    updateDB((db) => {
      db.exercises.push(exercise);
    });

    return exercise;
  }

  function deleteExercise(exerciseId) {
    updateDB((db) => {
      db.exercises = db.exercises.filter((exercise) => exercise.id !== exerciseId);

      db.builderDraft.exercises = db.builderDraft.exercises.filter(
        (exercise) => exercise.exerciseId !== exerciseId
      );

      if (db.ui.selectedExerciseId === exerciseId) {
        db.ui.selectedExerciseId = null;
      }
    });
  }

  function getWorkouts() {
    return getDB().workouts;
  }

  function getWorkoutById(workoutId) {
    return getDB().workouts.find((workout) => workout.id === workoutId) || null;
  }

  function addWorkout(workoutData) {
    const workout = normalizeWorkout({
      id: uid("workout"),
      name: workoutData.name,
      exercises: Array.isArray(workoutData.exercises) ? workoutData.exercises : [],
      createdAt: new Date().toISOString()
    });

    updateDB((db) => {
      db.workouts.push(workout);
    });

    return workout;
  }

  function deleteWorkout(workoutId) {
    updateDB((db) => {
      db.workouts = db.workouts.filter((workout) => workout.id !== workoutId);
    });
  }

  function getBuilderDraft() {
    return getDB().builderDraft;
  }

  function setBuilderDraft(draft) {
    updateDB((db) => {
      db.builderDraft = {
        name: cleanString(draft.name),
        exercises: Array.isArray(draft.exercises)
          ? draft.exercises.map(normalizeWorkoutExercise)
          : []
      };
    });
  }

  function resetBuilderDraft() {
    setBuilderDraft({
      name: "",
      exercises: []
    });
  }

  function addExerciseToBuilder(configuredExercise) {
    updateDB((db) => {
      db.builderDraft.exercises.push(normalizeWorkoutExercise({
        id: uid("workout_exercise"),
        exerciseId: configuredExercise.exerciseId,
        name: configuredExercise.name,
        image: configuredExercise.image || "",
        description: configuredExercise.description || "",
        commentary: configuredExercise.commentary || "",
        sets: configuredExercise.sets,
        reps: configuredExercise.reps,
        load: configuredExercise.load || ""
      }));
    });
  }

  function removeExerciseFromBuilder(builderExerciseId) {
    updateDB((db) => {
      db.builderDraft.exercises = db.builderDraft.exercises.filter(
        (exercise) => exercise.id !== builderExerciseId
      );
    });
  }

  function setSelectedExerciseId(exerciseId) {
    updateDB((db) => {
      db.ui.selectedExerciseId = exerciseId;
    });
  }

  function getSelectedExerciseId() {
    return getDB().ui.selectedExerciseId;
  }

  function startWorkoutSession(workoutId) {
    const workout = getWorkoutById(workoutId);
    if (!workout || !Array.isArray(workout.exercises) || !workout.exercises.length) return null;

    const session = {
      id: uid("session"),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      queue: workout.exercises.map((exercise) => ({
        ...exercise,
        remainingSets: toPositiveInteger(exercise.sets)
      }))
    };

    updateDB((db) => {
      db.ui.activeWorkoutSession = session;
    });

    return session;
  }

  function getActiveWorkoutSession() {
    return getDB().ui.activeWorkoutSession;
  }

  function saveActiveWorkoutSession(session) {
    updateDB((db) => {
      db.ui.activeWorkoutSession = session;
    });
  }

  function clearActiveWorkoutSession() {
    updateDB((db) => {
      db.ui.activeWorkoutSession = null;
    });
  }

  function addHistoryEntry(entry) {
    const historyEntry = normalizeHistoryEntry({
      id: uid("history"),
      workoutName: entry.workoutName || "Workout",
      completedAt: entry.completedAt || new Date().toISOString(),
      durationSeconds: entry.durationSeconds
    });

    updateDB((db) => {
      db.history.unshift(historyEntry);
    });

    return historyEntry;
  }

  function getHistory() {
    return getDB().history;
  }

  function deleteHistoryEntry(historyId) {
    updateDB((db) => {
      db.history = db.history.filter((entry) => entry.id !== historyId);
    });
  }

  function formatDuration(totalSeconds) {
    const safeSeconds = toNonNegativeSeconds(totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit"
    });
  }

  window.AppStore = {
    getDB,
    getExercises,
    getExerciseById,
    addExercise,
    deleteExercise,
    getWorkouts,
    getWorkoutById,
    addWorkout,
    deleteWorkout,
    getBuilderDraft,
    setBuilderDraft,
    resetBuilderDraft,
    addExerciseToBuilder,
    removeExerciseFromBuilder,
    setSelectedExerciseId,
    getSelectedExerciseId,
    startWorkoutSession,
    getActiveWorkoutSession,
    saveActiveWorkoutSession,
    clearActiveWorkoutSession,
    addHistoryEntry,
    getHistory,
    deleteHistoryEntry,
    formatDuration,
    formatDate,
    formatTime
  };
})();
