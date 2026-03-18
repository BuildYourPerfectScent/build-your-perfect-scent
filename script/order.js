const orderSummary = document.getElementById("orderSummary");
const orderForm = document.getElementById("orderForm");
const orderStatus = document.getElementById("orderStatus");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const orderPageContent = document.getElementById("orderPageContent");
const orderSuccessCard = document.getElementById("orderSuccessCard");
const successSummary = document.getElementById("successSummary");

const orderTypeField = document.getElementById("orderType");
const bottleSizeField = document.getElementById("bottleSize");
const quantityField = document.getElementById("quantity");

const summaryOrderMode = document.getElementById("summaryOrderMode");
const summarySelection = document.getElementById("summarySelection");
const summaryQuizAnswers = document.getElementById("summaryQuizAnswers");
const summaryBlendVerdict = document.getElementById("summaryBlendVerdict");
const summaryBlendStyle = document.getElementById("summaryBlendStyle");
const summaryBlendRatios = document.getElementById("summaryBlendRatios");
const summaryAudiencePreference = document.getElementById("summaryAudiencePreference");
const summaryEstimatedPrice = document.getElementById("summaryEstimatedPrice");

const EMAILJS_PUBLIC_KEY = "ckNjMhy5tH8CWIjy5";
const EMAILJS_SERVICE_ID = "service_5btu3p8";
const EMAILJS_TEMPLATE_ID = "template_j7ie0sq";

const BOTTLE_PRICES = {
  "10 ml": 200,
  "30 ml": 500,
  "50 ml": 800,
  "100 ml": 1500
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.emailjs) {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY,
      blockHeadless: true,
      limitRate: {
        id: "order-form",
        throttle: 10000
      }
    });
  }

  renderOrderSummary();
  bindPricingListeners();
  bindOrderForm();
});

function renderOrderSummary() {
  const singleScentOrder = safeParse(sessionStorage.getItem("singleScentOrder"));
  const mixBlend = safeParse(sessionStorage.getItem("mixBlend"));
  const topResults = safeParse(sessionStorage.getItem("quizTopResults")) || [];
  const audiencePreference = sessionStorage.getItem("quizAudiencePreference") || "Not specified";

  resetSummaryFields();
  summaryAudiencePreference.value = audiencePreference;

  if (mixBlend && Array.isArray(mixBlend.scents) && mixBlend.scents.length) {
    const selectedScents = mixBlend.scents.join(", ");
    const quizAnswers = Array.isArray(mixBlend.answers) ? mixBlend.answers.join(" • ") : "N/A";
    const verdict = mixBlend.analysis?.verdictLabel || "Custom Blend";
    const style = mixBlend.analysis?.styleLine || "Custom blend";

    const ratios = Array.isArray(mixBlend.analysis?.blendItems)
      ? mixBlend.analysis.blendItems.map((item) => `${item.scent} — ${item.pct}%`).join("\n")
      : Array.isArray(mixBlend.blend)
      ? mixBlend.blend.map((item) => `${item.scent} — ${item.pct}%`).join("\n")
      : "N/A";

    orderSummary.innerHTML = `
      <div class="summary-block">
        <h4>Custom Blend</h4>
        <p><strong>Selected Scents:</strong> ${escapeHtml(selectedScents)}</p>
        <p><strong>Mix Quiz Answers:</strong> ${escapeHtml(quizAnswers)}</p>
        <p><strong>Audience Direction:</strong> ${escapeHtml(audiencePreference)}</p>
        <p><strong>Blend Verdict:</strong> ${escapeHtml(verdict)}</p>
        <p><strong>Blend Style:</strong> ${escapeHtml(style)}</p>
      </div>

      <div class="summary-block">
        <h4>Recommended Blend</h4>
        <ul class="summary-list">
          ${ratios
            .split("\n")
            .map((line) => `<li>${escapeHtml(line)}</li>`)
            .join("")}
        </ul>
      </div>

      <div class="summary-block" id="priceSummaryBlock">
        ${buildPriceSummaryHtml()}
      </div>
    `;

    orderTypeField.value = "Custom Blend";
    summaryOrderMode.value = mixBlend.mode || "mix";
    summarySelection.value = selectedScents;
    summaryQuizAnswers.value = quizAnswers;
    summaryBlendVerdict.value = verdict;
    summaryBlendStyle.value = style;
    summaryBlendRatios.value = ratios;

    updateEstimatedPrice();
    return;
  }

  if (singleScentOrder && singleScentOrder.name) {
    orderSummary.innerHTML = `
      <div class="summary-block">
        <h4>Single Scent Order</h4>
        <p><strong>Selected Scent:</strong> ${escapeHtml(singleScentOrder.name)}</p>
        <p><strong>Profile:</strong> ${escapeHtml(prettyTags(singleScentOrder.tags || []))}</p>
        <p><strong>Audience Direction:</strong> ${escapeHtml(audiencePreference)}</p>
        <p><strong>Match Score:</strong> ${escapeHtml(String(singleScentOrder.score || ""))}</p>
      </div>

      <div class="summary-block" id="priceSummaryBlock">
        ${buildPriceSummaryHtml()}
      </div>
    `;

    orderTypeField.value = "Single Scent";
    summaryOrderMode.value = "single";
    summarySelection.value = singleScentOrder.name;
    summaryQuizAnswers.value = "Direct single scent selection";
    summaryBlendVerdict.value = "";
    summaryBlendStyle.value = prettyTags(singleScentOrder.tags || []);
    summaryBlendRatios.value = "";

    updateEstimatedPrice();
    return;
  }

  if (topResults.length) {
    const topPick = topResults[0];

    orderSummary.innerHTML = `
      <div class="summary-block">
        <h4>Single Scent Recommendation</h4>
        <p><strong>Recommended Scent:</strong> ${escapeHtml(topPick.name)}</p>
        <p><strong>Profile:</strong> ${escapeHtml(prettyTags(topPick.tags || []))}</p>
        <p><strong>Audience Direction:</strong> ${escapeHtml(audiencePreference)}</p>
        <p><strong>Match Score:</strong> ${escapeHtml(String(topPick.score || ""))}</p>
      </div>

      <div class="summary-block" id="priceSummaryBlock">
        ${buildPriceSummaryHtml()}
      </div>
    `;

    orderTypeField.value = "Single Scent";
    summaryOrderMode.value = "single";
    summarySelection.value = topPick.name;
    summaryQuizAnswers.value = "Main scent quiz completed";
    summaryBlendVerdict.value = "";
    summaryBlendStyle.value = prettyTags(topPick.tags || []);
    summaryBlendRatios.value = "";

    updateEstimatedPrice();
    return;
  }

  orderSummary.innerHTML = `
    <p class="empty-summary">
      No scent selection found yet. You can still place an order manually below.
    </p>
    <div class="summary-block" id="priceSummaryBlock" style="margin-top: 14px;">
      ${buildPriceSummaryHtml()}
    </div>
  `;

  orderTypeField.value = "";
  summaryOrderMode.value = "manual";
  updateEstimatedPrice();
}

function bindPricingListeners() {
  bottleSizeField.addEventListener("change", updateEstimatedPrice);
  quantityField.addEventListener("input", updateEstimatedPrice);
}

function buildPriceSummaryHtml() {
  return `
    <h4>Pricing</h4>
    <p id="priceSummaryText"><strong>Estimated Price:</strong> Please select a bottle size.</p>
  `;
}

function updateEstimatedPrice() {
  const size = bottleSizeField.value;
  const quantity = Math.max(1, Number(quantityField.value || 1));
  const unitPrice = BOTTLE_PRICES[size];

  const priceSummaryText = document.getElementById("priceSummaryText");
  if (!priceSummaryText) return;

  if (!size) {
    priceSummaryText.innerHTML = `<strong>Estimated Price:</strong> Please select a bottle size.`;
    summaryEstimatedPrice.value = "";
    return;
  }

  if (unitPrice == null) {
    priceSummaryText.innerHTML = `<strong>Estimated Price:</strong> ${escapeHtml(size)} price to be added.`;
    summaryEstimatedPrice.value = `${size} price to be added`;
    return;
  }

  const total = unitPrice * quantity;
  priceSummaryText.innerHTML = `<strong>Estimated Price:</strong> PHP ${formatPrice(total)} (${escapeHtml(size)} × ${quantity})`;
  summaryEstimatedPrice.value = `PHP ${formatPrice(total)}`;
}

function bindOrderForm() {
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (
      EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY" ||
      EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID"
    ) {
      setStatus("Please add your EmailJS public key, service ID, and template ID in order.js.", false);
      return;
    }

    if (!window.emailjs) {
      setStatus("Email service failed to load.", false);
      return;
    }

    submitOrderBtn.disabled = true;
    setStatus("Sending order...", true);

    try {
      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, orderForm);

      showSuccessScreen({
        full_name: document.getElementById("fullName").value.trim(),
        instagram: document.getElementById("instagram").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        order_type: document.getElementById("orderType").value,
        bottle_size: document.getElementById("bottleSize").value,
        quantity: document.getElementById("quantity").value,
        summary_selection: summarySelection.value,
        summary_blend_ratios: summaryBlendRatios.value,
        summary_audience_preference: summaryAudiencePreference.value,
        summary_estimated_price: summaryEstimatedPrice.value
      });

      orderForm.reset();

      sessionStorage.removeItem("singleScentOrder");
      sessionStorage.removeItem("mixBlend");

      resetSummaryFields();
      updateEstimatedPrice();
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setStatus(
        `Failed to send order: ${error?.text || error?.message || JSON.stringify(error)}`,
        false
      );
    } finally {
      submitOrderBtn.disabled = false;
    }
  });
}

function showSuccessScreen(payload) {
  orderPageContent.hidden = true;
  orderSuccessCard.hidden = false;

  successSummary.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(payload.full_name)}</p>
    <p><strong>Instagram:</strong> ${escapeHtml(payload.instagram)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Order Type:</strong> ${escapeHtml(payload.order_type)}</p>
    <p><strong>Bottle Size:</strong> ${escapeHtml(payload.bottle_size)}</p>
    <p><strong>Quantity:</strong> ${escapeHtml(payload.quantity)}</p>
    ${
      payload.summary_audience_preference
        ? `<p><strong>Audience Direction:</strong> ${escapeHtml(payload.summary_audience_preference)}</p>`
        : ""
    }
    ${
      payload.summary_selection
        ? `<p><strong>Selection:</strong> ${escapeHtml(payload.summary_selection)}</p>`
        : ""
    }
    ${
      payload.summary_blend_ratios
        ? `<p><strong>Recommended Blend:</strong><br>${escapeHtml(payload.summary_blend_ratios).replaceAll("\n", "<br>")}</p>`
        : ""
    }
    ${
      payload.summary_estimated_price
        ? `<p><strong>Estimated Price:</strong> ${escapeHtml(payload.summary_estimated_price)}</p>`
        : ""
    }
  `;
}

function resetSummaryFields() {
  summaryOrderMode.value = "";
  summarySelection.value = "";
  summaryQuizAnswers.value = "";
  summaryBlendVerdict.value = "";
  summaryBlendStyle.value = "";
  summaryBlendRatios.value = "";
  summaryAudiencePreference.value = "";
  summaryEstimatedPrice.value = "";
}

function setStatus(message, neutral = false) {
  orderStatus.textContent = message;
  orderStatus.className = "order-status";

  if (!neutral) {
    orderStatus.classList.add("status-error");
  }
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

  return priority.filter((tag) => tags.includes(tag)).slice(0, 6).join(", ");
}

function formatPrice(value) {
  return Number(value).toLocaleString("en-PH");
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}