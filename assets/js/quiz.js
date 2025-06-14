// /assets/js/quiz.js

let questions = [], answers = [], current = 0, startTime, timerRef, overtime = 0;

document.addEventListener("DOMContentLoaded", async () => {
  const config = JSON.parse(localStorage.getItem("quizbreaker_config"));
  const user = JSON.parse(localStorage.getItem("quizbreaker_user"));
  if (!config || !user) return location.href = "../app/index.html";

  const difficultyTime = { Easy: 90, Medium: 120, Hard: 180 };
  startTime = new Date();
  setupTimer(difficultyTime[config.difficulty]);

  questions = await loadQuizData(config.category, config.difficulty);
  if (!questions.length) return location.href = "game.html";
  shuffleArray(questions);
  questions = questions.slice(0, 10);
  answers = Array(questions.length).fill(null);
  showQuestion();
});

function setupTimer(seconds) {
  const timerEl = document.getElementById("timer");
  let remaining = seconds;
  timerEl.textContent = `Time Limit: ${formatTime(remaining)}`;
  timerRef = setInterval(() => {
    if (remaining > 0) {
      remaining--;
      timerEl.innerHTML = `Time Left: ${formatTime(remaining)}`;
    } else {
      overtime++;
      timerEl.innerHTML = `Time Over <span class='text-red'>+${formatTime(overtime)}</span>`;
    }
  }, 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

async function loadQuizData(category, difficulty) {
  try {
    const res = await fetch(`../data/quiz_${category}.json`);
    const data = await res.json();
    return data[difficulty] || [];
  } catch (err) {
    return [];
  }
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function showQuestion() {
  const q = questions[current];
  document.getElementById("qNum").textContent = current + 1;
  document.getElementById("questionTitle").textContent = q.question;

  const wrapper = document.getElementById("options");
  wrapper.innerHTML = "";
  const saved = answers[current] || "";

  if (q.type === "puzzle") {
    wrapper.innerHTML = `
      <div class='puzzle-box'>
        <button class="btn btn-sm hint-toggle" onclick="toggleHint(this)">💡 Show Hint</button>
        <div class="hint-content hidden"><strong>Hint:</strong> ${q.hint || "Solve the puzzle."}</div>
      </div>
      <input type='text' id='puzzleInput' class='form-control' value='${saved}' placeholder='Your answer...' style='width:100%;padding:0.75rem;margin-top:1rem;border-radius:8px;border:none;background:#2a2a2a;color:#f5f5f5;' />
    `;
  } else if (["calculator", "sql", "terminal", "code"].includes(q.type)) {
    wrapper.innerHTML = `
      <textarea id='codeInput' class='form-control' placeholder='Enter your answer here...' style='width:100%;min-height:120px;padding:0.75rem;margin-top:1rem;border-radius:8px;border:none;background:#2a2a2a;color:#f5f5f5;font-family:monospace;'>${saved}</textarea>
    `;
  } else if (Array.isArray(q.options)) {
    const shuffledOptions = [...q.options];
    shuffleArray(shuffledOptions);
    shuffledOptions.forEach((opt, i) => {
      const id = `opt${i}`;
      const checked = answers[current] === opt ? "checked" : "";
      wrapper.innerHTML += `
        <div class="opt-wrapper">
          <input type="radio" name="answer" id="${id}" value="${opt}" ${checked} />
          <label for="${id}">${opt}</label>
        </div>
      `;
    });
  }

  document.getElementById("progressBar").style.width = `${((current + 1) / questions.length) * 100}%`;
}

function toggleHint(btn) {
  const box = btn.closest(".puzzle-box");
  const hint = box.querySelector(".hint-content");
  hint.classList.toggle("hidden");
  btn.textContent = hint.classList.contains("hidden") ? "💡 Show Hint" : "❌ Hide Hint";
}

function getUserInput(q) {
  if (q.type === "puzzle") return document.getElementById("puzzleInput")?.value.trim();
  if (["calculator", "sql", "terminal", "code"].includes(q.type)) return document.getElementById("codeInput")?.value.trim();
  const opt = document.querySelector('input[name="answer"]:checked');
  return opt?.value.trim();
}

function nextQuestion() {
  const q = questions[current];
  const selected = getUserInput(q);
  if (!selected && q.options) return alert("Please select an answer.");

  answers[current] = selected;
  current++;
  current >= questions.length ? endQuiz() : showQuestion();
}

function prevQuestion() {
  if (current > 0) current--;
  showQuestion();
}

function endQuiz() {
  clearInterval(timerRef);
  const user = JSON.parse(localStorage.getItem("quizbreaker_user"));
  const config = JSON.parse(localStorage.getItem("quizbreaker_config"));
  const endTime = new Date();
  const duration = Math.floor((endTime - startTime) / 1000);

  const detailed = questions.map((q, i) => ({
    question: q.question,
    selected: answers[i],
    correct: q.answer
  }));

  const score = detailed.filter(q => (q.selected || '').trim().toLowerCase() === (q.correct || '').trim().toLowerCase()).length;
  const pass = score >= 6;

  const result = {
    user: user.name,
    category: config.category,
    difficulty: config.difficulty,
    score,
    total: questions.length,
    time: duration,
    passed: pass,
    date: new Date().toISOString(),
    details: detailed
  };

  const recent = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  recent.unshift(result);
  localStorage.setItem("quizbreaker_recent", JSON.stringify(recent.slice(0, 20)));

  showSummary(result);
}

function getSmartFeedback(score, total, overtime) {
  const accuracy = (score / total) * 100;
  if (accuracy === 100 && overtime === 0) return "<i class='bi bi-stars text-green'></i> Perfect! Outstanding timing and accuracy!";
  if (accuracy === 100 && overtime > 0) return "<i class='bi bi-hourglass-split text-yellow'></i> Perfect score, but time was exceeded.";
  if (accuracy >= 80 && overtime === 0) return "<i class='bi bi-emoji-smile text-green'></i> Great job finishing quickly with few mistakes.";
  if (accuracy >= 80) return "<i class='bi bi-stopwatch text-yellow'></i> Great score, but time management can improve.";
  if (accuracy >= 50) return "<i class='bi bi-lightbulb text-info'></i> Fair effort, you’re on the right track.";
  if (accuracy > 0) return "<i class='bi bi-emoji-neutral text-warning'></i> Needs improvement. Try to focus on accuracy and speed.";
  return "<i class='bi bi-emoji-frown text-danger'></i> Don’t worry! Practice makes perfect!"
}

function showSummary(result) {
  const accuracy = (result.score / result.total) * 100;
  const feedback = getSmartFeedback(result.score, result.total, overtime);

  document.querySelector(".container").innerHTML = `
    <h2>Quiz Summary</h2>
    <div class="summary">
      <h3>Result: ${result.passed ? '<i class="bi bi-check-circle-fill text-green"></i> Passed' : '<i class="bi bi-x-circle-fill text-red"></i> Failed'}</h3>
      <p><strong>Score:</strong> ${result.score} / ${result.total}</p>
      <p><strong>Time Taken:</strong> ${formatTime(result.time)} ${overtime > 0 ? '<span class="text-red">(+ ' + formatTime(overtime) + ' overtime)</span>' : ''}</p>
      <p><strong>Feedback:</strong> ${feedback}</p>
      <h3>Details:</h3>
      ${result.details.map((a, i) => `
        <div class="summary-item ${a.selected?.trim().toLowerCase() === a.correct?.trim().toLowerCase() ? 'correct' : 'incorrect'}">
          <strong>Q${i + 1}:</strong> ${a.question}<br/>
          <span><i class="bi ${a.selected?.trim().toLowerCase() === a.correct?.trim().toLowerCase() ? 'bi-check-lg text-green' : 'bi-x-lg text-red'}"></i> You answered: ${a.selected || "None"}</span><br/>
          <span><i class="bi bi-info-circle text-green"></i> Correct Answer: ${a.correct}</span>
        </div>
      `).join('')}
      <div class="btn-group">
        <button onclick="location.reload()"><i class="bi bi-arrow-clockwise"></i> Retake</button>
        <button onclick="location.href='game.html'"><i class="bi bi-arrow-left"></i> Back</button>
      </div>
    </div>
  `;
}
