import { camera, controls, params, scene, renderer } from './setup.js';
import { THREE } from './globals.js';

let center = new THREE.Vector3(0, 0, 0); // ← Default orbit point

export function updateCamera() {
  const azimuthRad = THREE.MathUtils.degToRad(params.azimuth);
  const phiRad = THREE.MathUtils.degToRad(params.phi);

  const x = center.x + params.distance * Math.sin(phiRad) * Math.cos(azimuthRad);
  const y = center.y + params.distance * Math.cos(phiRad) + params.cameraY;
  const z = center.z + params.distance * Math.sin(phiRad) * Math.sin(azimuthRad);

  camera.position.set(x, y, z);
  controls.target.copy(center);
  controls.update();
}

export function setCameraFocus(targetPosition) {
  center.copy(targetPosition);
  updateCamera();
}

export function initCameraFocusControls() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('dblclick', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Enable both primary and environment layers
    raycaster.layers.enable(0);
    raycaster.layers.enable(1);
    camera.layers.enableAll();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      const mesh = hit.object;
      if (mesh.name) {
        const point = hit.point;
        setCameraFocus(point);

        console.log('📌 Raycast Hit');
        console.log('→ Mesh Name:', mesh.name);
        console.log('→ Mesh UUID:', mesh.uuid);
        console.log('→ Point:', point);
        console.log('→ Mesh World Position:', mesh.getWorldPosition(new THREE.Vector3()));

        break; // Only focus on the first named mesh hit
      }
    }
  });
}