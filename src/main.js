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
import { startAquarius } from './aquarius.js';
import { startGhostEvent } from './ghostEvent.js';

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

// Vertical rotation limits (prevents looking below floor)
controls.minPolarAngle = Math.PI / 6;    // top limit
controls.maxPolarAngle = Math.PI / 2.1;  // bottom limit (adjust to prevent camera from going too low)

// Distance limits
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


``
/* -------------------- Interaction -------------------- */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const interactables = new Map();
let hovered = null;

const INTERACTIVE_NAMES = [
  'book1','book2','book3','book4','book5','book6','book53',
  'globe','daisy','Chihuahua',
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

function setNightVision(on) {
  if (on) {
    const nightTint = new THREE.Color(0x444444); // dark gray
    scene.traverse(obj => {
      if (obj.material && obj.material.color) {
        // save original
        obj.userData.originalColor = obj.material.color.clone();

        // convert to grayscale + darken
        const c = obj.userData.originalColor;
        const gray = (c.r + c.g + c.b) / 3;
        obj.material.color.setRGB(gray * nightTint.r, gray * nightTint.g, gray * nightTint.b);
      }
    });

    scene.fog = new THREE.Fog(0x222222, 1, 30); // subtle gray fog
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

// -------------------- Ghost Cleanse Button --------------------
let ghostCleanseBtn = null;

function createGhostCleanseButton(onCleanse) {
  // Avoid creating multiple
  if (ghostCleanseBtn) return;

  ghostCleanseBtn = document.createElement('button');
  ghostCleanseBtn.textContent = '✨ Cleanse the Area ✨';
  ghostCleanseBtn.style.cssText = `
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    padding: 15px 30px;
    font-size: 1.1rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(90deg, #ff4444, #ffbb00);
    color: white;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255,200,100,0.6);
    transition: all 0.3s ease;
    z-index: 1000;
  `;

  ghostCleanseBtn.addEventListener('mouseenter', () => {
    ghostCleanseBtn.style.boxShadow = '0 0 40px rgba(255,200,100,0.8)';
    ghostCleanseBtn.style.transform = 'translateX(-50%) scale(1.1)';
  });
  ghostCleanseBtn.addEventListener('mouseleave', () => {
    ghostCleanseBtn.style.boxShadow = '0 0 20px rgba(255,200,100,0.6)';
    ghostCleanseBtn.style.transform = 'translateX(-50%) scale(1)';
  });

  ghostCleanseBtn.addEventListener('click', () => {
    // Play a quick “burn/flash” effect
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: absolute; top:0; left:0; width:100%; height:100%;
      background: radial-gradient(circle, rgba(255,200,100,0.8) 0%, transparent 60%);
      pointer-events: none;
      z-index: 999;
      opacity: 0;
      transition: opacity 0.5s ease-out;
    `;
    document.body.appendChild(flash);
    requestAnimationFrame(() => flash.style.opacity = '1');
    setTimeout(() => flash.style.opacity = '0', 50);
    setTimeout(() => document.body.removeChild(flash), 600);

    onCleanse(); // call the stopGhost and floating reset
    document.body.removeChild(ghostCleanseBtn);
    ghostCleanseBtn = null;
  });

  document.body.appendChild(ghostCleanseBtn);
}




/* -------------------- Loaders & Preloading -------------------- */
const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const bakedTextureMap = { 
  woodFloor:'/images/floor.jpg', 
  room:'/images/walls4k.jpg', 
  Shelf:'/images/shelf.jpg',
  rug:'/images/rug4k.jpg', 
  bookStack:'/images/staticBooks.jpg', 
  chair:'/images/chair.jpg', 
  smallFurniture:'/images/sideTable.jpg', 
  topRoom:'/images/topRoom.jpg', 
  smallLanterninside:'/images/lights.jpg', 
  plants:'/images/plants.jpg', 
  globe:'/images/diffuse.jpg', 
  Chihuahua:'/images/chis.jpg', 
  milk:'/images/milk.jpg', 
  cat:'/images/tekstura_kota.jpg', 
  mug:'/images/mug.jpg', 
  katana:'/images/katana.jpg', 
  ground:'/images/Ground.jpg', 
  daisy:'/images/daisy.jpg', 
  windowOne:'/images/window1.jpg', 
  windowTwo:'/images/window2.jpg', 
  book1:'/images/book1.jpg', 
  book2:'/images/book2.jpg', 
  book3:'/images/book8.jpg', 
  book4:'/images/book4.jpg', 
  book5:'/images/book5.jpg', 
  book6:'/images/book6.jpg', 
  book53:'/images/book7.jpg', 
  mountainDew:'/images/dew.jpg', 
  pot:'/images/daisyPot.jpg', 
  dinky:'/images/dinks.jpg', 
  pillow:'/images/pillow.jpg',
  frame: '/images/frame.jpg'
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
let stopSheep=null, stopDaisy=null, stopGlobe=null, stopEightBall=null, stopFlappy=null, stopAquarius = null, stopGhost = null;
; 

const flappy = createFlappyBook(scene, camera);
const normalBg = new THREE.Color(0xffcaa8);
const sheepBg = new THREE.Color(0x0b1e3f);

// When you want to show the text:


scene.background = normalBg;

function stopAllEvents(){
  if(stopSheep){ stopSheep(); stopSheep=null; scene.background=normalBg; setNightMode(false);}
  if(stopDaisy){ stopDaisy(); stopDaisy=null;}
  if(stopGlobe){ stopGlobe(); stopGlobe=null;}
  if(stopEightBall){ stopEightBall(); stopEightBall=null;}
  if(stopFlappy){ stopFlappy(); stopFlappy=null;}
  if(stopAquarius){ stopAquarius(); stopAquarius=null;}
  if (stopGhost) { stopGhost(); stopGhost = null;
}

 

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

      case 'book1':
        popup.style.display='none';
        const aquariusInstance = startAquarius(scene, camera,hovered);
        stops.aquarius = aquariusInstance.stop;
        break;

      case 'book53':
        popup.style.display = 'none';
        setNightVision(true);

  // Objects to float
        const floatObjs = [];
        preloadedScene.traverse(obj => {
          if (obj.name === 'milk' || obj.name === 'mug' || obj.name === 'Chihuahua' ||obj.name === 'globe' ||obj.name === 'cat' || obj.name === 'mountainDew' || obj.name === 'book4' || obj.name === 'book6') {
            floatObjs.push(obj);
          }
        });

        const ghost = startGhostEvent(scene, floatObjs);
        stopGhost = () => {
        ghost.stop();
        setNightVision(false);
        };
        // Create the “cleanse the area” button
        createGhostCleanseButton(() => {
          stopGhost();
    // optional: play a small particle or sound effect here
        });
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
