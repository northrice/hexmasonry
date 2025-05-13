import { camera, controls, scene, renderer, gui } from './setup.js';
import { THREE } from './globals.js';

const cameraParams = {
  fixedDistance: 2.5,
  animationDuration: 2.5, // Cinematic zoom duration in seconds
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
  controls.minDistance = value;
});
focusFolder.add(cameraParams, 'cinematicFOV', 10, 75).step(1).name('Cinematic FOV');
// focusFolder.open(); // Keep folders collapsed by default

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

        const direction = new THREE.Vector3().subVectors(point, camera.position).normalize();
        const targetPosition = point.clone();
        const cameraTargetPosition = point.clone().addScaledVector(direction.negate(), cameraParams.fixedDistance);

        const startCamPos = camera.position.clone();
        const startTarget = controls.target.clone();
        const startFOV = camera.fov;
        const targetFOV = cameraParams.cinematicFOV;

        const duration = cameraParams.animationDuration * 1000;
        const startTime = performance.now();

        function animate() {
          const elapsed = performance.now() - startTime;
          const linearAlpha = Math.min(elapsed / duration, 1);
          const easedAlpha = easeInOutCubic(linearAlpha);

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
  renderer.domElement.addEventListener('touchstart', (event) => {
    // Save touches in case of need to extend behavior later
  }, { passive: false });

  renderer.domElement.addEventListener('touchmove', (event) => {
    if (event.touches.length === 1) {
      controls.enableRotate = true;
      controls.enablePan = false;
      controls.enableZoom = false;
    } else if (event.touches.length === 2) {
      controls.enableRotate = false;
      controls.enablePan = true;
      controls.enableZoom = true;
    }
    controls.update();
  }, { passive: false });

  renderer.domElement.addEventListener('touchend', () => {
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
  });

  controls.minDistance = cameraParams.minDistance;
}