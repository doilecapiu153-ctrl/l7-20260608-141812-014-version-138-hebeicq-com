import { H as Hls } from "./hls-vendor.js";

const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

ready(() => {
  setupMobileMenu();
  setupHero();
  setupPlayers();
  setupSearch();
});

function setupMobileMenu() {
  const button = document.querySelector("[data-mobile-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");
  if (!button || !nav) {
    return;
  }
  button.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

function setupHero() {
  const slides = Array.from(document.querySelectorAll("[data-hero-slide]"));
  const dots = Array.from(document.querySelectorAll("[data-hero-dot]"));
  if (slides.length < 2) {
    return;
  }
  let current = 0;
  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("active", slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === current);
    });
  };
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      show(Number(dot.dataset.heroDot || 0));
    });
  });
  window.setInterval(() => {
    show(current + 1);
  }, 5200);
}

function setupPlayers() {
  const videos = Array.from(document.querySelectorAll("video[data-stream]"));
  videos.forEach((video) => {
    const stream = video.getAttribute("data-stream");
    const box = video.closest(".player-box");
    const cover = box ? box.querySelector("[data-play-cover]") : null;
    let attached = false;

    const attach = () => {
      if (!stream || attached) {
        return;
      }
      attached = true;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
    };

    attach();

    if (cover) {
      cover.addEventListener("click", async () => {
        attach();
        cover.classList.add("is-hidden");
        try {
          await video.play();
        } catch (error) {
          video.controls = true;
        }
      });
    }

    video.addEventListener("play", () => {
      if (cover) {
        cover.classList.add("is-hidden");
      }
    });
  });
}

function setupSearch() {
  const form = document.querySelector("[data-search-form]");
  const results = document.querySelector("[data-search-results]");
  const status = document.querySelector("[data-search-status]");
  if (!form || !results || !window.SEARCH_INDEX) {
    return;
  }

  const input = form.querySelector("[data-search-input]");
  const type = form.querySelector("[data-search-type]");
  const year = form.querySelector("[data-search-year]");
  const params = new URLSearchParams(window.location.search);
  const queryFromUrl = params.get("q") || "";

  if (input && queryFromUrl) {
    input.value = queryFromUrl;
  }

  const escapeHTML = (value) => String(value || "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;"
  }[char]));

  const render = (items) => {
    const limited = items.slice(0, 80);
    if (status) {
      status.textContent = limited.length ? `显示 ${limited.length} 条匹配内容` : "没有找到匹配内容";
    }
    results.innerHTML = limited.map((movie) => `
<article class="movie-card">
  <a class="poster-link" href="${escapeHTML(movie.url)}" aria-label="${escapeHTML(movie.title)}">
    <img class="movie-poster" src="./${escapeHTML(movie.cover)}" alt="${escapeHTML(movie.title)}" loading="lazy">
    <span class="poster-year">${escapeHTML(movie.year)}</span>
  </a>
  <div class="movie-card-body">
    <div class="movie-meta-line">
      <span>${escapeHTML(movie.region)}</span>
      <span>${escapeHTML(movie.type)}</span>
    </div>
    <h2><a href="${escapeHTML(movie.url)}">${escapeHTML(movie.title)}</a></h2>
    <p>${escapeHTML(movie.oneLine)}</p>
    <div class="tag-row">
      <span>${escapeHTML(movie.category)}</span>
      <span>${escapeHTML(movie.genre)}</span>
    </div>
  </div>
</article>`).join("");
  };

  const search = () => {
    const keyword = input ? input.value.trim().toLowerCase() : "";
    const typeValue = type ? type.value : "";
    const yearValue = year ? year.value : "";
    const matched = window.SEARCH_INDEX.filter((movie) => {
      const haystack = [
        movie.title,
        movie.region,
        movie.type,
        movie.year,
        movie.genre,
        movie.tags,
        movie.category,
        movie.oneLine
      ].join(" ").toLowerCase();
      const keywordOk = !keyword || haystack.includes(keyword);
      const typeOk = !typeValue || movie.type === typeValue;
      const yearOk = !yearValue || String(movie.year) === yearValue;
      return keywordOk && typeOk && yearOk;
    }).sort((a, b) => b.score - a.score);
    render(matched);
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    search();
  });

  [input, type, year].forEach((element) => {
    if (element) {
      element.addEventListener("input", search);
      element.addEventListener("change", search);
    }
  });

  if (queryFromUrl) {
    search();
  }
}
