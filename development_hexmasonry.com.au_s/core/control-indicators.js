  function initControlIndicators() {
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function createDotTrailVector({
      container,
      origin,
      x = 0,
      y = 0,
      angle = 0,
      distance = 200,
      duration = 2000,
      wipeDuration = 1200
    }) {
      let startX, startY;
      if (origin) {
        const rect = container.getBoundingClientRect();
        startX = rect.width * origin.x;
        startY = rect.height * origin.y;
      } else {
        startX = x;
        startY = y;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'animation-wrapper';
      wrapper.style.left = `${startX}px`;
      wrapper.style.top = `${startY}px`;
      wrapper.style.transform = `rotate(${angle}deg)`;
      wrapper.style.transformOrigin = '0 0';

      const trail = document.createElement('div');
      trail.className = 'trail';
      trail.style.width = '0px';
      trail.style.left = '0px';
      trail.style.top = '0px';

      const dot = document.createElement('div');
      dot.className = 'dot';
      dot.style.left = '0px';
      dot.style.top = '0px';
      dot.style.transform = 'translate(-50%, -50%)';

      wrapper.appendChild(trail);
      wrapper.appendChild(dot);
      container.appendChild(wrapper);

      const startTime = performance.now();

      function animateMove(time) {
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(t);

        const moveX = distance * eased;
        dot.style.transform = `translate(${moveX - 7}px, -7px)`;
        trail.style.width = `${distance * eased}px`;

        if (t < 1) {
          requestAnimationFrame(animateMove);
        } else {
          setTimeout(() => {
            const wipeStart = performance.now();
            requestAnimationFrame(function animateWipe(wipeTime) {
              const wipeElapsed = wipeTime - wipeStart;
              const wipeT = Math.min(wipeElapsed / wipeDuration, 1);
              const wipeEased = easeOutCubic(wipeT);

              const remaining = distance * (1 - wipeEased);
              const offset = distance - remaining;
              trail.style.width = `${remaining}px`;
              trail.style.left = `${offset}px`;

              if (wipeT < 1) {
                requestAnimationFrame(animateWipe);
              } else {
                dot.style.opacity = '0';
                dot.addEventListener('transitionend', () => {
                  if (wrapper.parentNode === container) {
                    container.removeChild(wrapper);
                  }
                });
              }
            });
          }, 300);
        }
      }

      requestAnimationFrame(animateMove);
    }

    const scene = document.getElementById('scene');
    createDotTrailVector({ container: scene, origin: { x: 0.5035, y: 0.5 }, angle: 45 });
    createDotTrailVector({ container: scene, origin: { x: 0.5, y: 0.5 }, angle: 225 });
    createDotTrailVector({ container: scene, origin: { x: 0.45, y: 0.5 }, angle: 180, distance: 300 });
    createDotTrailVector({ container: scene, origin: { x: 0.45, y: 0.55 }, angle: 180, distance: 300 });
    createDotTrailVector({ container: scene, origin: { x: 0.35, y: 0.45 }, angle: 360, distance: 300 });
  }