(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupPlayer(wrapper) {
    var video = wrapper.querySelector("video[data-stream]");
    var layer = wrapper.querySelector("[data-play-layer]");
    if (!video) {
      return;
    }
    var stream = video.getAttribute("data-stream");
    var started = false;
    var hlsInstance = null;

    function attach() {
      if (started || !stream) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
      } else {
        video.src = stream;
      }
      started = true;
    }

    function play(event) {
      if (event) {
        event.preventDefault();
      }
      attach();
      if (layer) {
        layer.classList.add("is-hidden");
      }
      video.setAttribute("controls", "controls");
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          video.setAttribute("controls", "controls");
        });
      }
    }

    if (layer) {
      layer.addEventListener("click", play);
    }
    video.addEventListener("click", function () {
      if (!started || video.paused) {
        play();
      }
    });
    video.addEventListener("play", function () {
      if (layer) {
        layer.classList.add("is-hidden");
      }
    });
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    });
  }

  ready(function () {
    Array.prototype.slice.call(document.querySelectorAll("[data-player-wrap]")).forEach(setupPlayer);
  });
})();
