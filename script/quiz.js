const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let scents = [];
let quizzes = {};

let selectedLevel = null;
let currentIndex = 0;
let answers = [];

const levelButtons = $$(".level-btn");
const quizArea = $("#quizArea");
const resultsArea = $("#resultsArea");
const questionCard = $("#questionCard");
const progressText = $("#progressText");
const progressFill = $("#progressFill");
const backBtn = $("#backBtn");
const nextBtn = $("#nextBtn");
const restartBtn = $("#restartBtn");
const resultsGrid = $("#resultsGrid");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [scentsRes, quizRes] = await Promise.all([
      fetch("../data/scents.json"),
      fetch("../data/quiz.json"),
    ]);

    const scentsData = await scentsRes.json();
    const quizData = await quizRes.json();

    scents = scentsData.scents || [];
    quizzes = quizData.quiz_versions || {};

    bindEvents();
  } catch (error) {
    console.error("Failed to load quiz data:", error);
    questionCard.innerHTML = `
      <p style="color: white;">Failed to load quiz data. Check your JSON paths and run the site using Live Server or GitHub Pages.</p>
    `;
    quizArea.hidden = false;
  }
});

function bindEvents() {
  levelButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      levelButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      selectedLevel = btn.dataset.level;
      startQuiz(selectedLevel);
    });
  });

  backBtn.addEventListener("click", () => {
    if (currentIndex === 0) return;
    currentIndex--;
    renderQuestion();
  });

  nextBtn.addEventListener("click", () => {
    const selected = document.querySelector('input[name="quizOption"]:checked');

    if (!selected) {
      alert("Please choose an answer first.");
      return;
    }

    answers[currentIndex] = JSON.parse(selected.value);

    const total = quizzes[selectedLevel].length;

    if (currentIndex < total - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      showResults();
    }
  });

  restartBtn.addEventListener("click", () => {
    resetQuiz();
  });
}

function startQuiz(level) {
  if (!quizzes[level]) return;

  selectedLevel = level;
  currentIndex = 0;
  answers = new Array(quizzes[level].length).fill(null);

  resultsArea.hidden = true;
  quizArea.hidden = false;

  renderQuestion();
}

function renderQuestion() {
  const currentQuiz = quizzes[selectedLevel];
  const question = currentQuiz[currentIndex];

  progressText.textContent = `Question ${currentIndex + 1} of ${currentQuiz.length}`;
  progressFill.style.width = `${((currentIndex + 1) / currentQuiz.length) * 100}%`;

  backBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === currentQuiz.length - 1 ? "See Results" : "Next";

  const savedAnswer = answers[currentIndex];

  questionCard.innerHTML = `
    <h4 class="q-title">${escapeHtml(question.text)}</h4>
    <div class="options">
      ${question.options.map((option) => {
        const value = JSON.stringify(option.add);
        const checked =
          savedAnswer && JSON.stringify(savedAnswer) === JSON.stringify(option.add)
            ? "checked"
            : "";

        return `
          <label class="option">
            <input type="radio" name="quizOption" value='${escapeAttr(value)}' ${checked}>
            <span>${escapeHtml(option.label)}</span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function showResults() {
  quizArea.hidden = true;
  resultsArea.hidden = false;

  const selectedTags = answers.flat();

  const scored = scents
    .map((scent) => {
      let score = 0;

      selectedTags.forEach((tag) => {
        if (scent.tags.includes(tag)) score += 2;

        if (tag === "warm" && scent.tags.includes("amber")) score += 1;
        if (tag === "gourmand" && scent.tags.includes("sweet")) score += 1;
        if (tag === "statement" && scent.tags.includes("luxury")) score += 1;
      });

      return { ...scent, score };
    })
    .sort((a, b) => b.score - a.score);

  const topResults = scored.slice(0, 3);
  const moreResults = scored.slice(3, 6);

  resultsGrid.innerHTML = topResults.map((scent, index) => `
    <div class="result-card">
      <h4 class="result-name">#${index + 1} ${escapeHtml(scent.name)}</h4>
      <p class="result-meta">
        Matches: <strong>${scent.score}</strong> • Profile: ${escapeHtml(prettyTags(scent.tags))}
      </p>
    </div>
  `).join("");

  if (moreResults.length) {
    resultsGrid.innerHTML += `
      <div class="result-card" style="grid-column: 1 / -1;">
        <h4 class="result-name">More options to try</h4>
        <p class="result-meta">${moreResults.map((item) => escapeHtml(item.name)).join(" • ")}</p>
      </div>
    `;
  }
}

function resetQuiz() {
  selectedLevel = null;
  currentIndex = 0;
  answers = [];

  quizArea.hidden = true;
  resultsArea.hidden = true;
  questionCard.innerHTML = "";
  resultsGrid.innerHTML = "";

  levelButtons.forEach((btn) => btn.classList.remove("is-active"));
}

function prettyTags(tags) {
  const priority = [
    "fresh",
    "sweet",
    "floral",
    "woody",
    "amber",
    "vanilla",
    "aquatic",
    "musky",
    "spicy",
    "luxury",
    "statement",
    "day",
    "night",
    "sporty",
    "cozy",
    "allyear"
  ];

  return priority.filter((tag) => tags.includes(tag)).slice(0, 6).join(", ");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("\n", " ");
}