// /assets/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("quizbreaker_user"));
  const recent = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  if (!user) return location.href = "/index.html";
  
  document.getElementById("userAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.querySelectorAll(".displayName").forEach(el => el.textContent = user.name);
  document.querySelectorAll(".displayJoined").forEach(el => el.textContent = new Date(user.joinedAt).toLocaleString());
  
  document.getElementById("backBtn")?.addEventListener("click", () => location.href = "game.html");
  document.querySelector(".alert-feedback .btn-close")?.addEventListener("click", () => {
    document.getElementById("feedbackAlert").classList.add("d-none");
  });
  
  const statusEl = document.getElementById("onlineStatus");
  const statusIcon = document.getElementById("statusIcon");
  const updateStatus = () => {
    const online = navigator.onLine;
    statusEl.textContent = online ? "Online" : "Offline";
    statusEl.classList.toggle("text-success", online);
    statusEl.classList.toggle("text-danger", !online);
    statusIcon.className = online ? "bi bi-wifi fs-4 text-success" : "bi bi-wifi-off fs-4 text-danger";
  };
  updateStatus();
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  
  const userResults = recent.filter(q => q.user === user.name);
  const total = userResults.length;
  const correct = userResults.reduce((sum, r) => sum + r.score, 0);
  const attempted = userResults.reduce((sum, r) => sum + r.total, 0);
  const avgTime = userResults.length ? Math.floor(userResults.reduce((sum, r) => sum + r.time, 0) / userResults.length) : 0;
  
  document.getElementById("totalQuizzes").textContent = total;
  document.getElementById("overallAccuracy").textContent = attempted ? Math.round((correct / attempted) * 100) + "%" : "0%";
  document.getElementById("avgTime").textContent = formatTime(avgTime);
  
  showLastFeedback(userResults);
  renderScoreChart(userResults);
  renderCategoryPie(userResults);
  renderPassFailChart(userResults);
  renderDifficultyChart(userResults);
  renderRecentList(userResults);
  renderStreakData(userResults);
});

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function renderScoreChart(data) {
  const ctx = document.getElementById("scoreChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: "Score",
        data: data.map(d => d.score),
        borderColor: "#00d9ff",
        backgroundColor: "rgba(0, 217, 255, 0.1)",
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: true, max: 10 } }
    }
  });
}

function renderCategoryPie(data) {
  const categories = {};
  data.forEach(d => {
    categories[d.category] = categories[d.category] || { correct: 0, total: 0 };
    categories[d.category].correct += d.score;
    categories[d.category].total += d.total;
  });
  
  const labels = Object.keys(categories);
  const values = labels.map(l => Math.round((categories[l].correct / categories[l].total) * 100));
  const colors = [
    "rgba(0, 217, 255, 0.5)", "rgba(0, 255, 144, 0.5)", "rgba(255, 193, 7, 0.5)",
    "rgba(255, 99, 132, 0.5)", "rgba(102, 217, 239, 0.5)", "rgba(204, 102, 255, 0.5)"
  ];
  
  new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 1 }]
    },
    options: {
      plugins: { legend: { position: 'right', labels: { color: '#ccc' } } },
      responsive: true
    }
  });
  
  const mostPlayed = Object.entries(categories).sort((a, b) => b[1].total - a[1].total)[0];
  document.getElementById("mostPlayedCategory").textContent = mostPlayed ? `${mostPlayed[0]} (${mostPlayed[1].total}x)` : "--";
}

function renderPassFailChart(data) {
  const pass = data.filter(d => d.passed).length;
  const fail = data.length - pass;
  
  new Chart(document.getElementById("passFailChart"), {
    type: "doughnut",
    data: {
      labels: ["Passed", "Failed"],
      datasets: [{
        data: [pass, fail],
        backgroundColor: ["rgba(0,255,144,0.4)", "rgba(255,99,132,0.4)"]
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      responsive: true
    }
  });
}

function renderDifficultyChart(data) {
  const diff = {};
  data.forEach(d => {
    if (!diff[d.difficulty]) diff[d.difficulty] = { correct: 0, total: 0 };
    diff[d.difficulty].correct += d.score;
    diff[d.difficulty].total += d.total;
  });
  
  const labels = Object.keys(diff);
  const values = labels.map(l => Math.round((diff[l].correct / diff[l].total) * 100));
  
  new Chart(document.getElementById("difficultyChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "% Accuracy", data: values, backgroundColor: "rgba(0,217,255,0.4)" }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } },
      responsive: true
    }
  });
}

function renderStreakData(data) {
  let streak = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].passed) streak++;
    else break;
  }
  document.getElementById("passStreak").textContent = `${streak} quiz${streak !== 1 ? 'zes' : ''}`;
  
  const bestTime = data.filter(d => d.passed).sort((a, b) => a.time - b.time)[0];
  document.getElementById("bestTime").textContent = bestTime ? formatTime(bestTime.time) : "--";
}

function renderRecentList(data) {
  const list = document.getElementById("recentSummary");
  const latest = data.slice(0, 5);
  list.innerHTML = latest.map(q => `
    <div class="quiz-line ${q.passed ? 'passed' : 'failed'}">
      <span>${q.category} (${q.difficulty})</span>
      <span>${q.score}/${q.total}</span>
    </div>
  `).join("");
}

function showLastFeedback(data) {
  if (!data.length) return;
  const last = data[0];
  const accuracy = (last.score / last.total) * 100;
  const overtime = 0;
  
  let html = "",
    className = "";
  if (accuracy === 100 && overtime === 0) {
    html = "<i class='bi bi-stars'></i> Perfect! Outstanding timing and accuracy!";
    className = "success";
  } else if (accuracy === 100) {
    html = "<i class='bi bi-hourglass-split'></i> Perfect score, but time was exceeded.";
    className = "warning";
  } else if (accuracy >= 80 && overtime === 0) {
    html = "<i class='bi bi-emoji-smile'></i> Great job finishing quickly with few mistakes.";
    className = "success";
  } else if (accuracy >= 80) {
    html = "<i class='bi bi-stopwatch'></i> Great score, but time management can improve.";
    className = "warning";
  } else if (accuracy >= 50) {
    html = "<i class='bi bi-lightbulb'></i> Fair effort, you’re on the right track.";
    className = "warning";
  } else if (accuracy > 0) {
    html = "<i class='bi bi-emoji-neutral'></i> Needs improvement. Focus on accuracy and speed.";
    className = "danger";
  } else {
    html = "<i class='bi bi-emoji-frown'></i> Don’t worry! Practice makes perfect!";
    className = "danger";
  }
  
  const box = document.getElementById("feedbackAlert");
  const msg = document.getElementById("feedbackMessage");
  box.className = `alert-feedback ${className}`;
  msg.innerHTML = html;
  box.classList.remove("d-none");
}