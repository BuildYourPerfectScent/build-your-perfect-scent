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
    key: "goal",
    text: "What kind of blend do you want?",
    options: [
      { label: "Fresh and clean", value: "fresh-clean" },
      { label: "Sweet and cozy", value: "sweet-cozy" },
      { label: "Bold and intense", value: "bold-intense" },
      { label: "Balanced everyday scent", value: "balanced-everyday" }
    ]
  },
  {
    key: "strength",
    text: "How noticeable should the blend be?",
    options: [
      { label: "Soft and subtle", value: "soft" },
      { label: "Balanced", value: "balanced" },
      { label: "Strong", value: "strong" }
    ]
  },
  {
    key: "wear",
    text: "When will you wear this blend?",
    options: [
      { label: "Daytime", value: "day" },
      { label: "Night", value: "night" },
      { label: "Special occasions", value: "occasion" }
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

  try {
    const response = await fetch("../data/scents.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    mixPool = data.scents || [];
    mixHint.textContent = "Choose 2–5 scents from all available scents.";
  } catch (error) {
    console.error("Failed to load scents:", error);
    mixHint.textContent = "Failed to load scents.";
    mixPerfumeList.innerHTML = `
      <p class="card-note">
        Failed to load <strong>data/scents.json</strong>.
      </p>
    `;
  }
}

function renderMixChoices() {
  if (!mixPool.length) {
    if (!mixPerfumeList.innerHTML.trim()) {
      mixPerfumeList.innerHTML = `<p class="card-note">No scents available right now.</p>`;
    }
    return;
  }

  mixPerfumeList.innerHTML = mixPool
    .map((p, i) => {
      const family = [p.familyPrimary, p.familySecondary].filter(Boolean).join(" • ");
      return `
        <label class="mix-choice" for="mix_${i}">
          <input
            type="checkbox"
            class="mix-checkbox"
            id="mix_${i}"
            data-name="${escapeHtml(p.name)}"
          >
          <span class="mix-choice-text-wrap">
            <span class="mix-choice-text">${escapeHtml(p.name)}</span>
            <span class="mix-choice-meta">${escapeHtml(family)}</span>
          </span>
        </label>
      `;
    })
    .join("");

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

  mixNextBtn.textContent = mixIndex === MIX_QUIZ.length - 1 ? "See Blend" : "Next";

  mixQuestionCard.innerHTML = `
    <h4 class="q-title">${escapeHtml(q.text)}</h4>
    <div class="options">
      ${q.options
        .map(
          (opt) => `
            <label class="option">
              <input
                type="radio"
                name="mixOption"
                value="${escapeHtml(opt.value)}"
                ${saved === opt.value ? "checked" : ""}
              >
              <span>${escapeHtml(opt.label)}</span>
            </label>
          `
        )
        .join("")}
    </div>
  `;
}

function showMixResult() {
  mixQuizArea.hidden = true;
  mixResultArea.hidden = false;

  const selectedObjects = mixPool.filter((item) => selectedScents.includes(item.name));
  const mixProfile = getMixProfile();
  const analysis = analyzeBlend(selectedObjects, mixProfile);

  mixResultCard.innerHTML = `
    <div class="mix-result">
      <p><strong>Blend Verdict:</strong> ${escapeHtml(analysis.verdictLabel)}</p>
      <p>${escapeHtml(analysis.summary)}</p>

      <div class="divider"></div>

      <p><strong>Why it works:</strong></p>
      <ul class="mix-bullets">
        ${analysis.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>

      ${
        analysis.warnings.length
          ? `
            <div class="divider"></div>
            <p><strong>Things to watch:</strong></p>
            <ul class="mix-bullets">
              ${analysis.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}
            </ul>
          `
          : ""
      }

      <div class="divider"></div>

      <p><strong>Suggested structure:</strong></p>
      <p>${escapeHtml(analysis.structureLine)}</p>

      <div class="mix-bars">
        ${analysis.blendItems
          .map(
            (item) => `
              <div class="mix-bar">
                <div class="mix-bar-top">
                  <span>${escapeHtml(item.scent)}</span>
                  <span>${item.pct}% • ${escapeHtml(item.roleLabel)}</span>
                </div>
                <div class="mix-track">
                  <div class="mix-fill" style="width: ${item.pct}%"></div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="divider"></div>

      <p><strong>Blend style:</strong></p>
      <p>${escapeHtml(analysis.styleLine)}</p>
    </div>
  `;

  sessionStorage.setItem(
    "mixBlend",
    JSON.stringify({
      mode,
      scents: selectedScents,
      answers: mixAnswers,
      profile: mixProfile,
      analysis
    })
  );
}

function getMixProfile() {
  return {
    goal: mixAnswers[0] || "balanced-everyday",
    strength: mixAnswers[1] || "balanced",
    wear: mixAnswers[2] || "day"
  };
}

function analyzeBlend(scents, profile) {
  const reasons = [];
  const warnings = [];
  let score = 0;

  const nameSet = new Set(scents.map((s) => s.name));

  const pairResults = [];

  for (let i = 0; i < scents.length; i++) {
    for (let j = i + 1; j < scents.length; j++) {
      const a = scents[i];
      const b = scents[j];
      const pair = analyzePair(a, b);
      pairResults.push(pair);
      score += pair.score;
      reasons.push(...pair.reasons);
      warnings.push(...pair.warnings);
    }
  }

  const intensitySpread =
    Math.max(...scents.map((s) => Number(s.intensity || 3))) -
    Math.min(...scents.map((s) => Number(s.intensity || 3)));

  if (intensitySpread <= 1) {
    score += 2;
    reasons.push("The scents sit in a similar intensity range, so the blend should feel smoother.");
  } else if (intensitySpread >= 3) {
    score -= 2;
    warnings.push("One or more scents are much stronger than the others, so the blend may feel uneven.");
  }

  const avgSweetness = average(scents.map((s) => Number(s.sweetness || 0)));
  const avgFreshness = average(scents.map((s) => Number(s.freshness || 0)));

  if (profile.goal === "fresh-clean") {
    score += avgFreshness >= 3 ? 3 : -2;
    if (avgFreshness >= 3) {
      reasons.push("Your selection supports a fresher, cleaner blend direction.");
    } else {
      warnings.push("These choices lean less fresh than your requested blend style.");
    }
  }

  if (profile.goal === "sweet-cozy") {
    score += avgSweetness >= 3 ? 3 : -2;
    if (avgSweetness >= 3) {
      reasons.push("Your selection supports a sweeter, cozier blend direction.");
    } else {
      warnings.push("These choices lean less sweet than your requested blend style.");
    }
  }

  if (profile.goal === "bold-intense") {
    const strongCount = scents.filter((s) => Number(s.intensity || 3) >= 4).length;
    score += strongCount >= 1 ? 3 : -2;
    if (strongCount >= 1) {
      reasons.push("Your selection includes at least one scent strong enough to carry a bolder style.");
    } else {
      warnings.push("These choices may feel softer than your requested bold style.");
    }
  }

  if (profile.goal === "balanced-everyday") {
    const moderateFriendly = scents.filter((s) => Number(s.intensity || 3) <= 4).length;
    if (moderateFriendly >= Math.ceil(scents.length / 2)) {
      score += 2;
      reasons.push("Most of your choices can fit an everyday-wear blend.");
    }
  }

  if (profile.wear === "day" && avgFreshness >= avgSweetness) {
    score += 1;
    reasons.push("The overall profile suits daytime wear well.");
  }

  if (profile.wear === "night" && avgSweetness + average(scents.map((s) => Number(s.intensity || 3))) >= 7) {
    score += 1;
    reasons.push("The blend has enough body for night wear.");
  }

  if (profile.wear === "occasion") {
    const occasionCount = scents.filter((s) => s.tags?.includes("luxury") || s.tags?.includes("statement")).length;
    if (occasionCount > 0) {
      score += 2;
      reasons.push("At least one scent adds a more dressed-up, special-occasion feel.");
    }
  }

  const uniqueReasons = dedupe(reasons).slice(0, 5);
  const uniqueWarnings = dedupe(warnings).slice(0, 4);

  const roleAnalysis = assignRoles(scents, profile);
  const blendItems = buildRatios(roleAnalysis, profile);

  const verdictLabel =
    score >= 12
      ? "Very compatible"
      : score >= 8
      ? "Compatible"
      : score >= 4
      ? "Experimental but workable"
      : "Risky combination";

  const summary =
    score >= 12
      ? "These scents make strong sense together and should blend smoothly."
      : score >= 8
      ? "These scents can work well together with a sensible ratio."
      : score >= 4
      ? "This blend can work, but it needs balance so one scent does not overpower the others."
      : "This combination may feel less smooth because the profiles pull in different directions.";

  const styleLine = buildStyleLine(scents, profile);
  const structureLine = buildStructureLine(blendItems);

  return {
    verdictScore: score,
    verdictLabel,
    summary,
    reasons: uniqueReasons.length ? uniqueReasons : ["The selected scents have some overlap that can be blended with care."],
    warnings: uniqueWarnings,
    blendItems,
    styleLine,
    structureLine
  };
}

function analyzePair(a, b) {
  let score = 0;
  const reasons = [];
  const warnings = [];

  if (a.familyPrimary === b.familyPrimary) {
    score += 3;
    reasons.push(`${a.name} and ${b.name} share the same main fragrance family.`);
  } else if (
    a.familyPrimary === b.familySecondary ||
    a.familySecondary === b.familyPrimary ||
    a.familySecondary === b.familySecondary
  ) {
    score += 2;
    reasons.push(`${a.name} and ${b.name} sit in neighboring fragrance families.`);
  }

  const sharedNotes = intersect(a.notes || [], b.notes || []);
  if (sharedNotes.length) {
    score += Math.min(3, sharedNotes.length);
    reasons.push(`${a.name} and ${b.name} share note links like ${sharedNotes.slice(0, 2).join(" and ")}.`);
  }

  const sharedTags = intersect(a.tags || [], b.tags || []);
  if (sharedTags.length >= 2) {
    score += 2;
    reasons.push(`${a.name} and ${b.name} share a similar overall vibe.`);
  }

  const intensityDiff = Math.abs(Number(a.intensity || 3) - Number(b.intensity || 3));
  if (intensityDiff <= 1) {
    score += 1;
  } else if (intensityDiff >= 3) {
    score -= 2;
    warnings.push(`${a.name} may overpower ${b.name}, or vice versa.`);
  }

  if ((a.pairings || []).includes(b.name) || (b.pairings || []).includes(a.name)) {
    score += 3;
    reasons.push(`${a.name} and ${b.name} are marked as a strong pairing.`);
  }

  if ((a.avoidWith || []).includes(b.name) || (b.avoidWith || []).includes(a.name)) {
    score -= 4;
    warnings.push(`${a.name} and ${b.name} are less recommended together.`);
  }

  return { score, reasons, warnings };
}

function assignRoles(scents, profile) {
  const scored = scents.map((scent) => {
    let roleScore = 0;

    const canBase = (scent.worksAs || []).includes("base");
    const canSupport = (scent.worksAs || []).includes("support");
    const canAccent = (scent.worksAs || []).includes("accent");

    if (profile.goal === "fresh-clean") {
      roleScore += Number(scent.freshness || 0) * 2;
      if ((scent.tags || []).includes("fresh")) roleScore += 2;
      if (canBase) roleScore += 1;
    }

    if (profile.goal === "sweet-cozy") {
      roleScore += Number(scent.sweetness || 0) * 2;
      if ((scent.tags || []).includes("vanilla")) roleScore += 2;
      if ((scent.tags || []).includes("gourmand")) roleScore += 2;
      if (canBase) roleScore += 1;
    }

    if (profile.goal === "bold-intense") {
      roleScore += Number(scent.intensity || 0) * 2;
      if ((scent.tags || []).includes("statement")) roleScore += 2;
      if (canBase) roleScore += 1;
    }

    if (profile.goal === "balanced-everyday") {
      roleScore += 5 - Math.abs(3 - Number(scent.intensity || 3));
      if ((scent.tags || []).includes("day") || (scent.tags || []).includes("allyear")) roleScore += 2;
      if (canSupport) roleScore += 1;
    }

    if (profile.wear === "day" && (scent.tags || []).includes("day")) roleScore += 1;
    if (profile.wear === "night" && (scent.tags || []).includes("night")) roleScore += 1;
    if (profile.wear === "occasion" && ((scent.tags || []).includes("luxury") || (scent.tags || []).includes("statement"))) {
      roleScore += 1;
    }

    return { scent, roleScore };
  });

  scored.sort((a, b) => b.roleScore - a.roleScore);

  if (scents.length === 2) {
    return [
      { scent: scored[0].scent, role: "base" },
      { scent: scored[1].scent, role: "support" }
    ];
  }

  if (scents.length === 3) {
    return [
      { scent: scored[0].scent, role: "base" },
      { scent: scored[1].scent, role: "support" },
      { scent: scored[2].scent, role: "accent" }
    ];
  }

  if (scents.length === 4) {
    return [
      { scent: scored[0].scent, role: "base" },
      { scent: scored[1].scent, role: "support" },
      { scent: scored[2].scent, role: "support" },
      { scent: scored[3].scent, role: "accent" }
    ];
  }

  return [
    { scent: scored[0].scent, role: "base" },
    { scent: scored[1].scent, role: "support" },
    { scent: scored[2].scent, role: "support" },
    { scent: scored[3].scent, role: "accent" },
    { scent: scored[4].scent, role: "accent" }
  ];
}

function buildRatios(roleAssignments, profile) {
  const count = roleAssignments.length;
  let weights;

  if (count === 2) {
    weights = profile.strength === "soft" ? [55, 45] : profile.strength === "strong" ? [70, 30] : [60, 40];
  } else if (count === 3) {
    weights = profile.strength === "soft" ? [45, 35, 20] : profile.strength === "strong" ? [55, 30, 15] : [50, 30, 20];
  } else if (count === 4) {
    weights = profile.strength === "soft" ? [38, 27, 20, 15] : profile.strength === "strong" ? [45, 25, 18, 12] : [40, 25, 20, 15];
  } else {
    weights = profile.strength === "soft" ? [32, 23, 18, 15, 12] : profile.strength === "strong" ? [40, 22, 16, 12, 10] : [35, 22, 18, 13, 12];
  }

  const adjusted = roleAssignments.map((item, index) => {
    let pct = weights[index];
    const intensity = Number(item.scent.intensity || 3);

    if (intensity >= 5 && item.role !== "base") pct -= 3;
    if (intensity >= 5 && item.role === "base") pct -= 1;
    if (intensity <= 2 && item.role === "support") pct += 2;
    if (intensity <= 2 && item.role === "accent") pct += 1;

    if (profile.goal === "fresh-clean" && Number(item.scent.freshness || 0) >= 4) pct += 2;
    if (profile.goal === "sweet-cozy" && Number(item.scent.sweetness || 0) >= 4) pct += 2;
    if (profile.goal === "bold-intense" && intensity >= 4 && item.role === "base") pct += 2;
    if (profile.goal === "balanced-everyday" && intensity >= 5) pct -= 2;

    return {
      scent: item.scent.name,
      role: item.role,
      roleLabel: roleLabel(item.role),
      pct
    };
  });

  normalizePercentages(adjusted);

  return adjusted;
}

function normalizePercentages(items) {
  let total = items.reduce((sum, item) => sum + item.pct, 0);

  items.forEach((item) => {
    item.pct = Math.max(5, Math.round((item.pct / total) * 100));
  });

  total = items.reduce((sum, item) => sum + item.pct, 0);

  while (total > 100) {
    const idx = items.findIndex((item) => item.pct === Math.max(...items.map((x) => x.pct)));
    items[idx].pct -= 1;
    total -= 1;
  }

  while (total < 100) {
    const idx = items.findIndex((item) => item.pct === Math.max(...items.map((x) => x.pct)));
    items[idx].pct += 1;
    total += 1;
  }
}

function buildStyleLine(scents, profile) {
  const profileMap = {
    "fresh-clean": "fresh, airy, cleaner-leaning",
    "sweet-cozy": "sweet, soft, comforting",
    "bold-intense": "deeper, louder, more noticeable",
    "balanced-everyday": "smooth, versatile, easy to wear"
  };

  const wearMap = {
    day: "best suited for daytime wear",
    night: "better suited for evening wear",
    occasion: "well suited for dressier moments"
  };

  return `${profileMap[profile.goal] || "balanced"} and ${wearMap[profile.wear] || "versatile"}.`;
}

function buildStructureLine(blendItems) {
  const parts = blendItems.map((item) => `${item.scent} as ${item.roleLabel.toLowerCase()}`);
  return parts.join(", ");
}

function roleLabel(role) {
  if (role === "base") return "Base";
  if (role === "support") return "Support";
  return "Accent";
}

function intersect(a, b) {
  const bSet = new Set(b);
  return a.filter((item) => bSet.has(item));
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function dedupe(items) {
  return [...new Set(items)];
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}