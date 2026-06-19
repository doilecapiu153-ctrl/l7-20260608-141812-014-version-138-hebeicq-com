(function () {
    'use strict';

    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function initMobileNav() {
        var toggle = document.querySelector('.nav-toggle');
        var nav = document.querySelector('.mobile-nav');

        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener('click', function () {
            var isOpen = nav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }

    function initHeroCarousel() {
        var root = document.querySelector('[data-hero]');

        if (!root) {
            return;
        }

        var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
        var prev = root.querySelector('[data-hero-prev]');
        var next = root.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }

            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('active', dotIndex === current);
            });
        }

        function restart() {
            if (timer) {
                window.clearInterval(timer);
            }
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                restart();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                restart();
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                show(Number(dot.getAttribute('data-hero-dot')) || 0);
                restart();
            });
        });

        show(0);
        restart();
    }

    function createSearchCard(movie) {
        var title = escapeHtml(movie.title || '未命名影片');
        var meta = escapeHtml([movie.year, movie.region, movie.genre].filter(Boolean).join(' · '));
        var url = escapeHtml(movie.url || '#');
        var cover = escapeHtml(movie.cover || '');

        return [
            '<a class="search-result-card" href="', url, '">',
            '<img src="', cover, '" alt="', title, '" loading="lazy">',
            '<span><strong>', title, '</strong><small>', meta, '</small></span>',
            '</a>'
        ].join('');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function initGlobalSearch() {
        var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-search-box]'));
        var index = window.MOVIE_INDEX || [];

        inputs.forEach(function (input) {
            var targetId = input.getAttribute('data-search-target');
            var target = targetId ? document.getElementById(targetId) : null;

            if (!target) {
                return;
            }

            input.addEventListener('input', function () {
                var query = input.value.trim().toLowerCase();

                if (!query) {
                    target.classList.remove('open');
                    target.innerHTML = '';
                    return;
                }

                var results = index.filter(function (movie) {
                    return (movie.search || '').toLowerCase().indexOf(query) !== -1;
                }).slice(0, 24);

                if (!results.length) {
                    target.classList.add('open');
                    target.innerHTML = '<p class="empty-result">没有找到匹配影片。</p>';
                    return;
                }

                target.classList.add('open');
                target.innerHTML = results.map(createSearchCard).join('');
            });
        });
    }

    function initCardFilters() {
        var scopes = Array.prototype.slice.call(document.querySelectorAll('[data-filter-scope]'));

        scopes.forEach(function (scope) {
            var buttons = Array.prototype.slice.call(scope.querySelectorAll('[data-filter-value]'));
            var search = scope.querySelector('[data-card-search]');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('.js-filter-card'));
            var activeValue = 'all';

            function apply() {
                var query = search ? search.value.trim().toLowerCase() : '';

                cards.forEach(function (card) {
                    var text = (card.getAttribute('data-filter-text') || '').toLowerCase();
                    var category = (card.getAttribute('data-category') || '').toLowerCase();
                    var matchesQuery = !query || text.indexOf(query) !== -1;
                    var matchesFilter = activeValue === 'all' || text.indexOf(activeValue) !== -1 || category === activeValue;
                    card.classList.toggle('is-filter-hidden', !(matchesQuery && matchesFilter));
                });
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    activeValue = (button.getAttribute('data-filter-value') || 'all').toLowerCase();
                    buttons.forEach(function (item) {
                        item.classList.toggle('active', item === button);
                    });
                    apply();
                });
            });

            if (search) {
                search.addEventListener('input', apply);
            }
        });
    }

    function initPlayers() {
        var players = Array.prototype.slice.call(document.querySelectorAll('.js-player'));

        players.forEach(function (player) {
            var video = player.querySelector('video');
            var button = player.querySelector('.player-start');
            var status = player.querySelector('.player-status');
            var source = player.getAttribute('data-video-url');
            var hlsInstance = null;

            if (!video || !button || !source) {
                return;
            }

            function setStatus(message) {
                if (status) {
                    status.textContent = message || '';
                }
            }

            function playVideo() {
                var playPromise = video.play();

                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () {
                        setStatus('浏览器阻止了自动播放，请再次点击视频播放。');
                    });
                }
            }

            button.addEventListener('click', function () {
                button.classList.add('is-hidden');
                button.disabled = true;
                video.controls = true;
                setStatus('正在加载播放源...');

                if (window.Hls && window.Hls.isSupported()) {
                    hlsInstance = new window.Hls({
                        enableWorker: true,
                        lowLatencyMode: true
                    });
                    hlsInstance.loadSource(source);
                    hlsInstance.attachMedia(video);
                    hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                        setStatus('');
                        playVideo();
                    });
                    hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
                        if (!data || !data.fatal) {
                            return;
                        }

                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            setStatus('网络错误，正在重新加载播放源...');
                            hlsInstance.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            setStatus('媒体错误，正在尝试恢复播放...');
                            hlsInstance.recoverMediaError();
                        } else {
                            setStatus('播放器错误，请刷新页面后重试。');
                            hlsInstance.destroy();
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                    video.addEventListener('loadedmetadata', function () {
                        setStatus('');
                        playVideo();
                    }, { once: true });
                } else {
                    setStatus('当前浏览器不支持 HLS 播放，请更换现代浏览器。');
                }
            });

            window.addEventListener('beforeunload', function () {
                if (hlsInstance) {
                    hlsInstance.destroy();
                }
            });
        });
    }

    ready(function () {
        initMobileNav();
        initHeroCarousel();
        initGlobalSearch();
        initCardFilters();
        initPlayers();
    });
}());
