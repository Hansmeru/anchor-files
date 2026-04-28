const screenshots = Array.from(
  { length: 45 },
  (_, index) => {
    const extension = index < 30 ? "jpg" : "webp";

    return `images/${String(index + 1).padStart(3, "0")}.${extension}`;
  }
);

const slider = document.querySelector(".files-slider");
const dots = document.querySelector(".slide-dots");
const count = document.querySelector(".slide-count");
const previousButton = document.querySelector(".slider-button--prev");
const nextButton = document.querySelector(".slider-button--next");
const unlockPanel = document.querySelector(".unlock-panel");
const zoomOutButton = document.querySelector(".zoom-button--out");
const zoomInButton = document.querySelector(".zoom-button--in");
const zoomResetButton = document.querySelector(".zoom-button--reset");

let activeIndex = 0;
let zoom = 1;
let panX = 0;
let panY = 0;
let dragStartX = 0;
let dragStartY = 0;
let isDragging = false;

const minZoom = 1;
const maxZoom = 4;
const zoomStep = 0.25;

const clampIndex = (index) => Math.max(0, Math.min(index, screenshots.length - 1));
const clampZoom = (value) => Math.max(minZoom, Math.min(maxZoom, value));
const activeImage = () => slider.children[activeIndex]?.querySelector("img");

const clearImageZoom = (image) => {
  if (!image) {
    return;
  }

  image.style.setProperty("--zoom", 1);
  image.style.setProperty("--pan-x", "0px");
  image.style.setProperty("--pan-y", "0px");
  image.classList.remove("is-zoomed");
};

const applyZoom = () => {
  const image = activeImage();

  if (!image) {
    return;
  }

  image.style.setProperty("--zoom", zoom);
  image.style.setProperty("--pan-x", `${panX}px`);
  image.style.setProperty("--pan-y", `${panY}px`);
  image.classList.toggle("is-zoomed", zoom > 1);
  zoomResetButton.textContent = `${Math.round(zoom * 100)}%`;
  zoomOutButton.disabled = zoom <= minZoom;
  zoomInButton.disabled = zoom >= maxZoom;
  document.body.classList.toggle("is-zoomed", zoom > 1);
};

const resetZoom = () => {
  zoom = 1;
  panX = 0;
  panY = 0;
  applyZoom();
};

const setZoom = (value) => {
  const nextZoom = clampZoom(value);

  if (nextZoom === 1) {
    panX = 0;
    panY = 0;
  }

  zoom = nextZoom;
  applyZoom();
};

const updateState = (index) => {
  const nextIndex = clampIndex(index);

  if (nextIndex !== activeIndex) {
    clearImageZoom(activeImage());
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  activeIndex = nextIndex;
  count.textContent = `${activeIndex + 1} / ${screenshots.length}`;

  dots.querySelectorAll("button").forEach((dot, dotIndex) => {
    dot.classList.toggle("is-active", dotIndex === activeIndex);
    dot.setAttribute("aria-current", dotIndex === activeIndex ? "true" : "false");
  });

  previousButton.disabled = activeIndex === 0;
  nextButton.disabled = activeIndex === screenshots.length - 1;
  applyZoom();
};

const scrollToSlide = (index) => {
  const slide = slider.children[clampIndex(index)];

  if (slide) {
    resetZoom();
    slide.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }
};

screenshots.forEach((source, index) => {
  const slide = document.createElement("figure");
  const image = document.createElement("img");
  const dot = document.createElement("button");

  slide.className = "file-slide";
  image.src = source;
  image.alt = `Anchor files screenshot ${index + 1}`;
  image.loading = index < 2 ? "eager" : "lazy";
  image.decoding = "async";

  dot.type = "button";
  dot.setAttribute("aria-label", `Go to screenshot ${index + 1}`);
  dot.addEventListener("click", () => scrollToSlide(index));

  slide.append(image);
  slider.append(slide);
  dots.append(dot);
});

const observer = new IntersectionObserver(
  (entries) => {
    const centered = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (centered) {
      updateState([...slider.children].indexOf(centered.target));
    }
  },
  {
    root: slider,
    threshold: [0.55, 0.7, 0.85]
  }
);

[...slider.children].forEach((slide) => observer.observe(slide));

previousButton.addEventListener("click", () => scrollToSlide(activeIndex - 1));
nextButton.addEventListener("click", () => scrollToSlide(activeIndex + 1));
unlockPanel.addEventListener("click", () => document.body.classList.remove("is-locked"));
zoomOutButton.addEventListener("click", () => setZoom(zoom - zoomStep));
zoomInButton.addEventListener("click", () => setZoom(zoom + zoomStep));
zoomResetButton.addEventListener("click", resetZoom);

slider.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? zoomStep : -zoomStep));
  },
  { passive: false }
);

slider.addEventListener("pointerdown", (event) => {
  if (zoom <= 1 || event.button !== 0) {
    return;
  }

  isDragging = true;
  dragStartX = event.clientX - panX;
  dragStartY = event.clientY - panY;
  slider.setPointerCapture(event.pointerId);
});

slider.addEventListener("pointermove", (event) => {
  if (!isDragging) {
    return;
  }

  panX = event.clientX - dragStartX;
  panY = event.clientY - dragStartY;
  applyZoom();
});

slider.addEventListener("pointerup", () => {
  isDragging = false;
});

slider.addEventListener("pointercancel", () => {
  isDragging = false;
});

slider.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    scrollToSlide(activeIndex - 1);
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    scrollToSlide(activeIndex + 1);
  }

  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    setZoom(zoom + zoomStep);
  }

  if (event.key === "-") {
    event.preventDefault();
    setZoom(zoom - zoomStep);
  }

  if (event.key === "0") {
    event.preventDefault();
    resetZoom();
  }
});

updateState(0);
applyZoom();
