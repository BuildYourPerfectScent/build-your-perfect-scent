document.addEventListener("DOMContentLoaded", async () => {
  const navbarTarget = document.getElementById("navbar");

  if (navbarTarget) {
    const isInPagesFolder = window.location.pathname.includes("/pages/");
    const navbarPath = isInPagesFolder
      ? "../components/navbar.html"
      : "./components/navbar.html";

    try {
      const response = await fetch(navbarPath);
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