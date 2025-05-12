// run.js
import './build.js';
import { updateCamera, initCameraFocusControls } from './camera-utils.js';
import { camera, renderer, controls } from './setup.js';
import { renderSceneWithBloom } from './scene.js';
import { applyGlobalLighting } from './lighting.js';
import { RectAreaLightHelper } from './globals.js';

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

applyGlobalLighting();
updateCamera();
initCameraFocusControls(); // ← 🔥 Add this here

window.updateCamera = updateCamera;
window.camera = camera;

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderSceneWithBloom(); // Handles bloom + base scene render
}

animate();
