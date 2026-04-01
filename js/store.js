(function () {
  const STORAGE_KEY = "exercise_app_db_v1";

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
      }
    };
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = createEmptyDB();
        saveDB(fresh);
        return fresh;
      }

      const parsed = JSON.parse(raw);
      const merged = {
        ...createEmptyDB(),
        ...parsed,
        builderDraft: {
          ...createEmptyDB().builderDraft,
          ...(parsed.builderDraft || {})
        },
        ui: {
          ...createEmptyDB().ui,
          ...(parsed.ui || {})
        }
      };

      const historyNeedsIds = (merged.history || []).some((entry) => !entry.id);
      if (historyNeedsIds) {
        merged.history = (merged.history || []).map((entry) => ({
          ...entry,
          id: entry.id || uid("history")
        }));
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
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
    const exercise = {
      id: uid("exercise"),
      name: exerciseData.name || "Untitled Exercise",
      description: exerciseData.description || "",
      sets: Number(exerciseData.sets || 0),
      reps: Number(exerciseData.reps || 0),
      load: exerciseData.load || "",
      commentary: exerciseData.commentary || "",
      image: exerciseData.image || "",
      createdAt: new Date().toISOString()
    };

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
    const workout = {
      id: uid("workout"),
      name: workoutData.name || "Untitled Workout",
      exercises: Array.isArray(workoutData.exercises) ? workoutData.exercises : [],
      createdAt: new Date().toISOString()
    };

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
        name: draft.name || "",
        exercises: Array.isArray(draft.exercises) ? draft.exercises : []
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
      db.builderDraft.exercises.push({
        id: uid("workout_exercise"),
        exerciseId: configuredExercise.exerciseId,
        name: configuredExercise.name,
        image: configuredExercise.image || "",
        description: configuredExercise.description || "",
        commentary: configuredExercise.commentary || "",
        sets: Number(configuredExercise.sets || 0),
        reps: Number(configuredExercise.reps || 0),
        load: configuredExercise.load || ""
      });
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
    if (!workout) return null;

    const session = {
      id: uid("session"),
      workoutId: workout.id,
      workoutName: workout.name,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      currentExerciseIndex: 0,
      queue: workout.exercises.map((exercise) => ({
        ...exercise,
        remainingSets: Number(exercise.sets || 0)
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
    const historyEntry = {
      id: uid("history"),
      workoutName: entry.workoutName || "Workout",
      completedAt: entry.completedAt || new Date().toISOString(),
      durationSeconds: Number(entry.durationSeconds || 0)
    };

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
    const safeSeconds = Math.max(0, Number(totalSeconds || 0));
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
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