// /assets/js/index.js

let pendingUser = null;

const form = document.getElementById("userForm");
const input = document.getElementById("username");
const errorMsg = document.getElementById("errorMsg");
const icon = document.getElementById("inputIcon");
const submitBtn = document.getElementById("submitBtn");
const defaultBtnText = submitBtn ? submitBtn.querySelector(".default-text") : null;
const loadingUsers = document.getElementById("loadingUsers");

const redirected = sessionStorage.getItem("fromGame") === "true";
if (redirected && loadingUsers) {
  loadingUsers.classList.remove("d-none");
  const collapseEl = document.getElementById("collapseRecent");
  if (collapseEl) collapseEl.classList.add("d-none");
  
  setTimeout(() => {
    loadingUsers.classList.add("d-none");
    if (collapseEl) collapseEl.classList.remove("d-none");
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
  let history = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("quizbreaker_users"));
    if (Array.isArray(parsed)) history = parsed;
  } catch (e) {}
  const already = history.find(u => u.name === username);
  if (!already) history.unshift(user);
  localStorage.setItem("quizbreaker_users", JSON.stringify(history.slice(0, 10)));

  setTimeout(() => {
    sessionStorage.setItem("fromGame", "true");
    window.location.href = "app.html#game";
  }, 3000);
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
  window.location.href = "app.html#game";
}

function renderUsers() {
  const users = JSON.parse(localStorage.getItem("quizbreaker_users")) || [];
  const recentList = document.getElementById("recentUsers");
  const dropdown = document.getElementById("dropdownUsers");
  const card = document.getElementById("recentAccounts");
  recentList.innerHTML = "";
  dropdown.innerHTML = "";

  if (users.length === 0) {
    card.style.display = 'block';
    recentList.innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 w-100 text-center" style="min-height: 180px; color: #888;">
        <i class="bi bi-person-x" style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
        <p class="mb-0">No recent logins yet</p>
      </div>
    `;
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

window.confirmLogin = confirmLogin;
window.confirmDelete = confirmDelete;

const collapseEl = document.getElementById("collapseRecent");
const collapsedMessage = document.getElementById("collapsedMessage");
const toggleIcon = document.getElementById("toggleDropdown");

if (collapseEl && collapsedMessage && toggleIcon) {
  collapseEl.addEventListener('hidden.bs.collapse', () => {
    collapsedMessage.classList.remove('d-none');
    toggleIcon.className = 'bi bi-chevron-right';
  });
  collapseEl.addEventListener('show.bs.collapse', () => {
    collapsedMessage.classList.add('d-none');
    toggleIcon.className = 'bi bi-chevron-down';
  });
}
