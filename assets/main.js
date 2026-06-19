(function () {
  var mobileToggle = document.querySelector('.mobile-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.hero-dot'));
  var activeSlide = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    activeSlide = (index + slides.length) % slides.length;

    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('active', slideIndex === activeSlide);
    });

    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === activeSlide);
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      showSlide(index);
    });
  });

  if (slides.length > 1) {
    window.setInterval(function () {
      showSlide(activeSlide + 1);
    }, 5200);
  }

  var searchInput = document.querySelector('[data-search-input]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-title]'));
  var emptyResult = document.querySelector('[data-empty-result]');

  if (searchInput && cards.length) {
    searchInput.addEventListener('input', function () {
      var query = searchInput.value.trim().toLowerCase();
      var visibleCount = 0;

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title') || '',
          card.getAttribute('data-genre') || '',
          card.getAttribute('data-tags') || ''
        ].join(' ').toLowerCase();
        var matched = !query || text.indexOf(query) !== -1;
        card.style.display = matched ? '' : 'none';
        if (matched) {
          visibleCount += 1;
        }
      });

      if (emptyResult) {
        emptyResult.classList.toggle('is-visible', visibleCount === 0);
      }
    });
  }
})();

function initPlayer(videoId, streamUrl) {
  var video = document.getElementById(videoId);

  if (!video || !streamUrl) {
    return;
  }

  var box = video.closest('.player-box');
  var cover = box ? box.querySelector('.player-cover') : null;
  var started = false;

  function bindStream() {
    if (started) {
      return;
    }

    started = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
    } else if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      video._hls = hls;
    } else {
      video.src = streamUrl;
    }
  }

  function playVideo() {
    bindStream();
    video.controls = true;

    if (cover) {
      cover.classList.add('is-hidden');
    }

    var result = video.play();

    if (result && typeof result.catch === 'function') {
      result.catch(function () {
        if (cover) {
          cover.classList.remove('is-hidden');
        }
      });
    }
  }

  if (cover) {
    cover.addEventListener('click', playVideo);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    }
  });
}
