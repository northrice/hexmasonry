// build.js
import { THREE, RGBELoader, GLTFLoader } from './globals.js';
import { scene, camera, renderer, params, controls } from './setup.js';
import { Brush, Evaluator, ADDITION } from './globals.js';

let hdrTexture = null;
const uvTestTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

let mesh;

new RGBELoader()
  .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/')
  .load('studio_small_03_2k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    hdrTexture = texture;
    scene.environment = hdrTexture;
    updateMesh();
  });

function createCappedCylinderMesh(radius, height, topSquash, bottomSquash) {
  const cyl = new THREE.CylinderGeometry(radius, radius, height, params.radialSegments, 1, true);

  const top = new THREE.SphereGeometry(
    radius,
    params.sphereWidthSegments,
    params.sphereHeightSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  top.scale(1, topSquash, 1);
  top.translate(0, height / 2, 0);

  const bottom = new THREE.SphereGeometry(
    radius,
    params.sphereWidthSegments,
    params.sphereHeightSegments,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI
  );
  bottom.scale(1, bottomSquash, 1);
  bottom.translate(0, -height / 2, 0);

  const brushC = new Brush(cyl);
  const brushTop = new Brush(top);
  const brushBottom = new Brush(bottom);

  const evalr = new Evaluator();
  const combined = evalr.evaluate(brushC, brushTop, ADDITION);
  const final = evalr.evaluate(combined, brushBottom, ADDITION);

  applyCylindricalUVs(final.geometry);

  const material = new THREE.MeshBasicMaterial({
    map: params.useUVTest ? uvTestTexture : hdrTexture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(final.geometry, material);
  mesh.scale.setScalar(params.meshScale);
  return mesh;
}

function applyCylindricalUVs(geometry) {
  geometry = geometry.toNonIndexed();
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  const height = bbox.max.y - bbox.min.y;

  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    let theta = Math.atan2(z, x);
    let u = (theta + Math.PI) / (2 * Math.PI);
    if (u < 0.05) u += 1;
    u = u % 1;
    const v = (y - bbox.min.y) / height * 0.98 + 0.01;

    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function updateMesh() {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  mesh = createCappedCylinderMesh(
    params.radius,
    params.height,
    params.topSquash,
    params.bottomSquash
  );
  scene.add(mesh);
  window.mesh = mesh;
}

// External model
const modelUrl = 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php';
const loader = new GLTFLoader();
fetch(modelUrl)
  .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
  .then(buffer => loader.parseAsync(buffer, ''))
  .then(gltf => {
    const model = gltf.scene;
    model.scale.setScalar(params.modelScale);
    model.position.set(params.modelPosX, params.modelPosY, params.modelPosZ);
    scene.add(model);
    window.loadedModel = model;
    console.log('✅ Model loaded');
  })
  .catch(err => {
    console.error("Error loading model", err);
  });

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


function updateCamera() {
  const azimuthRad = THREE.MathUtils.degToRad(params.azimuth);
  const phiRad = THREE.MathUtils.degToRad(params.phi);

  const x = params.distance * Math.sin(phiRad) * Math.cos(azimuthRad);
  const y = params.distance * Math.cos(phiRad);
  const z = params.distance * Math.sin(phiRad) * Math.sin(azimuthRad);

  camera.position.set(x, y + params.cameraY, z);
  controls.target.set(0, params.cameraY, 0);
  controls.update();
}

export { 
    updateMesh,
    updateCamera,
};
