

let sprinkleWild = false;
let soundOn = true;
let audioCtx = null;
const favorites = new Set();
let state = { level: null, order: [], pointer: 0, current: null };

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildDeck(level) {
  let base = DECKS[level].map(q => ({ q, level }));
  if (sprinkleWild && level !== 'wild' && level !== 'mix') base = base.concat(DECKS.wild.map(q => ({ q, level: 'wild' })));
  return shuffle(base);
}
function playClick() {
  if (!soundOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(240, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.08);
  g.gain.setValueAtTime(0.07, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.1);
}

function updateFavLink() {
  const el = document.getElementById('favLink');
  el.textContent = '★ Favorites (' + favorites.size + ')';
  el.classList.toggle('hidden', favorites.size === 0);
}
function updateStarBtn() {
  const btn = document.getElementById('starBtn');
  const isFav = state.current && favorites.has(state.current.q);
  btn.textContent = isFav ? '★' : '☆';
  btn.classList.toggle('active', !!isFav);
}

function applyItem(item) {
  state.current = item;
  document.getElementById('cardText').textContent = item.q;
  const tag = document.getElementById('cardTag');
  tag.textContent = LABELS[item.level];
  tag.className = 'card-tag ' + item.level;
  document.getElementById('progressText').textContent =
    (state.pointer + 1) + ' / ' + state.order.length + ' — ' + LABELS[state.level].toUpperCase() + ' DECK';
  document.getElementById('progressFill').style.width = Math.round(((state.pointer + 1) / state.order.length) * 100) + '%';
  state.pointer++;
  updateStarBtn();
}

function openComplete() {
  document.getElementById('completeText').textContent =
    "You've been through the whole " + LABELS[state.level] + " deck.";
  document.getElementById('completeOverlay').classList.add('active');
}
function closeComplete() { document.getElementById('completeOverlay').classList.remove('active'); }

function startLevel(level) {
  state.level = level; state.order = buildDeck(level); state.pointer = 0;
  const home = document.getElementById('homeScreen'), cardScreen = document.getElementById('cardScreen');
  home.classList.add('exit-left');
  setTimeout(() => {
    home.classList.add('hidden'); home.classList.remove('exit-left');
    cardScreen.classList.remove('hidden'); cardScreen.classList.add('enter-right');
    closeComplete();
    applyItem(state.order[0]);
    setTimeout(() => cardScreen.classList.remove('enter-right'), 400);
  }, 380);
}

function goNext(mode) {
  if (state.pointer >= state.order.length) { openComplete(); return; }
  const item = state.order[state.pointer];
  const cardEl = document.getElementById('card');
  const useFade = item.level === 'wild' || mode === 'skip';
  if (useFade) {
    cardEl.classList.add('fade');
    setTimeout(() => { applyItem(item); cardEl.classList.remove('fade'); }, 150);
  } else {
    cardEl.classList.add('flip');
    setTimeout(() => { applyItem(item); cardEl.classList.remove('flip'); playClick(); }, 160);
  }
}

document.querySelectorAll('.level-btn').forEach(btn => btn.addEventListener('click', () => startLevel(btn.dataset.level)));
document.getElementById('nextBtn').addEventListener('click', () => goNext('next'));
document.getElementById('skipBtn').addEventListener('click', () => goNext('skip'));

document.getElementById('keepGoingBtn').addEventListener('click', () => {
  state.order = buildDeck(state.level); state.pointer = 0;
  closeComplete(); applyItem(state.order[0]);
});
document.getElementById('chooseAnotherBtn').addEventListener('click', () => { closeComplete(); goHome(); });

function goHome() {
  const home = document.getElementById('homeScreen'), cardScreen = document.getElementById('cardScreen');
  cardScreen.classList.add('exit-left');
  setTimeout(() => {
    cardScreen.classList.add('hidden'); cardScreen.classList.remove('exit-left');
    home.classList.remove('hidden'); home.classList.add('enter-right');
    setTimeout(() => home.classList.remove('enter-right'), 400);
  }, 380);
}
document.getElementById('backBtn').addEventListener('click', goHome);

function transition(fromEl, toEl) {
  fromEl.classList.add('exit-left');
  setTimeout(() => {
    fromEl.classList.add('hidden'); fromEl.classList.remove('exit-left');
    toEl.classList.remove('hidden'); toEl.classList.add('enter-right');
    setTimeout(() => toEl.classList.remove('enter-right'), 400);
  }, 380);
}
document.getElementById('titleContinueBtn').addEventListener('click', () => {
  transition(document.getElementById('titleScreen'), document.getElementById('howToScreen'));
});
document.getElementById('startBtn').addEventListener('click', () => {
  transition(document.getElementById('howToScreen'), document.getElementById('homeScreen'));
});
document.getElementById('howToLink').addEventListener('click', () => {
  transition(document.getElementById('homeScreen'), document.getElementById('howToScreen'));
});

document.getElementById('wildToggle').addEventListener('click', function () {
  sprinkleWild = !sprinkleWild; this.classList.toggle('on', sprinkleWild);
});

document.getElementById('soundBtn').addEventListener('click', function () {
  soundOn = !soundOn; this.textContent = soundOn ? '🔊' : '🔇'; this.classList.toggle('active', soundOn);
});

document.getElementById('starBtn').addEventListener('click', function () {
  if (!state.current) return;
  if (favorites.has(state.current.q)) favorites.delete(state.current.q); else favorites.add(state.current.q);
  updateStarBtn(); updateFavLink();
});

function renderFavList() {
  const list = document.getElementById('favList');
  list.innerHTML = '';
  if (favorites.size === 0) { list.innerHTML = '<div class="fav-empty">No favorites yet — tap the star on a card to save it here.</div>'; return; }
  favorites.forEach(q => {
    let lvl = 'open';
    for (const [k, arr] of Object.entries(DECKS)) { if (k !== 'mix' && arr.includes(q)) { lvl = k; break; } }
    const item = document.createElement('div'); item.className = 'fav-item';
    const tag = document.createElement('div'); tag.className = 'card-tag ' + lvl; tag.textContent = LABELS[lvl];
    const p = document.createElement('p'); p.textContent = q;
    item.appendChild(tag); item.appendChild(p); list.appendChild(item);
  });
}
document.getElementById('favLink').addEventListener('click', () => { renderFavList(); document.getElementById('favOverlay').classList.add('active'); });
document.getElementById('favCloseBtn').addEventListener('click', () => document.getElementById('favOverlay').classList.remove('active'));

document.addEventListener('keydown', (e) => {
  const cardScreen = document.getElementById('cardScreen');
  if (cardScreen.classList.contains('hidden')) return;
  if (document.getElementById('completeOverlay').classList.contains('active')) return;
  if (e.code === 'Space' || e.code === 'ArrowRight') { e.preventDefault(); goNext('next'); }
  else if (e.code === 'ArrowLeft') { goNext('skip'); }
});
