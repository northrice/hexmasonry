export function initControlIndicators() {
  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    #control-indicators {
      position: absolute;
      bottom: 5%;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      background: rgba(255, 255, 255, 0.85);
      border-radius: 12px;
      padding: 1rem 2rem;
      font-family: sans-serif;
      color: #333;
      pointer-events: none;
      transition: opacity 1s ease;
      max-width: 90vw;
    }

    #control-indicators.fade-out {
      opacity: 0;
    }

    .instruction {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
    }

    .gesture-step {
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      opacity: 0;
      transition: opacity 0.6s ease;
    }

    .gesture-step.active {
      display: flex;
      opacity: 1;
    }

    .slide-container {
      position: relative;
      width: 100px;
      height: 12px;
    }

    .slide-line {
      position: absolute;
      height: 2px;
      background: #333;
      top: 5px;
      left: 0;
      width: 0;
      animation: grow-line 1.2s ease forwards;
    }

    .slide-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #333;
      left: 0;
      top: 0;
      animation: move-dot 1.2s ease forwards;
    }

    .zoom-container {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .zoom-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 12px;
      height: 12px;
      background: #333;
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      opacity: 0;
    }

    .zoom-ring.one {
      animation: zoom-ring-grow 1.2s ease-out forwards;
    }

    .zoom-ring.two {
      animation: zoom-ring-grow 1.2s ease-out 0.6s forwards;
    }

    .pinch-container {
      position: relative;
      width: 60px;
      height: 60px;
    }

    .pinch-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #333;
      opacity: 1;
    }

    .pinch-dot.one {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      animation: pinch-move-one 1.2s ease-out forwards;
    }

    .pinch-dot.two {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(135deg);
      animation: pinch-move-two 1.2s ease-out forwards;
    }

    .pinch-line {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 2px;
      height: 0;
      background: #333;
      transform: translate(-50%, -50%) rotate(45deg);
      animation: pinch-line-grow 1.2s ease-out forwards;
      transform-origin: center;
    }

    .pan-container {
      position: relative;
      width: 100px;
      height: 24px;
    }

    .pan-line {
      position: absolute;
      top: 5px;
      left: 0;
      width: 0;
      height: 2px;
      background: #333;
      animation: grow-line 1.2s ease forwards;
    }

    .pan-dot {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #333;
    }

    .pan-dot.one {
      top: 0;
      left: 0;
      animation: move-dot 1.2s ease forwards;
    }

    .pan-dot.two {
      top: 12px;
      left: 0;
      animation: move-dot 1.2s ease forwards;
    }

    @keyframes pinch-move-one {
      0% { transform: translate(-50%, -50%) rotate(-45deg) translate(0, 0); opacity: 1; }
      100% { transform: translate(-50%, -50%) rotate(-45deg) translate(-20px, -20px); opacity: 0; }
    }

    @keyframes pinch-move-two {
      0% { transform: translate(-50%, -50%) rotate(135deg) translate(0, 0); opacity: 1; }
      100% { transform: translate(-50%, -50%) rotate(135deg) translate(20px, 20px); opacity: 0; }
    }

    @keyframes pinch-line-grow {
      0% { height: 0; opacity: 1; }
      100% { height: 40px; opacity: 0; }
    }

    @keyframes move-dot {
      0% { left: 0; opacity: 1; }
      70% { opacity: 1; }
      100% { left: 88px; opacity: 0; }
    }

    @keyframes grow-line {
      0% { width: 0; opacity: 1; }
      100% { width: 100%; opacity: 0; }
    }

    @keyframes zoom-ring-grow {
      0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
      30% { opacity: 1; }
      60% { transform: translate(-50%, -50%) scale(2); opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'control-indicators';

  const gestureSteps = [
    {
      key: 'rotate',
      html: `<div class="gesture-step" id="step-rotate">
        <div class="slide-container">
          <div class="slide-line"></div>
          <div class="slide-dot"></div>
        </div>
      </div>`
    },
    {
      key: 'zoom',
      html: `<div class="gesture-step" id="step-zoom">
        <div class="zoom-container">
          <div class="zoom-ring one"></div>
          <div class="zoom-ring two"></div>
        </div>
      </div>`
    },
    {
      key: 'pinch',
      html: `<div class="gesture-step" id="step-pinch">
        <div class="pinch-container">
          <div class="pinch-dot one"></div>
          <div class="pinch-dot two"></div>
          <div class="pinch-line"></div>
        </div>
      </div>`
    },
    {
      key: 'pan',
      html: `<div class="gesture-step" id="step-pan">
        <div class="pan-container">
          <div class="pan-line"></div>
          <div class="pan-dot one"></div>
          <div class="pan-dot two"></div>
        </div>
      </div>`
    }
  ];

  const gestureWrapper = document.createElement('div');
  gestureWrapper.className = 'instruction touch';
  gestureSteps.forEach(step => {
    gestureWrapper.innerHTML += step.html;
  });

  container.appendChild(gestureWrapper);
  document.body.appendChild(container);

  let currentIndex = 0;
  const keys = gestureSteps.map(step => step.key);
  let lastTap = 0;
  let pinchStartDist = 0;
  const completed = new Set();

  function showStep(index) {
    keys.forEach(key => {
      const el = document.getElementById(`step-${key}`);
      if (el) el.classList.remove('active');
    });
    const currentEl = document.getElementById(`step-${keys[index]}`);
    if (currentEl) currentEl.classList.add('active');
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

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    while (completed.has(keys[currentIndex])) currentIndex++;
    showStep(currentIndex);
    window.addEventListener('touchstart', detectGesture);
    window.addEventListener('touchend', detectDoubleTap);
  }
}