document.addEventListener("DOMContentLoaded", () => {
  const exerciseNameEl = document.getElementById("exercise-name");
  const exerciseImageEl = document.getElementById("exercise-image");
  const setsRemainingEl = document.getElementById("sets-remaining");
  const targetRepsEl = document.getElementById("target-reps");
  const timerDisplayEl = document.getElementById("timer-display");
  const playPauseButton = document.getElementById("play-pause-button");
  const playPauseIcon = document.getElementById("play-pause-icon");
  const restartTimerButton = document.getElementById("restart-timer-button");
  const skipExerciseButton = document.getElementById("skip-exercise-button");
  const exerciseDescriptionEl = document.getElementById("exercise-description");
  const finishSetButton = document.getElementById("finish-set-button");
  const upNextGrid = document.getElementById("up-next-grid");

  let session = window.AppStore.getActiveWorkoutSession();
  let timerId = null;
  let isRunning = false;

  if (!session || !Array.isArray(session.queue) || !session.queue.length) {
    alert("No active workout found.");
    window.location.href = "index.html";
    return;
  }

  function currentExercise() {
    return session.queue[session.currentExerciseIndex] || null;
  }

  function render() {
    const exercise = currentExercise();

    if (!exercise) {
      completeWorkout();
      return;
    }

    exerciseNameEl.textContent = exercise.name || "Exercise";
    exerciseDescriptionEl.textContent =
      exercise.commentary || exercise.description || "No description for this exercise yet.";
    setsRemainingEl.textContent = String(exercise.remainingSets || 0).padStart(2, "0");
    targetRepsEl.textContent = String(exercise.reps || 0).padStart(2, "0");
    timerDisplayEl.textContent = window.AppStore.formatDuration(session.elapsedSeconds || 0);

    if (exercise.image) {
      exerciseImageEl.src = exercise.image;
      exerciseImageEl.style.display = "block";
    } else {
      exerciseImageEl.removeAttribute("src");
      exerciseImageEl.style.display = "none";
    }

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
            <div class="space-y-1">
              <p class="font-headline font-bold text-lg uppercase tracking-wider text-on-background">
                ${escapeHtml(exercise.name)}
              </p>
              <p class="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                ${exercise.sets} SETS X ${exercise.reps} REPS
              </p>
            </div>
            <span class="material-symbols-outlined text-white/20 group-hover:text-primary transition-colors">arrow_forward</span>
          </div>
        `
      )
      .join("");
  }

  function saveSession() {
    window.AppStore.saveActiveWorkoutSession(session);
  }

  function startTimer() {
    if (isRunning) return;

    isRunning = true;
    playPauseIcon.textContent = "pause";

    timerId = window.setInterval(() => {
      session.elapsedSeconds += 1;
      timerDisplayEl.textContent = window.AppStore.formatDuration(session.elapsedSeconds);
      saveSession();
    }, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;

    isRunning = false;
    playPauseIcon.textContent = "play_arrow";

    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function restartTimer() {
    session.elapsedSeconds = 0;
    saveSession();
    timerDisplayEl.textContent = "00:00";
  }

  function moveToNextExercise() {
    session.currentExerciseIndex += 1;
    saveSession();

    if (!currentExercise()) {
      completeWorkout();
      return;
    }

    render();
  }

  function finishSet() {
    const exercise = currentExercise();
    if (!exercise) return;

    if (exercise.remainingSets > 1) {
      exercise.remainingSets -= 1;
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
    pauseTimer();

    window.AppStore.addHistoryEntry({
      workoutName: session.workoutName,
      completedAt: new Date().toISOString(),
      durationSeconds: session.elapsedSeconds || 0
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

  restartTimerButton?.addEventListener("click", restartTimer);
  skipExerciseButton?.addEventListener("click", skipExercise);
  finishSetButton?.addEventListener("click", finishSet);

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  render();
});