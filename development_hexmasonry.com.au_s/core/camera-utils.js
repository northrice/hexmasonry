import { camera, controls, scene, renderer, gui } from './setup.js';
import { THREE } from './globals.js';

const cameraParams = {
  fixedDistance: 2.5,
  animationDuration: 1.5, // Increased duration for cinematic zoom
  minDistance: 0.1,
  cinematicFOV: 30, // Target FOV for cinematic zoom
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// GUI Controls
const focusFolder = gui.addFolder('Camera Focus');
focusFolder.add(cameraParams, 'fixedDistance', 0.1, 10).step(0.1).name('Fixed Distance');
focusFolder.add(cameraParams, 'animationDuration', 0.1, 5).step(0.1).name('Anim Duration');
focusFolder.add(cameraParams, 'minDistance', 0.01, 5).step(0.01).name('Min Zoom Distance').onChange((value) => {
  controls.minDistance = value; // Dynamically update OrbitControls' minDistance
});
focusFolder.add(cameraParams, 'cinematicFOV', 10, 75).step(1).name('Cinematic FOV');
focusFolder.open();

export function initCameraFocusControls() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('dblclick', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.layers.enable(0);
    raycaster.layers.enable(1);
    camera.layers.enableAll();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      const mesh = hit.object;
      if (mesh.name) {
        const point = hit.point;

        // Determine target and camera new position
        const direction = new THREE.Vector3().subVectors(point, camera.position).normalize();
        const targetPosition = point.clone();
        const cameraTargetPosition = point.clone().addScaledVector(direction.negate(), cameraParams.fixedDistance);

        const startCamPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const startFOV = camera.fov;
        const targetFOV = cameraParams.cinematicFOV;

        let t = 0;
        const duration = cameraParams.animationDuration;

        function animate() {
          t += 0.01; // Smaller increment for smoother animation
          const linearAlpha = Math.min(t / duration, 1);
          const easedAlpha = easeInOutCubic(linearAlpha);

          // Smoothly interpolate camera position, target, and FOV
          camera.position.lerpVectors(startCamPos, cameraTargetPosition, easedAlpha);
          controls.target.lerpVectors(startTarget, targetPosition, easedAlpha);
          camera.fov = THREE.MathUtils.lerp(startFOV, targetFOV, easedAlpha);
          camera.updateProjectionMatrix();
          controls.update();

          if (linearAlpha < 1) {
            requestAnimationFrame(animate);
          }
        }

        animate();
        break;
      }
    }
  });

  // Mobile gesture support
  let prevTouches = [];
  renderer.domElement.addEventListener('touchstart', (event) => {
    prevTouches = [...event.touches];
  }, { passive: false });

  renderer.domElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) {
      // One finger = orbit
      controls.enableRotate = true;
      controls.enablePan = false;
      controls.enableZoom = false;
    } else if (event.touches.length === 2) {
      // Two fingers = pan + zoom
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
    }
    controls.update();
    prevTouches = [...event.touches];
  }, { passive: false });

  renderer.domElement.addEventListener('touchend', () => {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
  });

  // Update OrbitControls' minDistance dynamically
  controls.minDistance = cameraParams.minDistance;
}