let score = 0;
let time = 60;
let timer = null;
let plants = [];
let tank = 0;
let milestoneIdx = 0;

// time: seconds per round, dry: water lost per second, tankStep: tank fill per miss
const DIFFICULTY = {
  easy:   { time: 75, dry: 1, tankStep: 34 },
  normal: { time: 60, dry: 1, tankStep: 25 },
  hard:   { time: 40, dry: 2, tankStep: 20 },
};
let mode = DIFFICULTY.normal;

const MILESTONES = [
  { score: 50,  msg: 'Nice start! Every drop counts.' },
  { score: 100, msg: 'Halfway there! Keep that water flowing.' },
  { score: 150, msg: 'Almost done! The garden is thriving.' },
];

// ponytail: Web Audio beeps instead of sound files, swap in Pixabay clips if wanted
let audio;
function beep(freq, ms) {
  audio = audio || new AudioContext();
  const o = audio.createOscillator(), g = audio.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.2, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + ms / 1000);
}

const plantsDiv = document.getElementById('plants');

function startGame() {
  clearInterval(timer);
  mode = DIFFICULTY[document.getElementById('difficulty').value];
  score = 0;
  time = mode.time;
  tank = 0;
  milestoneIdx = 0;
  plants = [];
  plantsDiv.innerHTML = '';

  for (let i = 0; i < 5; i++) {
    const el = document.createElement('div');
    el.className = 'plant';
    const plant = { el, water: 20 + Math.floor(Math.random() * 30) };
    el.addEventListener('click', (e) => waterPlant(plant, e));
    plantsDiv.appendChild(el);
    plants.push(plant);
  }

  document.getElementById('message').textContent = 'Go!';
  timer = setInterval(tick, 1000);
  draw();
}

function waterPlant(plant, e) {
  if (!timer || plant.water <= 0 || plant.water >= 100) return;
  plant.water = Math.min(100, plant.water + 20);
  score += 10;
  splash(e.clientX, e.clientY);
  if (plant.water === 100) {
    document.getElementById('message').textContent = 'Bloom! +10';
    beep(880, 300);
    // Bloomed plants are collected: pop, then leave the page
    plant.el.classList.add('bloomed');
    setTimeout(() => plant.el.remove(), 500);
  } else {
    document.getElementById('message').textContent = 'Splash! +10';
    beep(600, 100);
  }
  checkMilestone();
  draw();
  checkEnd();
}

// A water drop appears where you clicked and removes itself after its animation
function splash(x, y) {
  const drop = document.createElement('span');
  drop.className = 'splash';
  drop.textContent = '💧';
  drop.style.left = x + 'px';
  drop.style.top = y + 'px';
  document.body.appendChild(drop);
  drop.addEventListener('animationend', () => drop.remove());
}

function checkMilestone() {
  const m = MILESTONES[milestoneIdx];
  if (m && score >= m.score) {
    document.getElementById('message').textContent = m.msg;
    milestoneIdx++;
  }
}

// Missing a plant fills the tank. A full tank pours +10 on every growing plant.
function missPlant(e) {
  if (!timer || e.target !== plantsDiv) return;
  tank += mode.tankStep;
  beep(200, 150);
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
    if (p.water > 0 && p.water < 100) p.water = Math.max(0, p.water - mode.dry);
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
  beep(msg.startsWith('You win') ? 1000 : 150, 500);
  document.getElementById('message').textContent = msg + ' Final score: ' + score;
}

function resetGame() {
  clearInterval(timer);
  timer = null;
  score = 0;
  time = DIFFICULTY[document.getElementById('difficulty').value].time;
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
