
import { Brush, Evaluator, ADDITION } from './globals.js';
import { THREE, RGBELoader } from './globals.js';

let hdrTexture = null;
const uvTestTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');

function createMesh(mesh_params) {
  const cyl = new THREE.CylinderGeometry(mesh_params.radius, mesh_params.radius, mesh_params.height, mesh_params.radialSegments, 1, true);

  const top = new THREE.SphereGeometry(
    mesh_params.radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  top.scale(1, mesh_params.topSquash, 1);
  top.translate(0, mesh_params.height / 2, 0);

  const bottom = new THREE.SphereGeometry(
    mesh_params.radius,
    mesh_params.sphereWidthSegments,
    mesh_params.sphereHeightSegments,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI
  );
  bottom.scale(1, mesh_params.bottomSquash, 1);
  bottom.translate(0, -mesh_params.height / 2, 0);

  const brushC = new Brush(cyl);
  const brushTop = new Brush(top);
  const brushBottom = new Brush(bottom);

  const evalr = new Evaluator();
  const combined = evalr.evaluate(brushC, brushTop, ADDITION);
  const final = evalr.evaluate(combined, brushBottom, ADDITION);

  applyUVs(final.geometry);

  const material = new THREE.MeshBasicMaterial({
    map: mesh_params.useUVTest ? uvTestTexture : hdrTexture,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(final.geometry, material);
  mesh.scale.setScalar(mesh_params.meshScale);

  //Creating sphere at the center of the mesh to position the camera.
  final.geometry.computeBoundingSphere();
  mesh.userData.boundingSphere = final.geometry.boundingSphere;

  return mesh;
}

function applyUVs(geometry) {
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

// Load HDRI — optionally called externally to avoid circular reference
function initHDRI(scene, updateMeshCallback) {
  new RGBELoader()
    .setPath('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/')
    .load('studio_small_03_2k.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      hdrTexture = texture;
      scene.environment = hdrTexture;
      if (updateMeshCallback) updateMeshCallback();
    });
}

export { createMesh, applyUVs, initHDRI };
