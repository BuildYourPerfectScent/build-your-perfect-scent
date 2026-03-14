const mixPerfumeList = document.getElementById("mixPerfumeList");
const startMixQuizBtn = document.getElementById("startMixQuizBtn");
const mixHint = document.getElementById("mixHint");

const mixQuizArea = document.getElementById("mixQuizArea");
const mixQuestionCard = document.getElementById("mixQuestionCard");
const mixNextBtn = document.getElementById("mixNextBtn");
const mixBackBtn = document.getElementById("mixBackBtn");

const mixResultArea = document.getElementById("mixResultArea");
const mixResultCard = document.getElementById("mixResultCard");
const restartMixBtn = document.getElementById("restartMixBtn");

let mixPool = [];
let selectedScents = [];
let mixAnswers = [];
let mixIndex = 0;

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") || "direct";

const MIX_QUIZ = [
  {
    text: "What kind of blend do you want?",
    options: [
      { label: "Fresh and clean" },
      { label: "Sweet and cozy" },
      { label: "Bold and intense" },
      { label: "Balanced everyday scent" }
    ]
  },
  {
    text: "How noticeable should the blend be?",
    options: [
      { label: "Soft and subtle" },
      { label: "Balanced" },
      { label: "Strong" }
    ]
  },
  {
    text: "When will you wear this blend?",
    options: [
      { label: "Daytime" },
      { label: "Night" },
      { label: "Special occasions" }
    ]
  }
];

document.addEventListener("DOMContentLoaded", async () => {
  await loadMixPool();
  renderMixChoices();
  bindEvents();
});

async function loadMixPool() {
  if (mode === "recommended") {
    const storedMixPool = JSON.parse(sessionStorage.getItem("mixPool")) || [];
    if (storedMixPool.length) {
      mixPool = storedMixPool;
      mixHint.textContent = "Choose 2–5 scents from your quiz recommendations.";
      return;
    }
  }

  const response = await fetch("../data/scents.json");
  const data = await response.json();
  mixPool = data.scents || [];
  mixHint.textContent = "Choose 2–5 scents from all available scents.";
}

function renderMixChoices() {
  if (!mixPool.length) {
    mixPerfumeList.innerHTML = `<p class="card-note">No scents available right now.</p>`;
    return;
  }

  mixPerfumeList.innerHTML = mixPool.map((p, i) => `
    <label class="mix-choice" for="mix_${i}">
      <input
        type="checkbox"
        class="mix-checkbox"
        id="mix_${i}"
        data-name="${escapeHtml(p.name)}"
      >
      <span class="mix-choice-text">${escapeHtml(p.name)}</span>
    </label>
  `).join("");

  mixPerfumeList.querySelectorAll(".mix-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      const name = cb.dataset.name;

      if (cb.checked) {
        if (selectedScents.length >= 5) {
          cb.checked = false;
          alert("You can mix up to 5 scents only.");
          return;
        }
        selectedScents.push(name);
      } else {
        selectedScents = selectedScents.filter((s) => s !== name);
      }

      updateMixState();
    });
  });
}

function updateMixState() {
  const count = selectedScents.length;

  if (count < 2) {
    mixHint.textContent =
      mode === "recommended"
        ? "Select at least 2 scents from your recommendations."
        : "Select at least 2 scents to continue.";
    startMixQuizBtn.disabled = true;
    return;
  }

  mixHint.textContent = `${count} scent${count > 1 ? "s" : ""} selected`;
  startMixQuizBtn.disabled = false;
}

function bindEvents() {
  startMixQuizBtn.addEventListener("click", () => {
    mixQuizArea.hidden = false;
    mixResultArea.hidden = true;
    mixIndex = 0;
    mixAnswers = [];
    renderMixQuestion();
  });

  mixNextBtn.addEventListener("click", () => {
    const chosen = document.querySelector('input[name="mixOption"]:checked');

    if (!chosen) {
      alert("Please choose an option.");
      return;
    }

    mixAnswers[mixIndex] = chosen.value;

    if (mixIndex < MIX_QUIZ.length - 1) {
      mixIndex++;
      renderMixQuestion();
    } else {
      showMixResult();
    }
  });

  mixBackBtn.addEventListener("click", () => {
    if (mixIndex === 0) {
      mixQuizArea.hidden = true;
      return;
    }

    mixIndex--;
    renderMixQuestion();
  });

  restartMixBtn.addEventListener("click", () => {
    window.location.reload();
  });
}

function renderMixQuestion() {
  const q = MIX_QUIZ[mixIndex];
  const saved = mixAnswers[mixIndex];

  mixNextBtn.textContent =
    mixIndex === MIX_QUIZ.length - 1 ? "See Blend" : "Next";

  mixQuestionCard.innerHTML = `
    <h4 class="q-title">${escapeHtml(q.text)}</h4>
    <div class="options">
      ${q.options.map((opt) => `
        <label class="option">
          <input
            type="radio"
            name="mixOption"
            value="${escapeHtml(opt.label)}"
            ${saved === opt.label ? "checked" : ""}
          >
          <span>${escapeHtml(opt.label)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function showMixResult() {
  mixQuizArea.hidden = true;
  mixResultArea.hidden = false;

  const baseRatio = Math.floor(100 / selectedScents.length);
  let remaining = 100 - (baseRatio * selectedScents.length);

  const blendItems = selectedScents.map((scent, index) => {
    const pct = baseRatio + (index === 0 ? remaining : 0);
    return { scent, pct };
  });

  mixResultCard.innerHTML = `
    <div class="mix-result">
      <p><strong>Your Blend Style:</strong></p>
      <p>${escapeHtml(mixAnswers.join(" • "))}</p>

      <div class="divider"></div>

      <p><strong>Your Blend:</strong></p>

      <div class="mix-bars">
        ${blendItems.map(item => `
          <div class="mix-bar">
            <div class="mix-bar-top">
              <span>${escapeHtml(item.scent)}</span>
              <span>${item.pct}%</span>
            </div>
            <div class="mix-track">
              <div class="mix-fill" style="width: ${item.pct}%"></div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  sessionStorage.setItem(
    "mixBlend",
    JSON.stringify({
      mode,
      scents: selectedScents,
      answers: mixAnswers,
      blend: blendItems
    })
  );
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}