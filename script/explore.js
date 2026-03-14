const scentsGrid = document.getElementById("scentsGrid");
const familyCards = document.querySelectorAll(".family-card");
const audienceFilter = document.getElementById("audienceFilter");
const searchInput = document.getElementById("searchInput");

let scents = [];
let selectedFamily = "all";

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("../data/scents.json");
  const data = await res.json();

  scents = data.scents || [];
  renderScents(scents);

  familyCards.forEach((card) => {
    card.addEventListener("click", () => {
      familyCards.forEach((item) => item.classList.remove("is-active"));
      card.classList.add("is-active");
      selectedFamily = card.dataset.family;
      applyFilters();
    });
  });

  audienceFilter.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);
});

function applyFilters() {
  let filtered = [...scents];
  const audience = audienceFilter.value;
  const search = searchInput.value.toLowerCase();

  if (selectedFamily !== "all") {
    filtered = filtered.filter((s) => s.tags.includes(selectedFamily));
  }

  if (audience !== "all") {
    filtered = filtered.filter((s) => s.audience === audience);
  }

  if (search) {
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(search));
  }

  renderScents(filtered);
}

function renderScents(list) {
  if (!list.length) {
    scentsGrid.innerHTML = `<p>No scents found.</p>`;
    return;
  }

  scentsGrid.innerHTML = list.map((scent) => `
    <div class="scent-card">
      <h3 class="scent-name">${escapeHtml(scent.name)}</h3>
      <p class="scent-meta">${escapeHtml(prettyTags(scent.tags))}</p>
      <span class="scent-audience">${escapeHtml(scent.audience || "Unisex")}</span>

      <div class="scent-actions">
        <button
          class="btn btn-primary"
          type="button"
          onclick='orderSingle(${JSON.stringify(scent).replace(/'/g, "&apos;")})'
        >
          Order
        </button>

        <button
          class="btn btn-ghost"
          type="button"
          onclick='mixSingle(${JSON.stringify(scent).replace(/'/g, "&apos;")})'
        >
          Mix
        </button>
      </div>
    </div>
  `).join("");
}

function orderSingle(scent) {
  sessionStorage.setItem("singleScentOrder", JSON.stringify(scent));
  sessionStorage.removeItem("mixBlend");
  window.location.href = "./order.html";
}

function mixSingle(scent) {
  sessionStorage.setItem("mixPool", JSON.stringify([scent]));
  sessionStorage.removeItem("singleScentOrder");
  window.location.href = "./mix.html?mode=direct";
}

function prettyTags(tags) {
  return tags.slice(0, 3).join(", ");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}