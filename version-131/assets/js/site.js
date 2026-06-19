(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var current = 0;
    var timer = null;

    var show = function (index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === current);
      });
    };

    var start = function () {
      if (timer) {
        clearInterval(timer);
      }

      timer = setInterval(function () {
        show(current + 1);
      }, 5000);
    };

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        start();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        start();
      });
    });

    show(0);
    start();
  }

  document.querySelectorAll('[data-scroll-left], [data-scroll-right]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-scroll-left') || button.getAttribute('data-scroll-right');
      var row = document.querySelector('[data-scroll-row="' + key + '"]');
      var dir = button.hasAttribute('data-scroll-left') ? -1 : 1;

      if (row) {
        row.scrollBy({ left: dir * 420, behavior: 'smooth' });
      }
    });
  });

  var filterList = document.querySelector('[data-filter-list]');

  if (filterList) {
    var filterInput = document.querySelector('[data-filter-input]');
    var filterType = document.querySelector('[data-filter-type]');
    var filterYear = document.querySelector('[data-filter-year]');
    var cards = Array.prototype.slice.call(filterList.querySelectorAll('[data-card]'));
    var empty = document.createElement('div');
    empty.className = 'filter-empty';
    empty.textContent = '没有找到匹配的影片';
    empty.hidden = true;
    filterList.appendChild(empty);

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q') || '';

    if (filterInput && q) {
      filterInput.value = q;
    }

    var apply = function () {
      var keyword = filterInput ? filterInput.value.trim().toLowerCase() : '';
      var type = filterType ? filterType.value : '';
      var year = filterYear ? filterYear.value : '';
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-tags') || '',
          card.getAttribute('data-region') || '',
          card.getAttribute('data-type') || '',
          card.getAttribute('data-year') || ''
        ].join(' ').toLowerCase();
        var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
        var matchType = !type || card.getAttribute('data-type') === type;
        var matchYear = !year || card.getAttribute('data-year') === year;
        var showCard = matchKeyword && matchType && matchYear;

        card.hidden = !showCard;

        if (showCard) {
          visibleCount += 1;
        }
      });

      empty.hidden = visibleCount !== 0;
    };

    [filterInput, filterType, filterYear].forEach(function (control) {
      if (control) {
        control.addEventListener('input', apply);
        control.addEventListener('change', apply);
      }
    });

    apply();
  }
})();

function initializePlayer(source) {
  var video = document.getElementById('movie-player');
  var cover = document.querySelector('[data-player-cover]');
  var loaded = false;

  if (!video || !source) {
    return;
  }

  var play = function () {
    if (!loaded) {
      loaded = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls();
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    video.controls = true;

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var promise = video.play();

    if (promise && promise.catch) {
      promise.catch(function () {});
    }
  };

  if (cover) {
    cover.addEventListener('click', play);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      play();
    }
  });
}
