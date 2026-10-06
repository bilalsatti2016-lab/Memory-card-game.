(() => {
  const EMOJIS = ['🐶','🐱','🦊','🐼','🐸','🦁','🐵','🐙','🦄','🐢','🦋','🐳','🍎','🍕','🚀','⚽','🎸','🌈',
                  '🐯','🐰','🐨','🐧','🦉','🐝','🍓','🍔','🍩','🌵','🌻','⭐','🎲','🎧','🚲','🎈'];

  const boardEl = document.getElementById('board');
  const movesEl = document.getElementById('moves');
  const timeEl = document.getElementById('time');
  const bestEl = document.getElementById('best');
  const sizeEl = document.getElementById('size');
  const overlay = document.getElementById('overlay');
  const summaryEl = document.getElementById('summary');

  let first = null, second = null, lock = false;
  let moves = 0, matched = 0, totalPairs = 0;
  let timer = null, seconds = 0, started = false;

  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const bestKey = n => `memory-best-${n}`;

  function loadBest() {
    try {
      const b = localStorage.getItem(bestKey(sizeEl.value));
      bestEl.textContent = b ? `${b} moves` : '–';
    } catch { bestEl.textContent = '–'; }
  }

  function saveBest() {
    try {
      const key = bestKey(sizeEl.value);
      const prev = Number(localStorage.getItem(key));
      if (!prev || moves < prev) localStorage.setItem(key, moves);
    } catch {}
    loadBest();
  }

  // Fisher–Yates shuffle
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startTimer() {
    started = true;
    timer = setInterval(() => {
      seconds++;
      timeEl.textContent = fmt(seconds);
    }, 1000);
  }

  function newGame() {
    clearInterval(timer);
    overlay.classList.remove('show');
    first = second = null;
    lock = false;
    moves = matched = seconds = 0;
    started = false;
    movesEl.textContent = '0';
    timeEl.textContent = '0:00';
    loadBest();

    const [rows, cols] = sizeEl.value.split('x').map(Number);
    totalPairs = (rows * cols) / 2;
    const symbols = shuffle([...EMOJIS]).slice(0, totalPairs);
    const deck = shuffle([...symbols, ...symbols]);

    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.innerHTML = '';
    deck.forEach(symbol => {
      const card = document.createElement('button');
      card.className = 'card';
      card.dataset.symbol = symbol;
      card.setAttribute('aria-label', 'Hidden card');
      card.innerHTML =
        `<div class="inner">
           <div class="face back">?</div>
           <div class="face front">${symbol}</div>
         </div>`;
      card.addEventListener('click', () => flip(card));
      boardEl.appendChild(card);
    });
  }

  function flip(card) {
    if (lock || card === first ||
        card.classList.contains('flipped') ||
        card.classList.contains('matched')) return;

    if (!started) startTimer();

    card.classList.add('flipped');
    card.setAttribute('aria-label', card.dataset.symbol);

    if (!first) { first = card; return; }

    second = card;
    moves++;
    movesEl.textContent = moves;
    lock = true;

    if (first.dataset.symbol === second.dataset.symbol) {
      first.classList.replace('flipped', 'matched');
      second.classList.replace('flipped', 'matched');
      matched++;
      resetTurn();
      if (matched === totalPairs) win();
    } else {
      setTimeout(() => {
        [first, second].forEach(c => {
          c.classList.remove('flipped');
          c.setAttribute('aria-label', 'Hidden card');
        });
        resetTurn();
      }, 800);
    }
  }

  function resetTurn() {
    first = second = null;
    lock = false;
  }

  function confetti() {
    const colors = ['#6c5ce7', '#55efc4', '#ffeaa7', '#fd79a8', '#74b9ff'];
    for (let i = 0; i < 80; i++) {
      const p = document.createElement('i');
      p.className = 'confetti';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = (2 + Math.random() * 2) + 's';
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 5000);
    }
  }

  function win() {
    clearInterval(timer);
    confetti();
    saveBest();
    summaryEl.textContent = `You finished in ${moves} moves and ${fmt(seconds)}.`;
    setTimeout(() => overlay.classList.add('show'), 500);
  }

  document.getElementById('restart').addEventListener('click', newGame);
  document.getElementById('again').addEventListener('click', newGame);
  sizeEl.addEventListener('change', newGame);

  // Theme: saved choice, else follow the system setting
  const themeBtn = document.getElementById('theme');
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    themeBtn.textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('memory-theme'); } catch {}
  applyTheme(savedTheme ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('memory-theme', next); } catch {}
  });

  newGame();
})();