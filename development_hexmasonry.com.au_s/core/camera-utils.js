import { camera, controls, scene, renderer, gui } from './setup.js';
import { THREE } from './globals.js';

let center = new THREE.Vector3(0, 0, 0); // Current orbit focus
const cameraParams = {
  fixedDistance: 2.5,
  animationDuration: 0.5
};

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// GUI
const focusFolder = gui.addFolder('Camera Focus');
focusFolder.add(cameraParams, 'fixedDistance', 0.1, 10).step(0.1).name('Fixed Distance');
focusFolder.add(cameraParams, 'animationDuration', 0.1, 2).step(0.1).name('Anim Duration');
focusFolder.open();

export function setCameraFocus(targetPosition) {
  center.copy(targetPosition);
  controls.target.copy(center);
  controls.update();
}

export function initCameraFocusControls() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('dblclick', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // ✅ Enable layers for raycaster and camera
    raycaster.layers.enable(0);
    raycaster.layers.enable(1);
    camera.layers.enableAll();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      const mesh = hit.object;
      if (mesh.name) {
        const point = hit.point;

        // Create a new direction vector from the camera to the hit point
        const viewDirection = new THREE.Vector3().subVectors(point, camera.position).normalize();
        const newTarget = point.clone();
        const newPosition = point.clone().addScaledVector(viewDirection.clone().negate(), cameraParams.fixedDistance);

        const startCam = camera.position.clone();
        const startTarget = controls.target.clone();

        let t = 0;
        const duration = cameraParams.animationDuration;

        function animate() {
          t += 0.02;
          const linearAlpha = Math.min(t / duration, 1);
          const easedAlpha = easeInOutCubic(linearAlpha);

          camera.position.lerpVectors(startCam, newPosition, easedAlpha);
          controls.target.lerpVectors(startTarget, newTarget, easedAlpha);
          controls.update();

          if (linearAlpha < 1) {
            requestAnimationFrame(animate);
          } else {
            center.copy(newTarget);
          }
        }

        animate();

        console.log('📌 Raycast Hit');
        console.log('→ Mesh Name:', mesh.name);
        console.log('→ Hit Point:', point);
        console.log('→ World Pos:', mesh.getWorldPosition(new THREE.Vector3()));

        break; // Only focus on first named mesh
      }
    }
  });
}