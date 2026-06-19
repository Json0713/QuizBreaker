import { initSidebar } from './sidebar.js';
import { initGame } from './game.js';
import { initDashboard } from './dashboard.js';

window.addEventListener("viewChanged", (e) => {
  if (e.detail.view === "dashboard") {
    initDashboard();
  } else if (e.detail.view === "advance") {
    const hideUntil = localStorage.getItem("quizbreaker_hide_callout_until");
    if (!hideUntil || Date.now() > parseInt(hideUntil, 10)) {
      setTimeout(() => {
        const callout = document.getElementById("socialCallout");
        if (callout) {
          callout.style.display = "block";
          requestAnimationFrame(() => {
            callout.classList.add("show");
          });
        }
      }, 5000);
    }
  }
});

initSidebar();
initGame();
