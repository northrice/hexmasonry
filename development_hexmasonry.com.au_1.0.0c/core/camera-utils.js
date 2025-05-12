import { camera, controls, params } from './setup.js';

export function updateCamera() {
  const center = new THREE.Vector3(0, 0, 0); // ← Define the orbit point here

  const azimuthRad = THREE.MathUtils.degToRad(params.azimuth);
  const phiRad = THREE.MathUtils.degToRad(params.phi);

  const x = center.x + params.distance * Math.sin(phiRad) * Math.cos(azimuthRad);
  const y = center.y + params.distance * Math.cos(phiRad) + params.cameraY;
  const z = center.z + params.distance * Math.sin(phiRad) * Math.sin(azimuthRad);

  camera.position.set(x, y, z);
  controls.target.copy(center); // ← Camera looks at this point
  controls.update();
}
