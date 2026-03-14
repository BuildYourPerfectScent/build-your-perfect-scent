const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let scents = [];
let quizzes = {};

let selectedLevel = null;
let currentIndex = 0;
let answers = [];

const levelButtons = $$(".level-btn");
const quizArea = $("#quizArea");
const questionCard = $("#questionCard");
const progressText = $("#progressText");
const progressFill = $("#progressFill");
const backBtn = $("#backBtn");
const nextBtn = $("#nextBtn");

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
    quizArea.hidden = false;
    questionCard.innerHTML = `
      <p style="color: white;">
        Failed to load quiz data. Check your JSON paths and run the site using Live Server or GitHub Pages.
      </p>
    `;
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

    animateQuestion("back", () => {
      currentIndex--;
      renderQuestion();
    });
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
      animateQuestion("next", () => {
        currentIndex++;
        renderQuestion();
      });
    } else {
      animateQuestion("next", () => {
        showResults();
      });
    }
  });
}

function startQuiz(level) {
  if (!quizzes[level]) return;

  selectedLevel = level;
  currentIndex = 0;
  answers = new Array(quizzes[level].length).fill(null);

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

  sessionStorage.setItem("quizTopResults", JSON.stringify(topResults));
  sessionStorage.setItem("quizMoreResults", JSON.stringify(moreResults));
  sessionStorage.setItem("quizSelectedTags", JSON.stringify(selectedTags));

  window.location.href = "../pages/results.html";
}

function animateQuestion(direction, updateFn) {
  const enterX = direction === "next" ? "14px" : "-14px";
  const exitX = direction === "next" ? "-14px" : "14px";

  questionCard.style.setProperty("--qExitX", exitX);
  questionCard.classList.remove("q-anim-enter", "q-anim-enter-active");
  questionCard.classList.add("q-anim-exit");

  void questionCard.offsetWidth;

  questionCard.classList.add("q-anim-exit-active");

  setTimeout(() => {
    updateFn();

    if (quizArea.hidden) return;

    questionCard.style.setProperty("--qEnterX", enterX);
    questionCard.classList.remove("q-anim-exit", "q-anim-exit-active");
    questionCard.classList.add("q-anim-enter");

    void questionCard.offsetWidth;

    questionCard.classList.add("q-anim-enter-active");

    setTimeout(() => {
      questionCard.classList.remove("q-anim-enter", "q-anim-enter-active");
    }, 240);
  }, 190);
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