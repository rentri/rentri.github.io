
/* pfp.js — reusable animated ASCII portrait effect */

const CHARACTERS = " _.,-=+:;cba!?0123456789$W#@";
const FONT = '"Geist Mono", ui-monospace, SFMono-Regular, monospace';
const FRAME_INTERVAL = 1000 / 24;
const INTRO_DURATION = 1600;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const smoothstep = (min, max, value) => {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};

const noise = (x, y) =>
  Math.sin(x * 1.9 + y) * 0.55 +
  Math.sin(x * 3.7 - y * 1.6 + 1.7) * 0.3 +
  Math.sin(x * 7.1 + y * 2.3 + 4.1);

function createRenderer(canvas, sourceImage, options = {}) {
  const ctx = canvas.getContext("2d");
  const container = canvas.parentElement;

  if (!ctx || !container || !sourceImage) return () => {};

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const image = new Image();
  image.crossOrigin = "anonymous";

  let destroyed = false;
  let frame = 0;
  let lastFrame = 0;
  let startTime = -1;
  let columns = 0;
  let rows = 0;
  let cellWidth = 0;
  let cellHeight = 0;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let sampleWidth = 0;
  let sampleHeight = 0;
  let brightness = new Float32Array(0);
  let highlights = new Float32Array(0);
  let highlightX = 0;
  let highlightY = 0;
  let foreground = "#d9e2ff";
  let eyeColor = "#75a7ff";
  let blinkStart = 0;
  let blinkAgain = false;

  const pointer = { x: 0, y: 0, time: -Infinity };
  const movement = { x: 0, y: 0 };

  function updateColors() {
    const styles = getComputedStyle(document.documentElement);

    foreground =
      options.foreground ||
      styles.getPropertyValue("--portrait-fg").trim() ||
      "#d9e2ff";

    eyeColor =
      options.eye ||
      styles.getPropertyValue("--portrait-eye").trim() ||
      "#75a7ff";
  }

  function sample(data, x, y) {
    x -= 0.5;
    y -= 0.5;

    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const x0 = clamp(fx, 0, sampleWidth - 1);
    const y0 = clamp(fy, 0, sampleHeight - 1);
    const x1 = clamp(x0 + 1, 0, sampleWidth - 1);
    const y1 = clamp(y0 + 1, 0, sampleHeight - 1);
    const tx = clamp(x - fx, 0, 1);
    const ty = clamp(y - fy, 0, 1);

    const a = data[y0 * sampleWidth + x0];
    const b = data[y1 * sampleWidth + x0];
    const c = data[y0 * sampleWidth + x1];
    const d = data[y1 * sampleWidth + x1];

    return (a + (b - a) * tx) * (1 - ty) +
      (c + (d - c) * tx) * ty;
  }

  function prepareImage() {
    sampleWidth = Math.max(1, columns * 2);
    sampleHeight = Math.max(1, rows * 2);

    const buffer = document.createElement("canvas");
    buffer.width = sampleWidth;
    buffer.height = sampleHeight;

    const bufferCtx = buffer.getContext("2d", {
      willReadFrequently: true
    });

    if (!bufferCtx) return false;

    bufferCtx.imageSmoothingQuality = "high";
    bufferCtx.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    let pixels;

    try {
      pixels = bufferCtx.getImageData(
        0, 0, sampleWidth, sampleHeight
      ).data;
    } catch (error) {
      console.error(
        "ASCII portrait: cannot read image pixels. Check image CORS.",
        error
      );
      return false;
    }

    brightness = new Float32Array(sampleWidth * sampleHeight);
    highlights = new Float32Array(sampleWidth * sampleHeight);

    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let i = 0; i < sampleWidth * sampleHeight; i++) {
      const r = pixels[i * 4] / 255;
      const g = pixels[i * 4 + 1] / 255;
      const b = pixels[i * 4 + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (saturation > 0.85 && max > 0.82) {
        highlights[i] = 1;
        brightness[i] = 0.1;
        sumX += (i % sampleWidth) + 0.5;
        sumY += Math.floor(i / sampleWidth) + 0.5;
        count++;
      } else {
        brightness[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
    }

    highlightX = count ? sumX / count : sampleWidth / 2;
    highlightY = count ? sumY / count : sampleHeight / 2;

    return true;
  }

  function resize() {
    const rect = container.getBoundingClientRect();

    if (!rect.width || !rect.height) return false;

    width = rect.width;
    height = rect.height;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);

    columns = Math.round(clamp(width / 4.4, 40, 88));
    cellWidth = width / columns;
    rows = Math.max(1, Math.round(height / (cellWidth * 2)));
    cellHeight = height / rows;

    return prepareImage();
  }

  function blink(time) {
    if (reducedMotion) return 0;

    if (time >= blinkStart + 520) {
      blinkAgain = Math.random() < 0.22;
      blinkStart = time + 2600 + Math.random() * 4200;
    }

    const curve = value => {
      if (value < 0 || value > 230) return 0;
      if (value < 70) return value / 70;
      if (value < 110) return 1;
      return 1 - (value - 110) / 120;
    };

    return Math.max(
      curve(time - blinkStart),
      blinkAgain ? curve(time - blinkStart - 290) : 0
    );
  }

  function updatePointer(time) {
    let targetX = 0;
    let targetY = 0;

    if (!reducedMotion && time - pointer.time < 4000) {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + (highlightX / sampleWidth) * width;
      const centerY = rect.top + (highlightY / sampleHeight) * height;

      targetX = clamp(
        (pointer.x - centerX) / (window.innerWidth * 0.35),
        -1,
        1
      );

      targetY = clamp(
        (pointer.y - centerY) / (window.innerHeight * 0.45),
        -1,
        1
      );
    }

    movement.x += (targetX * 2.4 - movement.x) * 0.18;
    movement.y += (targetY * 1.2 - movement.y) * 0.18;
  }

  function render(time) {
    const elapsed = reducedMotion ? 0 : (time - startTime) / 1000;

    const intro = reducedMotion
      ? 1
      : 1 - Math.pow(
          1 - clamp((time - startTime) / INTRO_DURATION, 0, 1),
          3
        );

    const blinkScale = 1 - blink(time) * 0.94;

    updatePointer(time);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.font = `500 ${(cellWidth / 0.6).toFixed(2)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = foreground;

    const eyePixels = [];

    for (let row = 0; row < rows; row++) {
      const y = (row + 0.5) * 2;
      const v = y / sampleHeight;
      const wave = Math.pow(Math.max(0, 1 - v * 1.6), 2) * 2.2;

      for (let col = 0; col < columns; col++) {
        const x = (col + 0.5) * 2;
        const u = x / sampleWidth;
        const radius = Math.hypot(u - 0.5, v - 0.5) * 2;

        if (radius >= 1) continue;

        const edge = 1 - smoothstep(0.84, 1, radius);

        const eye = blinkScale > 0.1
          ? sample(
              highlights,
              x - movement.x,
              highlightY +
                (y - movement.y - highlightY) / blinkScale
            )
          : 0;

        if (eye > 0.45) {
          eyePixels.push(col, row, eye * edge);
          continue;
        }

        const wobbleX =
          wave * noise(u * 6, v * 5 + elapsed * 2.2);

        const wobbleY =
          wave * 0.5 * noise(u * 5 + 3, v * 6 + elapsed * 2.8);

        const value = sample(
          brightness,
          x + wobbleX,
          y + wobbleY
        );

        let amount = smoothstep(0.18, 0.92, value);

        if (amount < 0.04) continue;

        amount = clamp(
          amount + 0.05 * noise(
            col * 0.35 + elapsed * 0.6,
            row * 0.5 - elapsed * 0.4
          ),
          0,
          1
        );

        amount *= intro;

        const character =
          CHARACTERS[Math.round(amount * (CHARACTERS.length - 1))];

        if (character !== " ") {
          ctx.globalAlpha = (0.1 + 0.8 * amount * amount) * edge;
          ctx.fillText(
            character,
            (col + 0.5) * cellWidth,
            (row + 0.5) * cellHeight
          );
        }
      }
    }

    ctx.fillStyle = eyeColor;
    ctx.shadowColor = eyeColor;
    ctx.shadowBlur = cellWidth * 1.6;

    for (let i = 0; i < eyePixels.length; i += 3) {
      ctx.globalAlpha = eyePixels[i + 2] * intro;

      ctx.fillText(
        eyePixels[i + 2] > 0.75 ? "@" : "#",
        (eyePixels[i] + 0.5) * cellWidth,
        (eyePixels[i + 1] + 0.5) * cellHeight
      );
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  function tick(time) {
    frame = 0;

    if (destroyed || !visible || document.hidden) return;

    if (startTime < 0) startTime = time;

    if (time - lastFrame >= FRAME_INTERVAL) {
      lastFrame = time;
      render(time);
    }

    if (!reducedMotion) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (destroyed) return;

    if (frame) cancelAnimationFrame(frame);

    frame = 0;
    lastFrame = 0;

    if (visible && !document.hidden) {
      frame = requestAnimationFrame(tick);
    }
  }

  function onPointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.time = performance.now();
  }

  function onPointerDown() {
    blinkStart = performance.now();
    blinkAgain = false;
  }

  function onResize() {
    updateColors();
    if (resize()) schedule();
  }

  const resizeObserver = new ResizeObserver(onResize);

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });

  const mutationObserver = new MutationObserver(() => {
    updateColors();
    schedule();
  });

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  container.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("visibilitychange", schedule);
  resizeObserver.observe(container);
  intersectionObserver.observe(container);

  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "style", "class"]
  });

  async function load() {
    try {
      image.src = sourceImage.currentSrc || sourceImage.src;

      if (typeof image.decode === "function") {
        await image.decode();
      } else {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
      }

      if (destroyed) return;

      updateColors();

      if (resize()) {
        blinkStart = performance.now() + 2200;
        schedule();
        statusFor(container, "ASCII effect active");
      }
    } catch (error) {
      if (!destroyed) {
        console.error("ASCII portrait failed to initialize:", error);
        statusFor(container, "ASCII effect failed; see browser console.");
      }
    }
  }

  load();

  return () => {
    destroyed = true;

    if (frame) cancelAnimationFrame(frame);

    window.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("visibilitychange", schedule);

    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    mutationObserver.disconnect();
  };
}

function statusFor(container, message) {
  const status = container.querySelector("[data-pfp-status]");
  if (status) status.textContent = message;
}

const pfpInstances = new Map();


function mountPfp(container, options = {}) {
  if (pfpInstances.has(container)) return;

  const img = container.querySelector("img");

  if (!img) {
    console.warn("PFP: no image found inside", container);
    return;
  }

  // Never show the source image, even while loading.
  img.style.visibility = "hidden";

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }

  container.style.overflow = "hidden";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    display: "block",
    pointerEvents: "none",
    zIndex: "1"
  });

  container.appendChild(canvas);

  let started = false;
  let failed = false;

  function fail(error) {
    if (failed || started) return;
    failed = true;

    // Keep both the image and broken-image indicator hidden.
    canvas.remove();

    if (error) {
      console.error("ASCII portrait initialization failed:", error);
    }

    statusFor(container, "");
  }

  function start() {
    if (started || failed) return;

    if (!img.naturalWidth || !img.naturalHeight) {
      fail(new Error("Portrait image has no usable dimensions."));
      return;
    }

    started = true;

    try {
      const cleanup = createRenderer(canvas, img, options);

      pfpInstances.set(container, {
        cleanup,
        img,
        canvas
      });
    } catch (error) {
      started = false;
      fail(error);
    }
  }

  img.addEventListener("load", start, { once: true });
  img.addEventListener("error", () => fail(), { once: true });

  if (img.complete) {
    if (img.naturalWidth > 0) {
      start();
    } else {
      // A cached image may already have failed.
      fail();
    }
  }
}


function initPfpAscii(options = {}) {
  document.querySelectorAll(options.selector || ".pfp").forEach(container => {
    mountPfp(container, options);
  });
}

window.initPfpAscii = initPfpAscii;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initPfpAscii());
} else {
  initPfpAscii();
}
