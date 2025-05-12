import { THREE } from './globals.js';
import { scene, camera, gui } from './setup.js';
import { RectAreaLightHelper } from './globals.js';
// === BLOOM MASKING SUPPORT ===
export const darkMaterial = new THREE.MeshBasicMaterial({ color: 'white' });
const materialsBackup = new Map();

export function darkenNonBloomed(obj) {
  if (obj.isMesh && !obj.layers.test(camera.layers)) {
    materialsBackup.set(obj.uuid, obj.material);
    obj.material = darkMaterial;
  }
}

export function restoreMaterials(obj) {
  if (materialsBackup.has(obj.uuid)) {
    obj.material = materialsBackup.get(obj.uuid);
    materialsBackup.delete(obj.uuid);
  }
}

// === LIGHT HELPERS & DEBUG SPHERES ===
let hemiLightHelper, spotLightHelper, rectLightHelper;
const debugSpheres = [];
const debugParams = { showHelpers: false };

function createDebugSphere(position, color = 0xff0000, size = 0.1) {
  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.copy(position);
  sphere.visible = debugParams.showHelpers;
  scene.add(sphere);
  debugSpheres.push(sphere);
  return sphere;
}

function updateLightHelpersVisibility() {
  if (hemiLightHelper) hemiLightHelper.visible = debugParams.showHelpers;
  if (spotLightHelper) spotLightHelper.visible = debugParams.showHelpers;
  if (rectLightHelper) rectLightHelper.visible = debugParams.showHelpers;
  debugSpheres.forEach(s => s.visible = debugParams.showHelpers);
}

// === GLOBAL LIGHTING ===
export let hemiLight = null;

export function applyGlobalLighting() {
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.25);
  scene.add(hemiLight);

  hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
  hemiLightHelper.visible = debugParams.showHelpers;
  scene.add(hemiLightHelper);
  createDebugSphere(hemiLight.position, 0x0077ff); // Blue sphere

  const folder = gui.addFolder('Global Light');
  folder.add(hemiLight, 'intensity', 0, 2).step(0.01).name('Intensity');

  folder.addColor({ sky: '#ffffff' }, 'sky').name('Sky Color')
    .onChange(val => hemiLight.color.set(val));

  folder.addColor({ ground: '#444444' }, 'ground').name('Ground Color')
    .onChange(val => hemiLight.groundColor.set(val));

  folder.add(hemiLight.position, 'x', -50, 50).step(0.1).name('Pos X');
  folder.add(hemiLight.position, 'y', -50, 50).step(0.1).name('Pos Y');
  folder.add(hemiLight.position, 'z', -50, 50).step(0.1).name('Pos Z');
  folder.open();
}

// === SUBJECT LIGHTING ===
export function applyLightingToSubject() {
  const light = new THREE.SpotLight(0xffffff, 1.5, 100, Math.PI / 6, 0.3, 1);
  light.position.set(0, 10, 0);
  light.target.position.set(0, 0, 0);

  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0001;

  scene.add(light);
  scene.add(light.target);

  spotLightHelper = new THREE.SpotLightHelper(light);
  spotLightHelper.visible = debugParams.showHelpers;
  scene.add(spotLightHelper);

  createDebugSphere(light.position, 0xff0000); // Red = light
  createDebugSphere(light.target.position, 0x00ff00); // Green = target

  const folder = gui.addFolder('Subject Light');
  folder.add(light, 'intensity', 0, 5).step(0.1).name('Intensity');
  folder.add(light.position, 'x', -20, 20).step(0.1).name('Pos X');
  folder.add(light.position, 'y', 0, 20).step(0.1).name('Pos Y');
  folder.add(light.position, 'z', -20, 20).step(0.1).name('Pos Z');

  folder.add(light.rotation, 'x', -Math.PI, Math.PI).step(0.01).name('Rot X');
  folder.add(light.rotation, 'y', -Math.PI, Math.PI).step(0.01).name('Rot Y');
  folder.add(light.rotation, 'z', -Math.PI, Math.PI).step(0.01).name('Rot Z');
  folder.open();
}

// === ENVIRONMENT LIGHTING ===
export let rectLight = null;

export function applyEnvironmentLighting() {
  rectLight = new THREE.RectAreaLight(0xffffff, 1, 5, 5);
  rectLight.position.set(100, 100, 0);
  rectLight.lookAt(0, 0, 0);
  scene.add(rectLight);

  rectLightHelper = new THREE.RectAreaLightHelper(rectLight);
  rectLightHelper.visible = debugParams.showHelpers;
  scene.add(rectLightHelper);

  createDebugSphere(rectLight.position, 0xffaa00); // Orange = environment light

  const folder = gui.addFolder('Environment Light');
  folder.add(rectLight, 'intensity', 0, 10).step(0.1).name('Intensity');
  folder.add(rectLight, 'width', 1, 20).step(0.1).name('Width')
    .onChange(val => rectLight.width = val);
  folder.add(rectLight, 'height', 1, 20).step(0.1).name('Height')
    .onChange(val => rectLight.height = val);

  folder.add(rectLight.position, 'x', -100, 100).step(0.1).name('Pos X');
  folder.add(rectLight.position, 'y', -100, 100).step(0.1).name('Pos Y');
  folder.add(rectLight.position, 'z', -100, 100).step(0.1).name('Pos Z');

  folder.add(rectLight.rotation, 'x', -Math.PI, Math.PI).step(0.01).name('Rot X');
  folder.add(rectLight.rotation, 'y', -Math.PI, Math.PI).step(0.01).name('Rot Y');
  folder.add(rectLight.rotation, 'z', -Math.PI, Math.PI).step(0.01).name('Rot Z');
  folder.open();
}

// === DEBUG TOGGLE ===
const debugFolder = gui.addFolder('Debug');
debugFolder.add(debugParams, 'showHelpers').name('Show Light Helpers')
  .onChange(updateLightHelpersVisibility);
debugFolder.open();
