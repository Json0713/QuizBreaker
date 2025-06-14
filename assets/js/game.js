    let pendingDeleteIndex = null, pendingUser = null;
    document.addEventListener("DOMContentLoaded", () => {
      const user = JSON.parse(localStorage.getItem("quizbreaker_user"));
      if (!user) return location.href = "../app/index.html";
      document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();
      document.querySelectorAll(".displayName").forEach(e => e.textContent = user.name);
      document.querySelectorAll(".displayJoined").forEach(e => e.textContent = new Date(user.joinedAt).toLocaleString());
      renderRecent(user.name);document.getElementById("dropdownToggle").addEventListener("click", () => {
    const dropdown = document.getElementById("recentDropdown");
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    dropdownToggle.classList.toggle("bi-chevron-down");
    dropdownToggle.classList.toggle("bi-chevron-up");
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    document.getElementById("logoutModal").style.display = "flex";
  });
  document.getElementById("userInfo").addEventListener("click", () => {
    document.getElementById("infoModal").style.display = "flex";
  });

  document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');

  document.querySelectorAll('input[name="category"], input[name="difficulty"]').forEach(el => {
    el.addEventListener("change", () => {
      const category = document.querySelector('input[name="category"]:checked');
      const difficulty = document.querySelector('input[name="difficulty"]:checked');
      document.getElementById("startBtn").disabled = !(category && difficulty);
    });
  });
});

function logout() {
  localStorage.removeItem("quizbreaker_user");
  location.href = "../app/index.html";
}

function startQuiz() {
  const category = document.querySelector('input[name="category"]:checked');
  const difficulty = document.querySelector('input[name="difficulty"]:checked');
  if (!category || !difficulty) return;
  const config = {
    category: category.value,
    difficulty: difficulty.value,
    startTime: new Date().toISOString()
  };
  localStorage.setItem("quizbreaker_config", JSON.stringify(config));
  location.href = "quiz.html";
}

function renderRecent(username) {
  const all = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  const list = document.getElementById("recentQuizzes");
  const dropdown = document.getElementById("recentDropdown");
  const userQuizzes = all.filter(q => q.user === username);
  list.innerHTML = dropdown.innerHTML = "";
  if (userQuizzes.length === 0) {
    list.innerHTML = '<li style="color:#888;">No recent quizzes taken yet.</li>';
    return;
  }
  userQuizzes.slice(0, 5).forEach((quiz, index) => list.appendChild(createQuizItem(quiz, index, username)));
  userQuizzes.slice(5).forEach((quiz, index) => dropdown.appendChild(createQuizItem(quiz, index + 5, username)));
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
    <button class="delete-btn" onclick="event.stopPropagation(); showDeleteModal(${index}, '${username}')">
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
