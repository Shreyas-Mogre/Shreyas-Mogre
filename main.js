// Main game script (uses story.json and remote background map)
const backgrounds = new Map([
  ["ruins", "ruin_map.png"],
  ["valley", "end.png"],
  ["village", "village.png"],
  ["forest", "forest.png"],
  ["tower", "traders.png"],
  ["summit", "spirit.png"],
  ["sunrise", "desert_start.png"],
  ["night", "crystal_desert.png"]
]);

// Game State
const defaultState = () => ({
  node: "start",
  health: 100,
  rep: 0,
  items: []
});

let state = defaultState();
let story = {};

// Helpers
const $ = sel => document.querySelector(sel);
const el = (tag, props = {}, children = []) => {
  const e = document.createElement(tag);
  Object.assign(e, props);
  for (const c of children) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
};

function setBackground(key) {
  const url = backgrounds.get(key) || backgrounds.get("valley");
  document.body.style.backgroundImage = `url('${url}')`;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1400);
}

// Load story.json
async function loadStory() {
  try {
    const res = await fetch("story.json");
    story = await res.json();
  } catch (e) {
    console.error("Failed to load story.json", e);
    alert("Story data failed to load. Check console for errors.");
  }
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function meetsRequirements(req = {}) {
  if (req.hasItems && !req.hasItems.every(it => state.items.includes(it))) return false;
  if (req.anyItems && !req.anyItems.some(it => state.items.includes(it))) return false;
  if (typeof req.repMin === 'number' && state.rep < req.repMin) return false;
  if (typeof req.repMax === 'number' && state.rep > req.repMax) return false;
  if (typeof req.healthMin === 'number' && state.health < req.healthMin) return false;
  if (typeof req.healthMax === 'number' && state.health > req.healthMax) return false;
  return true;
}

function applyEffects(effects = {}) {
  if (effects.reset) { state = defaultState(); return; }
  if (typeof effects.health === 'number') state.health = clamp(state.health + effects.health, 0, 100);
  if (typeof effects.rep === 'number') state.rep = clamp(state.rep + effects.rep, -20, 20);
  if (Array.isArray(effects.itemsAdd)) {
    for (const it of effects.itemsAdd) if (!state.items.includes(it)) state.items.push(it);
  }
  if (Array.isArray(effects.itemsRemove)) {
    state.items = state.items.filter(it => !effects.itemsRemove.includes(it));
  }
}

function renderNode(nodeId) {
  const node = story[nodeId];
  if (!node) return alert(`Missing story node: ${nodeId}`);
  state.node = nodeId;

  $("#node-title").textContent = node.title || "";
  $("#node-tag").textContent = node.tag || "";
  $("#story-text").innerHTML = node.text || "";
  setBackground(node.bg);

  const choicesWrap = $("#choices");
  choicesWrap.innerHTML = "";

  for (const ch of node.choices || []) {
    const disabled = ch.requirements && !meetsRequirements(ch.requirements);
    const btn = el("button", {
      className: "choice",
      disabled,
      innerHTML: ch.text
    });
    btn.addEventListener('click', () => {
      if (ch.effects) applyEffects(ch.effects);
      if (state.health <= 0) return gameOver();
      goTo(ch.next);
    });
    choicesWrap.appendChild(btn);
  }

  updateSidebar();
  saveGame(false);
}

function goTo(nodeId) {
  renderNode(nodeId);
}

function gameOver() {
  $("#story-text").innerHTML += `\n\n<span class="muted">Your strength fails; the journey ends here.</span>`;
  const choicesWrap = $("#choices");
  choicesWrap.innerHTML = "";
  const restart = el("button", { className: 'choice', innerHTML: 'Load Last Save' });
  restart.addEventListener('click', () => loadGame());
  const newg = el("button", { className: 'choice', innerHTML: 'New Game' });
  newg.addEventListener('click', () => newGame());
  choicesWrap.append(restart, newg);
  updateSidebar();
}

function updateSidebar() {
  const h = clamp(state.health, 0, 100);
  const repPct = clamp(((state.rep + 20) / 40) * 100, 0, 100);
  $("#bar-health").style.width = `${h}%`;
  $("#bar-rep").style.width = `${repPct}%`;
  $("#val-health").textContent = state.health;
  $("#val-rep").textContent = state.rep;

  const inv = $("#inv-tags");
  inv.innerHTML = "";
  if (!state.items.length) inv.appendChild(el('span', { className: 'muted small', innerText: 'Empty' }));
  for (const it of state.items) inv.appendChild(el('span', { className: 'tag', innerText: it }));
}

// Save / Load
const SAVE_KEY = 'eldoriaSave';

function saveGame(show = true) {
  const payload = JSON.stringify(state);
  localStorage.setItem(SAVE_KEY, payload);
  if (show) toast('Game saved.');
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return toast('No save found.');
  try {
    state = JSON.parse(raw);
    renderNode(state.node || 'start');
    toast('Save loaded.');
  } catch (e) {
    console.error(e);
    toast('Save corrupted. Starting new game.');
    newGame();
  }
}

function exportSave() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'eldoria-save.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSave(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const s = JSON.parse(fr.result);
      if (!s || typeof s !== 'object') throw new Error('Invalid file');
      state = Object.assign(defaultState(), s);
      renderNode(state.node || 'start');
      toast('Save imported.');
    } catch (e) {
      console.error(e);
      alert('Import failed: not a valid save');
    }
  };
  fr.readAsText(file);
}

// Controls & Boot
function newGame() {
  state = defaultState();
  renderNode('start');
  toast('New journey begins.');
}

function bindUI() {
  document.getElementById('btn-new').addEventListener('click', newGame);
  document.getElementById('btn-save').addEventListener('click', () => saveGame(true));
  document.getElementById('btn-load').addEventListener('click', loadGame);
  document.getElementById('btn-export').addEventListener('click', exportSave);
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (file) importSave(file);
    e.target.value = '';
  });
  document.getElementById('btn-help').addEventListener('click', () => document.getElementById('help-modal').showModal());
  document.getElementById('close-help').addEventListener('click', () => document.getElementById('help-modal').close());
}

// Initialize
(async () => {
  await loadStory();
  bindUI();
  renderNode('start');
})();