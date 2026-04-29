document.addEventListener("DOMContentLoaded", () => {
  const exerciseNameEl = document.getElementById("exercise-name");
  const exerciseImageEl = document.getElementById("exercise-image");
  const setsRemainingEl = document.getElementById("sets-remaining");
  const targetRepsEl = document.getElementById("target-reps");
  const timerDisplayEl = document.getElementById("timer-display");
  const restPresetDisplayEl = document.getElementById("rest-preset-display");
  const timerProgressRingEl = document.getElementById("timer-progress-ring");
  const playPauseButton = document.getElementById("play-pause-button");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const restartTimerButton = document.getElementById("restart-timer-button");
  const decreaseTimerButton = document.getElementById("decrease-timer-button");
  const increaseTimerButton = document.getElementById("increase-timer-button");
  const skipExerciseButton = document.getElementById("skip-exercise-button");
  const exerciseDescriptionEl = document.getElementById("exercise-description");
  const finishSetButton = document.getElementById("finish-set-button");
  const upNextGrid = document.getElementById("up-next-grid");

  const TIMER_STEP_SECONDS = 15;
  const PROGRESS_CIRCUMFERENCE = 1000;

  let session = window.AppStore.getActiveWorkoutSession();
  let timerId = null;
  let isRunning = false;
  let isCompleting = false;

  if (!session || !Array.isArray(session.queue) || !session.queue.length) {
    alert("No active workout found.");
    window.location.href = "index.html";
    return;
  }

  function currentExercise() {
    return session.queue[session.currentExerciseIndex] || null;
  }

  function getExerciseRestSeconds(exercise) {
    return Math.max(0, Number(exercise?.restSeconds ?? window.AppStore.DEFAULT_REST_SECONDS) || 0);
  }

  function syncTimerToExercise(exercise, preserveRemaining = false) {
    const presetSeconds = getExerciseRestSeconds(exercise);
    session.timerDurationSeconds = presetSeconds;
    session.timerRemainingSeconds = preserveRemaining
      ? Math.min(session.timerRemainingSeconds ?? presetSeconds, presetSeconds)
      : presetSeconds;
  }

  function saveSession() {
    window.AppStore.saveActiveWorkoutSession(session);
  }

  function updateTimerProgress() {
    const total = Math.max(0, Number(session.timerDurationSeconds) || 0);
    const remaining = Math.max(0, Number(session.timerRemainingSeconds) || 0);
    const completionRatio = total > 0 ? remaining / total : 0;
    const dashOffset = PROGRESS_CIRCUMFERENCE * (1 - completionRatio);

    if (timerProgressRingEl) {
      timerProgressRingEl.style.strokeDashoffset = String(dashOffset);
    }
  }

  function updateTimerUi() {
    const remaining = Math.max(0, Number(session.timerRemainingSeconds) || 0);
    const preset = Math.max(0, Number(session.timerDurationSeconds) || 0);

    timerDisplayEl.textContent = window.AppStore.formatDuration(remaining);
    restPresetDisplayEl.textContent = window.AppStore.formatDuration(preset);
    updateTimerProgress();

  }

  function render() {
    const exercise = currentExercise();

    if (!exercise) {
      completeWorkout();
      return;
    }

    if (typeof session.timerDurationSeconds !== "number" || typeof session.timerRemainingSeconds !== "number") {
      syncTimerToExercise(exercise);
      saveSession();
    }

    exerciseNameEl.textContent = exercise.name || "Exercise";
    exerciseDescriptionEl.textContent =
      exercise.commentary || exercise.description || "No description for this exercise yet.";
    setsRemainingEl.textContent = String(Math.max(0, Number(exercise.remainingSets) || 0)).padStart(2, "0");
    targetRepsEl.textContent = String(Math.max(0, Number(exercise.reps) || 0)).padStart(2, "0");

    if (exercise.image) {
      exerciseImageEl.src = exercise.image;
      exerciseImageEl.style.display = "block";
    } else {
      exerciseImageEl.removeAttribute("src");
      exerciseImageEl.style.display = "none";
    }

    updateTimerUi();
    renderUpNext();
  }

  function renderUpNext() {
    const upcoming = session.queue.slice(session.currentExerciseIndex + 1, session.currentExerciseIndex + 4);

    if (!upcoming.length) {
      upNextGrid.innerHTML = `
        <div class="md:col-span-3 bg-surface border border-white/10 p-6 text-center">
          <p class="font-headline font-bold text-lg uppercase tracking-wider text-on-background">
            Final exercise in queue
          </p>
        </div>
      `;
      return;
    }

    upNextGrid.innerHTML = upcoming
      .map(
        (exercise) => `
          <div class="bg-surface border border-white/10 p-6 flex justify-between items-center group hover:border-primary/50 transition-all">
            <div class="space-y-2">
              <p class="font-headline font-bold text-lg uppercase tracking-wider text-on-background">
                ${escapeHtml(exercise.name)}
              </p>
              <p class="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                ${escapeHtml(exercise.sets)} SETS X ${escapeHtml(exercise.reps)} REPS
              </p>
              <p class="font-mono text-[10px] text-primary/70 uppercase tracking-[0.2em]">
                REST ${escapeHtml(window.AppStore.formatDuration(getExerciseRestSeconds(exercise)))}
              </p>
            </div>
            <span class="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">arrow_forward</span>
          </div>
        `
      )
      .join("");
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }

    isRunning = false;
    playPauseIcon.textContent = "play_arrow";
  }

  function tickTimer() {
    session.elapsedSeconds += 1;
    session.timerRemainingSeconds = Math.max(0, (Number(session.timerRemainingSeconds) || 0) - 1);

    if (session.timerRemainingSeconds <= 0) {
      session.timerRemainingSeconds = 0;
      stopTimer();
    }

    saveSession();
    updateTimerUi();
  }

  function startTimer() {
    if (isRunning) return;
    if ((Number(session.timerRemainingSeconds) || 0) <= 0) {
      session.timerRemainingSeconds = Math.max(0, Number(session.timerDurationSeconds) || 0);
    }

    isRunning = true;
    playPauseIcon.textContent = "pause";
    updateTimerUi();
    saveSession();

    timerId = window.setInterval(tickTimer, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    stopTimer();
    updateTimerUi();
  }

  function resetTimer() {
    session.timerRemainingSeconds = Math.max(0, Number(session.timerDurationSeconds) || 0);
    saveSession();
    updateTimerUi();
  }

  function adjustTimer(deltaSeconds) {
    const exercise = currentExercise();
    if (!exercise) return;

    const nextPreset = Math.max(0, getExerciseRestSeconds(exercise) + deltaSeconds);
    exercise.restSeconds = nextPreset;
    session.timerDurationSeconds = nextPreset;
    session.timerRemainingSeconds = Math.max(0, (Number(session.timerRemainingSeconds) || 0) + deltaSeconds);

    if (session.timerRemainingSeconds > nextPreset) {
      session.timerRemainingSeconds = nextPreset;
    }

    if (nextPreset === 0) {
      stopTimer();
    }

    saveSession();
    updateTimerUi();
    renderUpNext();
  }

  function moveToNextExercise() {
    session.currentExerciseIndex += 1;
    stopTimer();

    const nextExercise = currentExercise();
    if (!nextExercise) {
      saveSession();
      completeWorkout();
      return;
    }

    syncTimerToExercise(nextExercise);
    saveSession();
    render();
  }

  function finishSet() {
    const exercise = currentExercise();
    if (!exercise) return;

    stopTimer();

    if (exercise.remainingSets > 1) {
      exercise.remainingSets -= 1;
      syncTimerToExercise(exercise);
      saveSession();
      render();
      return;
    }

    exercise.remainingSets = 0;
    saveSession();
    moveToNextExercise();
  }

  function skipExercise() {
    const confirmed = window.confirm("Skip this exercise?");
    if (!confirmed) return;

    moveToNextExercise();
  }

  function completeWorkout() {
    if (isCompleting) return;
    isCompleting = true;

    stopTimer();

    const startedAtMs = new Date(session.startedAt).getTime();
    const durationSeconds = Number.isFinite(startedAtMs)
      ? Math.max(0, Math.round((Date.now() - startedAtMs) / 1000))
      : session.elapsedSeconds || 0;

    window.AppStore.addHistoryEntry({
      workoutName: session.workoutName,
      completedAt: new Date().toISOString(),
      durationSeconds
    });

    window.AppStore.clearActiveWorkoutSession();
    alert(`Workout complete: ${session.workoutName}`);
    window.location.href = "workout-history.html";
  }

  playPauseButton?.addEventListener("click", () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  restartTimerButton?.addEventListener("click", resetTimer);
  decreaseTimerButton?.addEventListener("click", () => adjustTimer(-TIMER_STEP_SECONDS));
  increaseTimerButton?.addEventListener("click", () => adjustTimer(TIMER_STEP_SECONDS));
  skipExerciseButton?.addEventListener("click", skipExercise);
  finishSetButton?.addEventListener("click", finishSet);

  render();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
