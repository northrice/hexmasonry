import { initViewer } from './build.js';
import { initCameraFocusControls } from './camera-utils.js';
import { camera, renderer, controls } from './setup.js';
import { renderSceneWithBloom } from './scene.js';
import { applyGlobalLighting } from './lighting.js';
import { saveGUIParamsToFile } from './gui-export.js';
import configArray from './configs/home.js';
import { loadModels } from './build.js';


const container = document.getElementById('viewer-container');
initViewer(container, configArray);

// Parse query param from <script src="run.js?config=home.js"> (optional)
const scriptUrl = new URL(import.meta.url);
const configName = scriptUrl.searchParams.get('config');

if (!configName) {
  console.log('ℹ️ No dynamic config specified, using default home.js');
} else {
  console.warn('⚠️ Dynamic config loading from URL is deprecated in favor of direct import.');
  // Optionally remove the whole block if you're sticking with JS configs only
  import(`./configs/${configName}`)
    .then(module => {
      initViewer(container, module.default);
    })
    .catch(err => console.error(`❌ Failed to load config "${configName}":`, err));
}

// Keyboard shortcut to save GUI
window.addEventListener('keydown', (e) => {
  if (e.key === 'p') {
    saveGUIParamsToFile();
  }
});

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Init camera & lighting
applyGlobalLighting();
initCameraFocusControls();

// Debugging
window.camera = camera;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderSceneWithBloom();
}
animate();

// USE <script type="module" src="https://northrice.github.io/hexmasonry/development_hexmasonry.com.au_merged/core/run.js?config=home"></script>
// with a specific config

