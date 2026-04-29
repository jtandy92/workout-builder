document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-exercise-form");
  const imageInput = document.getElementById("exercise_image");
  const titleEl = document.querySelector("main h2");
  const descriptionCopyEl = document.querySelector("main section p");
  const submitButton = form?.querySelector('button[type="submit"]');
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  const params = new URLSearchParams(window.location.search);
  const editExerciseId = params.get("exerciseId") || "";
  const editingExercise = editExerciseId
    ? window.AppStore.getExerciseById(editExerciseId)
    : null;
  const ALLOWED_RETURN_PAGES = new Set([
    "exercise-library.html",
    "exercise-library.html?mode=pick",
    "workout-builder.html"
  ]);

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function getReturnUrl() {
    const returnTo = params.get("returnTo") || "exercise-library.html";
    return ALLOWED_RETURN_PAGES.has(returnTo) ? returnTo : "exercise-library.html";
  }

  function shouldPickAfterSave() {
    return params.get("pickAfterSave") === "1";
  }

  function parsePositiveInteger(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
  }

  if (editExerciseId && !editingExercise) {
    alert("Exercise not found.");
    window.location.href = getReturnUrl();
    return;
  }

  if (editingExercise) {
    const nameInput = document.getElementById("exercise_name");
    const descriptionInput = document.getElementById("description");
    const setsInput = document.getElementById("sets");
    const repsInput = document.getElementById("reps");
    const loadInput = document.getElementById("load");
    const commentaryInput = document.getElementById("commentary");

    if (titleEl) {
      titleEl.innerHTML = 'Edit<br />Exercise_';
    }

    if (descriptionCopyEl) {
      descriptionCopyEl.textContent = "Modify the current exercise and save the updated version into the library.";
    }

    if (submitButton) {
      submitButton.textContent = "Execute_Update";
    }

    if (nameInput) nameInput.value = editingExercise.name || "";
    if (descriptionInput) descriptionInput.value = editingExercise.description || "";
    if (setsInput) setsInput.value = String(editingExercise.sets || 4);
    if (repsInput) repsInput.value = String(editingExercise.reps || 12);
    if (loadInput) loadInput.value = editingExercise.load || "";
    if (commentaryInput) commentaryInput.value = editingExercise.commentary || "";
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("exercise_name")?.value.trim() || "";
    const description = document.getElementById("description")?.value.trim() || "";
    const sets = parsePositiveInteger(document.getElementById("sets")?.value);
    const reps = parsePositiveInteger(document.getElementById("reps")?.value);
    const load = document.getElementById("load")?.value.trim() || "";
    const commentary = document.getElementById("commentary")?.value.trim() || "";

    if (!name) {
      alert("Please enter an exercise name.");
      return;
    }

    if (!sets || !reps) {
      alert("Sets and reps must be whole numbers greater than 0.");
      return;
    }

    let image = editingExercise?.image || "";
    const file = imageInput?.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        return;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        alert("Please choose an image smaller than 2 MB.");
        return;
      }

      try {
        image = await fileToDataUrl(file);
      } catch (error) {
        console.error(error);
        alert("Could not read the image file.");
        return;
      }
    }

    const exercise = editingExercise
      ? window.AppStore.updateExercise(editingExercise.id, {
          name,
          description,
          sets,
          reps,
          load,
          commentary,
          image
        })
      : window.AppStore.addExercise({
          name,
          description,
          sets,
          reps,
          load,
          commentary,
          image
        });

    if (!exercise) {
      alert("Could not save the exercise.");
      return;
    }

    if (shouldPickAfterSave()) {
      window.AppStore.setSelectedExerciseId(exercise.id);
      const editWorkoutId = params.get("editWorkoutId") || "";
      const editParam = editWorkoutId ? `?editWorkoutId=${encodeURIComponent(editWorkoutId)}` : "";
      window.location.href = `exercise-details.html${editParam}`;
      return;
    }

    window.location.href = getReturnUrl();
  });
});
