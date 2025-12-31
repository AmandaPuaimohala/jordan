// daisy.js
export function daisyEvent() {
  const audio = new Audio('src/DAISIES.mp3');
  audio.loop = true;
  
  // Start playing
  audio.play();

  // Return a stop function to pause/reset when needed
  return function stop() {
    audio.pause();
    audio.currentTime = 0;
  };
}
