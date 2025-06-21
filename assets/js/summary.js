document.addEventListener("DOMContentLoaded", () => {
  const quiz = JSON.parse(localStorage.getItem("quizbreaker_summary"));
  if (!quiz) return location.href = "game.html";

  const container = document.getElementById("summaryContainer");

  const formatTime = s => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const getSmartFeedback = (score, total) => {
    const accuracy = (score / total) * 100;
    if (accuracy === 100) return "<i class='bi bi-stars text-green'></i> Perfect! Outstanding performance!";
    if (accuracy >= 90) return "<i class='bi bi-emoji-laughing text-green'></i> Excellent result!";
    if (accuracy >= 75) return "<i class='bi bi-emoji-smile text-info'></i> Great effort!";
    if (accuracy >= 50) return "<i class='bi bi-lightbulb text-yellow'></i> Fair work, keep practicing!";
    return "<i class='bi bi-emoji-frown text-red'></i> Don't worry, you can improve with time!";
  };

  const renderSkeleton = () => {
    container.innerHTML = `
      <div class="skeleton-header d-flex flex-column align-items-center text-center mb-3">
        <div class="skeleton-header-line w-50 mb-2"></div>
        <div class="skeleton-header-line w-75 mb-2"></div>
        <div class="skeleton-header-line w-25"></div>
        <div class="skeleton-header-line w-50"></div>
        <div class="skeleton-header-line w-75"></div>
        <div class="skeleton-header-line w-25"></div>
      </div>
      <div class="skeleton-questions">
        ${Array.from({ length: 10 }).map(() => `
          <div class="skeleton-question-card">
            <div class="skeleton-q-line"></div>
            <div class="skeleton-answer-line"></div>
            <div class="skeleton-correct-line"></div>
          </div>
        `).join('')}
      </div>
      <div class="skeleton-btn"></div>
    `;
  };

  const renderSummary = () => {
    container.innerHTML = `
      <h2>Quiz Summary</h2>
      <div class="summary">
        <h3>Result: ${quiz.passed ? '<i class="bi bi-check-circle-fill text-green"></i> Passed' : '<i class="bi bi-x-circle-fill text-red"></i> Failed'}</h3>
        <p><strong>Score:</strong> ${quiz.score} / ${quiz.total}</p>
        <p><strong>Time Taken:</strong> ${formatTime(quiz.time)}</p>
        <p><strong>Feedback:</strong> ${getSmartFeedback(quiz.score, quiz.total)}</p>
        <h3>Details:</h3>
        ${quiz.details.map((q, i) => `
          <div class="summary-item ${q.selected?.trim().toLowerCase() === q.correct?.trim().toLowerCase() ? 'correct' : 'incorrect'}">
            <strong>Q${i + 1}:</strong> ${q.question}<br/>
            <span><i class="bi ${q.selected?.trim().toLowerCase() === q.correct?.trim().toLowerCase() ? 'bi-check-lg text-green' : 'bi-x-lg text-red'}"></i> You answered: ${q.selected || "None"}</span><br/>
            <span><i class="bi bi-info-circle text-green"></i> Correct Answer: ${q.correct}</span>
          </div>
        `).join('')}
        <div class="btn-group">
          <button onclick="location.href='game.html'"><i class="bi bi-arrow-left"></i> Back to Game</button>
        </div>
      </div>
    `;
  };

  renderSkeleton();
  setTimeout(() => {
    renderSummary();
  }, 2000);
});
