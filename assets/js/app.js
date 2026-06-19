import { initSidebar } from './sidebar.js';
import { initGame } from './game.js';
import { initDashboard } from './dashboard.js';

initSidebar();
initGame();

window.addEventListener("viewChanged", (e) => {
  if (e.detail.view === "dashboard") {
    initDashboard();
  } else if (e.detail.view === "advance") {
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
});
