import { scene, camera, renderer } from './setup.js';
import { THREE } from './globals.js';
import { clickableMeshes } from './build.js';

// Simple double-click zoom
export function cameraControls(controls) {
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('dblclick', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true); // true for recursive checking

  console.log('Intersections:', intersects); // Debug: Log all intersections

  if (intersects.length > 0) {
      // Debug: Detailed information for each intersection
      intersects.forEach((hit, index) => {
        const obj = hit.object;
        console.log(`Hit #${index + 1}:`);
        console.log('Name:', obj.name);
        console.log('Type:', obj.type);
        console.log('Is Mesh:', obj.isMesh);
        console.log('Position:', obj.position);
        console.log('World Position:', obj.getWorldPosition(new THREE.Vector3()));
        console.log('Geometry Type:', obj.geometry?.type || 'No Geometry');
        console.log('Material:', obj.material);
        console.log('Distance to Camera:', camera.position.distanceTo(hit.point).toFixed(2));
      });

      // Now, check for the most child mesh in the intersected objects
      const deepestIntersect = intersects.reduce((deepest, hit) => {
        // Only proceed if the object is a mesh and has a valid name
        if (hit.object.isMesh && hit.object.name && hit.object.name.trim() !== "") {
          return hit; // Return the deepest (most child) mesh
        }
        return deepest;
      }, intersects[0]);  // Default to the first intersection if none are valid

      // Debug: Log the deepest hit mesh
      if (deepestIntersect) {
        const point = deepestIntersect.point;
        const mesh = deepestIntersect.object;

        console.log('Selected Mesh:', mesh.name);
        console.log('Mesh World Position:', mesh.getWorldPosition(new THREE.Vector3()));

        // Create a debug hitmarker (a small sphere at the intersection point)
        const hitMarkerGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const hitMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const hitMarker = new THREE.Mesh(hitMarkerGeometry, hitMarkerMaterial);
        hitMarker.position.copy(point);
        scene.add(hitMarker);

        // Move camera toward the clicked point
        const direction = new THREE.Vector3().subVectors(point, camera.position).normalize();
        const zoomFactor = 0.5;
        camera.position.add(direction.multiplyScalar(camera.position.distanceTo(point) * zoomFactor));

        // Look at the clicked point
        controls.target.copy(point);
        controls.update();
      }
    }
  }
);

// Enable right-click panning
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.enablePan = true;
}
