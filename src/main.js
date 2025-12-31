import './style.scss';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { spamSheep } from './sheep.js';
import { daisyEvent } from './daisy.js';
import { showGlobePlace } from './globe.js';
import { showEightBall } from './eightBall.js';
import { createFlappyBook } from './flappyBook.js';

/* -------------------- Canvas & Core -------------------- */
const canvas = document.querySelector('#experience-canvas');
const sizes = { width: window.innerWidth, height: window.innerHeight };
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffcaa8);

/* -------------------- Camera -------------------- */
const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 100);
camera.position.set(6, 6, 9); // shift left (x=-5), keep height and distance
camera.lookAt(0, 1, 0);       // look at center of the room (y=1)

scene.add(camera);

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

/* -------------------- Enter Screen -------------------- */
const enterScreen = document.createElement('div');
enterScreen.id = 'enterScreen';
enterScreen.innerHTML = `
  <h1>Welcome to Jordan's Reading Room</h1>
  <p>Preparing the room...</p>
  <button id="enterButton">Enter</button>
`;
document.body.appendChild(enterScreen);

const enterButton = document.getElementById('enterButton');

/* -------------------- Interaction -------------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const interactables = new Map();
let hovered = null;

const INTERACTIVE_NAMES = [
  'book1','book2','book3','book4','book5','book6','book53',
  'globe','mug','daisy','Chihuahua',
];

const popupInfo = {
  book1: "This is book 1, full of adventures!",
  book2: "Book 2: mystery awaits.",
  book3: "Go to couch.",
  book4: "Book 4: fun stories inside.",
  book5: "Book 5: secrets revealed.",
  book6: "Flappy",
  book53: "Book 53: the hidden gem.",
  globe: "A tiny globe of the world!",
  mug: "A cute mug for your coffee.",
  daisy: "❤️",
  Chihuahua: "psychic"
};

/* -------------------- Popup HTML -------------------- */
const popup = document.createElement('div');
popup.id = 'popup';
popup.style.cssText = `
  display: none; position: absolute; top:50%; left:50%;
  transform: translate(-50%,-50%);
  background: #1e2a38; color: #fff; padding:25px 30px;
  border-radius:15px; box-shadow:0 8px 20px rgba(0,0,0,0.6);
  font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width:90%; width:600px; text-align:center; transition: all 0.3s ease;
`;
popup.innerHTML = `
  <span id="popup-text" style="display:block; margin-bottom:20px; font-size:1rem;"></span>
  <button id="close-popup" style="
    background: #3b5a7d; color:#fff; border:none; padding:10px 20px;
    border-radius:8px; cursor:pointer; font-size:0.95rem; transition: all 0.2s ease;
  ">Close</button>
`;
document.body.appendChild(popup);

const popupText = document.getElementById('popup-text');
const closeBtn = document.getElementById('close-popup');
closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#577aa1');
closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = '#3b5a7d');

/* -------------------- Night Mode -------------------- */
let nightTint = null;
function setNightMode(on) {
  if (on) {
    nightTint = new THREE.Color(0x1a2b4c);
    scene.traverse(obj => {
      if (obj.material && obj.material.color) {
        obj.userData.originalColor = obj.material.color.clone();
        obj.material.color.lerp(nightTint, 0.95);
      }
    });
    scene.fog = new THREE.Fog(0x0b1e3f, 3, 30);
  } else {
    scene.traverse(obj => {
      if (obj.material && obj.userData.originalColor) {
        obj.material.color.copy(obj.userData.originalColor);
        delete obj.userData.originalColor;
      }
    });
    scene.fog = null;
  }
}

/* -------------------- Loaders & Preloading -------------------- */
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const bakedTextureMap = { 
  woodFloor:'/images/floor.png', room:'/images/walls4k.png', Shelf:'/images/shelf.png',
  rug:'/images/rug4k.png', bookStack:'/images/staticBooks.png', chair:'/images/chair.png', 
  smallFurniture:'/images/sideTable.png', topRoom:'/images/topRoom.png', 
  smallLanterninside:'/images/lights.png', plants:'/images/plants.png', globe:'/images/diffuse.png', 
  Chihuahua:'/images/chis.png', milk:'/images/milk.png', cat:'/images/tekstura_kota.png', 
  mug:'/images/mug.png', katana:'/images/katana.png', grounf:'/images/ground4k.png', 
  daisy:'/images/daisy.png', windowOne:'images/window1.png', windowTwo:'images/window2.png', 
  book1:'/images/book1.png', book2:'/images/book2.png', book3:'/images/book8.png', book4:'/images/book4.png', 
  book5:'/images/book5.png', book6:'/images/book6.png', book53:'/images/book7.png', mountainDew:'/images/dew.png', 
  pot:'/images/daisyPot.png', dinky:'/images/dinks.png', pillow:'images/pillow.png' 
};

const bakedTextures = {};
Object.entries(bakedTextureMap).forEach(([name,path])=>{
  const tex = textureLoader.load(path);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  bakedTextures[name] = tex;
});

let preloadedScene = null;
gltfLoader.load('/models/JordanReadingRoom.glb', (gltf)=>{
  gltf.scene.traverse(child=>{
    if(!child.isMesh) return;
    if(bakedTextures[child.name]){
      child.material = new THREE.MeshBasicMaterial({map:bakedTextures[child.name]});
    }
    if(INTERACTIVE_NAMES.includes(child.name)){
      interactables.set(child, {basePos: child.position.clone(), baseRot: child.rotation.clone()});
    }
  });
  preloadedScene = gltf.scene; // store for later
});

/* -------------------- Event Handlers -------------------- */
let stopSheep=null, stopDaisy=null, stopGlobe=null, stopEightBall=null, stopFlappy=null;
const flappy = createFlappyBook(scene, camera);
const normalBg = new THREE.Color(0xffcaa8);
const sheepBg = new THREE.Color(0x0b1e3f);
scene.background = normalBg;

function stopAllEvents(){
  if(stopSheep){ stopSheep(); stopSheep=null; scene.background=normalBg; setNightMode(false);}
  if(stopDaisy){ stopDaisy(); stopDaisy=null;}
  if(stopGlobe){ stopGlobe(); stopGlobe=null;}
  if(stopEightBall){ stopEightBall(); stopEightBall=null;}
  if(stopFlappy){ stopFlappy(); stopFlappy=null;}
  popup.style.display='none';
}

window.addEventListener('mousemove', e=>{
  mouse.x = (e.clientX / sizes.width)*2-1;
  mouse.y = -(e.clientY / sizes.height)*2+1;
});

/* -------------------- Enter Button -------------------- */
enterButton.addEventListener('click', ()=>{
  enterScreen.style.display='none';
  if(preloadedScene) scene.add(preloadedScene); // add preloaded room
  startTick(); // start animation loop and events
});

/* -------------------- Animation Loop -------------------- */
function startTick(){
  window.addEventListener('click', ()=>{
    if(!hovered) return;
    stopAllEvents();
    switch(hovered.name){
      case 'book3':
        popupText.textContent = popupInfo[hovered.name];
        popup.style.display='block';
        scene.background = sheepBg;
        setNightMode(true);
        stopSheep = spamSheep();
        break;
      case 'daisy':
        popupText.textContent = popupInfo[hovered.name];
        popup.style.display='block';
        stopDaisy = daisyEvent();
        break;
      case 'globe':
        stopGlobe = showGlobePlace(popup);
        break;
      case 'Chihuahua':
        popupText.textContent = popupInfo[hovered.name];
        popup.style.display='block';
        stopEightBall = showEightBall(popup);
        break;
      case 'book6':
        popup.style.display='none';
        flappy.book.onClick();
        stopFlappy = flappy.stopFlappy;
        break;
      default:
        popupText.textContent = popupInfo[hovered.name] || `You clicked: ${hovered.name}`;
        popup.style.display='block';
    }
  });

  closeBtn.addEventListener('click', stopAllEvents);

  window.addEventListener('resize', ()=>{
    sizes.width=window.innerWidth;
    sizes.height=window.innerHeight;
    camera.aspect=sizes.width/sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width,sizes.height);
  });

  const tick = ()=>{
    controls.update();
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects([...interactables.keys()], true);
    hovered = hits.length ? hits[0].object : null;

    interactables.forEach((data, mesh)=>{
      const isHover = mesh === hovered;
      mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, data.basePos.y + (isHover ? 0.3 : 0), 0.1);
      mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, data.baseRot.y + (isHover ? 0 : 0), 0.1);
    });

    document.body.style.cursor = hovered ? 'pointer':'default';
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  tick();
}
