// /assets/js/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("testBtn");
  const output = document.getElementById("output");

  btn.addEventListener("click", () => {
    fetch("../../data/dashboard.json")
      .then(res => res.json())
      .then(data => {
        output.textContent = `Fetched: ${data.message}`;
      })
      .catch(() => {
        output.textContent = "Failed to fetch data.";
        output.style.color = "#ff5c5c";
      });
  });
});
