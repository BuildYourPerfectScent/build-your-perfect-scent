const scentsGrid = document.getElementById("scentsGrid");
const familyCards = document.querySelectorAll(".family-card");
const audienceFilter = document.getElementById("audienceFilter");
const searchInput = document.getElementById("searchInput");

let scents = [];
let filteredScents = [];
let selectedFamily = "all";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("../data/scents.json", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    scents = data.scents || [];
    filteredScents = [...scents];
    renderScents(filteredScents);

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

    scentsGrid.addEventListener("click", handleGridClick);
  } catch (error) {
    console.error("Failed to load scents:", error);
    scentsGrid.innerHTML = `
      <div class="empty-state">
        Failed to load scents. Please refresh the page.
      </div>
    `;
  }
});

function applyFilters() {
  let list = [...scents];
  const audience = audienceFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  if (selectedFamily !== "all") {
    list = list.filter((scent) => Array.isArray(scent.tags) && scent.tags.includes(selectedFamily));
  }

  if (audience !== "all") {
    list = list.filter((scent) => (scent.audience || "Unisex") === audience);
  }

  if (search) {
    list = list.filter((scent) => scent.name.toLowerCase().includes(search));
  }

  filteredScents = list;
  renderScents(filteredScents);
}

function renderScents(list) {
  if (!list.length) {
    scentsGrid.innerHTML = `
      <div class="empty-state">
        No scents found for your current filters.
      </div>
    `;
    return;
  }

  scentsGrid.innerHTML = list
    .map((scent, index) => `
      <div class="scent-card">
        <h3 class="scent-name">${escapeHtml(scent.name)}</h3>
        <p class="scent-meta">${escapeHtml(prettyTags(scent.tags || []))}</p>
        <span class="scent-audience">${escapeHtml(scent.audience || "Unisex")}</span>

        <div class="scent-actions">
          <button
            class="btn btn-primary explore-order-btn"
            type="button"
            data-index="${index}"
          >
            Order
          </button>

          <button
            class="btn btn-ghost explore-mix-btn"
            type="button"
            data-index="${index}"
          >
            Mix
          </button>
        </div>
      </div>
    `)
    .join("");
}

function handleGridClick(event) {
  const orderBtn = event.target.closest(".explore-order-btn");
  const mixBtn = event.target.closest(".explore-mix-btn");

  if (orderBtn) {
    const scent = filteredScents[Number(orderBtn.dataset.index)];
    if (!scent) return;

    sessionStorage.setItem("singleScentOrder", JSON.stringify(scent));
    sessionStorage.removeItem("mixBlend");
    window.location.href = "./order.html";
    return;
  }

  if (mixBtn) {
    const scent = filteredScents[Number(mixBtn.dataset.index)];
    if (!scent) return;

    sessionStorage.setItem("mixPool", JSON.stringify([scent]));
    sessionStorage.removeItem("singleScentOrder");
    sessionStorage.removeItem("mixBlend");
    window.location.href = "./mix.html?mode=direct";
  }
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