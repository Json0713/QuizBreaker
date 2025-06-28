// /assets/js/game.js — Simplified Final with Fallback Message, Optimized

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

  renderRadarChart(user.name);

  if (localStorage.getItem("justCompletedQuiz") === "true") {
    showToast("<i class='bi bi-check-circle-fill'></i> Quiz completed!");
    localStorage.removeItem("justCompletedQuiz");
  }
  
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

  items.forEach(item => {
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `
      <input type="radio" name="${groupName}" value="${item.id}">
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
    list.innerHTML = '<li style="color:#888; text-align:center; padding:1rem;">No recent quizzes taken yet.</li>';
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
  renderRadarChart(pendingUser);
  document.getElementById("deleteModal").style.display = "none";
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerHTML = msg;
  toast.classList.add("show");
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 8000);
}

function renderRadarChart(username) {
  const fallback = document.getElementById("radarFallback");
  const canvas = document.getElementById("radarChart");
  const all = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  const userQuizzes = all.filter(q => q.user === username);

  canvas.style.display = "none";
  fallback.style.display = "none";

  if (userQuizzes.length < 2) {
    fallback.style.display = "block";
    return;
  }

  const [latest, previous] = userQuizzes;
  const ctx = canvas.getContext("2d");
  canvas.style.display = "block";

  const toRadar = (quiz) => {
    const accuracy = quiz.score / quiz.total * 100;
    const timeScore = Math.max(0, 100 - quiz.time);
    const difficulty = { Easy: 1, Medium: 2, Hard: 3 }[quiz.difficulty] * 33.3;
    const precision = getPrecisionStreak(quiz);
    return [accuracy, timeScore, difficulty, precision];
  };

  new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Accuracy %", "Speed Score", "Difficulty Level", "Precision %"],
      datasets: [
        {
          label: "Latest Quiz",
          data: toRadar(latest),
          backgroundColor: "rgba(0, 217, 255, 0.2)",
          borderColor: "#00d9ff",
          borderWidth: 2
        },
        {
          label: "Previous Quiz",
          data: toRadar(previous),
          backgroundColor: "rgba(255, 100, 100, 0.2)",
          borderColor: "#ff5c5c",
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#ccc"
          },
          pointLabels: {
            color: "#f5f5f5"
          },
          grid: {
            color: "#444"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#f5f5f5"
          }
        }
      }
    }
  });
}

function getPrecisionStreak(quiz) {
  let correctStreak = 0, maxStreak = 0;
  for (const q of quiz.details) {
    const isCorrect = (q.selected || "").trim().toLowerCase() === (q.correct || "").trim().toLowerCase();
    if (isCorrect) {
      correctStreak++;
      if (correctStreak > maxStreak) maxStreak = correctStreak;
    } else {
      correctStreak = 0;
    }
  }
  return Math.min(100, (maxStreak / quiz.details.length) * 100);
}
