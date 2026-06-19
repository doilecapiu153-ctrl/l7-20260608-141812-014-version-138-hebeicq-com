import { H as Hls } from './hls-vendor-dru42stk.js';

const onReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

const formatViews = (value) => {
  const number = Number(value) || 0;
  if (number >= 10000) {
    return `${(number / 10000).toFixed(1)}万`;
  }
  return String(number);
};

const escapeHTML = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const buildCard = (movie) => `
  <a class="movie-card" href="${escapeHTML(movie.url)}" data-movie-card>
    <div class="movie-poster">
      <img src="${escapeHTML(movie.image)}" alt="${escapeHTML(movie.title)}封面" loading="lazy">
      <span class="poster-badge">${escapeHTML(movie.primaryGenre)}</span>
      <span class="poster-duration">${escapeHTML(movie.duration)}</span>
    </div>
    <div class="movie-info">
      <h3>${escapeHTML(movie.title)}</h3>
      <p>${escapeHTML(movie.description)}</p>
      <div class="movie-meta">
        <span>${escapeHTML(movie.region)}</span>
        <span>${escapeHTML(movie.year)}</span>
        <span>${formatViews(movie.views)}观看</span>
      </div>
    </div>
  </a>`;

const initImages = () => {
  document.querySelectorAll('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.classList.add('image-missing');
    }, { once: true });
  });
};

const initMobileMenu = () => {
  const button = document.querySelector('.menu-toggle');
  const panel = document.querySelector('.mobile-panel');

  if (!button || !panel) {
    return;
  }

  button.addEventListener('click', () => {
    const isOpen = panel.hasAttribute('hidden') === false;
    if (isOpen) {
      panel.setAttribute('hidden', '');
      button.setAttribute('aria-expanded', 'false');
    } else {
      panel.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
    }
  });
};

const initHeroCarousel = () => {
  const carousel = document.querySelector('[data-hero-carousel]');
  if (!carousel) {
    return;
  }

  const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
  const dots = Array.from(carousel.querySelectorAll('[data-hero-dot]'));
  let current = 0;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
    });
  };

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => show(index));
  });

  if (slides.length > 1) {
    window.setInterval(() => show(current + 1), 5000);
  }
};

const initFilters = () => {
  document.querySelectorAll('[data-filter-panel]').forEach((panel) => {
    const input = panel.querySelector('[data-filter-input]');
    const region = panel.querySelector('[data-filter-region]');
    const year = panel.querySelector('[data-filter-year]');
    const count = panel.querySelector('[data-filter-count]');
    const section = panel.closest('section');
    const grid = section ? section.querySelector('[data-filter-grid]') : null;
    const cards = grid ? Array.from(grid.querySelectorAll('[data-movie-card]')) : [];

    const apply = () => {
      const keyword = (input?.value || '').trim().toLowerCase();
      const selectedRegion = region?.value || '';
      const selectedYear = year?.value || '';
      let visible = 0;

      cards.forEach((card) => {
        const title = (card.dataset.title || '').toLowerCase();
        const genre = (card.dataset.genre || '').toLowerCase();
        const cardRegion = card.dataset.region || '';
        const cardYear = card.dataset.year || '';
        const matchesKeyword = !keyword || title.includes(keyword) || genre.includes(keyword);
        const matchesRegion = !selectedRegion || cardRegion === selectedRegion;
        const matchesYear = !selectedYear || cardYear === selectedYear;
        const shouldShow = matchesKeyword && matchesRegion && matchesYear;

        card.hidden = !shouldShow;
        if (shouldShow) {
          visible += 1;
        }
      });

      if (count) {
        count.textContent = String(visible);
      }
    };

    [input, region, year].forEach((element) => {
      if (element) {
        element.addEventListener('input', apply);
        element.addEventListener('change', apply);
      }
    });
  });
};

const initSearchPage = () => {
  const resultContainer = document.querySelector('[data-search-results]');
  if (!resultContainer || !Array.isArray(window.MOVIE_INDEX)) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const query = (params.get('q') || '').trim();
  const input = document.querySelector('[data-search-page-input]');
  const summary = document.querySelector('[data-search-summary]');
  const empty = document.querySelector('[data-search-empty]');

  if (input) {
    input.value = query;
  }

  if (!query) {
    if (summary) {
      summary.textContent = '等待输入关键词';
    }
    return;
  }

  const lowered = query.toLowerCase();
  const matches = window.MOVIE_INDEX.filter((movie) => {
    const text = [
      movie.title,
      movie.description,
      movie.region,
      movie.type,
      movie.year,
      movie.genre,
      movie.category,
      ...(movie.tags || []),
    ].join(' ').toLowerCase();

    return text.includes(lowered);
  });

  if (summary) {
    summary.textContent = `“${query}” 找到 ${matches.length} 个结果`;
  }

  if (matches.length === 0) {
    if (empty) {
      empty.hidden = false;
    }
    resultContainer.innerHTML = '';
    return;
  }

  if (empty) {
    empty.hidden = true;
  }
  resultContainer.innerHTML = matches.slice(0, 120).map(buildCard).join('');
  initImages();
};

const initPlayers = () => {
  document.querySelectorAll('[data-player]').forEach((player) => {
    const video = player.querySelector('[data-hls-player]');
    const overlay = player.querySelector('[data-play-overlay]');
    const status = player.querySelector('[data-player-status]');

    if (!video) {
      return;
    }

    const source = video.dataset.src;
    const setStatus = (message) => {
      if (status) {
        status.textContent = message;
      }
    };

    if (source) {
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setStatus('视频已就绪，点击播放');
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data && data.fatal) {
            setStatus('视频加载失败，请刷新重试');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('视频已就绪，点击播放');
      } else {
        setStatus('当前浏览器不支持 HLS 播放，请更换浏览器');
      }
    }

    const play = async () => {
      try {
        await video.play();
        player.classList.add('is-playing');
        setStatus('正在播放');
      } catch (error) {
        setStatus('浏览器阻止了自动播放，请再次点击播放按钮');
      }
    };

    if (overlay) {
      overlay.addEventListener('click', play);
    }

    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', () => {
      player.classList.add('is-playing');
      setStatus('正在播放');
    });

    video.addEventListener('pause', () => {
      player.classList.remove('is-playing');
      setStatus('已暂停，点击继续播放');
    });
  });
};

const initScrollToPlayer = () => {
  document.querySelectorAll('[data-scroll-player]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const player = document.querySelector('[data-player]');
      if (player) {
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
};

onReady(() => {
  initImages();
  initMobileMenu();
  initHeroCarousel();
  initFilters();
  initSearchPage();
  initPlayers();
  initScrollToPlayer();
});
