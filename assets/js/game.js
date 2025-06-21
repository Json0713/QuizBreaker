// game.js — Optimized Version with Scrollable Quiz List and Clean Logic

let pendingDeleteIndex = null;
let pendingUser = null;

const categories = [
  { id: "ICT", label: "ICT", desc: "Digital tech, media, communication" },
  { id: "Science", label: "Science", desc: "Biology, chemistry, physics" },
  { id: "History", label: "History", desc: "Philippine past & people" },
];

const difficulties = [
  { id: "Easy", label: "Easy", desc: "Basic knowledge and beginner-friendly" },
  { id: "Medium", label: "Medium", desc: "Intermediate level problem solving" },
  { id: "Hard", label: "Hard", desc: "Challenging for advanced users" },
];

document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  if (!user) return redirectToLogin();

  initializeUserInfo(user);
  renderOptions("categoryOptions", categories, "category");
  renderOptions("difficultyOptions", difficulties, "difficulty");
  renderRecent(user.name);
  initEventListeners(user.name);
});

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("quizbreaker_user"));
  } catch {
    return null;
  }
}

function redirectToLogin() {
  localStorage.clear();
  location.href = "/index.html";
}

function initializeUserInfo(user) {
  document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.querySelectorAll(".displayName").forEach(el => (el.textContent = user.name));
  document.querySelectorAll(".displayJoined").forEach(el => (el.textContent = new Date(user.joinedAt).toLocaleString()));
}

function renderOptions(containerId, items, groupName) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item, index) => {
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `
      <input type="radio" name="${groupName}" value="${item.id}" ${index === 0 ? 'autofocus' : ''}>
      <span>${item.label} <small>${item.desc}</small></span>
    `;
    container.appendChild(label);
  });

  container.querySelectorAll(`input[name='${groupName}']`).forEach(el => {
    el.addEventListener("change", toggleStartButton);
  });
}

function toggleStartButton() {
  const category = document.querySelector("input[name='category']:checked");
  const difficulty = document.querySelector("input[name='difficulty']:checked");
  const startBtn = document.getElementById("startBtn");
  const isReady = !!(category && difficulty);
  startBtn.disabled = !isReady;
  startBtn.setAttribute("aria-disabled", !isReady);
}

function initEventListeners(username) {
  document.getElementById("logoutBtn").addEventListener("click", () => {
    document.getElementById("logoutModal").style.display = "flex";
  });

  document.getElementById("userInfo").addEventListener("click", () => {
    document.getElementById("infoModal").style.display = "flex";
  });

  document.querySelectorAll(".modal .cancel").forEach(btn => {
    btn.addEventListener("click", e => {
      e.target.closest(".modal").style.display = "none";
    });
  });

  document.querySelector("#logoutModal .confirm").addEventListener("click", logout);
  document.querySelector("#deleteModal .confirm").addEventListener("click", confirmDelete);
  document.querySelector("#infoModal .confirm").addEventListener("click", e => {
    e.target.closest(".modal").style.display = "none";
  });

  document.getElementById("startBtn").addEventListener("click", startQuiz);
}

function logout() {
  localStorage.removeItem("quizbreaker_user");
  location.href = "../../index.html";
}

function startQuiz() {
  const category = document.querySelector("input[name='category']:checked");
  const difficulty = document.querySelector("input[name='difficulty']:checked");
  if (!category || !difficulty) return;

  const config = {
    category: category.value,
    difficulty: difficulty.value,
    startTime: new Date().toISOString(),
  };

  localStorage.setItem("quizbreaker_config", JSON.stringify(config));
  location.href = "quiz.html";
}

function renderRecent(username) {
  const all = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  const list = document.getElementById("recentQuizzes");
  const userQuizzes = all.filter(q => q.user === username);

  list.innerHTML = "";
  if (userQuizzes.length === 0) {
    list.innerHTML = '<li style="color:#888; text-align:center; padding:1rem;">📭 No recent quizzes taken yet.</li>';
    return;
  }

  userQuizzes.forEach((quiz, index) => {
    list.appendChild(createQuizItem(quiz, index, username));
  });
}

function createQuizItem(quiz, index, username) {
  const li = document.createElement("li");
  li.className = "quiz-item";
  li.innerHTML = `
    <div>
      <strong>${quiz.category} (${quiz.difficulty})</strong><br>
      <span class="${quiz.passed ? 'text-green' : 'text-red'}">Score: ${quiz.score}/${quiz.total}</span> –
      <small>${new Date(quiz.date).toLocaleString()}</small>
    </div>
    <button class="delete-btn" aria-label="Delete quiz record" onclick="event.stopPropagation(); showDeleteModal(${index}, '${username}')">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  li.onclick = () => {
    localStorage.setItem("quizbreaker_summary", JSON.stringify(quiz));
    location.href = "summary.html";
  };

  return li;
}

function showDeleteModal(index, username) {
  pendingDeleteIndex = index;
  pendingUser = username;
  document.getElementById("deleteModal").style.display = "flex";
}

function confirmDelete() {
  const all = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  const userQuizzes = all.filter(q => q.user === pendingUser);
  const quizToDelete = userQuizzes[pendingDeleteIndex];

  const updated = all.filter(q => !(q.date === quizToDelete.date && q.user === pendingUser));
  localStorage.setItem("quizbreaker_recent", JSON.stringify(updated));

  renderRecent(pendingUser);
  document.getElementById("deleteModal").style.display = "none";
}
