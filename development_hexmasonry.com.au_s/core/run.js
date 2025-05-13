// run.js
import './build.js';
import { initCameraFocusControls } from './camera-utils.js';
import { camera, renderer, controls } from './setup.js';
import { renderSceneWithBloom } from './scene.js';
import { applyGlobalLighting } from './lighting.js';

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lighting & camera init
applyGlobalLighting();
initCameraFocusControls();

// Debug / Dev globals (optional)
window.camera = camera;

function animate() {
  requestAnimationFrame(animate);
  controls.update();         
  renderSceneWithBloom();     
}

animate();
