export function initControlIndicators() {
  // 1. Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #gesture-tutorial {
      position: absolute;
      bottom: 5%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      background: transparent;
      border-radius: 12px;
      padding: 1rem 2rem;
      font-family: 'Open Sans', sans-serif;
      color: #555a60;
      pointer-events: none;
      transition: opacity 1s ease;
      max-width: 90vw;
      min-width: 320px;
    }
    #gesture-tutorial.fade-out { opacity: 0; }
    .gesture-step { display: none; flex-direction: column; align-items: center; gap: 1.5rem; opacity: 0; transition: opacity 0.6s ease; }
    .gesture-step.active { display: flex; opacity: 1; }
    .dot-animation-container { position: relative; width: 200px; height: 50px; margin: 0 auto; }
    .animation-wrapper {
      position: absolute;
      pointer-events: none;
    }
    .trail {
      position: absolute;
      height: 4px;
      background: rgba(120,120,120,0.5);
      border-radius: 2px;
      top: 50%;
      transform: translateY(-50%);
    }
    .dot {
      position: absolute;
      width: 14px;
      height: 14px;
      background: rgba(200,60,60,0.7);
      border-radius: 50%;
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
      transition: opacity 0.3s;
    }
    .double-tap-circle {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(0,122,175,0.25);
      transform: translate(-50%, -50%) scale(0.7);
      opacity: 0;
      pointer-events: none;
      animation: double-tap-fade 0.7s ease-out forwards;
    }
    .double-tap-circle.second {
      animation-delay: 0.2s;
    }
    @keyframes double-tap-fade {
      0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7);}
      20% { opacity: 1; transform: translate(-50%, -50%) scale(1);}
      80% { opacity: 1; transform: translate(-50%, -50%) scale(1);}
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.2);}
    }
  `;
  document.head.appendChild(style);


  // 2. Create tutorial container
  const container = document.createElement('div');
  container.id = 'gesture-tutorial';

  // 3. Define gesture steps and their animations
  const gestureSteps = [
    {
      key: 'rotate',
      label: 'Rotate: Drag with one finger',
      animation: (animContainer) => {
        // Single dot trail, horizontal
        createDotTrailVector({
          container: animContainer,
          origin: { x: 0.1, y: 0.5 },
          angle: 0,
          distance: animContainer.offsetWidth * 0.8,
          duration: 1200
        });
      }
    },
    {
      key: 'zoom',
      label: 'Zoom: Double tap',
      animation: (animContainer) => {
        // Two overlapping circles fading in/out
        createDoubleTapAnimation(animContainer);
      }
    },
    {
      key: 'pinch',
      label: 'Pinch: Use two fingers',
      animation: (animContainer) => {
        // Two dots moving away from center
        createDotTrailVector({
          container: animContainer,
          origin: { x: 0.5, y: 0.5 },
          angle: 135,
          distance: animContainer.offsetWidth * 0.35,
          duration: 1200
        });
        createDotTrailVector({
          container: animContainer,
          origin: { x: 0.5, y: 0.5 },
          angle: -45,
          distance: animContainer.offsetWidth * 0.35,
          duration: 1200
        });
      }
    },
    {
      key: 'pan',
      label: 'Pan: Drag with two fingers',
      animation: (animContainer) => {
        // Two parallel lines
        createDotTrailVector({
          container: animContainer,
          origin: { x: 0.1, y: 0.3 },
          angle: 0,
          distance: animContainer.offsetWidth * 0.8,
          duration: 1200
        });
        createDotTrailVector({
          container: animContainer,
          origin: { x: 0.1, y: 0.7 },
          angle: 0,
          distance: animContainer.offsetWidth * 0.8,
          duration: 1200
        });
      }
    }
  ];

  // 4. Build the DOM for steps
  const stepsWrapper = document.createElement('div');
  stepsWrapper.className = 'instruction touch';
  gestureSteps.forEach((step) => {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'gesture-step';
    stepDiv.id = `step-${step.key}`;
    stepDiv.innerHTML = `
      <div>${step.label}</div>
      <div class="dot-animation-container" id="anim-${step.key}"></div>
    `;
    stepsWrapper.appendChild(stepDiv);
  });
  container.appendChild(stepsWrapper);
  document.body.appendChild(container);

  // 5. Dot trail animation function (from your code)
  function createDotTrailVector({
    container,
    origin,
    x = 0,
    y = 0,
    angle = 0,
    distance = 200,
    duration = 1200,
    wipeDuration = 800
  }) {
    // Determine start coordinates
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

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

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

  // 6. Double tap animation
  function createDoubleTapAnimation(container) {
    // First circle
    const circle1 = document.createElement('div');
    circle1.className = 'double-tap-circle';
    container.appendChild(circle1);
    // Second circle (delayed)
    const circle2 = document.createElement('div');
    circle2.className = 'double-tap-circle second';
    container.appendChild(circle2);
    // Remove after animation
    setTimeout(() => {
      if (circle1.parentNode === container) container.removeChild(circle1);
      if (circle2.parentNode === container) container.removeChild(circle2);
    }, 1200);
  }

  // 7. Tutorial logic
  let currentIndex = 0;
  const keys = gestureSteps.map(step => step.key);
  const completed = new Set();
  let lastTap = 0;
  let pinchStartDist = 0;

  let animationInterval = null;

  function showStep(index) {
    keys.forEach(key => {
      const el = document.getElementById(`step-${key}`);
      if (el) el.classList.remove('active');
    });
    const currentEl = document.getElementById(`step-${keys[index]}`);
    if (currentEl) {
      currentEl.classList.add('active');
      const animContainer = document.getElementById(`anim-${keys[index]}`);
      animContainer.innerHTML = ''; // Clear previous

      // Clear any previous interval
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }

      // Run the animation immediately
      gestureSteps[index].animation(animContainer);

      // Repeat the animation every 1.5s (adjust if needed)
      animationInterval = setInterval(() => {
        animContainer.innerHTML = '';
        gestureSteps[index].animation(animContainer);
      }, 1500);
    }
  }

  function nextStep() {
    const currentEl = document.getElementById(`step-${keys[currentIndex]}`);
    if (currentEl) currentEl.classList.remove('active');
    currentIndex++;
    while (currentIndex < keys.length && completed.has(keys[currentIndex])) {
      currentIndex++;
    }
    if (currentIndex < keys.length) {
      showStep(currentIndex);
    } else {
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      container.classList.add('fade-out');
      setTimeout(() => container.remove(), 1000);
    }
  }

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function detectGesture(e) {
    const touches = e.touches;
    const currentKey = keys[currentIndex];

    if (touches.length === 1 && currentKey === 'rotate') {
      completed.add('rotate');
      nextStep();
    } else if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;

      if (currentKey === 'pinch') {
        const dist = getDistance(touches);
        if (pinchStartDist === 0) pinchStartDist = dist;
        else if (Math.abs(dist - pinchStartDist) > 25) {
          completed.add('pinch');
          nextStep();
          pinchStartDist = 0;
        }
      } else if (currentKey === 'pan') {
        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
          completed.add('pan');
          nextStep();
        }
      }
    }
  }

  function detectDoubleTap(e) {
    const now = new Date().getTime();
    const timeDiff = now - lastTap;
    if (timeDiff < 300 && keys[currentIndex] === 'zoom') {
      completed.add('zoom');
      nextStep();
    }
    lastTap = now;
  }

  // 8. Start tutorial
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    while (completed.has(keys[currentIndex])) currentIndex++;
    showStep(currentIndex);
    window.addEventListener('touchstart', detectGesture);
    window.addEventListener('touchend', detectDoubleTap);
  }
}