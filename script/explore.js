const scentsGrid = document.getElementById("scentsGrid");
const familyCards = document.querySelectorAll(".family-card");
const audienceFilter = document.getElementById("audienceFilter");
const searchInput = document.getElementById("searchInput");

const scentModal = document.getElementById("scentModal");
const scentModalContent = document.getElementById("scentModalContent");
const closeScentModalBtn = document.getElementById("closeScentModalBtn");

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

    if (closeScentModalBtn) {
      closeScentModalBtn.addEventListener("click", closeScentModal);
    }

    if (scentModal) {
      scentModal.addEventListener("click", (event) => {
        if (event.target.matches("[data-close-modal='true']")) {
          closeScentModal();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && scentModal && !scentModal.hidden) {
        closeScentModal();
      }
    });
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
    list = list.filter((scent) => {
      const haystack = [
        scent.name,
        scent.brand,
        ...(scent.tags || []),
        ...(scent.notes || [])
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
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
            class="btn btn-ghost view-scent-btn"
            type="button"
            data-index="${index}"
          >
            View This Scent
          </button>

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
  const viewBtn = event.target.closest(".view-scent-btn");

  if (viewBtn) {
    const scent = filteredScents[Number(viewBtn.dataset.index)];
    if (!scent) return;
    openScentModal(scent);
    return;
  }

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

function openScentModal(scent) {
  if (!scentModal || !scentModalContent) return;

  const sourceLinks = Array.isArray(scent.sources)
    ? scent.sources
        .map(
          (source) => `
            <li>
              <a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(source.label)}
              </a>
            </li>
          `
        )
        .join("")
    : "";

  scentModalContent.innerHTML = `
    <div class="scent-modal-header">
      <p class="scent-modal-kicker">${escapeHtml(scent.brand || "Brand")}</p>
      <h3 id="scentModalTitle" class="scent-modal-title">${escapeHtml(scent.name)}</h3>
      <p class="scent-modal-subtitle">${escapeHtml(scent.audience || "Unisex")} • Released ${escapeHtml(scent.releaseDate || "N/A")}</p>
    </div>

    <div class="scent-modal-grid">
      <div class="scent-modal-block">
        <h4>Profile</h4>
        <p>${escapeHtml(prettyTags(scent.tags || []))}</p>
      </div>

      <div class="scent-modal-block">
        <h4>Notes</h4>
        <p>${escapeHtml((scent.notes || []).join(", "))}</p>
      </div>

      <div class="scent-modal-block">
        <h4>When it's usually worn</h4>
        <p>${escapeHtml(scent.wearContext || "No wear context added yet.")}</p>
      </div>

      <div class="scent-modal-block">
        <h4>What people usually say</h4>
        <p>${escapeHtml(scent.reviewSummary || "No review summary added yet.")}</p>
      </div>

      ${
        sourceLinks
          ? `
            <div class="scent-modal-block scent-modal-block-full">
              <h4>Sources</h4>
              <ul class="scent-source-list">
                ${sourceLinks}
              </ul>
            </div>
          `
          : ""
      }
    </div>
  `;

  scentModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeScentModal() {
  if (!scentModal) return;
  scentModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function prettyTags(tags) {
  return tags.slice(0, 6).join(", ");
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
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}