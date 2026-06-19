(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var mobilePanel = document.querySelector('.mobile-panel');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('.hero-slider');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle('is-active', current === activeIndex);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle('is-active', current === activeIndex);
      });
    }

    function startTimer() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(activeIndex - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(activeIndex + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-slide')) || 0);
        startTimer();
      });
    });

    startTimer();
  }

  function searchTextOf(card) {
    return (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
  }

  var params = new URLSearchParams(window.location.search);
  var keyword = (params.get('q') || '').trim().toLowerCase();
  var searchInput = document.querySelector('.large-search input[name="q"]');
  var status = document.querySelector('[data-search-status]');
  var searchCards = Array.prototype.slice.call(document.querySelectorAll('.search-results .search-card'));

  if (searchInput && keyword) {
    searchInput.value = keyword;
  }

  if (searchCards.length) {
    var visible = 0;
    searchCards.forEach(function (card) {
      var match = !keyword || searchTextOf(card).indexOf(keyword) !== -1;
      card.style.display = match ? '' : 'none';
      if (match) {
        visible += 1;
      }
    });
    if (status) {
      status.textContent = keyword ? '正在展示相关影片' : '全部影片';
      if (keyword && visible === 0) {
        status.textContent = '未匹配到相关影片';
      }
    }
  }

  var filterAreas = Array.prototype.slice.call(document.querySelectorAll('[data-filter-area]'));
  filterAreas.forEach(function (area) {
    var buttons = Array.prototype.slice.call(area.querySelectorAll('[data-filter]'));
    var list = area.closest('.page-shell');
    var cards = list ? Array.prototype.slice.call(list.querySelectorAll('.filter-list .search-card')) : [];

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter') || 'all';
        buttons.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });
        cards.forEach(function (card) {
          var match = filter === 'all' || searchTextOf(card).indexOf(filter.toLowerCase()) !== -1;
          card.style.display = match ? '' : 'none';
        });
      });
    });
  });

  var players = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
  players.forEach(function (box) {
    var video = box.querySelector('video');
    var layer = box.querySelector('.play-layer');
    var stream = box.getAttribute('data-stream');

    function playVideo() {
      if (!video || !stream) {
        return;
      }
      if (layer) {
        layer.classList.add('is-hidden');
      }
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        if (!video.src) {
          video.src = stream;
        }
        video.play().catch(function () {});
        return;
      }
      if (window.Hls && window.Hls.isSupported()) {
        if (!video.hlsInstance) {
          var hls = new window.Hls();
          video.hlsInstance = hls;
          hls.loadSource(stream);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.play().catch(function () {});
        }
        return;
      }
      if (!video.src) {
        video.src = stream;
      }
      video.play().catch(function () {});
    }

    if (layer) {
      layer.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        }
      });
    }
  });
})();
