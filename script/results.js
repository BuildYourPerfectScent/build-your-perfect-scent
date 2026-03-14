const resultsGrid = document.getElementById("resultsGrid");

document.addEventListener("DOMContentLoaded", () => {

  const topResults =
    JSON.parse(sessionStorage.getItem("quizTopResults")) || [];

  const moreResults =
    JSON.parse(sessionStorage.getItem("quizMoreResults")) || [];

  if (!topResults.length) {

    resultsGrid.innerHTML = `
      <div class="result-card" style="grid-column: 1 / -1;">
        <h4 class="result-name">No quiz results found</h4>
        <p class="result-meta">Please take the scent quiz first.</p>
      </div>
    `;

    return;
  }

  // Combine all results for mixing later
  const mixPool = [...topResults, ...moreResults];
  sessionStorage.setItem("mixPool", JSON.stringify(mixPool));


  // Render top matches
  const topMarkup = topResults.map((scent, index) => `
      <div class="result-card">
        <h4 class="result-name">#${index + 1} ${escapeHtml(scent.name)}</h4>
        <p class="result-meta">
          Matches: <strong>${scent.score}</strong><br>
          Profile: ${prettyTags(scent.tags)}
        </p>
      </div>
  `).join("");


  // Render additional recommendations
  const moreMarkup = moreResults.length ? `
      <div class="result-card" style="grid-column: 1 / -1;">
        <h4 class="result-name">Additional Recommendations</h4>
        <p class="result-meta">
          ${moreResults.map(p => escapeHtml(p.name)).join(" • ")}
        </p>
      </div>
  ` : "";


  resultsGrid.innerHTML = topMarkup + moreMarkup;

});


function prettyTags(tags){

  const priority = [
    "fresh","sweet","floral","woody",
    "amber","vanilla","aquatic","musky",
    "spicy","luxury","statement",
    "day","night","sporty","cozy","allyear"
  ];

  return priority
    .filter(t => tags.includes(t))
    .slice(0,6)
    .join(", ");

}


function escapeHtml(str){

  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}