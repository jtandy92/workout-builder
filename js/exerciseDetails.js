document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const editWorkoutId = params.get("editWorkoutId") || "";
  const exerciseId = window.AppStore.getSelectedExerciseId();
  const exercise = exerciseId ? window.AppStore.getExerciseById(exerciseId) : null;

  const nameEl = document.getElementById("details-exercise-name");
  const imageEl = document.getElementById("details-exercise-image");
  const setsEl = document.getElementById("details-sets");
  const repsEl = document.getElementById("details-reps");
  const restSecondsEl = document.getElementById("details-rest-seconds");
  const loadEl = document.getElementById("details-load");
  const commentaryEl = document.getElementById("details-commentary");
  const saveButton = document.getElementById("details-save-button");

  if (!exercise) {
    alert("No exercise selected. Please choose one from the library.");
    window.location.href = "exercise-library.html?mode=pick";
    return;
  }

  if (nameEl) {
    nameEl.innerHTML = `
      ${escapeHtml(exercise.name)}<br />
      <span class="text-cyan-400">Details</span>
    `;
  }

  if (imageEl && exercise.image) {
    imageEl.src = exercise.image;
  }

  if (setsEl) setsEl.value = exercise.sets || 4;
  if (repsEl) repsEl.value = exercise.reps || 10;
  if (restSecondsEl) restSecondsEl.value = exercise.restSeconds ?? window.AppStore.DEFAULT_REST_SECONDS;
  if (loadEl) loadEl.value = parseLoadNumber(exercise.load);
  if (commentaryEl) commentaryEl.textContent = exercise.commentary || exercise.description || "Edit commentary here.";

  function parsePositiveInteger(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
  }

  function parseNonNegativeNumber(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
  }

  function parseRestSeconds(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
  }

  saveButton?.addEventListener("click", () => {
    const sets = parsePositiveInteger(setsEl?.value);
    const reps = parsePositiveInteger(repsEl?.value);
    const restSeconds = parseRestSeconds(restSecondsEl?.value);
    const loadValue = parseNonNegativeNumber(loadEl?.value || 0);

    if (!sets || !reps) {
      alert("Sets and reps must be whole numbers greater than 0.");
      return;
    }

    if (restSeconds === null) {
      alert("Rest time must be 0 seconds or greater.");
      return;
    }

    if (loadValue === null) {
      alert("Load must be 0 or greater.");
      return;
    }

    const configuredExercise = {
      exerciseId: exercise.id,
      name: exercise.name,
      image: exercise.image || "",
      description: exercise.description || "",
      commentary: commentaryEl?.textContent?.trim() || "",
      sets,
      reps,
      restSeconds,
      load: loadValue > 0
        ? `${loadValue} kg`
        : ""
    };

    window.AppStore.addExerciseToBuilder(configuredExercise);
    const editParam = editWorkoutId ? `?editWorkoutId=${encodeURIComponent(editWorkoutId)}` : "";
    window.location.href = `workout-builder.html${editParam}`;
  });

  function parseLoadNumber(loadText) {
    if (!loadText) return 0;
    const match = String(loadText).match(/[\d.]+/);
    return match ? Number(match[0]) : 0;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
});
