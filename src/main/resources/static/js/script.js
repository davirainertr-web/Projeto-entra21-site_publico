const MAIN_SITE_URL = "plataforma/login.html";

document.querySelectorAll("[data-main-link]").forEach(el => {
  el.href = MAIN_SITE_URL;
});

document.querySelectorAll(".avatar[data-name]").forEach(el => {
  const initials = el.dataset.name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  el.textContent = initials;
});

const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document
  .querySelectorAll(".reveal, #stitchDiagram")
  .forEach(el => io.observe(el));