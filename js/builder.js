document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("builder-workout-name");
  const listSection = document.getElementById("builder-list-section");
  const addExerciseButton = document.getElementById("add-exercise-button");
  const saveRoutineButton = document.getElementById("save-routine-button");

  function loadDraft() {
    return window.AppStore.getBuilderDraft();
  }

  function saveDraftName() {
    const current = loadDraft();
    window.AppStore.setBuilderDraft({
      ...current,
      name: nameInput?.value.trim() || ""
    });
  }

  nameInput?.addEventListener("input", saveDraftName);

  addExerciseButton?.addEventListener("click", () => {
    saveDraftName();
    window.location.href = "exercise-library.html?mode=pick";
  });

  saveRoutineButton?.addEventListener("click", () => {
    saveDraftName();
    const draft = loadDraft();
    const validExercises = draft.exercises.filter((exercise) => {
      const sets = Number(exercise.sets);
      const reps = Number(exercise.reps);
      return Number.isFinite(sets) && sets > 0 && Number.isFinite(reps) && reps > 0;
    });

    if (!draft.name.trim()) {
      alert("Please enter a workout name.");
      return;
    }

    if (!validExercises.length) {
      alert("Please add at least one exercise.");
      return;
    }

    window.AppStore.addWorkout({
      name: draft.name,
      exercises: validExercises
    });

    window.AppStore.resetBuilderDraft();
    window.location.href = "index.html";
  });

  function render() {
    const draft = loadDraft();

    if (nameInput && !nameInput.value) {
      nameInput.value = draft.name || "";
    }

    const headerMarkup = `
      <div class="flex items-center justify-between mb-8 border-b border-white/5 pb-2">
        <h2 class="font-['Space_Grotesk'] font-bold text-sm tracking-[0.2em] text-on-surface uppercase italic">Composition</h2>
        <span class="font-mono text-[10px] text-cyan-400/60">ARRAY[${draft.exercises.length}]</span>
      </div>
    `;

    if (!draft.exercises.length) {
      listSection.innerHTML = `
        ${headerMarkup}
        <div class="border border-dashed border-cyan-500/20 bg-neutral-900/30 p-8 text-center">
          <p class="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-4">
            No exercises added yet
          </p>
          <p class="text-sm text-neutral-400">
            Use ADD_EXERCISE to choose one from your library.
          </p>
        </div>
      `;
      return;
    }

    listSection.innerHTML = `
      ${headerMarkup}
      ${draft.exercises
        .map(
          (exercise, index) => `
            <div class="bg-neutral-900/60 border border-cyan-500/10 p-5 flex items-start justify-between gap-4">
              <div>
                <p class="font-mono text-[10px] text-cyan-400/60 uppercase tracking-[0.2em] mb-2">
                  Slot ${index + 1}
                </p>
                <h3 class="font-headline text-2xl font-bold uppercase tracking-tight text-on-surface mb-2">
                  ${escapeHtml(exercise.name)}
                </h3>
                <p class="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
                  ${exercise.sets} sets x ${exercise.reps} reps${exercise.load ? ` - ${escapeHtml(exercise.load)}` : ""}
                </p>
                ${
                  exercise.commentary
                    ? `<p class="text-xs text-neutral-400 mt-3 max-w-xl">${escapeHtml(exercise.commentary)}</p>`
                    : ""
                }
              </div>
              <button
                class="remove-builder-exercise text-neutral-500 hover:text-red-400 transition-colors"
                data-builder-exercise-id="${escapeHtml(exercise.id)}"
                type="button"
                title="Remove exercise"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          `
        )
        .join("")}
    `;

    listSection.querySelectorAll(".remove-builder-exercise").forEach((button) => {
      button.addEventListener("click", () => {
        const builderExerciseId = button.dataset.builderExerciseId;
        window.AppStore.removeExerciseFromBuilder(builderExerciseId);
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
