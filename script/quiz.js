const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

let scents = [];
let quizzes = {};

let selectedLevel = null;
let selectedAudience = null;
let currentIndex = 0;
let answers = [];

const audienceButtons = $$(".audience-btn");
const levelButtons = $$(".quiz-level-btn");
const quizStartHint = $("#quizStartHint");

const quizArea = $("#quizArea");
const questionCard = $("#questionCard");
const progressText = $("#progressText");
const progressFill = $("#progressFill");
const backBtn = $("#backBtn");
const nextBtn = $("#nextBtn");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const [scentsRes, quizRes] = await Promise.all([
      fetch("../data/scents.json", { cache: "no-store" }),
      fetch("../data/quiz.json", { cache: "no-store" })
    ]);

    if (!scentsRes.ok || !quizRes.ok) {
      throw new Error("Failed to load quiz resources.");
    }

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
  audienceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      audienceButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      selectedAudience = btn.dataset.audience;
      sessionStorage.setItem("quizAudiencePreference", selectedAudience);

      updateStartHint();
    });
  });

  levelButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!selectedAudience) {
        alert("Please choose your scent direction first.");
        return;
      }

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

function updateStartHint() {
  if (!selectedAudience) {
    quizStartHint.textContent = "Please choose your scent direction first, then select a quiz length.";
    return;
  }

  const labelMap = {
    Women: "Mainly Women’s Scents",
    Men: "Mainly Men’s Scents",
    Unisex: "Unisex / Open to Both"
  };

  quizStartHint.textContent = `Selected direction: ${labelMap[selectedAudience]}. Now choose your quiz length.`;
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
  const selectedTags = answers.flat().filter(Boolean);

  const scored = scents
    .map((scent) => {
      let score = 0;

      selectedTags.forEach((tag) => {
        if (scent.tags.includes(tag)) score += 2;
        if (tag === "warm" && scent.tags.includes("amber")) score += 1;
        if (tag === "gourmand" && scent.tags.includes("sweet")) score += 1;
        if (tag === "statement" && scent.tags.includes("luxury")) score += 1;
      });

      score += getAudienceScoreBoost(scent, selectedAudience);

      return { ...scent, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

  const topResults = scored.slice(0, 3);
  const moreResults = scored.slice(3, 6);

  sessionStorage.setItem("quizTopResults", JSON.stringify(topResults));
  sessionStorage.setItem("quizMoreResults", JSON.stringify(moreResults));
  sessionStorage.setItem("quizSelectedTags", JSON.stringify(selectedTags));
  sessionStorage.setItem("quizAudiencePreference", selectedAudience || "Unisex");
  sessionStorage.setItem(
    "quizMeta",
    JSON.stringify({
      level: selectedLevel,
      audience: selectedAudience || "Unisex"
    })
  );

  window.location.href = "../pages/results.html";
}

function getAudienceScoreBoost(scent, audiencePreference) {
  const scentAudience = scent.audience || "Unisex";

  if (!audiencePreference || audiencePreference === "Unisex") {
    if (scentAudience === "Unisex") return 3;
    return 1;
  }

  if (audiencePreference === scentAudience) return 4;
  if (scentAudience === "Unisex") return 2;

  return 0;
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