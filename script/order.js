const orderSummary = document.getElementById("orderSummary");
const orderForm = document.getElementById("orderForm");
const orderStatus = document.getElementById("orderStatus");
const submitOrderBtn = document.getElementById("submitOrderBtn");

const orderTypeField = document.getElementById("orderType");

const summaryOrderMode = document.getElementById("summaryOrderMode");
const summarySelection = document.getElementById("summarySelection");
const summaryQuizAnswers = document.getElementById("summaryQuizAnswers");
const summaryBlendVerdict = document.getElementById("summaryBlendVerdict");
const summaryBlendStyle = document.getElementById("summaryBlendStyle");
const summaryBlendRatios = document.getElementById("summaryBlendRatios");

const EMAILJS_PUBLIC_KEY = "olJtS4gyuhMqLH3u2GxdE";
const EMAILJS_SERVICE_ID = "service_h9kaics";
const EMAILJS_TEMPLATE_ID = "template_j7ie0sq";

document.addEventListener("DOMContentLoaded", () => {
  if (window.emailjs) {
    emailjs.init({
      publicKey: EMAILJS_PUBLIC_KEY
    });
  }

  renderOrderSummary();
  bindOrderForm();
});

function renderOrderSummary() {
  const mixBlend = safeParse(sessionStorage.getItem("mixBlend"));
  const topResults = safeParse(sessionStorage.getItem("quizTopResults")) || [];

  if (mixBlend && Array.isArray(mixBlend.scents) && mixBlend.scents.length) {
    const selectedScents = mixBlend.scents.join(", ");
    const quizAnswers = Array.isArray(mixBlend.answers) ? mixBlend.answers.join(" • ") : "N/A";

    const verdict =
      mixBlend.analysis?.verdictLabel ||
      "Custom Blend";

    const style =
      mixBlend.analysis?.styleLine ||
      "Custom blend";

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
    `;

    orderTypeField.value = "Custom Blend";
    summaryOrderMode.value = mixBlend.mode || "mix";
    summarySelection.value = selectedScents;
    summaryQuizAnswers.value = quizAnswers;
    summaryBlendVerdict.value = verdict;
    summaryBlendStyle.value = style;
    summaryBlendRatios.value = ratios;
    return;
  }

  if (topResults.length) {
    const topPick = topResults[0];

    orderSummary.innerHTML = `
      <div class="summary-block">
        <h4>Single Scent Recommendation</h4>
        <p><strong>Recommended Scent:</strong> ${escapeHtml(topPick.name)}</p>
        <p><strong>Profile:</strong> ${escapeHtml(prettyTags(topPick.tags || []))}</p>
        <p><strong>Match Score:</strong> ${escapeHtml(String(topPick.score || ""))}</p>
      </div>
    `;

    orderTypeField.value = "Single Scent";
    summaryOrderMode.value = "single";
    summarySelection.value = topPick.name;
    summaryQuizAnswers.value = "Main scent quiz completed";
    summaryBlendVerdict.value = "";
    summaryBlendStyle.value = prettyTags(topPick.tags || []);
    summaryBlendRatios.value = "";
    return;
  }

  orderSummary.innerHTML = `
    <p class="empty-summary">
      No scent selection found yet. You can still place an order manually below.
    </p>
  `;

  summaryOrderMode.value = "manual";
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

    submitOrderBtn.disabled = true;
    setStatus("Sending order...", true);

    const payload = {
      full_name: document.getElementById("fullName").value.trim(),
      instagram: document.getElementById("instagram").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
      order_type: document.getElementById("orderType").value,
      bottle_size: document.getElementById("bottleSize").value,
      quantity: document.getElementById("quantity").value,
      notes: document.getElementById("notes").value.trim(),

      summary_order_mode: summaryOrderMode.value,
      summary_selection: summarySelection.value,
      summary_quiz_answers: summaryQuizAnswers.value,
      summary_blend_verdict: summaryBlendVerdict.value,
      summary_blend_style: summaryBlendStyle.value,
      summary_blend_ratios: summaryBlendRatios.value
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        payload
      );

      setStatus("Order sent successfully. Please check your email or Instagram for follow-up.", true, true);
      orderForm.reset();

      summaryOrderMode.value = "";
      summarySelection.value = "";
      summaryQuizAnswers.value = "";
      summaryBlendVerdict.value = "";
      summaryBlendStyle.value = "";
      summaryBlendRatios.value = "";
    } catch (error) {
      console.error("EmailJS send failed:", error);
      setStatus("Failed to send order. Please try again.", false);
    } finally {
      submitOrderBtn.disabled = false;
    }
  });
}

function setStatus(message, neutral = false, success = false) {
  orderStatus.textContent = message;
  orderStatus.className = "order-status";

  if (success) {
    orderStatus.classList.add("status-success");
    return;
  }

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