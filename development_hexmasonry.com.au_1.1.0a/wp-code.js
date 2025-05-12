
import * as THREE from 'https://esm.sh/three@0.155.0';
import { OrbitControls } from 'https://esm.sh/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'https://esm.sh/three@0.155.0/examples/jsm/libs/lil-gui.module.min.js';
import { RGBELoader } from 'https://esm.sh/three@0.155.0/examples/jsm/loaders/RGBELoader.js';
import { CSS2DRenderer, CSS2DObject } from 'https://esm.sh/three@0.155.0/examples/jsm/renderers/CSS2DRenderer.js';

const container = document.getElementById("threejs-container");
const infoBox = document.getElementById("info-box");

const guiContainer = document.createElement('div');
guiContainer.style.position = 'absolute';
guiContainer.style.top = '10px';
guiContainer.style.right = '10px';
guiContainer.style.zIndex = '100';
container.appendChild(guiContainer);

const scene = new THREE.Scene();

const rgbeLoader = new RGBELoader();
rgbeLoader.load('https://floralwhite-wasp-616415.hostingersite.com/wp-content/kloofendal_48d_partly_cloudy_puresky_1k.hdr', (hdrTexture) => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = hdrTexture;
    scene.environment = hdrTexture;
});

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambient);

const gui = new GUI({ width: 300, title: "Scene Controls", container: guiContainer });
const lightFolder = gui.addFolder('Directional Light');
lightFolder.add(light, 'intensity', 0, 2).name('Intensity');
lightFolder.add(light.position, 'x', -10, 10).name('Position X');
lightFolder.add(light.position, 'y', -10, 10).name('Position Y');
lightFolder.add(light.position, 'z', -10, 10).name('Position Z');
lightFolder.open();

const ambientFolder = gui.addFolder('Ambient Light');
ambientFolder.add(ambient, 'intensity', 0, 1).name('Intensity');
ambientFolder.open();

const settings = { rotationSpeed: 0.003 };
const rotationFolder = gui.addFolder('Rotation Speed');
rotationFolder.add(settings, 'rotationSpeed', 0, 0.1).name('Speed').step(0.001);
rotationFolder.open();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let model = null;
let connectorLine = null;
let clickedPoint = null;
let clickedPointRef = null;

const infoLabel = new CSS2DObject(infoBox);
infoLabel.visible = false;
scene.add(infoLabel);

const modelUrl = 'https://floralwhite-wasp-616415.hostingersite.com/serve-model.php';
fetch(modelUrl)
    .then(res => res.ok ? res.arrayBuffer() : Promise.reject("Network error"))
    .then(buffer => new GLTFLoader().parseAsync(buffer, ''))
    .then(gltf => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    scene.add(model);
})
    .catch(err => {
    console.error("Error loading model:", err);
    infoBox.textContent = "Error loading model";
    infoBox.style.display = 'block';
    infoBox.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('click', (event) => {
    if (!model) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        clickedPoint = intersection.point.clone();
        clickedPointRef = new THREE.Object3D();
        model.attach(clickedPointRef);
        clickedPointRef.position.copy(model.worldToLocal(clickedPoint.clone()));

        const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const hitMarker = new THREE.Mesh(markerGeometry, markerMaterial);
        hitMarker.position.copy(clickedPoint);
        scene.add(hitMarker);

        const offset = new THREE.Vector3(0, 1.5, 0);
        infoLabel.position.copy(clickedPoint.clone().add(offset));
        infoLabel.visible = true;

        document.getElementById('object-info').textContent = "You clicked an object!";

        if (connectorLine) scene.remove(connectorLine);

        const rect = infoBox.getBoundingClientRect();
        const x = rect.left + rect.width;
        const y = rect.top + rect.height;
        const ndcX = (x / window.innerWidth) * 2 - 1;
        const ndcY = -(y / window.innerHeight) * 2 + 1;
        const projectedVec = new THREE.Vector3(ndcX, ndcY, 0.5);
        projectedVec.unproject(camera);

        const points = [clickedPoint.clone(), projectedVec];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x000000 });
        connectorLine = new THREE.Line(geometry, material);
        scene.add(connectorLine);
    }
});

function updateConnectorLine() {
    if (connectorLine && clickedPointRef && infoLabel.visible) {
        const modelPoint = clickedPointRef.getWorldPosition(new THREE.Vector3());

        const rect = infoBox.getBoundingClientRect();
        const x = rect.left + rect.width;
        const y = rect.top + rect.height;
        const ndcX = (x / window.innerWidth) * 2 - 1;
        const ndcY = -(y / window.innerHeight) * 2 + 1;
        const projectedVec = new THREE.Vector3(ndcX, ndcY, 0.5);
        projectedVec.unproject(camera);

        const points = [modelPoint, projectedVec];
        connectorLine.geometry.setFromPoints(points);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (model) model.rotation.y += settings.rotationSpeed;
    controls.update();
    updateConnectorLine();
    labelRenderer.render(scene, camera);
    renderer.render(scene, camera);
}

animate();
