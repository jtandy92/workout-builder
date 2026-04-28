document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("library-search");
  const createButton = document.getElementById("create-new-exercise-button");
  const grid =
    document.getElementById("library-grid") ||
    document.querySelector("main .grid");

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") || "browse";

  function createExerciseUrl() {
    if (mode === "pick") {
      return "create-exercise.html?returnTo=exercise-library.html%3Fmode%3Dpick&pickAfterSave=1";
    }
    return "create-exercise.html?returnTo=exercise-library.html";
  }

  createButton?.addEventListener("click", () => {
    window.location.href = createExerciseUrl();
  });

  searchInput?.addEventListener("input", render);

  function render() {
    if (!grid) return;

    const query = (searchInput?.value || "").trim().toLowerCase();
    const exercises = window.AppStore.getExercises().filter((exercise) => {
      return String(exercise.name || "").toLowerCase().includes(query);
    });

    if (!exercises.length) {
      grid.innerHTML = `
        <div class="md:col-span-2 lg:col-span-3 bg-surface-container p-10 border border-outline text-center">
          <h3 class="text-3xl font-headline font-bold uppercase tracking-widest text-primary mb-4">
            No Exercises Found
          </h3>
          <p class="text-on-surface-variant text-sm uppercase tracking-wider mb-8">
            Create your first exercise to start building workouts.
          </p>
          <button id="empty-create-exercise" class="bg-primary text-surface px-8 py-4 font-label font-bold uppercase tracking-[0.2em] hover:bg-cyan-300 active:scale-95 transition-all">
            Create Exercise
          </button>
        </div>
      `;

      document.getElementById("empty-create-exercise")?.addEventListener("click", () => {
        window.location.href = createExerciseUrl();
      });

      return;
    }

    grid.innerHTML = exercises
      .map((exercise) => {
        const imageMarkup = exercise.image
          ? `<img alt="${escapeHtml(exercise.name)}" class="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" src="${escapeHtml(exercise.image)}" />`
          : `<div class="w-full h-full flex items-center justify-center text-[10px] font-mono text-neutral-600 uppercase tracking-widest">No Image</div>`;

        return `
          <div class="bg-surface-container p-8 flex flex-col justify-between group cyber-card-border transition-all min-h-[260px] relative overflow-hidden">
            <button
              class="delete-exercise absolute top-4 right-4 text-neutral-700 group-hover:text-error transition-colors z-20"
              data-exercise-id="${escapeHtml(exercise.id)}"
              type="button"
              title="Delete exercise"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>

            <button
              class="open-exercise flex flex-col justify-between text-left w-full h-full cursor-pointer"
              data-exercise-id="${escapeHtml(exercise.id)}"
              type="button"
              title="${mode === "pick" ? "Add exercise" : "Open exercise"}"
            >
              <div class="flex flex-col gap-6">
                <div class="w-24 h-24 bg-neutral-900 overflow-hidden border border-outline group-hover:border-primary/40 transition-colors">
                  ${imageMarkup}
                </div>
              </div>

              <div class="mt-8">
                <span class="text-[10px] text-primary font-label uppercase tracking-[0.3em] mb-2 block opacity-60">Exercise</span>
                <h3 class="text-2xl font-bold font-headline text-on-background leading-none uppercase tracking-tighter group-hover:text-primary transition-colors">
                  ${escapeHtml(exercise.name)}
                </h3>
              </div>
            </button>
          </div>
        `;
      })
      .join("");

    grid.querySelectorAll(".open-exercise").forEach((button) => {
      button.addEventListener("click", () => {
        const exerciseId = button.dataset.exerciseId;
        window.AppStore.setSelectedExerciseId(exerciseId);

        if (mode === "pick") {
          window.location.href = "exercise-details.html";
          return;
        }

        alert("This exercise is saved in your library. Use Workout Builder > Add Exercise to place it into a workout.");
      });
    });

    grid.querySelectorAll(".delete-exercise").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        const exerciseId = button.dataset.exerciseId;
        const exercise = window.AppStore.getExerciseById(exerciseId);
        if (!exercise) return;

        const confirmed = window.confirm(`Delete "${exercise.name}"?`);
        if (!confirmed) return;

        window.AppStore.deleteExercise(exerciseId);
        render();
      });
    });
  }

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
