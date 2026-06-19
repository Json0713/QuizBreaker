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

const modes = [
  { id: "Standard", label: "Standard", desc: "10 questions, fixed time limit" },
  { id: "Survival", label: "Survival", desc: "Race against the clock! Time added/lost scales with difficulty." }
];

export function initGame() {
  const user = getUser();
  if (!user) return redirectToLogin();

  renderOptions("modeOptions", modes, "mode");
  renderOptions("categoryOptions", categories, "category");
  renderOptions("difficultyOptions", difficulties, "difficulty");
  renderRecent(user.name);
  renderQuickProfile(user.name);
  initEventListeners(user.name);
  
  // Handle mode selection change
  document.querySelectorAll("input[name='mode']").forEach(el => {
    el.addEventListener("change", (e) => {
      // Difficulty is now required for both modes
      const diffCard = document.getElementById("difficultyOptions").closest('.card');
      diffCard.style.opacity = "1";
      diffCard.style.pointerEvents = "auto";
    });
  });

  renderRadarChart(user.name);

  if (localStorage.getItem("justCompletedQuiz") === "true") {
    showToast("<i class='bi bi-check-circle-fill'></i> Quiz completed!");
    localStorage.removeItem("justCompletedQuiz");
  }
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("quizbreaker_user"));
  } catch {
    return null;
  }
}

function redirectToLogin() {
  localStorage.clear();
  location.href = "index.html";
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
    el.addEventListener("change", () => {
      // Remove invalid class on change
      container.classList.remove("is-invalid");
      checkStartButtonState();
    });
  });
}

function checkStartButtonState() {
  const mode = document.querySelector("input[name='mode']:checked");
  const category = document.querySelector("input[name='category']:checked");
  const difficulty = document.querySelector("input[name='difficulty']:checked");
  const startBtn = document.getElementById("startBtn");
  
  if (startBtn) {
    if (mode && category && difficulty) {
      startBtn.classList.add("ready");
    } else {
      startBtn.classList.remove("ready");
    }
  }
}

function renderQuickProfile(username) {
  const recent = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  const userQuizzes = recent.filter(q => q.user === username);

  document.getElementById("qp-name").textContent = username;
  document.getElementById("qp-total").textContent = userQuizzes.length;
  
  if (userQuizzes.length === 0) {
    document.getElementById("qp-accuracy").textContent = "0%";
    return;
  }
  
  const totalScore = userQuizzes.reduce((acc, curr) => acc + curr.score, 0);
  const totalPossible = userQuizzes.reduce((acc, curr) => acc + curr.total, 0);
  const accuracy = totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0;
  
  document.getElementById("qp-accuracy").textContent = `${accuracy}%`;
}

function initEventListeners(username) {
  document.querySelectorAll(".modal .cancel").forEach(btn => {
    btn.addEventListener("click", e => {
      e.target.closest(".modal").style.display = "none";
    });
  });

  document.querySelector("#deleteModal .confirm").addEventListener("click", confirmDelete);
  document.querySelector("#infoModal .confirm")?.addEventListener("click", e => {
    e.target.closest(".modal").style.display = "none";
  });

  document.getElementById("startBtn").addEventListener("click", startQuiz);
}

function startQuiz() {
  const mode = document.querySelector("input[name='mode']:checked");
  const category = document.querySelector("input[name='category']:checked");
  const difficulty = document.querySelector("input[name='difficulty']:checked");
  
  const modeContainer = document.getElementById("modeOptions");
  const catContainer = document.getElementById("categoryOptions");
  const diffContainer = document.getElementById("difficultyOptions");
  
  modeContainer.classList.remove("is-invalid");
  catContainer.classList.remove("is-invalid");
  diffContainer.classList.remove("is-invalid");

  let hasError = false;
  if (!mode) {
    modeContainer.classList.add("is-invalid");
    hasError = true;
  }
  if (!category) {
    catContainer.classList.add("is-invalid");
    hasError = true;
  }
  if (!difficulty) {
    diffContainer.classList.add("is-invalid");
    hasError = true;
  }

  if (hasError) {
    showToast("<i class='bi bi-exclamation-triangle-fill'></i> Please select all required options!", true);
    return;
  }

  const config = {
    mode: mode.value,
    category: category.value,
    difficulty: difficulty.value,
    startTime: new Date().toISOString(),
  };

  localStorage.setItem("quizbreaker_config", JSON.stringify(config));
  location.href = "src/app/quiz.html";
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
      <strong>${quiz.category} (${quiz.mode === 'Survival' ? 'Survival: ' + quiz.difficulty : quiz.difficulty})</strong><br>
      <span class="${quiz.passed ? 'text-green' : 'text-red'}">Score: ${quiz.score}${quiz.mode === 'Survival' ? '' : '/' + quiz.total}</span> –
      <small>${new Date(quiz.date).toLocaleString()}</small>
    </div>
    <button class="delete-btn" aria-label="Delete quiz record" onclick="event.stopPropagation(); showDeleteModal(${index}, '${username}')">
      <i class="bi bi-x-lg"></i>
    </button>
  `;

  li.onclick = () => {
    localStorage.setItem("quizbreaker_summary", JSON.stringify(quiz));
    location.href = "src/app/summary.html";
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

function showToast(msg, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerHTML = msg;
  toast.className = "toast show " + (isError ? "error" : "success");
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
    const diffScores = { Easy: 1, Medium: 2, Hard: 3, Survival: 3 };
    const difficulty = (diffScores[quiz.difficulty] || 2) * 33.3;
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

window.showDeleteModal = showDeleteModal;

