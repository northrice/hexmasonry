import { camera, controls, params } from './setup.js';

export function updateCamera(mesh) {
  if (!mesh || !mesh.userData.boxCenter || !mesh.userData.boxSize) {
    console.warn('Camera update skipped: invalid mesh or bounding box');
    return;
  }

  const center = mesh.userData.boxCenter;
  const size = mesh.userData.boxSize;

  const maxSize = Math.max(size.x, size.y, size.z);
  const boundingRadius = maxSize * 0.5;

  const fitDistance = boundingRadius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  const azimuthRad = THREE.MathUtils.degToRad(params.azimuth);
  const phiRad = THREE.MathUtils.degToRad(params.phi);

  const x = center.x + params.distance * Math.sin(phiRad) * Math.cos(azimuthRad);
  const y = center.y + params.distance * Math.cos(phiRad);
  const z = center.z + params.distance * Math.sin(phiRad) * Math.sin(azimuthRad);

  camera.position.set(x, y, z);
  controls.target.copy(center);

  controls.minDistance = 0.1;                       // allow close-up viewing
  controls.maxDistance = boundingRadius * 1000;      // stay inside shape
  controls.enableZoom = true;

  controls.update();
}

export function enforceCameraInsideMesh(mesh) {
  if (!mesh) return;

  const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
  const raycaster = new THREE.Raycaster(controls.target, direction);
  const intersects = raycaster.intersectObject(mesh, true);

  if (intersects.length > 0) {
    const surfaceDistance = intersects[0].distance;
    const camDistance = camera.position.distanceTo(controls.target);

    if (camDistance > surfaceDistance * 0.99) {
      const safeDistance = surfaceDistance * 0.99;
      const newPosition = direction.multiplyScalar(safeDistance).add(controls.target);

      camera.position.copy(newPosition);
      controls.update();
    }
  }
}
