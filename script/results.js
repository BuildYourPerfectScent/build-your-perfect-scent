const resultsGrid = document.getElementById("resultsGrid");

document.addEventListener("DOMContentLoaded", () => {
  const topResults = JSON.parse(sessionStorage.getItem("quizTopResults")) || [];
  const moreResults = JSON.parse(sessionStorage.getItem("quizMoreResults")) || [];
  const audiencePreference = sessionStorage.getItem("quizAudiencePreference") || "Unisex";

  if (!topResults.length) {
    resultsGrid.innerHTML = `
      <div class="result-card" style="grid-column: 1 / -1;">
        <h4 class="result-name">No quiz results found</h4>
        <p class="result-meta">Please take the scent quiz first.</p>
      </div>
    `;
    return;
  }

  const mixPool = [...topResults, ...moreResults];
  sessionStorage.setItem("mixPool", JSON.stringify(mixPool));
  sessionStorage.removeItem("singleScentOrder");

  const headerCard = `
    <div class="result-card" style="grid-column: 1 / -1;">
      <h4 class="result-name">Preference Direction</h4>
      <p class="result-meta">
        Your quiz was tuned toward: <strong>${escapeHtml(prettyAudience(audiencePreference))}</strong>
      </p>
    </div>
  `;

  const topMarkup = topResults
    .map((scent, index) => `
      <div class="result-card">
        <h4 class="result-name">#${index + 1} ${escapeHtml(scent.name)}</h4>
        <p class="result-meta">
          Matches: <strong>${scent.score}</strong><br>
          Profile: ${escapeHtml(prettyTags(scent.tags || []))}
        </p>
        <span class="result-audience">${escapeHtml(scent.audience || "Unisex")}</span>

        <div class="result-actions">
          <button
            class="btn btn-primary single-order-btn"
            type="button"
            data-scent='${escapeAttr(JSON.stringify(scent))}'
          >
            Order This Scent
          </button>
        </div>
      </div>
    `)
    .join("");

  const moreMarkup = moreResults.length
    ? `
      <div class="result-card" style="grid-column: 1 / -1;">
        <h4 class="result-name">Additional Recommendations</h4>
        <p class="result-meta">
          ${moreResults
            .map((p) => `${escapeHtml(p.name)} (${escapeHtml(p.audience || "Unisex")})`)
            .join(" • ")}
        </p>
      </div>
    `
    : "";

  resultsGrid.innerHTML = headerCard + topMarkup + moreMarkup;

  document.querySelectorAll(".single-order-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const scent = JSON.parse(button.dataset.scent);

      sessionStorage.setItem("singleScentOrder", JSON.stringify(scent));
      sessionStorage.removeItem("mixBlend");

      window.location.href = "./order.html";
    });
  });
});

function prettyAudience(value) {
  if (value === "Women") return "Mainly Women’s Scents";
  if (value === "Men") return "Mainly Men’s Scents";
  return "Unisex / Open to Both";
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

  return priority.filter((t) => tags.includes(t)).slice(0, 6).join(", ");
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