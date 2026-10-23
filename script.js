// Water Darts: water the plants with balloons before they wilt.
const START_TIME = 60;
const START_BALLOONS = 20;
const PLANT_COUNT = 5;

const $ = (id) => document.getElementById(id);
const field = $('field');
const crosshair = $('crosshair');
const cloud = $('cloud');

let score, timeLeft, balloons, tank, plants, timer, rafId, playing;
let pointer = { x: 0, y: 0 };
let cloudX = 0, cloudDir = 1;

function show(screenId) {
  ['start-screen', 'game-screen', 'end-screen'].forEach((id) =>
    $(id).classList.toggle('hidden', id !== screenId));
}

function startGame() {
  score = 0;
  timeLeft = START_TIME;
  balloons = START_BALLOONS;
  tank = 0;
  playing = true;

  // Five plants with random starting hydration between 20 and 50
  $('plants').innerHTML = '';
  plants = [];
  for (let i = 0; i < PLANT_COUNT; i++) {
    const el = document.createElement('div');
    el.className = 'plant';
    el.innerHTML = '<div class="bar"><div></div></div><div class="target"></div><div class="emoji">🌱</div>';
    $('plants').appendChild(el);
    plants.push({ el, hydration: 20 + Math.floor(Math.random() * 31), state: 'alive' });
  }

  show('game-screen');
  const r = field.getBoundingClientRect();
  pointer = { x: r.width / 2, y: r.height / 2 };
  updateHud();

  clearInterval(timer);
  timer = setInterval(tick, 1000);
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(animate);
}

// Runs once per second: count down and dry the plants out
function tick() {
  timeLeft--;
  plants.forEach((p) => {
    if (p.state !== 'alive') return;
    p.hydration--;
    if (p.hydration <= 0) {
      p.hydration = 0;
      p.state = 'wilted';
      toast('A plant wilted! 🥀');
    }
  });
  updateHud();
  checkEnd();
}

// Crosshair wobble + drifting pollution cloud
function animate(t) {
  const aim = aimPoint();
  crosshair.style.left = aim.x + 'px';
  crosshair.style.top = aim.y + 'px';

  const maxX = field.clientWidth - cloud.offsetWidth;
  cloudX += cloudDir * 1.5;
  if (cloudX <= 0 || cloudX >= maxX) cloudDir *= -1;
  cloudX = Math.max(0, Math.min(maxX, cloudX));
  cloud.style.left = cloudX + 'px';

  if (playing) rafId = requestAnimationFrame(animate);
}

// Where the balloon will land: the pointer plus a small wobble
function aimPoint() {
  const s = performance.now() / 1000;
  return { x: pointer.x + Math.sin(s * 3) * 12, y: pointer.y + Math.cos(s * 2.3) * 12 };
}

function movePointer(e) {
  const r = field.getBoundingClientRect();
  pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
}

function throwBalloon(e) {
  if (!playing || balloons <= 0) return;
  // On touch, aim where the finger lands, then the wobble still applies
  if (e.pointerType !== 'mouse') movePointer(e);

  balloons--;
  const r = field.getBoundingClientRect();
  const aim = aimPoint();
  const x = aim.x + r.left;
  const y = aim.y + r.top;
  splash(x - r.left, y - r.top);

  // Obstacle: hitting the pollution cloud costs points
  if (dist(x, y, cloud.getBoundingClientRect()) < cloud.offsetWidth / 2) {
    score = Math.max(0, score - 10);
    toast('Polluted! -10');
    updateHud();
    checkEnd();
    return;
  }

  const hit = plants.find((p) => p.state === 'alive' &&
    dist(x, y, p.el.querySelector('.target').getBoundingClientRect()) <= radius(p));

  if (hit) {
    const d = dist(x, y, hit.el.querySelector('.target').getBoundingClientRect());
    const bullseye = d <= radius(hit) * 0.2;
    hit.hydration += bullseye ? 35 : 20;
    score += bullseye ? 15 : 10;
    toast(bullseye ? 'Bullseye! +15' : 'Hit! +10');
    if (hit.hydration >= 100) {
      hit.hydration = 100;
      hit.state = 'bloomed';
      score += 50;
      toast('Bloom! +50 🌼');
    }
  } else {
    // Missed water drains into the catch tank
    tank += 25;
    if (tank >= 100) {
      tank = 0;
      balloons += 3;
      toast('Tank full! +3 balloons');
    } else {
      toast('Miss: water saved in the tank');
    }
  }
  updateHud();
  checkEnd();
}

function radius(p) {
  return p.el.querySelector('.target').getBoundingClientRect().width / 2;
}

function dist(x, y, rect) {
  return Math.hypot(x - (rect.left + rect.width / 2), y - (rect.top + rect.height / 2));
}

function splash(x, y) {
  const s = document.createElement('div');
  s.className = 'splash';
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  field.appendChild(s);
  setTimeout(() => s.remove(), 500);
}

let toastTimer;
function toast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 900);
}

function updateHud() {
  $('score').textContent = score;
  $('time').textContent = timeLeft;
  $('balloons').textContent = balloons;
  $('tank-pct').textContent = tank;
  $('tank-fill').style.height = tank + '%';
  plants.forEach((p) => {
    p.el.querySelector('.bar div').style.width = p.hydration + '%';
    p.el.className = 'plant ' + p.state + (p.state === 'alive' && p.hydration < 20 ? ' low' : '');
    p.el.querySelector('.emoji').textContent =
      p.state === 'bloomed' ? '🌼' : p.state === 'wilted' ? '🥀' : '🌱';
  });
}

function checkEnd() {
  const wilted = plants.filter((p) => p.state === 'wilted').length;
  const alive = plants.filter((p) => p.state === 'alive').length;

  if (alive === 0 && wilted < 2) return endGame(true, 'Every plant is in bloom. Clean water changes everything.');
  if (wilted >= 2) return endGame(false, 'Two plants wilted. Try to keep every bar out of the red.');
  if (timeLeft <= 0) return endGame(false, 'Time ran out before every plant bloomed.');
  if (balloons <= 0) return endGame(false, 'You ran out of balloons. Misses fill the tank for more!');
}

function endGame(won, msg) {
  playing = false;
  clearInterval(timer);
  $('end-title').textContent = won ? 'You did it! 🎉' : 'Game over';
  $('end-msg').textContent = msg;
  $('final-score').textContent = score;
  show('end-screen');
  if (won) confetti();
}

// Win celebration: falling yellow and blue confetti
function confetti() {
  for (let i = 0; i < 120; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53'][i % 4];
    c.style.animationDuration = 2 + Math.random() * 2 + 's';
    c.style.animationDelay = Math.random() * 0.5 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function resetGame() {
  playing = false;
  clearInterval(timer);
  show('start-screen');
}

field.addEventListener('pointermove', movePointer);
field.addEventListener('pointerdown', throwBalloon);
$('start-btn').addEventListener('click', startGame);
$('again-btn').addEventListener('click', startGame);
$('reset-btn').addEventListener('click', resetGame);
