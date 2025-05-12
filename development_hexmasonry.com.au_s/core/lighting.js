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
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(hemiLight);

  hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 5);
  hemiLightHelper.visible = debugParams.showHelpers;
  scene.add(hemiLightHelper);

  createDebugSphere(hemiLight.position, 0x0077ff); // Blue = Global light

  const folder = gui.addFolder('Global Light');
  folder.add(hemiLight, 'intensity', 0, 10).step(0.1).name('Intensity');

  folder.addColor({ sky: '#ffffff' }, 'sky').name('Sky Color')
    .onChange(val => hemiLight.color.set(val));
  folder.addColor({ ground: '#444444' }, 'ground').name('Ground Color')
    .onChange(val => hemiLight.groundColor.set(val));

  folder.add(hemiLight.position, 'x', -100, 100).step(0.1).name('Pos X');
  folder.add(hemiLight.position, 'y', -100, 100).step(0.1).name('Pos Y');
  folder.add(hemiLight.position, 'z', -100, 100).step(0.1).name('Pos Z');

  // Dummy rotation (HemisphereLight has no rotation)
  const dummyRot = { x: 0, y: 0, z: 0 };
  folder.add(dummyRot, 'x', -Math.PI, Math.PI).step(0.01).name('Rot X');
  folder.add(dummyRot, 'y', -Math.PI, Math.PI).step(0.01).name('Rot Y');
  folder.add(dummyRot, 'z', -Math.PI, Math.PI).step(0.01).name('Rot Z');

  folder.open();
}

// === SUBJECT LIGHTING ===
export let subjectLight = null;

export function applyLightingToSubject() {
  subjectLight = new THREE.SpotLight(0xffffff, 1.5, 100, Math.PI / 6, 0.3, 1);
  subjectLight.position.set(0, 10, 0);
  subjectLight.target.position.set(0, 0, 0);
  scene.add(subjectLight);
  scene.add(subjectLight.target);

  subjectLight.castShadow = true;
  subjectLight.shadow.mapSize.set(1024, 1024);
  subjectLight.shadow.bias = -0.0001;

  spotLightHelper = new THREE.SpotLightHelper(subjectLight);
  spotLightHelper.visible = debugParams.showHelpers;
  scene.add(spotLightHelper);

  createDebugSphere(subjectLight.position, 0xff0000); // Red = Light
  createDebugSphere(subjectLight.target.position, 0x00ff00); // Green = Target

  const folder = gui.addFolder('Subject Light');
  folder.add(subjectLight, 'intensity', 0, 10).step(0.1).name('Intensity');
  folder.addColor({ color: '#ffffff' }, 'color').name('Light Color')
    .onChange(val => subjectLight.color.set(val));

  folder.add(subjectLight.position, 'x', -100, 100).step(0.1).name('Pos X');
  folder.add(subjectLight.position, 'y', -100, 100).step(0.1).name('Pos Y');
  folder.add(subjectLight.position, 'z', -100, 100).step(0.1).name('Pos Z');

  const dummyRot = { x: 0, y: 0, z: 0 };
  folder.add(dummyRot, 'x', -Math.PI, Math.PI).step(0.01).name('Rot X');
  folder.add(dummyRot, 'y', -Math.PI, Math.PI).step(0.01).name('Rot Y');
  folder.add(dummyRot, 'z', -Math.PI, Math.PI).step(0.01).name('Rot Z');

  folder.open();
}

// === ENVIRONMENT LIGHTING ===
export let rectLight = null;

export function applyEnvironmentLighting() {
  rectLight = new THREE.RectAreaLight(0xffffff, 1, 5, 5);
  rectLight.position.set(100, 100, 0);
  rectLight.lookAt(0, 0, 0);
  scene.add(rectLight);

  rectLightHelper = new RectAreaLightHelper(rectLight);
  rectLightHelper.visible = debugParams.showHelpers;
  scene.add(rectLightHelper);

  createDebugSphere(rectLight.position, 0xffaa00); // Orange = Env light

  const folder = gui.addFolder('Environment Light');
  folder.add(rectLight, 'intensity', 0, 10).step(0.1).name('Intensity');
  folder.addColor({ color: '#ffffff' }, 'color').name('Light Color')
    .onChange(val => rectLight.color.set(val));

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
