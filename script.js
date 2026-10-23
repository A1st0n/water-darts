let score = 0;
let time = 60;
let timer = null;
let plants = [];
let tank = 0;

const plantsDiv = document.getElementById('plants');

function startGame() {
  clearInterval(timer);
  score = 0;
  time = 60;
  tank = 0;
  plants = [];
  plantsDiv.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'plant';
    const plant = { el, water: 20 + Math.floor(Math.random() * 30) };
    el.addEventListener('click', () => waterPlant(plant));
    plantsDiv.appendChild(el);
    plants.push(plant);
  }

  document.getElementById('message').textContent = 'Go!';
  timer = setInterval(tick, 1000);
  draw();
}

function waterPlant(plant) {
  if (!timer || plant.water <= 0 || plant.water >= 100) return;
  plant.water = Math.min(100, plant.water + 20);
  score += 10;
  document.getElementById('message').textContent = plant.water === 100 ? 'Bloom! +10' : 'Splash! +10';
  draw();
  checkEnd();
}

// Missing a plant fills the tank. A full tank pours +10 on every growing plant.
function missPlant(e) {
  if (!timer || e.target !== plantsDiv) return;
  tank += 25;
  document.getElementById('message').textContent = 'Miss! The water went into the tank.';
  if (tank >= 100) {
    tank = 0;
    plants.forEach((p) => {
      if (p.water > 0 && p.water < 100) p.water = Math.min(100, p.water + 10);
    });
    document.getElementById('message').textContent = 'Tank full! Every plant gets +10 water.';
  }
  draw();
  checkEnd();
}

function tick() {
  time--;
  // Growing plants dry out by 1 each second
  plants.forEach((p) => {
    if (p.water > 0 && p.water < 100) p.water--;
  });
  draw();
  checkEnd();
}

function draw() {
  document.getElementById('score').textContent = score;
  document.getElementById('time').textContent = time;
  document.getElementById('tank-fill').style.height = tank + '%';
  plants.forEach((p) => {
    const emoji = p.water >= 100 ? '🌼' : p.water <= 0 ? '🥀' : '🌱';
    p.el.innerHTML = emoji + '<div class="bar" style="width:' + p.water + '%"></div>';
  });
}

function checkEnd() {
  if (plants.every((p) => p.water >= 100)) endGame('You win! Every plant bloomed.');
  else if (plants.some((p) => p.water <= 0)) endGame('A plant wilted. Game over!');
  else if (time <= 0) endGame("Time's up! Game over.");
}

function endGame(msg) {
  clearInterval(timer);
  timer = null;
  document.getElementById('message').textContent = msg + ' Final score: ' + score;
}

function resetGame() {
  clearInterval(timer);
  timer = null;
  score = 0;
  time = 60;
  tank = 0;
  plants = [];
  plantsDiv.innerHTML = '';
  document.getElementById('message').textContent = 'Click the plants to water them before they dry out!';
  draw();
}

// Reticle follows the mouse over the plants
const reticle = document.getElementById('reticle');
plantsDiv.addEventListener('mousemove', (e) => {
  reticle.style.display = 'block';
  reticle.style.left = e.clientX + 'px';
  reticle.style.top = e.clientY + 'px';
});
plantsDiv.addEventListener('mouseleave', () => (reticle.style.display = 'none'));

plantsDiv.addEventListener('click', missPlant);
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('reset-btn').addEventListener('click', resetGame);
