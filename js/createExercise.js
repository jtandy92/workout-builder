document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("create-exercise-form");
  const imageInput = document.getElementById("exercise_image");

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
    return params.get("returnTo") || "exercise-library.html";
  }

  function shouldPickAfterSave() {
    const params = new URLSearchParams(window.location.search);
    return params.get("pickAfterSave") === "1";
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("exercise_name")?.value.trim() || "";
    const description = document.getElementById("description")?.value.trim() || "";
    const sets = document.getElementById("sets")?.value || "0";
    const reps = document.getElementById("reps")?.value || "0";
    const load = document.getElementById("load")?.value.trim() || "";
    const commentary = document.getElementById("commentary")?.value.trim() || "";

    if (!name) {
      alert("Please enter an exercise name.");
      return;
    }

    let image = "";
    const file = imageInput?.files?.[0];
    if (file) {
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