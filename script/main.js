document.addEventListener("DOMContentLoaded", async () => {
  const navbarTarget = document.getElementById("navbar");

  if (navbarTarget) {
    try {
      const response = await fetch("/build-your-perfect-scent/components/navbar.html");
      const html = await response.text();
      navbarTarget.innerHTML = html;
    } catch (error) {
      console.error("Failed to load navbar:", error);
    }
  }

  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});