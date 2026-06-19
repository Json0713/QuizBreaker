export function initSidebar() {
  const userStr = localStorage.getItem("quizbreaker_user");
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user) {
    location.href = "index.html";
    return;
  }

  const currentPath = location.pathname;

  const sidebarHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <i class="bi bi-lightning-charge-fill"></i> QuizBreaker
      </div>
      <ul class="sidebar-nav">
        <li>
          <a href="#game" id="nav-game">
            <i class="bi bi-play-circle"></i> Quick Play
          </a>
        </li>
        <li>
          <a href="#dashboard" id="nav-dashboard">
            <i class="bi bi-bar-chart"></i> Dashboard
          </a>
        </li>
        <li>
          <a href="#advance" id="nav-advance">
            <i class="bi bi-lightbulb"></i> Advanced Quizzes
          </a>
        </li>
        <li>
          <a href="#" class="disabled" onclick="event.preventDefault()">
            <i class="bi bi-gear"></i> Custom Quizzes
          </a>
        </li>
      </ul>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="sidebar-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">${user.name}</span>
            <span class="sidebar-user-joined">Joined ${new Date(user.joinedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <button class="sidebar-logout" id="sidebarLogoutBtn">
          <i class="bi bi-box-arrow-left"></i> Logout
        </button>
      </div>
    </aside>
  `;

  const layout = document.querySelector('.app-layout');
  if (layout) {
    layout.insertAdjacentHTML('afterbegin', sidebarHTML);

    // Setup routing logic
    function handleRoute() {
      let hash = location.hash.replace("#", "") || "game";
      
      // Hide all views
      document.querySelectorAll(".view").forEach(el => el.classList.add("d-none"));
      
      // Show target view
      const targetView = document.getElementById("view-" + hash);
      if (targetView) {
        targetView.classList.remove("d-none");
      } else {
        document.getElementById("view-game").classList.remove("d-none");
        hash = "game";
      }

      // Update active nav links
      document.querySelectorAll(".sidebar-nav a").forEach(a => a.classList.remove("active"));
      const activeLink = document.getElementById("nav-" + hash);
      if (activeLink) activeLink.classList.add("active");

      // Dispatch event so app.js can re-render charts if needed
      window.dispatchEvent(new CustomEvent("viewChanged", { detail: { view: hash } }));
    }

    window.addEventListener("hashchange", handleRoute);
    
    // Initial route
    handleRoute();
  }

  const logoutBtn = document.getElementById("sidebarLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      const logoutModal = document.getElementById("logoutModal");
      if (logoutModal) {
        logoutModal.style.display = "flex";
        
        // Ensure confirm button works
        const confirmBtn = logoutModal.querySelector(".confirm");
        if (confirmBtn && !confirmBtn.hasAttribute("data-logout-bound")) {
          confirmBtn.setAttribute("data-logout-bound", "true");
          confirmBtn.addEventListener("click", () => {
            localStorage.removeItem("quizbreaker_user");
            location.href = "index.html";
          });
        }
      } else {
        localStorage.removeItem("quizbreaker_user");
        location.href = "index.html";
      }
    });
  }
}
