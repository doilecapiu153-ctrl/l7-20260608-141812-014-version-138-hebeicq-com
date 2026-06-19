(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    ready(function () {
        var menuButton = document.querySelector("[data-menu-button]");
        var mobilePanel = document.querySelector("[data-mobile-panel]");

        if (menuButton && mobilePanel) {
            menuButton.addEventListener("click", function () {
                mobilePanel.classList.toggle("open");
            });
        }

        document.querySelectorAll("[data-scroll-left], [data-scroll-right]").forEach(function (button) {
            button.addEventListener("click", function () {
                var key = button.getAttribute("data-scroll-left") || button.getAttribute("data-scroll-right");
                var strip = document.querySelector('[data-scroll-strip="' + key + '"]');
                var direction = button.hasAttribute("data-scroll-left") ? -1 : 1;
                if (strip) {
                    strip.scrollBy({ left: direction * 430, behavior: "smooth" });
                }
            });
        });

        initHero();
        initFilters();
    });

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var previous = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, itemIndex) {
                slide.classList.toggle("active", itemIndex === index);
            });
            dots.forEach(function (dot, itemIndex) {
                dot.classList.toggle("active", itemIndex === index);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        if (previous) {
            previous.addEventListener("click", function () {
                show(index - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                start();
            });
        }

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var grid = document.querySelector("[data-card-grid]");
        if (!grid) {
            return;
        }

        var input = document.querySelector("[data-filter-input]");
        var type = document.querySelector("[data-filter-type]");
        var region = document.querySelector("[data-filter-region]");
        var category = document.querySelector("[data-filter-category]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card], .rank-card"));
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";

        if (input && query) {
            input.value = query;
        }

        function textOf(card) {
            return [
                card.getAttribute("data-title"),
                card.getAttribute("data-tags"),
                card.getAttribute("data-year"),
                card.getAttribute("data-region"),
                card.getAttribute("data-type"),
                card.getAttribute("data-category"),
                card.textContent
            ].join(" ").toLowerCase();
        }

        function apply() {
            var term = input ? input.value.trim().toLowerCase() : "";
            var typeValue = type ? type.value : "";
            var regionValue = region ? region.value : "";
            var categoryValue = category ? category.value : "";

            cards.forEach(function (card) {
                var matchesText = !term || textOf(card).indexOf(term) !== -1;
                var matchesType = !typeValue || (card.getAttribute("data-type") || card.textContent).indexOf(typeValue) !== -1;
                var matchesRegion = !regionValue || (card.getAttribute("data-region") || card.textContent).indexOf(regionValue) !== -1;
                var matchesCategory = !categoryValue || (card.getAttribute("data-category") || card.textContent).indexOf(categoryValue) !== -1;
                card.style.display = matchesText && matchesType && matchesRegion && matchesCategory ? "" : "none";
            });
        }

        [input, type, region, category].forEach(function (control) {
            if (control) {
                control.addEventListener("input", apply);
                control.addEventListener("change", apply);
            }
        });

        apply();
    }

    window.initMoviePlayer = function (source) {
        ready(function () {
            var video = document.querySelector(".movie-video");
            var overlay = document.querySelector(".player-overlay");
            var hls = null;
            var attached = false;

            if (!video || !source) {
                return;
            }

            function attach() {
                if (attached) {
                    return;
                }

                if (video.canPlayType("application/vnd.apple.mpegurl")) {
                    video.src = source;
                    attached = true;
                    return;
                }

                if (window.Hls && window.Hls.isSupported()) {
                    hls = new window.Hls({ enableWorker: true });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    attached = true;
                } else {
                    video.src = source;
                    attached = true;
                }
            }

            function play() {
                attach();
                if (overlay) {
                    overlay.classList.add("hidden");
                }
                var promise = video.play();
                if (promise && typeof promise.catch === "function") {
                    promise.catch(function () {
                        if (overlay) {
                            overlay.classList.remove("hidden");
                        }
                    });
                }
            }

            if (overlay) {
                overlay.addEventListener("click", play);
            }

            video.addEventListener("click", function () {
                if (video.paused) {
                    play();
                }
            });

            video.addEventListener("play", function () {
                if (overlay) {
                    overlay.classList.add("hidden");
                }
            });

            video.addEventListener("ended", function () {
                if (overlay) {
                    overlay.classList.remove("hidden");
                }
            });

            window.addEventListener("beforeunload", function () {
                if (hls) {
                    hls.destroy();
                }
            });
        });
    };
})();
