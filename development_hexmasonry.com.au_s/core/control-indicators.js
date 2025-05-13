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
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 1.2rem;
    }

    .gesture-sequence {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .gesture-step {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .dot {
      width: 12px;
      height: 12px;
      background: #333;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    .line {
      width: 40px;
      height: 2px;
      background: #333;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const container = document.createElement('div');
  container.id = 'control-indicators';

  const gestureSteps = [
    {
      key: 'rotate',
      html: `
        <div class="gesture-step rotate">
          <div class="dots">
            <div class="dot"></div>
            <div class="line"></div>
          </div>
        </div>
      `
    },
    {
      key: 'zoom',
      html: `
        <div class="gesture-step zoom">
          <div class="dots">
            <div class="dot"></div>
            <div class="line"></div>
            <div class="dot"></div>
          </div>
        </div>
      `
    },
    {
      key: 'pinch',
      html: `
        <div class="gesture-step pinch">
          <div class="dots">
            <div class="dot" style="transform: translate(-15px, -15px);"></div>
            <div class="line"></div>
            <div class="dot" style="transform: translate(15px, 15px);"></div>
          </div>
        </div>
      `
    },
    {
      key: 'pan',
      html: `
        <div class="gesture-step pan">
          <div class="dots">
            <div class="dot"></div>
            <div class="line"></div>
            <div class="dot"></div>
          </div>
        </div>
      `
    }
  ];

  const shown = JSON.parse(localStorage.getItem('gestureTutorialShown') || '{}');

  const gestureWrapper = document.createElement('div');
  gestureWrapper.className = 'instruction touch gesture-sequence';
  for (const step of gestureSteps) {
    if (!shown[step.key]) {
      gestureWrapper.innerHTML += step.html;
    }
  }

  // Only show if there is something left to show
  if (gestureWrapper.innerHTML.trim()) {
    container.appendChild(gestureWrapper);
    document.body.appendChild(container);
  }

  const markGestureShown = () => {
    gestureSteps.forEach(step => {
      shown[step.key] = true;
    });
    localStorage.setItem('gestureTutorialShown', JSON.stringify(shown));
  };

  const dismiss = () => {
    container.classList.add('fade-out');
    setTimeout(() => container.remove(), 1000);
    markGestureShown();
    window.removeEventListener('touchstart', dismiss);
  };

  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    window.addEventListener('touchstart', dismiss);
  }
}