import { THREE, GLTFLoader } from './globals.js';
import { scene, camera, renderer, params } from './setup.js';
import {
  applyLightingToSubject,
  applyEnvironmentLighting
} from './lighting.js';

export const clickableMeshes = [];

// Wireframe material setup
const wireframeMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000, 
  wireframe: true   // Enable wireframe mode
});

// Ensure meshes from geometry and apply wireframe if needed
function ensureMeshesFromGeometry(object, defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff })) {
  object.traverse((child, index) => {
    if (!child.isMesh && child.geometry) {
      const mesh = new THREE.Mesh(child.geometry, defaultMaterial);
      mesh.position.copy(child.position);
      mesh.rotation.copy(child.rotation);
      mesh.scale.copy(child.scale);

      // Assign a unique name to each generated mesh
      mesh.name = child.name || `GeneratedMesh_${index}`;
      child.parent.add(mesh);
      child.parent.remove(child);
      console.warn('⚠️ Replaced geometry-only node with mesh:', mesh.name);
    }
  });
}

// Highlight all meshes by adding emissive color (and optionally wireframe)
function highlightAllMeshes(root, highlightColor = 0xffff00) {
  root.traverse((obj, index) => {
    if (obj.isMesh && obj.material) {
      obj.material = obj.material.clone();
      obj.material.emissive = new THREE.Color(highlightColor);
      obj.material.emissiveIntensity = 0.5;

      // Apply wireframe material for debugging and give each mesh a unique name
      obj.material = wireframeMaterial;
      obj.name = obj.name || `WireframeMesh_${index}`;  // Assign unique name to each wireframe
    }
  });
}

// === SUBJECT MODEL ===
const subjectModelUrl = 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php';
const subjectLoader = new GLTFLoader();

fetch(subjectModelUrl, params)
  .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
  .then(buffer => subjectLoader.parseAsync(buffer, ''))
  .then(gltf => {
    const model = gltf.scene;
    model.name = 'MainModel';
    model.scale.setScalar(params.modelScale);
    model.position.set(params.modelPosX, params.modelPosY, params.modelPosZ);

    ensureMeshesFromGeometry(model);

    model.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = true;
        obj.receiveShadow = false;
        obj.layers.set(0); // Main layer (no bloom)
      }
    });

    highlightAllMeshes(model);
    model.traverse((child) => {
      if (child.isMesh) {
        clickableMeshes.push(child);
      }
    });

    scene.add(model);
    //applyLightingToSubject(model);
    window.mainModel = model;
    console.log('✅ Subject model loaded');
  })
  .catch(err => {
    console.error('❌ Error loading subject model', err);
  });

// === ENVIRONMENT MODEL ===
const envModelUrl = 'scene/hexmasonry-mockup-model-mesh.glb';
const envLoader = new GLTFLoader();

envLoader.load(
  envModelUrl,
  gltf => {
    const env = gltf.scene;
    env.name = 'EnvironmentModel';
    env.scale.setScalar(params.envScale);
    env.position.set(params.envPosX, params.envPosY, params.envPosZ);

    ensureMeshesFromGeometry(env);

    env.traverse(obj => {
      if (obj.isMesh && obj.material) {
        obj.castShadow = false;
        obj.receiveShadow = true;
        obj.layers.set(1); // Bloom layer (optional)
        console.log('✅ Mesh found in env:', obj.name || obj);
      } else {
        console.warn('⚠️ Non-mesh object in env:', obj);
      }
    });

    highlightAllMeshes(env);
        env.traverse((child) => {
    if (child.isMesh) {
      clickableMeshes.push(child);
    }
    });


    scene.add(env);
    //applyEnvironmentLighting();
    window.envModel = env;
    console.log('✅ Environment model loaded');
  },
  undefined,
  err => console.error('❌ Error loading environment model', err)
);

// === Resize Handling ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
