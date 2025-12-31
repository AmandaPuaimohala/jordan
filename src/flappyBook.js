import * as THREE from 'three';

export function createFlappyBook(scene, camera) {
  /* -------------------- BOOK -------------------- */
  const book = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.1, 1.5),
    new THREE.MeshStandardMaterial({ color: 0xffd6e0 })
  );
  book.position.set(1.2, 0.5, 0);
  book.name = 'bookFlap';
  scene.add(book);

  /* -------------------- GAME OBJECTS -------------------- */
  const gameGroup = new THREE.Group();
  scene.add(gameGroup);
  gameGroup.position.set(5, 6, 1);
  gameGroup.scale.set(2, 2, 2); // doubles the size of everything


// Bird as an emoji
const canvas = document.createElement('canvas');
canvas.width = 128;
canvas.height = 128;
const ctx = canvas.getContext('2d');
ctx.font = '100px serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('🐟', 64, 64); // pick any emoji

const texture = new THREE.CanvasTexture(canvas);
const bird = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
bird.scale.set(0.3, 0.3, 1); // adjust size
gameGroup.add(bird);
bird.position.set(-0.4, 0, 0);


  // Pipes
  const pipes = [];

  /* -------------------- STATE -------------------- */
  let running = false;
  let velocity = 0;
  let birdY = 0;
  let score = 0;
  let lastPipeTime = 0;

  const gravity = 0.002;
  const flapPower = 0.04;
  const pipeSpeed = 0.015;

  /* -------------------- HTML Overlay -------------------- */
  const overlayDiv = document.createElement('div');
  overlayDiv.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    color: #ffcc00;
    background: rgba(0,0,0,0.7);
    padding: 20px 30px;
    border-radius: 12px;
    text-align: center;
    display: none;
    z-index: 10;
  `;
  document.body.appendChild(overlayDiv);

  const startButton = document.createElement('button');
  startButton.textContent = "START";
  startButton.style.cssText = `
    display:block;
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 1rem;
    border-radius: 8px;
    border: none;
    cursor: pointer;
  `;
  overlayDiv.appendChild(startButton);

  /* -------------------- INPUT -------------------- */
  function flap() {
    if (!running) return;
    velocity = flapPower;
  }
  window.addEventListener('click', flap);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') flap();
  });

  /* -------------------- GAME LOOP -------------------- */
  function animate(time) {
    if (!running) return;

    // bird physics
    velocity -= gravity;
    birdY += velocity;
    bird.position.y = birdY;

// floor / ceiling
    const floorLimit = -0.7;  // lower floor
    const ceilingLimit = 0.7; // higher ceiling

    if (birdY < floorLimit || birdY > ceilingLimit) {
        gameOver();
        return;
    }


    // spawn pipes
    if (time - lastPipeTime > 1800) {
      spawnPipes();
      lastPipeTime = time;
    }

    // move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.position.x -= pipeSpeed;

      // collision
      if (
        Math.abs(p.position.x - bird.position.x) < 0.12 &&
        Math.abs(p.position.y - bird.position.y) < 0.3
      ) {
        gameOver();
        return;
      }

      // cleanup
      if (p.position.x < -1.5) {
        gameGroup.remove(p);
        pipes.splice(i, 1);
        score++;
      }
    }

    requestAnimationFrame(animate);
  }

  /* -------------------- HELPERS -------------------- */
  function spawnPipes() {
    const gapY = (Math.random() - 0.5) * 0.5;

    const pipeGeo = new THREE.BoxGeometry(0.15, 0.6, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66cc88 });

    const top = new THREE.Mesh(pipeGeo, mat);
    top.position.set(1.2, gapY + 0.6, 0);

    const bottom = new THREE.Mesh(pipeGeo, mat);
    bottom.position.set(1.2, gapY - 0.6, 0);

    pipes.push(top, bottom);
    gameGroup.add(top, bottom);
  }

  function resetGame() {
    birdY = 0;
    velocity = 0;
    bird.position.set(-0.4, 0, 0);

    pipes.forEach(p => gameGroup.remove(p));
    pipes.length = 0;

    score = 0;
    lastPipeTime = 0;
  }

function gameOver() {
  running = false;
  overlayDiv.innerHTML = `
    Game Over!<br>Score: ${score}<br>Click START to play again!
  `;

  // Add START button back
  overlayDiv.appendChild(startButton);

  // Create a close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'CLOSE';
  closeBtn.style.cssText = `
    display:block;
    margin-top: 10px;
    padding: 8px 16px;
    font-size: 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
  `;
  overlayDiv.appendChild(closeBtn);

  closeBtn.addEventListener('click', () => {
    overlayDiv.style.display = 'none';
    stopFlappy(); // stops game
  });

  resetGame();
  gameGroup.visible = false;
  overlayDiv.style.display = 'block';
}


  /* -------------------- START / STOP -------------------- */
  function startFlappy() {
    if (running) return;
    running = true;
    overlayDiv.style.display = 'none';
    resetGame();
    gameGroup.visible = true;
    requestAnimationFrame(animate);
  }

  function stopFlappy() {
    running = false;
    resetGame();
    gameGroup.visible = false;
    overlayDiv.style.display = 'none';
  }

  book.onClick = () => {
    overlayDiv.style.display = 'block';
    overlayDiv.innerHTML = "Face Dinky Portrait and stand behind table. \n Press SPACE to flap!\nClick START to begin!";
    overlayDiv.appendChild(startButton);
  };

  startButton.addEventListener('click', startFlappy);

  /* -------------------- RETURN -------------------- */
  gameGroup.visible = false;
  return {
    book,
    startFlappy,
    stopFlappy,
    gameGroup
  };
}
