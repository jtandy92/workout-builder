(function () {
  const STORAGE_KEY = "exercise_app_db_v1";
  const DEFAULT_LIBRARY_VERSION = 2;
  const DEFAULT_LIBRARY_CREATED_AT = "2026-04-28T00:00:00.000Z";
  const DEFAULT_REST_SECONDS = 60;
  const DEFAULT_EXERCISES = [
    {
      id: "seed_push_ups",
      name: "Push-ups",
      description: "Keep a straight line from shoulders to heels. Lower under control, then press the floor away.",
      sets: 3,
      reps: 12,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Brace the core and keep elbows tracking close to the body.",
      image: "assets/exercises/push-ups.png"
    },
    {
      id: "seed_wall_pushups",
      name: "wall pushups",
      description: "Stand facing a wall, keep the body straight, and lower the chest toward the hands before pressing away.",
      sets: 3,
      reps: 12,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Step farther from the wall to make the movement harder.",
      image: "assets/exercises/wall-pushups.png"
    },
    {
      id: "seed_incline_push_ups",
      name: "Incline push-ups",
      description: "Place the hands on an elevated surface and keep a straight plank as you lower and press.",
      sets: 3,
      reps: 12,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Use a lower surface as strength improves.",
      image: "assets/exercises/incline-push-ups.png"
    },
    {
      id: "seed_decline_push_ups",
      name: "Decline push-ups",
      description: "Elevate the feet, keep the body rigid, and lower the chest toward the floor under control.",
      sets: 3,
      reps: 10,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Keep the hips from sagging as fatigue builds.",
      image: "assets/exercises/decline-push-ups.png"
    },
    {
      id: "seed_rows",
      name: "Rows",
      description: "Grip the rings, keep the body straight, and pull the chest toward the hands.",
      sets: 3,
      reps: 10,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Walk the feet farther forward to increase the challenge.",
      image: "assets/exercises/rows.png"
    },
    {
      id: "seed_negative_pull_ups",
      name: "Negative pull-ups",
      description: "Start at the top of the pull-up and lower slowly until the arms are fully extended.",
      sets: 3,
      reps: 5,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Use a box or jump to reach the top position, then control the descent.",
      image: "assets/exercises/negative-pull-ups.png"
    },
    {
      id: "seed_pull_ups",
      name: "pull-ups",
      description: "Hang from the bar, pull the chest upward, and lower back to a full controlled hang.",
      sets: 3,
      reps: 6,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Keep the ribs down and avoid swinging between reps.",
      image: "assets/exercises/pull-ups.png"
    },
    {
      id: "seed_scapular_pulls",
      name: "Scapular pulls",
      description: "Hang with straight arms and pull the shoulder blades down without bending the elbows.",
      sets: 3,
      reps: 8,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Think about moving the shoulders away from the ears.",
      image: "assets/exercises/scapular-pulls.png"
    },
    {
      id: "seed_plank",
      name: "plank",
      description: "Hold a strong forearm plank with ribs tucked and glutes lightly squeezed.",
      sets: 3,
      reps: 30,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Treat reps as seconds for this exercise.",
      image: "assets/exercises/plank.png"
    },
    {
      id: "seed_glute_bridge",
      name: "Glute bridge",
      description: "Lie on your back, brace the core, and squeeze the glutes to lift the hips.",
      sets: 3,
      reps: 15,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Pause at the top without over-arching the low back.",
      image: "assets/exercises/glute-bridge.png"
    },
    {
      id: "seed_split_squats",
      name: "Split squats",
      description: "Use a stationary lunge stance, lower the back knee, and drive through the front foot to stand.",
      sets: 3,
      reps: 10,
      restSeconds: DEFAULT_REST_SECONDS,
      commentary: "Count reps per side and keep the front knee tracking over the toes.",
      image: "assets/exercises/split-squats.png"
    }
  ];
  const DEFAULT_EXERCISE_IDS = new Set(DEFAULT_EXERCISES.map((exercise) => exercise.id));
  const LEGACY_DEFAULT_EXERCISE_IDS = new Set([
    "seed_push_up",
    "seed_bodyweight_squat",
    "seed_reverse_lunge",
    "seed_glute_bridge",
    "seed_plank_hold",
    "seed_dead_bug",
    "seed_mountain_climber",
    "seed_burpee",
    "seed_dumbbell_row",
    "seed_shoulder_press",
    "seed_romanian_deadlift",
    "seed_jumping_jack"
  ]);

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
        activeWorkoutSession: null,
        builderEditingWorkoutId: null
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

  function normalizeRestSeconds(value, fallback = DEFAULT_REST_SECONDS) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
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
      restSeconds: normalizeRestSeconds(exercise.restSeconds),
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
      restSeconds: normalizeRestSeconds(exercise.restSeconds),
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
      timerDurationSeconds: normalizeRestSeconds(session.timerDurationSeconds),
      timerRemainingSeconds: normalizeRestSeconds(
        session.timerRemainingSeconds,
        normalizeRestSeconds(session.timerDurationSeconds)
      ),
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
        activeWorkoutSession: normalizeSession(parsedUi.activeWorkoutSession),
        builderEditingWorkoutId: parsedUi.builderEditingWorkoutId || null
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

    if (db.meta.defaultLibraryVersion < 2) {
      db.exercises = db.exercises.filter((exercise) => {
        return !DEFAULT_EXERCISE_IDS.has(exercise.id) && !LEGACY_DEFAULT_EXERCISE_IDS.has(exercise.id);
      });
    }

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
      restSeconds: exerciseData.restSeconds,
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

  function updateExercise(exerciseId, exerciseData) {
    let updatedExercise = null;

    updateDB((db) => {
      const index = db.exercises.findIndex((exercise) => exercise.id === exerciseId);
      if (index < 0) return;

      const existingExercise = db.exercises[index];
      updatedExercise = normalizeExercise({
        ...existingExercise,
        id: existingExercise.id,
        createdAt: existingExercise.createdAt,
        name: exerciseData.name,
        description: exerciseData.description,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        restSeconds: exerciseData.restSeconds,
        load: exerciseData.load,
        commentary: exerciseData.commentary,
        image: exerciseData.image
      });

      db.exercises[index] = updatedExercise;

      db.builderDraft.exercises = db.builderDraft.exercises.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;
        return normalizeWorkoutExercise({
          ...exercise,
          name: updatedExercise.name,
          image: updatedExercise.image,
          description: updatedExercise.description,
          commentary: updatedExercise.commentary,
          sets: updatedExercise.sets,
          reps: updatedExercise.reps,
          restSeconds: updatedExercise.restSeconds,
          load: updatedExercise.load
        });
      });

      db.workouts = db.workouts.map((workout) => ({
        ...workout,
        exercises: workout.exercises.map((exercise) => {
          if (exercise.exerciseId !== exerciseId) return exercise;
          return normalizeWorkoutExercise({
            ...exercise,
            name: updatedExercise.name,
            image: updatedExercise.image,
            description: updatedExercise.description,
            commentary: updatedExercise.commentary,
            sets: updatedExercise.sets,
            reps: updatedExercise.reps,
            restSeconds: updatedExercise.restSeconds,
            load: updatedExercise.load
          });
        })
      }));

      if (db.ui.activeWorkoutSession?.queue?.length) {
        db.ui.activeWorkoutSession = normalizeSession({
          ...db.ui.activeWorkoutSession,
          queue: db.ui.activeWorkoutSession.queue.map((exercise) => {
            if (exercise.exerciseId !== exerciseId) return exercise;
            return {
              ...exercise,
              name: updatedExercise.name,
              image: updatedExercise.image,
              description: updatedExercise.description,
              commentary: updatedExercise.commentary,
              sets: updatedExercise.sets,
              reps: updatedExercise.reps,
              restSeconds: updatedExercise.restSeconds,
              load: updatedExercise.load
            };
          })
        });
      }
    });

    return updatedExercise;
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

  function updateWorkout(workoutId, workoutData) {
    let updatedWorkout = null;

    updateDB((db) => {
      const index = db.workouts.findIndex((workout) => workout.id === workoutId);
      if (index < 0) return;

      const existingWorkout = db.workouts[index];
      updatedWorkout = normalizeWorkout({
        ...existingWorkout,
        id: existingWorkout.id,
        name: workoutData.name,
        exercises: Array.isArray(workoutData.exercises) ? workoutData.exercises : [],
        createdAt: existingWorkout.createdAt
      });

      db.workouts[index] = updatedWorkout;
    });

    return updatedWorkout;
  }

  function deleteWorkout(workoutId) {
    updateDB((db) => {
      db.workouts = db.workouts.filter((workout) => workout.id !== workoutId);

      if (db.ui.builderEditingWorkoutId === workoutId) {
        db.ui.builderEditingWorkoutId = null;
      }
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

  function setBuilderEditingWorkoutId(workoutId) {
    updateDB((db) => {
      db.ui.builderEditingWorkoutId = workoutId || null;
    });
  }

  function getBuilderEditingWorkoutId() {
    return getDB().ui.builderEditingWorkoutId || null;
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
        restSeconds: configuredExercise.restSeconds,
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
      timerDurationSeconds: normalizeRestSeconds(workout.exercises[0]?.restSeconds),
      timerRemainingSeconds: normalizeRestSeconds(workout.exercises[0]?.restSeconds),
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
    updateExercise,
    deleteExercise,
    getWorkouts,
    getWorkoutById,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    getBuilderDraft,
    setBuilderDraft,
    resetBuilderDraft,
    setBuilderEditingWorkoutId,
    getBuilderEditingWorkoutId,
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
    DEFAULT_REST_SECONDS,
    formatDuration,
    formatDate,
    formatTime
  };
})();
