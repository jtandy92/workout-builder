document.addEventListener("DOMContentLoaded", () => {
  const historyCount = document.getElementById("history-count");
  const historyList = document.getElementById("history-list");

  function render() {
    const history = window.AppStore.getHistory();

    if (!historyList) return;

    if (historyCount) {
      historyCount.textContent = `${history.length}_SESSIONS_COMPLETED`;
    }

    if (!history.length) {
      historyList.innerHTML = `
        <div class="py-6 px-4 border border-neutral-800">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <div class="min-w-0 flex-1">
              <h4 class="headline-font text-xl md:text-2xl font-bold text-on-surface uppercase">No workouts yet</h4>
            </div>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end md:flex-nowrap shrink-0 mono-font text-xs text-on-surface-variant">
              <span class="w-[4.5rem] md:text-right">-</span>
              <span class="w-[6.5rem] md:text-right">-</span>
              <span class="flex items-center gap-3 md:gap-4">
                <span class="headline-font text-xl font-bold text-on-surface w-12 md:w-14 text-right tabular-nums">00:00</span>
                <span class="w-9"></span>
              </span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    historyList.innerHTML = history
      .map(
        (entry) => `
          <div class="py-5 px-4 group hover:bg-cyan-500/5 transition-all duration-300 border border-neutral-800 hover:border-cyan-500/40">
            <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <div class="min-w-0 flex-1">
                <h4 class="headline-font text-xl md:text-2xl font-bold text-on-surface group-hover:text-primary transition-colors uppercase truncate">
                  ${escapeHtml(entry.workoutName)}
                </h4>
              </div>
              <div class="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-end md:flex-nowrap shrink-0">
                <p class="text-on-surface-variant mono-font text-xs w-[4.5rem] md:text-right tabular-nums">${escapeHtml(
                  window.AppStore.formatTime(entry.completedAt)
                )}</p>
                <p class="text-on-surface-variant mono-font text-xs w-[6.5rem] md:text-right">${escapeHtml(
                  window.AppStore.formatDate(entry.completedAt)
                )}</p>
                <div class="flex items-center gap-3 md:gap-4">
                  <p class="text-on-surface headline-font text-xl font-bold group-hover:text-primary w-12 md:w-14 text-right tabular-nums">
                    ${window.AppStore.formatDuration(entry.durationSeconds)}
                  </p>
                  <button
                    class="delete-history-entry text-neutral-600 hover:text-red-400 transition-colors p-1 -m-1 w-9 flex justify-center shrink-0"
                    data-history-id="${escapeHtml(entry.id)}"
                    type="button"
                    title="Delete session from history"
                    aria-label="Delete session from history"
                  >
                    <span class="material-symbols-outlined text-lg leading-none">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      )
      .join("");

    historyList.querySelectorAll(".delete-history-entry").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        const historyId = button.dataset.historyId;
        const entry = window.AppStore.getHistory().find((item) => item.id === historyId);
        if (!entry) return;

        const confirmed = window.confirm(`Remove "${entry.workoutName}" from history?`);
        if (!confirmed) return;

        window.AppStore.deleteHistoryEntry(historyId);
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
