// /assets/js/quiz.js — Updated to trigger justCompletedQuiz flag and radar data
import { quizData } from './quiz_data.js';


let questions = [], answers = [], current = 0, startTime, timerRef, overtime = 0, latestResult = null;
let remainingTime = 0;
let isSurvival = false;
let timeToAdd = 5;
let timeToSub = 3;

document.addEventListener("DOMContentLoaded", async () => {
  const config = JSON.parse(localStorage.getItem("quizbreaker_config"));
  const user = JSON.parse(localStorage.getItem("quizbreaker_user"));
  if (!config || !user) return location.href = "/index.html";

  isSurvival = config.mode === "Survival";
  const difficultyTime = { Easy: 90, Medium: 120, Hard: 180 };
  const survivalSettings = {
    Easy: { time: 60, add: 10, sub: 2 },
    Medium: { time: 45, add: 7, sub: 3 },
    Hard: { time: 30, add: 5, sub: 5 }
  };

  startTime = new Date();

  if (isSurvival) {
    const s = survivalSettings[config.difficulty] || survivalSettings.Medium;
    remainingTime = s.time;
    timeToAdd = s.add;
    timeToSub = s.sub;
    try {
      const data = quizData[config.category] || {};
      questions = data[config.difficulty] || [];
      // To ensure there are enough questions for a good survival run on a single difficulty, 
      // we might just shuffle the existing 20 questions. If they survive past 20, they win!
    } catch (err) { questions = []; }
  } else {
    remainingTime = difficultyTime[config.difficulty];
    const categoryData = quizData[config.category] || {};
    questions = categoryData[config.difficulty] || [];
  }

  setupTimer();

  if (!questions.length) return location.href = "../../app.html#game";
  shuffleArray(questions);
  if (!isSurvival) {
    questions = questions.slice(0, 10);
  }
  answers = Array(questions.length).fill(null);

  document.getElementById("prevBtn").addEventListener("click", prevQuestion);
  document.getElementById("nextBtn").addEventListener("click", nextQuestion);
  showQuestion();
});

function setupTimer() {
  const timerEl = document.getElementById("timer");
  timerEl.innerHTML = `Time Limit: ${formatTime(remainingTime)}`;
  timerRef = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      timerEl.innerHTML = `Time Left: ${formatTime(remainingTime)}`;
      
      if (isSurvival && remainingTime <= 10) {
        timerEl.classList.add("timer-pulse", "text-red");
      } else {
        timerEl.classList.remove("timer-pulse", "text-red");
      }
    } else if (isSurvival) {
      endQuiz(); // Survival mode ends exactly at 0
    } else {
      overtime++;
      timerEl.innerHTML = `Time Over <span class='text-red'>+${formatTime(overtime)}</span>`;
    }
  }, 1000);
}

function animateTime(amount) {
  const timerEl = document.getElementById("timer");
  const floater = document.createElement("span");
  floater.textContent = amount > 0 ? `+${amount}s` : `${amount}s`;
  floater.className = `time-floater ${amount > 0 ? 'text-green' : 'text-red'}`;
  timerEl.appendChild(floater);
  setTimeout(() => floater.remove(), 1000);
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

async function loadQuizData(category, difficulty) {
  try {
    const data = quizData[category] || {};
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
      <div class='puzzle-box revealed'>
        <div class="hint-content"><strong>Hint:</strong> ${q.hint || "Solve the puzzle."}</div>
      </div>
      <input type='text' id='puzzleInput' autocomplete='off' spellcheck='false' value='${saved}' placeholder='Your answer...' />
    `;
  } else if (["calculator", "sql", "terminal", "code"].includes(q.type)) {
    wrapper.innerHTML = `
      <textarea id='codeInput' autocomplete='off' spellcheck='false' placeholder='Enter your answer here...'>${saved}</textarea>
    `;
  } else if (Array.isArray(q.options)) {
    const shuffledOptions = [...q.options];
    shuffleArray(shuffledOptions);
    shuffledOptions.forEach((opt) => {
      const checked = answers[current] === opt ? "checked" : "";
      wrapper.innerHTML += `
        <label class="option">
          <input type="radio" name="answer" value="${opt}" ${checked} />
          <span>${opt}</span>
        </label>
      `;
    });
  }

  const prevBtn = document.getElementById("prevBtn");
  if (prevBtn) {
    if (current === 0) {
      prevBtn.disabled = true;
      prevBtn.classList.add("btn-disabled");
    } else {
      prevBtn.disabled = false;
      prevBtn.classList.remove("btn-disabled");
    }
  }

  document.getElementById("progressBar").style.width = `${((current + 1) / questions.length) * 100}%`;
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
  if (!selected && q.options && !isSurvival) return alert("Please select an answer."); // Survival allows skipping? Or just enforce selection. Let's enforce selection.
  if (!selected && q.options) return alert("Please select an answer.");

  answers[current] = selected;
  
  if (isSurvival) {
    const isCorrect = (selected || '').trim().toLowerCase() === (q.answer || '').trim().toLowerCase();
    if (isCorrect) {
      remainingTime += timeToAdd;
      animateTime(timeToAdd);
    } else {
      remainingTime -= timeToSub;
      animateTime(-timeToSub);
      if (remainingTime <= 0) {
        remainingTime = 0;
        return endQuiz();
      }
    }
    const timerEl = document.getElementById("timer");
    // Preserve any existing floaters by using textContent for the base text and re-appending floaters? 
    // Easier to just let setInterval update it next tick, or update it directly
    const currentFloaters = timerEl.querySelectorAll('.time-floater');
    timerEl.innerHTML = `Time Left: ${formatTime(remainingTime)}`;
    currentFloaters.forEach(f => timerEl.appendChild(f));
    
    if (remainingTime > 10) timerEl.classList.remove("timer-pulse", "text-red");
  }

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

  const answeredQuestions = isSurvival ? questions.slice(0, current) : questions;
  const answeredAnswers = answers.slice(0, answeredQuestions.length);

  const detailed = answeredQuestions.map((q, i) => ({
    question: q.question,
    selected: answeredAnswers[i],
    correct: q.answer
  }));

  const score = detailed.filter(q => (q.selected || '').trim().toLowerCase() === (q.correct || '').trim().toLowerCase()).length;
  const pass = isSurvival ? score >= 10 : score >= 6;
  const total = isSurvival ? (current === 0 ? 1 : current) : questions.length;

  const result = {
    user: user.name,
    category: config.category,
    difficulty: config.difficulty,
    mode: config.mode || "Standard",
    score,
    total: total,
    time: duration,
    passed: pass,
    date: new Date().toISOString(),
    details: detailed
  };

  const recent = JSON.parse(localStorage.getItem("quizbreaker_recent")) || [];
  recent.unshift(result);
  localStorage.setItem("quizbreaker_recent", JSON.stringify(recent.slice(0, 20)));

  latestResult = result;
  showSummary(result);
}

function getSmartFeedback(score, total, overtime, isSurvival) {
  if (isSurvival) {
    if (score >= 20) return "<i class='bi bi-fire text-red'></i> Incredible survival skills! You're a machine!";
    if (score >= 10) return "<i class='bi bi-shield-check text-green'></i> Great job, you survived a long time.";
    return "<i class='bi bi-emoji-frown text-danger'></i> Time ran out fast! Keep practicing.";
  }
  const accuracy = (score / total) * 100;
  if (accuracy === 100 && overtime === 0) return "<i class='bi bi-stars text-green'></i> Perfect! Outstanding timing and accuracy!";
  if (accuracy === 100 && overtime > 0) return "<i class='bi bi-hourglass-split text-yellow'></i> Perfect score, but time was exceeded.";
  if (accuracy >= 80 && overtime === 0) return "<i class='bi bi-emoji-smile text-green'></i> Great job finishing quickly with few mistakes.";
  if (accuracy >= 80) return "<i class='bi bi-stopwatch text-yellow'></i> Great score, but time management can improve.";
  if (accuracy >= 50) return "<i class='bi bi-lightbulb text-info'></i> Fair effort, you’re on the right track.";
  if (accuracy > 0) return "<i class='bi bi-emoji-neutral text-warning'></i> Needs improvement. Try to focus on accuracy and speed.";
  return "<i class='bi bi-emoji-frown text-danger'></i> Don’t worry! Practice makes perfect!";
}

function showSummary(result) {
  const accuracy = (result.score / result.total) * 100;
  const feedback = getSmartFeedback(result.score, result.total, overtime, result.mode === 'Survival');

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
        <button onclick="exitToGamePage()"><i class="bi bi-arrow-left"></i> Back</button>
      </div>
    </div>
  `;
}

function exitToGamePage() {
  if (latestResult) {
    localStorage.setItem("justCompletedQuiz", "true");
    localStorage.setItem("quizbreaker_latestMeta", JSON.stringify({
      score: latestResult.score,
      total: latestResult.total,
      time: latestResult.time,
      category: latestResult.category,
      difficulty: latestResult.difficulty
    }));
  }
  location.href = '../../app.html#game';
}

window.exitToGamePage = exitToGamePage;

