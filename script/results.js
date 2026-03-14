const resultsGrid = document.getElementById("resultsGrid");

document.addEventListener("DOMContentLoaded", () => {

const topResults =
JSON.parse(sessionStorage.getItem("quizTopResults")) || [];

const moreResults =
JSON.parse(sessionStorage.getItem("quizMoreResults")) || [];

if (!topResults.length) {

resultsGrid.innerHTML = `
<p>No quiz results found. Please take the quiz first.</p>
`;

return;

}

resultsGrid.innerHTML = topResults.map((scent, index) => `

<div class="result-card">

<h4 class="result-name">
#${index + 1} ${escapeHtml(scent.name)}
</h4>

<p class="result-meta">

Matches: <strong>${scent.score}</strong>

<br>

Profile: ${prettyTags(scent.tags)}

</p>

</div>

`).join("");

if (moreResults.length) {

resultsGrid.innerHTML += `

<div class="result-card" style="grid-column:1/-1">

<h4 class="result-name">More Options</h4>

<p class="result-meta">

${moreResults.map(p => escapeHtml(p.name)).join(" • ")}

</p>

</div>

`;

}

});

function prettyTags(tags){

const priority = [

"fresh","sweet","floral","woody",
"amber","vanilla","aquatic","musky",
"spicy","luxury","statement",
"day","night","sporty","cozy"

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