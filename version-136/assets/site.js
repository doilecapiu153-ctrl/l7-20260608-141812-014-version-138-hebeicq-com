(function () {
  var mobileButton = document.querySelector('[data-nav-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');
  if (mobileButton && mobileNav) {
    mobileButton.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var current = 0;
    var timer = null;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function startHero() {
      if (timer) {
        clearInterval(timer);
      }
      timer = setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }

    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(current - 1);
        startHero();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        showSlide(current + 1);
        startHero();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showSlide(i);
        startHero();
      });
    });
    showSlide(0);
    startHero();
  }

  var searchForm = document.querySelector('[data-search-form]');
  if (searchForm) {
    searchForm.addEventListener('submit', function (event) {
      var input = searchForm.querySelector('input[name="q"]');
      if (input && input.value.trim()) {
        event.preventDefault();
        window.location.href = searchForm.getAttribute('action') + '?q=' + encodeURIComponent(input.value.trim());
      }
    });
  }

  var filterInput = document.querySelector('[data-filter-input]');
  if (filterInput) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));

    function runFilter() {
      var value = filterInput.value.trim().toLowerCase();
      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || card.textContent || '').toLowerCase();
        card.classList.toggle('hidden-by-search', value && text.indexOf(value) === -1);
      });
    }

    if (initial) {
      filterInput.value = initial;
    }
    filterInput.addEventListener('input', runFilter);
    runFilter();
  }

  function prepareVideo(video) {
    if (!video || video.getAttribute('data-ready') === '1') {
      return;
    }
    var url = video.getAttribute('data-video');
    if (!url) {
      return;
    }
    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({ enableWorker: true, lowLatencyMode: false });
      hls.loadSource(url);
      hls.attachMedia(video);
      video._hls = hls;
    } else {
      video.src = url;
    }
    video.setAttribute('data-ready', '1');
  }

  function playVideo(card) {
    var video = card.querySelector('video[data-video]');
    if (!video) {
      return;
    }
    prepareVideo(video);
    card.classList.add('player-active');
    var action = video.play();
    if (action && typeof action.catch === 'function') {
      action.catch(function () {});
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player-card]')).forEach(function (card) {
    var button = card.querySelector('[data-play-button]');
    if (button) {
      button.addEventListener('click', function () {
        playVideo(card);
      });
    }
    card.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('video')) {
        return;
      }
      if (card.classList.contains('player-active')) {
        return;
      }
      playVideo(card);
    });
  });
})();
