// File: assets/js/utils.js

export function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function getColor(index) {
  const colors = ["info", "success", "warning", "danger", "primary", "secondary"];
  return colors[index % colors.length];
}

export function getStreak(data) {
  let streak = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].passed) streak++;
    else break;
  }
  return streak;
}

export function generateSmartFeedbackText(data) {
  const total = data.length;
  if (!total) return [];

  const avgAccuracy = Math.round(data.reduce((sum, q) => sum + (q.score / q.total), 0) / total * 100);
  const passRate = Math.round((data.filter(q => q.passed).length / total) * 100);
  const avgTime = Math.round(data.reduce((sum, q) => sum + q.time, 0) / total);
  const improving = total >= 2 && data[0].score > data[1].score;
  const declining = total >= 2 && data[0].score < data[1].score;

  const feedbacks = [];

  if (avgAccuracy === 100) feedbacks.push("Flawless");
  else if (avgAccuracy >= 80) feedbacks.push("Great accuracy");
  else if (avgAccuracy >= 60) feedbacks.push("Decent performance");
  else feedbacks.push("Keep practicing");

  if (passRate >= 80) feedbacks.push("Passing most quizzes");
  else if (passRate <= 30) feedbacks.push("Most attempts failed");

  if (avgTime < 60) feedbacks.push("Lightning fast");
  else if (avgTime > 180) feedbacks.push("Consider pacing up");

  if (improving) feedbacks.push("You're improving");
  if (declining) feedbacks.push("Small dip in performance");

  return feedbacks;
}
