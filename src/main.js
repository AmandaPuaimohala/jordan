import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* -------------------- Core -------------------- */
const canvas = document.querySelector('#experience-canvas');

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1e3f);

/* -------------------- Camera -------------------- */
const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, 8);
scene.add(camera);

/* -------------------- Sky -------------------- */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0xffcaa8) },
      bottomColor: { value: new THREE.Color(0xf2f6ff) },
      exponent: { value: 0.7 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float exponent;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 color = mix(bottomColor, topColor, pow(h, exponent));
        gl_FragColor = vec4(color, 1.0);
      }
    `
  })
);
scene.add(sky);

/* -------------------- Renderer -------------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;

/* -------------------- Controls -------------------- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);
controls.minPolarAngle = Math.PI / 6;
controls.maxPolarAngle = Math.PI / 1.7;
controls.minDistance = 4;
controls.maxDistance = 20;

/* -------------------- Interaction -------------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const interactables = new Map();
let hovered = null;

// Objects that can be interacted with
const INTERACTIVE_NAMES = [
  'book1','book2','book3','book4','book5','book6','book53',
  'globe','mug','daisy'
];

// Mapping objects to popup text
const popupInfo = {
  book1: "This is book 1, full of adventures!",
  book2: "Book 2: mystery awaits.",
  book3: "Book 3: a classic tale.",
  book4: "Book 4: fun stories inside.",
  book5: "Book 5: secrets revealed.",
  book6: "Book 6: learn something new!",
  book53: "Book 53: the hidden gem.",
  globe: "A tiny globe of the world!",
  mug: "A cute mug for your coffee.",
  daisy: "A cheerful daisy plant."
};

/* -------------------- Popup HTML -------------------- */
const popup = document.createElement('div');
popup.id = 'popup';
popup.style.cssText = `
  display:none;
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%,-50%);
  background:white;
  padding:20px;
  border-radius:10px;
  box-shadow:0 0 10px rgba(0,0,0,0.5);
  font-family: sans-serif;
`;
popup.innerHTML = `
  <span id="popup-text"></span>
  <br><br>
  <button id="close-popup">Close</button>
`;
document.body.appendChild(popup);

const popupText = document.getElementById('popup-text');
const closeBtn = document.getElementById('close-popup');

closeBtn.addEventListener('click', () => {
  popup.style.display = 'none';
});

/* -------------------- Mouse Events -------------------- */
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / sizes.width) * 2 - 1;
  mouse.y = -(e.clientY / sizes.height) * 2 + 1;
});

window.addEventListener('click', () => {
  if (!hovered) return;

  // Show popup with relevant info
  popupText.textContent = popupInfo[hovered.name] || `You clicked: ${hovered.name}`;
  popup.style.display = 'block';
});

window.addEventListener('click', () => {
  if (!hovered) return;

  // Show popup with relevant info
  popupText.textContent = popupInfo[hovered.name] || `You clicked: ${hovered.name}`;
  popup.style.display = 'block';

  // Spam sheep only for book3 (or whichever book you like)
  if (hovered.name === 'book3') {
    spamSheep();
  }
});


/* -------------------- Loaders -------------------- */
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/* -------------------- Baked Textures -------------------- */
const bakedTextures = {};
const bakedTextureMap = {
woodFloor: '/images/floor.png', 
room: '/images/walls4k.png', 
Shelf: '/images/shelf.png',
rug: '/images/rug4k.png', 
bookStack: '/images/staticBooks.png', 
chair: '/images/chair.png', 
smallFurniture: '/images/sideTable.png', 
topRoom: '/images/topRoom.png', 
smallLanterninside: '/images/lights.png', 
plants: '/images/plants.png', 
globe: '/images/diffuse.png', 
Chihuahua: '/images/chis.png', 
milk : '/images/milk.png', 
cat: '/images/tekstura_kota.png', 
mug: '/images/mug.png', 
katana: '/images/katana.png', 
grounf: '/images/ground4k.png', 
daisy: '/images/daisy.png', 
windowOne: 'images/window1.png', 
windowTwo: 'images/window2.png', 
book1: '/images/book1.png', 
book2: '/images/book2.png', 
book3: '/images/book8.png', 
book4: '/images/book4.png', 
book5: '/images/book5.png', 
book6: '/images/book6.png', 
book53: '/images/book7.png', 
mountainDew: '/images/dew.png', 
pot: '/images/daisyPot.png', 
dinky: '/images/dinks.png'
};

Object.entries(bakedTextureMap).forEach(([name, path]) => {
  const tex = textureLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  bakedTextures[name] = tex;
});



/* -------------------- Model -------------------- */
gltfLoader.load('/models/JordanReadingRoom.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (!child.isMesh) return;

    if (bakedTextures[child.name]) {
      child.material = new THREE.MeshBasicMaterial({
        map: bakedTextures[child.name]
      });
    }

    if (INTERACTIVE_NAMES.includes(child.name)) {
      interactables.set(child, {
        basePos: child.position.clone(),
        baseRot: child.rotation.clone()
      });
    }
  });

  scene.add(gltf.scene);
});

/* -------------------- Resize -------------------- */
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

/* -------------------- Update Loop -------------------- */
const tick = () => {
  controls.update();

  // Raycasting
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([...interactables.keys()]);
  hovered = hits.length ? hits[0].object : null;

  // Hover animation
  interactables.forEach((data, mesh) => {
    const isHover = mesh === hovered;

    mesh.position.y = THREE.MathUtils.lerp(
      mesh.position.y,
      data.basePos.y + (isHover ? 0.3 : 0),
      0.1
    );

    mesh.rotation.y = THREE.MathUtils.lerp(
      mesh.rotation.y,
      data.baseRot.y + (isHover ? 0.0 : 0),
      0.1
    );
  });

  document.body.style.cursor = hovered ? 'pointer' : 'default';

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};

tick();

/* -------------------- Sheep Spam Function -------------------- */
function spamSheep() {
  for (let i = 0; i < 20; i++) { // 20 sheep
    const sheep = document.createElement('div');
    sheep.textContent = '🐑';
    sheep.style.position = 'absolute';
    sheep.style.fontSize = `${Math.random() * 30 + 20}px`;
    sheep.style.left = `${Math.random() * window.innerWidth}px`;
    sheep.style.top = `${Math.random() * window.innerHeight}px`;
    sheep.style.pointerEvents = 'none';
    document.body.appendChild(sheep);

    const animDuration = 2000 + Math.random() * 1000;
    sheep.animate(
      [
        { transform: `translateY(0px)`, opacity: 1 },
        { transform: `translateY(-100px)`, opacity: 0 }
      ],
      { duration: animDuration, easing: 'ease-out' }
    ).onfinish = () => sheep.remove();
  }
}
