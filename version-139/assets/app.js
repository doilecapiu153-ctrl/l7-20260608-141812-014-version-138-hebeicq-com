(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var value = Number(dot.getAttribute("data-hero-dot") || "0");
        show(value);
        start();
      });
    });

    var carousel = document.querySelector("[data-hero-carousel]");
    if (carousel) {
      carousel.addEventListener("mouseenter", stop);
      carousel.addEventListener("mouseleave", start);
    }
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function setupPageFilter() {
    var container = document.querySelector("[data-card-container]");
    var input = document.querySelector("[data-page-filter]");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter-year]"));
    if (!container || (!input && !buttons.length)) {
      return;
    }
    var cards = Array.prototype.slice.call(container.querySelectorAll("[data-movie-card]"));
    var activeYear = "";

    function filterCards() {
      var query = normalize(input ? input.value : "");
      cards.forEach(function (card) {
        var search = normalize(card.getAttribute("data-search") || "");
        var year = card.getAttribute("data-year") || "";
        var matchesQuery = !query || search.indexOf(query) !== -1;
        var matchesYear = !activeYear || year === activeYear;
        card.classList.toggle("is-filter-hidden", !(matchesQuery && matchesYear));
      });
    }

    if (input) {
      input.addEventListener("input", filterCards);
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeYear = button.getAttribute("data-filter-year") || "";
        buttons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        filterCards();
      });
    });
  }

  function setupSearchPage() {
    var results = document.querySelector("[data-search-results]");
    var title = document.querySelector("[data-search-title]");
    var subtitle = document.querySelector("[data-search-subtitle]");
    if (!results || !window.SEARCH_MOVIES) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = normalize(params.get("q"));
    var input = document.querySelector(".large-search input[name='q']");
    if (input && query) {
      input.value = params.get("q") || "";
    }
    if (!query) {
      return;
    }
    var matches = window.SEARCH_MOVIES.filter(function (item) {
      return normalize([item.title, item.year, item.region, item.type, item.genre, item.tags].join(" ")).indexOf(query) !== -1;
    }).slice(0, 120);
    if (title) {
      title.textContent = "搜索结果";
    }
    if (subtitle) {
      subtitle.textContent = matches.length ? "以下内容与关键词匹配。" : "暂未找到完全匹配内容，可尝试更换关键词。";
    }
    results.innerHTML = matches.map(function (item) {
      var tags = String(item.tags || "").split("，").slice(0, 3).map(function (tag) {
        return "<span>" + escapeHtml(tag) + "</span>";
      }).join("");
      return "<article class=\"movie-card\">" +
        "<a class=\"poster-link\" href=\"" + escapeAttr(item.url) + "\" aria-label=\"" + escapeAttr(item.title) + "\">" +
        "<img src=\"" + escapeAttr(item.cover) + "\" alt=\"" + escapeAttr(item.title) + "\" loading=\"lazy\">" +
        "<span class=\"poster-badge\">" + escapeHtml(item.year) + "</span>" +
        "</a>" +
        "<div class=\"movie-card-body\">" +
        "<a class=\"movie-title\" href=\"" + escapeAttr(item.url) + "\">" + escapeHtml(item.title) + "</a>" +
        "<div class=\"movie-meta\"><span>" + escapeHtml(item.region) + "</span><span>" + escapeHtml(item.type) + "</span></div>" +
        "<p>" + escapeHtml(item.oneLine) + "</p>" +
        "<div class=\"tag-row\">" + tags + "</div>" +
        "</div>" +
        "</article>";
    }).join("");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;"
      }[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupPageFilter();
    setupSearchPage();
  });
})();
