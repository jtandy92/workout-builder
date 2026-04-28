document.addEventListener("DOMContentLoaded", () => {
  const workoutsGrid = document.getElementById("workouts-grid");

  function goToBuilder() {
    window.location.href = "workout-builder.html";
  }

  function renderEmptyState() {
    workoutsGrid.innerHTML = `
      <div class="col-span-full border border-dashed border-neutral-800 p-10 text-center bg-neutral-900/30">
        <h3 class="text-3xl font-bold mb-4 text-cyan-400">No Workouts Yet</h3>
        <button id="empty-create-workout"
          class="bg-cyan-400 text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition">
          Create First Workout
        </button>
      </div>
    `;

    document.getElementById("empty-create-workout")
      ?.addEventListener("click", goToBuilder);
  }

  function renderWorkouts() {
    const workouts = window.AppStore.getWorkouts();

    if (!workoutsGrid) return;

    // CLEAR EVERYTHING FIRST
    workoutsGrid.innerHTML = "";

    if (!workouts.length) {
      renderEmptyState();
      return;
    }

    // 🔵 CREATE WRAPPER FOR WORKOUTS
    const listWrapper = document.createElement("div");
    listWrapper.className = "col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

    workouts.forEach((workout) => {
      const exerciseCount = workout.exercises.length;

      const card = document.createElement("div");
      card.className = "bg-neutral-900/50 p-8 rounded-xl flex flex-col justify-between min-h-[320px]";

      card.innerHTML = `
        <div>
          <h3 class="text-2xl font-bold mb-4">${escapeHtml(workout.name)}</h3>
          <p class="text-neutral-400">${exerciseCount} exercises</p>
        </div>

        <div class="mt-6 flex justify-between items-center">
          <button class="start-workout bg-cyan-400 text-black px-4 py-2 rounded"
            data-id="${escapeHtml(workout.id)}">
            Start
          </button>

          <button class="delete-workout text-red-400"
            data-id="${escapeHtml(workout.id)}">
            Delete
          </button>
        </div>
      `;

      listWrapper.appendChild(card);
    });

    workoutsGrid.appendChild(listWrapper);

    // ✅ ALWAYS ADD BUTTON (OUTSIDE LIST)
    const buttonWrapper = document.createElement("div");
    buttonWrapper.className = "col-span-full flex justify-center mt-10";

    const button = document.createElement("button");
    button.textContent = "+ Create New Workout";
    button.className = "bg-cyan-400 text-black px-8 py-4 rounded-xl font-bold hover:scale-105 transition";

    button.addEventListener("click", goToBuilder);

    buttonWrapper.appendChild(button);
    workoutsGrid.appendChild(buttonWrapper);

    // EVENTS
    workoutsGrid.querySelectorAll(".start-workout").forEach((btn) => {
      btn.addEventListener("click", () => {
        const workoutId = btn.dataset.id;
        const session = window.AppStore.startWorkoutSession(workoutId);
        if (!session) {
          alert("This workout has no exercises. Add an exercise before starting.");
          return;
        }

        window.location.href = "active-workout.html";
      });
    });

    workoutsGrid.querySelectorAll(".delete-workout").forEach((btn) => {
      btn.addEventListener("click", () => {
        const workoutId = btn.dataset.id;
        window.AppStore.deleteWorkout(workoutId);
        renderWorkouts();
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

  renderWorkouts();
});
