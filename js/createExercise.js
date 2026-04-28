document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-exercise-form");
  const imageInput = document.getElementById("exercise_image");
  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
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
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get("returnTo") || "exercise-library.html";
    return ALLOWED_RETURN_PAGES.has(returnTo) ? returnTo : "exercise-library.html";
  }

  function shouldPickAfterSave() {
    const params = new URLSearchParams(window.location.search);
    return params.get("pickAfterSave") === "1";
  }

  function parsePositiveInteger(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed);
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

    let image = "";
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

    const exercise = window.AppStore.addExercise({
      name,
      description,
      sets,
      reps,
      load,
      commentary,
      image
    });

    if (shouldPickAfterSave()) {
      window.AppStore.setSelectedExerciseId(exercise.id);
      window.location.href = "exercise-details.html";
      return;
    }

    window.location.href = getReturnUrl();
  });
});
