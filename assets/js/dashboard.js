// /assets/js/dashboard.js

const DEFAULT_CATEGORIES = ["IT", "CS", "IS"];

let charts = [];

function resetCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}

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
  
  const userResults = recent.filter(q => q.user === user.name);
  const total = userResults.length;
  const correct = userResults.reduce((sum, r) => sum + r.score, 0);
  const attempted = userResults.reduce((sum, r) => sum + r.total, 0);
  const avgTime = userResults.length ? Math.floor(userResults.reduce((sum, r) => sum + r.time, 0) / userResults.length) : 0;
  
  document.getElementById("totalQuizzes").textContent = total;
  document.getElementById("overallAccuracy").textContent = attempted ? Math.round((correct / attempted) * 100) + "%" : "0%";
  document.getElementById("avgTime").textContent = formatTime(avgTime);
  
  resetCharts();
  generateSmartFeedback(userResults);
  renderScoreChart(userResults);
  renderCategoryAccuracyBars(userResults);
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

function showNoData(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const parent = container.tagName === 'CANVAS' ? container.parentElement : container;
  parent.innerHTML = '<div class="chart-empty">No data available yet</div>';
}

function generateSmartFeedback(data) {
  const box = document.getElementById("feedbackAlert");
  const msg = document.getElementById("feedbackMessage");
  box.className = "alert-feedback info";
  if (!data.length) return;
  
  const total = data.length;
  const avgAccuracy = Math.round(data.reduce((sum, q) => sum + (q.score / q.total), 0) / total * 100);
  const passRate = Math.round((data.filter(q => q.passed).length / total) * 100);
  const avgTime = Math.round(data.reduce((sum, q) => sum + q.time, 0) / total);
  const improving = total >= 2 && data[0].score > data[1].score;
  const declining = total >= 2 && data[0].score < data[1].score;
  
  const feedbacks = [];
  
  if (avgAccuracy === 100) feedbacks.push("<i class='bi bi-stars'></i> Flawless! You're acing every question!");
  else if (avgAccuracy >= 80) feedbacks.push("<i class='bi bi-bullseye'></i> Great accuracy! Keep sharpening your skills.");
  else if (avgAccuracy >= 60) feedbacks.push("<i class='bi bi-lightbulb'></i> Decent performance. There's room to grow.");
  else feedbacks.push("<i class='bi bi-emoji-neutral'></i> Keep practicing for better accuracy.");
  
  if (passRate >= 80) feedbacks.push("<i class='bi bi-check2-circle'></i> You're passing most of your quizzes. Well done!");
  else if (passRate <= 30) feedbacks.push("<i class='bi bi-emoji-frown'></i> Most attempts failed. Consider revisiting the materials.");
  
  if (avgTime < 60) feedbacks.push("<i class='bi bi-stopwatch'></i> Lightning fast! You solve quizzes in record time.");
  else if (avgTime > 180) feedbacks.push("<i class='bi bi-hourglass-split'></i> Consider pacing up a bit for efficiency.");
  
  if (improving) feedbacks.push("<i class='bi bi-graph-up'></i> You're improving! Last quiz was better than the previous.");
  if (declining) feedbacks.push("<i class='bi bi-graph-down'></i> A small dip in performance. Stay focused!");
  
  if (!feedbacks.length) return;
  let index = 0;
  msg.innerHTML = feedbacks[index];
  box.classList.remove("d-none");
  
  setInterval(() => {
    index = (index + 1) % feedbacks.length;
    msg.innerHTML = feedbacks[index];
  }, 3000);
}

function renderScoreChart(data) {
  const canvas = document.getElementById("scoreChart");
  if (!data.length) return showNoData("scoreChart");
  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_, i) => `Q${i + 1}`),
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
      scales: {
        x: { display: false },
        y: { beginAtZero: true, max: 10 }
      }
    }
  });
  charts.push(chart);
}

function renderCategoryAccuracyBars(data) {
  const categories = {};
  DEFAULT_CATEGORIES.forEach(cat => {
    categories[cat] = { correct: 0, total: 0, count: 0 };
  });
  data.forEach(d => {
    if (!categories[d.category]) categories[d.category] = { correct: 0, total: 0, count: 0 };
    categories[d.category].correct += d.score;
    categories[d.category].total += d.total;
    categories[d.category].count += 1;
  });
  const container = document.getElementById("categoryAccuracyBars");
  container.innerHTML = "";
  const entries = Object.entries(categories);
  if (!entries.length) return showNoData("categoryAccuracyBars");
  
  let anyData = false;
  entries.forEach(([cat, val], i) => {
    const acc = val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0;
    if (val.total > 0) anyData = true;
    const progressBar = document.createElement("div");
    progressBar.className = "progress-item";
    progressBar.innerHTML = `
      <div class="label">
        <span>${cat}</span><span>${acc}%</span>
      </div>
      <div class="progress">
        <div class="progress-bar bg-${getColor(i)}" role="progressbar" style="width:${acc}%"></div>
      </div>
    `;
    container.appendChild(progressBar);
  });
  
  if (!anyData) container.innerHTML = '<div class="chart-empty">No data available yet</div>';
  
  const mostPlayed = entries.sort((a, b) => b[1].count - a[1].count)[0];
  document.getElementById("mostPlayedCategory").textContent = mostPlayed ? `${mostPlayed[0]} (${mostPlayed[1].count}x)` : "--";
}

function getColor(index) {
  const colors = ["info", "success", "warning", "danger", "primary", "secondary"];
  return colors[index % colors.length];
}

function renderPassFailChart(data) {
  const canvas = document.getElementById("passFailChart");
  if (!data.length) return showNoData("passFailChart");
  const ctx = canvas.getContext("2d");
  const pass = data.filter(d => d.passed).length;
  const fail = data.length - pass;
  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Passed", "Failed"],
      datasets: [{
        data: [pass, fail],
        backgroundColor: ["rgba(0, 217, 255, 0.6)", "rgba(180, 180, 180, 0.3)"]
      }]
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      responsive: true,
      cutout: '60%'
    }
  });
  charts.push(chart);
}

function renderDifficultyChart(data) {
  const canvas = document.getElementById("difficultyChart");
  const diff = {};
  data.forEach(d => {
    if (!diff[d.difficulty]) diff[d.difficulty] = { correct: 0, total: 0 };
    diff[d.difficulty].correct += d.score;
    diff[d.difficulty].total += d.total;
  });
  const labels = Object.keys(diff);
  if (!labels.length) return showNoData("difficultyChart");
  
  const values = labels.map(l => Math.round((diff[l].correct / diff[l].total) * 100));
  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "% Accuracy",
        data: values,
        backgroundColor: "rgba(0,217,255,0.4)",
        borderRadius: 6
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } },
      responsive: true
    }
  });
  charts.push(chart);
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
  if (!data.length) return showNoData("recentSummary");
  const latest = data.slice(0, 5);
  list.innerHTML = latest.map(q => `
    <div class="quiz-line ${q.passed ? 'passed' : 'failed'}">
      <span>${q.category} (${q.difficulty})</span>
      <span>${q.score}/${q.total}</span>
    </div>
  `).join("");
}