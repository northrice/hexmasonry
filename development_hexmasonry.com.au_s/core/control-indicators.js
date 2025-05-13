/**
 * Initializes and manages a touch gesture tutorial.
 *
 * HOW IT WORKS:
 * 1. Injects CSS for styling the tutorial elements.
 * 2. Creates HTML for the tutorial overlay, instructions, animation area, and skip button.
 * This UI is appended to an element with ID 'threejs-container' if found, otherwise to document.body.
 * 3. Defines a sequence of gestures (e.g., rotate, pinch, pan).
 * 4. For each gesture:
 * - Displays instructions and an animation demonstrating the gesture.
 * - Listens for touch events on the `targetElement` to detect if the user performs the gesture.
 * 5. Allows progressing to the next gesture or skipping the tutorial.
 * 6. Removes tutorial elements upon completion or skip.
 *
 * NOTE: Gesture detection is simplified for this example. Robust gesture detection
 * often requires more complex algorithms or libraries.
 *
 * @param {string} targetElementSelector - CSS selector for the element on which gestures are detected.
 * @param {Array<Object>} [customGestures] - Optional array to customize gestures.
 * Each object: { id, name, instruction, animationFnName, detectionFn }
 */
function initControlIndicators(targetElementSelector, customGestures) {
    // --- Easing functions ---
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // --- Configuration ---
    const GESTURE_AREA_ID = 'gesture-tutorial-container';
    const ANIMATION_AREA_ID = 'gesture-animation-area';
    const UI_HOST_ELEMENT_ID = 'threejs-container'; // ID of the element to host the tutorial UI

    const targetElement = document.querySelector(targetElementSelector);

    if (!targetElement) {
        console.error(`Target element "${targetElementSelector}" not found for gesture tutorial. Tutorial will not initialize.`);
        return;
    }

    // --- State Variables ---
    let currentGestureIndex = 0;
    let touchData = {
        startPoints: [],
        lastPoints: [],
        isInteracting: false,
        lastDistance: 0,
        lastAngle: 0,
        lastMidpoint: null
    };
    let tutorialContainer;
    let animationArea;
    let instructionTextElement;
    let progressDotsContainer;
    let animationFrameId = null; // To cancel ongoing animations

    // --- Default Gesture Definitions ---
    const defaultGestures = [
        {
            id: 'pan',
            name: 'Pan',
            instruction: 'Use two fingers to drag and move.',
            animationFn: animatePanIndicator,
            detectionFn: detectPan,
        },
        {
            id: 'pinch-zoom',
            name: 'Pinch / Zoom',
            instruction: 'Use two fingers to pinch or spread apart to zoom.',
            animationFn: animatePinchZoomIndicator,
            detectionFn: detectPinchZoom,
        },
        {
            id: 'rotate',
            name: 'Rotate',
            instruction: 'With two fingers on the screen, rotate them.',
            animationFn: animateRotateIndicator,
            detectionFn: detectRotate,
        },
    ];

    const gestures = customGestures || defaultGestures;

    // --- CSS Injection ---
    function injectStyles() {
        const styleId = 'gesture-tutorial-styles';
        if (document.getElementById(styleId)) return; // Styles already injected

        const css = `
            #${GESTURE_AREA_ID} {
                position: fixed; /* Positioned relative to viewport or a transformed/filtered ancestor */
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5);
                z-index: 10000;
                text-align: center;
                width: 90%;
                max-width: 450px;
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
                font-family: 'Inter', sans-serif;
            }
            #${GESTURE_AREA_ID}.visible {
                opacity: 1;
            }
            #${ANIMATION_AREA_ID} {
                width: 120px;
                height: 100px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                margin: 15px auto;
                position: relative; /* Relative to its parent GESTURE_AREA_ID */
                overflow: hidden;
            }
            .${ANIMATION_AREA_ID}-dot {
                position: absolute;
                width: 15px;
                height: 15px;
                background-color: #3b82f6;
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.7);
            }
            #gesture-instruction {
                margin-bottom: 15px;
                font-size: 1em;
                line-height: 1.4;
            }
            #skip-gesture-tutorial, #next-gesture-button {
                background-color: #3b82f6;
                color: white;
                border: none;
                padding: 10px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9em;
                margin-top: 10px;
                transition: background-color 0.3s ease;
            }
            #skip-gesture-tutorial:hover, #next-gesture-button:hover {
                background-color: #2563eb;
            }
            #gesture-progress-dots {
                margin-top: 15px;
                display: flex;
                justify-content: center;
                gap: 8px;
            }
            .progress-dot {
                width: 10px;
                height: 10px;
                background-color: rgba(255,255,255,0.3);
                border-radius: 50%;
                transition: background-color 0.3s ease;
            }
            .progress-dot.active {
                background-color: #3b82f6;
            }
            .progress-dot.completed {
                background-color: #10b981;
            }
        `;
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = css;
        document.head.appendChild(styleElement);
    }

    // --- HTML Structure Setup ---
    function createTutorialUI() {
        tutorialContainer = document.createElement('div');
        tutorialContainer.id = GESTURE_AREA_ID;

        instructionTextElement = document.createElement('p');
        instructionTextElement.id = 'gesture-instruction';

        animationArea = document.createElement('div');
        animationArea.id = ANIMATION_AREA_ID;

        progressDotsContainer = document.createElement('div');
        progressDotsContainer.id = 'gesture-progress-dots';

        const skipButton = document.createElement('button');
        skipButton.id = 'skip-gesture-tutorial';
        skipButton.textContent = 'Skip Tutorial';
        skipButton.onclick = skipTutorial;
        
        tutorialContainer.appendChild(instructionTextElement);
        tutorialContainer.appendChild(animationArea);
        tutorialContainer.appendChild(progressDotsContainer);
        tutorialContainer.appendChild(skipButton);
        
        // Append the tutorial UI to the specified host element or fallback to body
        const hostElement = document.getElementById(UI_HOST_ELEMENT_ID);
        if (hostElement) {
            hostElement.appendChild(tutorialContainer);
            // Note: If 'UI_HOST_ELEMENT_ID' has CSS transform, perspective, or filter properties,
            // the 'position: fixed' tutorial container will be fixed relative to it.
            // Otherwise, it's fixed relative to the viewport.
        } else {
            console.warn(`Host element with ID '${UI_HOST_ELEMENT_ID}' not found for tutorial UI. Appending to document.body as a fallback.`);
            document.body.appendChild(tutorialContainer);
        }

        // Make it visible with a fade-in
        requestAnimationFrame(() => {
            tutorialContainer.classList.add('visible');
        });
    }

    // --- Gesture Animation Functions ---
    function clearAnimationArea() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        animationArea.innerHTML = '';
    }

    function animatePanIndicator() {
        clearAnimationArea();
        const dot1 = document.createElement('div');
        const dot2 = document.createElement('div');
        dot1.className = `${ANIMATION_AREA_ID}-dot`;
        dot2.className = `${ANIMATION_AREA_ID}-dot`;
        animationArea.append(dot1, dot2);

        const areaRect = animationArea.getBoundingClientRect();
        const startX1 = areaRect.width * 0.25 - 7.5;
        const startX2 = areaRect.width * 0.45 - 7.5;
        const startY = areaRect.height * 0.5 - 7.5;
        const endX1 = areaRect.width * 0.55 - 7.5;
        const endX2 = areaRect.width * 0.75 - 7.5;

        let progress = 0;
        const duration = 1500;
        let startTime = null;

        function frame(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easeInOutCubic(progress);
            const currentX1 = startX1 + (endX1 - startX1) * easedProgress;
            const currentX2 = startX2 + (endX2 - startX2) * easedProgress;

            dot1.style.transform = `translate(${currentX1}px, ${startY}px)`;
            dot2.style.transform = `translate(${currentX2}px, ${startY}px)`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(frame);
            } else {
                startTime = null;
                animationFrameId = requestAnimationFrame(frame); // Loop
            }
        }
        animationFrameId = requestAnimationFrame(frame);
    }

    function animatePinchZoomIndicator() {
        clearAnimationArea();
        const dot1 = document.createElement('div');
        const dot2 = document.createElement('div');
        dot1.className = `${ANIMATION_AREA_ID}-dot`;
        dot2.className = `${ANIMATION_AREA_ID}-dot`;
        animationArea.append(dot1, dot2);

        const areaRect = animationArea.getBoundingClientRect();
        const midX = areaRect.width * 0.5 - 7.5;
        const midY = areaRect.height * 0.5 - 7.5;
        const initialDist = areaRect.width * 0.1;
        const finalDist = areaRect.width * 0.35;

        let progress = 0;
        const duration = 1500;
        let startTime = null;
        let zoomingOut = true;

        function frame(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            const easedProgress = easeInOutCubic(progress);
            let currentDist;
            if (zoomingOut) {
                currentDist = initialDist + (finalDist - initialDist) * easedProgress;
            } else {
                currentDist = finalDist - (finalDist - initialDist) * easedProgress;
            }

            dot1.style.transform = `translate(${midX - currentDist}px, ${midY}px)`;
            dot2.style.transform = `translate(${midX + currentDist}px, ${midY}px)`;

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(frame);
            } else {
                startTime = null;
                zoomingOut = !zoomingOut;
                animationFrameId = requestAnimationFrame(frame); // Loop
            }
        }
        animationFrameId = requestAnimationFrame(frame);
    }
    
    function animateRotateIndicator() {
        clearAnimationArea();
        const dot1 = document.createElement('div');
        const dot2 = document.createElement('div');
        dot1.className = `${ANIMATION_AREA_ID}-dot`;
        dot2.className = `${ANIMATION_AREA_ID}-dot`;
        animationArea.append(dot1, dot2);

        const areaRect = animationArea.getBoundingClientRect();
        const centerX = areaRect.width * 0.5;
        const centerY = areaRect.height * 0.5;
        const radius = areaRect.width * 0.25;

        let angle = 0;
        const durationPerRevolution = 3000;
        let startTime = null;

        function frame(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            angle = (elapsed / durationPerRevolution) * 2 * Math.PI;
            
            const x1 = centerX + radius * Math.cos(angle) - 7.5;
            const y1 = centerY + radius * Math.sin(angle) - 7.5;
            const x2 = centerX + radius * Math.cos(angle + Math.PI) - 7.5;
            const y2 = centerY + radius * Math.sin(angle + Math.PI) - 7.5;

            dot1.style.transform = `translate(${x1}px, ${y1}px)`;
            dot2.style.transform = `translate(${x2}px, ${y2}px)`;

            animationFrameId = requestAnimationFrame(frame); // Loop
        }
        animationFrameId = requestAnimationFrame(frame);
    }

    // --- Gesture Detection Logic (Simplified) ---
    function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2));
    }

    function getAngle(p1, p2) {
        return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
    }
    
    function getMidpoint(p1, p2) {
        return {
            clientX: (p1.clientX + p2.clientX) / 2,
            clientY: (p1.clientY + p2.clientY) / 2
        };
    }

    function detectPan(touches) {
        if (touches.length !== 2) return false;
        const currentMidpoint = getMidpoint(touches[0], touches[1]);
        if (touchData.lastMidpoint) {
            const distMoved = getDistance(touchData.lastMidpoint, currentMidpoint);
            if (distMoved > 20) { // Threshold for pan
                return true;
            }
        }
        touchData.lastMidpoint = currentMidpoint;
        return false;
    }

    function detectPinchZoom(touches) {
        if (touches.length !== 2) return false;
        const currentDistance = getDistance(touches[0], touches[1]);
        if (touchData.lastDistance > 0) {
            const diff = Math.abs(currentDistance - touchData.lastDistance);
            if (diff > 15) { // Threshold for pinch/zoom
                return true;
            }
        }
        touchData.lastDistance = currentDistance;
        return false;
    }
    
    function detectRotate(touches) {
        if (touches.length !== 2) return false;
        const currentAngle = getAngle(touches[0], touches[1]);
        if (touchData.lastAngle !== 0 && Math.abs(touchData.lastAngle - currentAngle) > 1) {
             const angleDiff = Math.abs(currentAngle - touchData.lastAngle);
             if (angleDiff > 15 && angleDiff < 345) { // Threshold for rotation
                return true;
            }
        }
        touchData.lastAngle = currentAngle;
        return false;
    }

    // --- Tutorial Flow ---
    function updateProgressDots() {
        progressDotsContainer.innerHTML = '';
        gestures.forEach((gesture, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            if (index < currentGestureIndex) {
                dot.classList.add('completed');
            } else if (index === currentGestureIndex) {
                dot.classList.add('active');
            }
            progressDotsContainer.appendChild(dot);
        });
    }

    function showGesture(index) {
        if (index >= gestures.length) {
            endTutorial(true);
            return;
        }
        const gesture = gestures[index];
        instructionTextElement.textContent = `${gesture.name}: ${gesture.instruction}`;
        
        if (typeof gesture.animationFn === 'function') {
            gesture.animationFn();
        }
        updateProgressDots();
    }

    function completeCurrentGesture() {
        if (currentGestureIndex < gestures.length) {
            gestures[currentGestureIndex].completed = true;
            currentGestureIndex++;
            resetTouchDataForNextGesture();
            showGesture(currentGestureIndex);
        }
    }
    
    function resetTouchDataForNextGesture() {
        touchData.lastDistance = 0;
        touchData.lastAngle = 0;
        touchData.lastMidpoint = null;
    }

    function skipTutorial() {
        endTutorial(false);
    }

    function endTutorial(completedAll) {
        if (tutorialContainer) {
            tutorialContainer.classList.remove('visible');
            tutorialContainer.addEventListener('transitionend', () => {
                if (tutorialContainer && tutorialContainer.parentNode) {
                    tutorialContainer.parentNode.removeChild(tutorialContainer);
                }
                tutorialContainer = null;
            });
        }
        targetElement.removeEventListener('touchstart', handleTouchStart);
        targetElement.removeEventListener('touchmove', handleTouchMove);
        targetElement.removeEventListener('touchend', handleTouchEnd);
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        console.log(completedAll ? "Gesture tutorial completed!" : "Gesture tutorial skipped.");
    }

    // --- Touch Event Handlers ---
    function handleTouchStart(event) {
        event.preventDefault();
        touchData.isInteracting = true;
        touchData.startPoints = Array.from(event.touches);
        touchData.lastPoints = Array.from(event.touches);

        if (event.touches.length === 2) {
            touchData.lastDistance = getDistance(event.touches[0], event.touches[1]);
            touchData.lastAngle = getAngle(event.touches[0], event.touches[1]);
            touchData.lastMidpoint = getMidpoint(event.touches[0], event.touches[1]);
        } else {
            touchData.lastDistance = 0;
            touchData.lastAngle = 0;
            touchData.lastMidpoint = null;
        }
    }

    function handleTouchMove(event) {
        event.preventDefault();
        if (!touchData.isInteracting || currentGestureIndex >= gestures.length) return;

        const currentTouches = Array.from(event.touches);
        const gestureDefinition = gestures[currentGestureIndex];

        if (gestureDefinition.detectionFn && gestureDefinition.detectionFn(currentTouches)) {
            completeCurrentGesture();
        }
        touchData.lastPoints = currentTouches;
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        if (event.touches.length < 2) {
            touchData.lastDistance = 0;
            touchData.lastAngle = 0;
            touchData.lastMidpoint = null;
        }
        if (event.touches.length === 0) {
            touchData.isInteracting = false;
            touchData.startPoints = [];
            touchData.lastPoints = [];
        }
    }

    // --- Initialization ---
    function init() {
        injectStyles();
        createTutorialUI();
        showGesture(currentGestureIndex);

        targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        targetElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    init();

    return {
        cleanup: () => endTutorial(false)
    };
}

// --- Example Usage ---
/*
document.addEventListener('DOMContentLoaded', () => {
    // Ensure an element with ID 'threejs-container' exists in your HTML
    // For example: <div id="threejs-container" style="width: 100%; height: 500px; border: 1px solid grey;"></div>

    // Ensure an element matching 'targetElementSelector' exists.
    // This could be '#threejs-container' itself, or a canvas inside it.
    // For example, if threejs-container also serves as the touch target:
    // initControlIndicators('#threejs-container');

    // Or if there's a canvas inside threejs-container for touch:
    // const threejsContainer = document.getElementById('threejs-container');
    // if (threejsContainer) {
    //    const canvas = document.createElement('canvas'); // Your Three.js canvas
    //    canvas.id = 'my-three-canvas';
    //    threejsContainer.appendChild(canvas);
    //    // Style canvas as needed
    //    initControlIndicators('#my-three-canvas');
    // }
});
*/
