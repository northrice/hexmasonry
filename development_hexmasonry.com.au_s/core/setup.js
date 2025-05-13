import { THREE, OrbitControls, GUI } from './globals.js';

const params = {
  modelPosX: 0,
  modelPosY: -0.16,
  modelPosZ: 0,
  modelScale: 1,
  envScale: 1,
  cameraY: 0,
  envPosX: 0,
  envPosY: 0.0,
  envPosZ: 0
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f8f8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.getElementById('threejs-container').appendChild(renderer.domElement);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.layers.enableAll();
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.minDistance = 1;
controls.maxDistance = 1000;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

// GUI
const gui = new GUI({ closeFolders: true });

// POSITION TOP LEFT
const guiContainer = gui.domElement;
guiContainer.style.position = 'absolute';
guiContainer.style.top = '30px';
guiContainer.style.left = '30px';
guiContainer.style.zIndex = '100';
document.body.appendChild(guiContainer);

// 🔒 Show GUI only if user is logged in (via .is-logged-in marker)
function updateGUIVisibility() {
  const isLoggedIn = !!document.querySelector('.is-logged-in');
  guiContainer.style.display = isLoggedIn ? 'block' : 'none';
}
updateGUIVisibility();

// Optional: observe DOM for changes in case .is-logged-in is injected late
const observer = new MutationObserver(updateGUIVisibility);
observer.observe(document.body, { childList: true, subtree: true });

// 🖱️ DRAGGABLE GUI
let isDragging = false, offsetX = 0, offsetY = 0;
guiContainer.addEventListener('mousedown', (e) => {
  isDragging = true;
  offsetX = e.clientX - guiContainer.offsetLeft;
  offsetY = e.clientY - guiContainer.offsetTop;
  document.body.style.userSelect = 'none';
});
document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  guiContainer.style.left = `${e.clientX - offsetX}px`;
  guiContainer.style.top = `${e.clientY - offsetY}px`;
});
document.addEventListener('mouseup', () => {
  isDragging = false;
  document.body.style.userSelect = '';
});

// GUI OPTIONS
const globalFolder = gui.addFolder('Global');

globalFolder.add(params, 'modelScale', 0.01, 10).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.scale.setScalar(params.modelScale);
});
globalFolder.add(params, 'envScale', 0.1, 10).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.scale.setScalar(params.envScale);
});
globalFolder.add(params, 'modelPosX', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.x = params.modelPosX;
});
globalFolder.add(params, 'modelPosY', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.y = params.modelPosY;
});
globalFolder.add(params, 'modelPosZ', -50, 50).step(0.01).onChange(() => {
  if (window.mainModel) window.mainModel.position.z = params.envModelPosZ;
});
globalFolder.add(params, 'envPosX', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.x = params.envPosX;
});
globalFolder.add(params, 'envPosY', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.y = params.envPosY;
});
globalFolder.add(params, 'envPosZ', -50, 50).step(0.01).onChange(() => {
  if (window.envModel) window.envModel.position.z = params.envPosZ;
});
globalFolder.open();

// Exports
export {
  params,
  scene,
  camera,
  renderer,
  controls,
  gui
};
