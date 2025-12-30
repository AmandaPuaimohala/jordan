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
