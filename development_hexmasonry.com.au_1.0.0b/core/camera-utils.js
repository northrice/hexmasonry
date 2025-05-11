import { camera, controls } from './setup.js'

export function cameraConstrain(mesh) {
  /// START CAMERA CONTRAINTS
  // Update world matrix
  mesh.updateMatrixWorld(true);

  // Get bounding box & center
  const bbox = new THREE.Box3().setFromObject(mesh);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Set initial camera position (inside mesh)
  camera.position.copy(center);
  camera.position.z += maxDim * 0.3;

  // Lock controls to center
  controls.target.copy(center);
  controls.update();

  // Prevent zooming outside
  controls.minDistance = 0.1;
  controls.maxDistance = maxDim * 0.2;

  // Prevent panning (keeps target centered)
  controls.enablePan = false;

  // Angle limits (prevents flipping under/over mesh)
  controls.minPolarAngle = 0.2; // Slightly above bottom
  controls.maxPolarAngle = Math.PI - 0.2; // Slightly below top

  //  Strictly enforce camera inside mesh
  let isUpdating = false;
  controls.addEventListener('change', () => {
    if (isUpdating) return;
    isUpdating = true;

    // Get current mesh bounds (in case it moves/scales)
    const currentBbox = new THREE.Box3().setFromObject(mesh);
    const clampedPos = new THREE.Vector3().copy(camera.position);

    // **Clamp camera to mesh bounds (with margin)**
    clampedPos.x = THREE.MathUtils.clamp(
      clampedPos.x,
      currentBbox.min.x + 0.1 * size.x,
      currentBbox.max.x - 0.1 * size.x
    );
    clampedPos.y = THREE.MathUtils.clamp(
      clampedPos.y,
      currentBbox.min.y + 0.1 * size.y,
      currentBbox.max.y - 0.1 * size.y
    );
    clampedPos.z = THREE.MathUtils.clamp(
      clampedPos.z,
      currentBbox.min.z + 0.1 * size.z,
      currentBbox.max.z - 0.1 * size.z
    );

    // If position was clamped, update camera
    if (!clampedPos.equals(camera.position)) {
      camera.position.copy(clampedPos);
      setTimeout(() => {
        controls.update();
        isUpdating = false;
      }, 0);
    } else {
      isUpdating = false;
    }
  });
  // END CAMERA CONTRAINTS
}

