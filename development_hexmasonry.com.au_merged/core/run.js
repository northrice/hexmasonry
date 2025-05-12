// run.js
import { updateMesh,  mesh} from './build.js';
import { scene, camera, renderer, controls } from './setup.js';
import { updateCamera, enforceCameraInsideMesh} from './camera-utils.js';

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

updateMesh();
updateCamera(mesh);

window.updateCamera = updateCamera;
window.mesh = mesh;
window.camera = camera;

function animate() {
  requestAnimationFrame(animate);
  enforceCameraInsideMesh(window.mesh);
  controls.update();
  renderer.render(scene, camera);
}

animate();