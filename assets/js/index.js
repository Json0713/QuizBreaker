// /assets/js/index.js

let pendingUser = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userForm");
  const input = document.getElementById("username");
  const errorMsg = document.getElementById("errorMsg");
  const icon = document.getElementById("inputIcon");
  const submitBtn = document.getElementById("submitBtn");
  const defaultBtnText = submitBtn.querySelector(".default-text");
  const loadingUsers = document.getElementById("loadingUsers");

  const redirected = sessionStorage.getItem("fromGame") === "true";
  if (redirected) {
    loadingUsers.classList.remove("d-none");
    setTimeout(() => {
      loadingUsers.classList.add("d-none");
      renderUsers();
      sessionStorage.removeItem("fromGame");
    }, 5000);
  } else {
    renderUsers();
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMsg.textContent = "";
    input.classList.remove("is-invalid");
    icon.classList.add("d-none");

    const username = input.value.trim();
    if (!username) {
      errorMsg.textContent = "Please enter your name.";
      input.classList.add("is-invalid");
      icon.classList.remove("d-none");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" style="color: #333;"></span>
      <span class="btn-text" style="color: #333;">Logging In...</span>
    `;

    const user = {
      name: username,
      joinedAt: new Date().toISOString(),
      score: 0,
      currentLevel: 1
    };
    localStorage.setItem("quizbreaker_user", JSON.stringify(user));
    const history = JSON.parse(localStorage.getItem("quizbreaker_users")) || [];
    const already = history.find(u => u.name === username);
    if (!already) history.unshift(user);
    localStorage.setItem("quizbreaker_users", JSON.stringify(history.slice(0, 10)));

    setTimeout(() => {
      sessionStorage.setItem("fromGame", "true");
      window.location.href = "src/app/game.html";
    }, 3000);
  });
});

function createUserItem(u, index) {
  const name = typeof u.name === "string" ? u.name : "Unknown";
  const avatar = name.length > 0 ? name.charAt(0).toUpperCase() : "?";

  const div = document.createElement("div");
  div.className = "user-item";
  div.innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="details">
      <strong>${name}</strong>
      <div class="date-time">
        <small><i class="bi bi-calendar"></i> ${new Date(u.joinedAt).toLocaleString()}</small>
      </div>
    </div>
    <a class="delete-btn" onclick="event.stopPropagation(); confirmDelete(${index})"><i class="bi bi-x-lg"></i></a>
  `;
  div.onclick = (event) => {
    event.stopPropagation();
    pendingUser = u;
    const modal = new bootstrap.Modal(document.getElementById("confirmLoginModal"));
    modal.show();
  };
  return div;
}

function confirmLogin() {
  if (!pendingUser) return;
  localStorage.setItem("quizbreaker_user", JSON.stringify(pendingUser));
  window.location.href = "src/app/game.html";
}

function renderUsers() {
  const users = JSON.parse(localStorage.getItem("quizbreaker_users")) || [];
  const recentList = document.getElementById("recentUsers");
  const dropdown = document.getElementById("dropdownUsers");
  const card = document.getElementById("recentAccounts");
  recentList.innerHTML = "";
  dropdown.innerHTML = "";

  if (users.length === 0) {
    card.style.display = 'none';
    return;
  } else {
    card.style.display = 'block';
  }

  users.slice(0, 5).forEach((u, i) => recentList.appendChild(createUserItem(u, i)));
  users.slice(5, 10).forEach((u, i) => dropdown.appendChild(createUserItem(u, i + 5)));
}

function confirmDelete(index) {
  const modal = new bootstrap.Modal(document.getElementById("confirmModal"));
  modal.show();
  document.getElementById("confirmDeleteBtn").onclick = () => {
    const users = JSON.parse(localStorage.getItem("quizbreaker_users")) || [];
    users.splice(index, 1);
    localStorage.setItem("quizbreaker_users", JSON.stringify(users));
    modal.hide();
    renderUsers();
  };
  document.getElementById("cancelDeleteBtn").onclick = () => {
    modal.hide();
  };
}
