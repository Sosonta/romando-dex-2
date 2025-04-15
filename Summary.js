// Summary.js

// 🧠 Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

console.log("✅ Summary.js loaded");

// 🔐 Firebase config (same as your other files)
const firebaseConfig = {
 apiKey: "AIzaSyAftZI2JkFM6GBkANoECCS1V7hapgx3q5w",

  authDomain: "romando-dex-2.firebaseapp.com",

  projectId: "romando-dex-2",

  storageBucket: "romando-dex-2.firebasestorage.app",

  messagingSenderId: "229132141413",

  appId: "1:229132141413:web:d62d5b7654debd5553978c"

};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const typeColors = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC'
};

// Track tabs and summaries
const tabBar = document.getElementById("tab-bar");
const tabContent = document.getElementById("tab-content");
const openTabs = new Map(); // key: dex, value: { tabEl, contentEl }

// Listen for messages from opener
window.addEventListener("message", (event) => {
  console.log("📨 Message received", event.data); // Add this
  const data = event.data;
  if (!data || !data.type || data.type !== "OPEN_SUMMARY") return;

  const dex = data.dex;
  if (openTabs.has(dex)) {
    setActiveTab(dex);
    return;
  }

  createTab(dex);
});

// ✅ Tell the opener you're ready
window.opener?.postMessage({ type: "SUMMARY_READY" }, "*");

function createTab(dex) {
  const tabId = `tab-${dex}`;
  const contentId = `summary-${dex}`;

// Create tab button
const tab = document.createElement("div");
tab.className = "tab";
tab.id = tabId;
tab.textContent = ""; // Clear any existing content

const nameSpan = document.createElement("span");
nameSpan.textContent = `#${dex}`;
tab.appendChild(nameSpan);

// 🛠️ Fix: Enable clicking the tab to activate it
tab.onclick = () => setActiveTab(dex);

// Close button
const closeBtn = document.createElement("span");
closeBtn.className = "close-btn";
closeBtn.textContent = "×";
closeBtn.onclick = (e) => {
  e.stopPropagation();
  closeTab(dex);
};

tab.appendChild(closeBtn);
tabBar.appendChild(tab);

  // Create summary content block
  const content = document.createElement("div");
  content.className = "summary-block";
  content.id = contentId;
  content.textContent = `Summary for Pokémon #${dex}`; // Placeholder

  tabContent.appendChild(content);
  openTabs.set(dex, { tabEl: tab, contentEl: content });
populateSummary(dex, content);
setActiveTab(dex);
}

function setActiveTab(dex) {
  openTabs.forEach(({ tabEl, contentEl }, key) => {
    const active = key === dex;
    tabEl.classList.toggle("active", active);
    contentEl.style.display = active ? "block" : "none";
  });
}

let currentUser = null;

let authIsReady = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authIsReady = true;
    console.log("✅ Firebase Auth ready:", currentUser.uid);
  } else {
    console.warn("❌ User not logged in");
  }
});

async function updateField(field, value, dex) {
  if (!currentUser) {
    console.error("❌ Cannot save — currentUser is null");
    return;
  }

  const userDocRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(userDocRef);
  const data = snap.data();
  const pc = data?.pcPokemon || [];
  const team = data?.teamPokemon || [];

  let index = pc.findIndex(p => p?.dex === dex);
  let targetList = "pcPokemon";

  if (index === -1) {
    index = team.findIndex(p => p?.dex === dex);
    if (index !== -1) {
      targetList = "teamPokemon";
    } else {
      console.warn(`❌ Pokémon #${dex} not found in PC or Team`);
      return;
    }
  }

  const updatedList = targetList === "pcPokemon" ? [...pc] : [...team];

  updatedList[index] = {
    ...updatedList[index],
    [field]: value
  };

  await updateDoc(userDocRef, {
    [targetList]: updatedList
  });
}

// 🔍 Fetch Pokémon base info (name, type, etc.) and build layout
async function populateSummary(dex, container) {
// Wait until Firebase Auth is ready
while (!authIsReady) {
  console.log("⏳ Waiting for Firebase Auth...");
  await new Promise(resolve => setTimeout(resolve, 100));
}
  let maxHP = 0;
  let currentHpInput = null;
  let barFill = null;
  let maxDisplay = null;

  const paddedDex = dex.toString().padStart(3, '0');
  let data = null;
  let isNationalPokemon = false;

  try {
    const q = query(collection(db, "pokemon"), where("Dex Number", "==", dex));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      data = querySnapshot.docs[0].data();
    } else {
      console.warn(`Pokémon #${dex} not found in Firebase. Treating as national.`);
      isNationalPokemon = true;
      data = {
        Name: `National #${dex}`,
        Types: [],
      };
    }

    // Clear and build base content
    container.innerHTML = '';

    let title = null;
    if (!isNationalPokemon) {
      title = document.createElement('h2');
      title.textContent = data.Name || `#${dex}`;
    }

    const image = document.createElement('img');
    image.src = isNationalPokemon
      ? `national-pokemon/${dex}.png`
      : `pokemon-images/${paddedDex}.png`;
    image.alt = `Pokémon ${data.Name}`;
    image.className = 'summary-img';

    const typeBox = document.createElement('div');
    typeBox.className = 'summary-types';
    (data.Types || []).forEach(type => {
      const span = document.createElement('span');
      span.textContent = type;
      span.className = `type-tag type-${type.toLowerCase()}`;
      typeBox.appendChild(span);
    });

    const headerBox = document.createElement('div');
    headerBox.className = 'summary-header';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'summary-image-wrapper';
    imageWrapper.appendChild(image);

    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'summary-info-wrapper';
    if (title) infoWrapper.appendChild(title);
    infoWrapper.appendChild(typeBox);

    headerBox.appendChild(imageWrapper);
    headerBox.appendChild(infoWrapper);
    container.appendChild(headerBox);

    // Fetch user's data for this Pokémon
    const userDocRef = doc(db, "pokeIDs", currentUser.uid);
    const userSnap = await getDoc(userDocRef);
    const userData = userSnap.data();
    const userPC = userData?.pcPokemon || [];
    const userTeam = userData?.teamPokemon || [];

    let target = userPC.find(p => p?.dex === dex);
    let isFromTeam = false;

    if (!target) {
      target = userTeam.find(p => p?.dex === dex);
      if (target) isFromTeam = true;
    }

    if (!target) {
      const err = document.createElement('p');
      err.textContent = `Pokémon #${dex} not found in your PC or Team.`;
      container.appendChild(err);
      return;
    }

if (isNationalPokemon) {
  const nationalBox = document.createElement('div');
  nationalBox.style.display = 'flex';
  nationalBox.style.flexDirection = 'column';
  nationalBox.style.gap = '6px';
  nationalBox.style.marginTop = '6px';

  // Species (top input)
  const speciesInput = document.createElement('input');
  speciesInput.type = 'text';
  speciesInput.placeholder = 'Species';
  speciesInput.value = target?.species || '';
  speciesInput.onchange = async (e) => {
  await updateField("species", e.target.value, dex);
  };
  nationalBox.appendChild(speciesInput);

Object.assign(speciesInput.style, {
  fontSize: '1.5rem',
  fontWeight: '600',
  fontFamily: 'Arial, sans-serif',
  color: '#333',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  padding: '0',
  marginBottom: '24px',
  textAlign: 'left',
  textShadow: 'none'
});

  // Types (side-by-side row)
  const typeRow = document.createElement('div');
  typeRow.style.display = 'flex';
  typeRow.style.gap = '6px';

function applyTypeColor(inputEl) {
  const val = inputEl.value.trim().toLowerCase();
  if (typeColors[val]) {
    inputEl.style.backgroundColor = typeColors[val];
    inputEl.style.color = 'white';
  } else {
    inputEl.style.backgroundColor = '';
    inputEl.style.color = '';
  }
}

const type1Input = document.createElement('input');
type1Input.type = 'text';
type1Input.placeholder = 'Type 1';
type1Input.value = target?.type1 || '';
applyTypeColor(type1Input); // Set initial color
type1Input.onchange = async (e) => {
  const val = e.target.value;
  applyTypeColor(type1Input);
  await updateField("type1", val, dex);
};

const type2Input = document.createElement('input');
type2Input.type = 'text';
type2Input.placeholder = 'Type 2';
type2Input.value = target?.type2 || '';
applyTypeColor(type2Input); // Set initial color
type2Input.onchange = async (e) => {
  const val = e.target.value;
  applyTypeColor(type2Input);
  await updateField("type2", val, dex);
};

typeRow.appendChild(type1Input);
typeRow.appendChild(type2Input);

const sharedTypeStyle = {
  padding: '8px',
  fontSize: '0.9rem',
  borderRadius: '2px',
  boxSizing: 'border-box',
  fontFamily: 'Arial, sans-serif',
  border: 'none',
  textAlign: 'center',
  textShadow: '1px 1px 1px rgba(0,0,0,0.2)',
  fontWeight: 'bold',
  color: 'white'
};
Object.assign(type1Input.style, sharedTypeStyle);
Object.assign(type2Input.style, sharedTypeStyle);

  // Append both to infoWrapper
  nationalBox.appendChild(typeRow);
  infoWrapper.appendChild(nationalBox);
}

// 🏷️ Update tab label to saved name if available
const tabInfo = openTabs.get(dex);
if (tabInfo && tabInfo.tabEl?.childNodes[0]) {
  tabInfo.tabEl.childNodes[0].textContent = target.name || `#${dex}`;
}

  const infoBox = document.createElement('div');
  infoBox.className = 'summary-info';

function labeledInput(label, initialValue, onChange, isTextArea = false, usePlaceholder = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field-wrapper';

  const input = isTextArea ? document.createElement('textarea') : document.createElement('input');
  input.value = initialValue;
  input.onchange = (e) => onChange(e.target.value);

  if (usePlaceholder) {
    input.placeholder = label;
  } else {
    const lbl = document.createElement('label');
    lbl.textContent = label;
    wrapper.appendChild(lbl);
  }

  wrapper.appendChild(input);
  return wrapper;
}

function inputWithDesc(title, value, desc, onValueChange, onDescChange, extraClass = '') {
  const wrapper = document.createElement('div');
wrapper.className = `ability-col ${extraClass}`;

  const inputField = labeledInput(title, value, onValueChange, false, true); // <-- placeholder
  const descField = labeledInput('', desc, onDescChange, true); // no label for desc

  wrapper.appendChild(inputField);
  wrapper.appendChild(descField);
  return wrapper;
}

// Editable fields
// Update HP bar based on stats
function updateHPBar() {
  const base = baseStats?.hp || 0;
  const lv = lvStats?.hp || 0;
  const level = target.level || 1;
  maxHP = 10 + ((base + lv) * 3) + (level * 3);

  const current = Number(currentHpInput?.value || 0);
  const percent = Math.min(100, Math.max(0, (current / maxHP) * 100));

  if (barFill) {
    barFill.style.width = `${percent}%`;

    // 🔄 Change color based on HP %
    if (percent > 60) {
      barFill.style.background = "green";
    } else if (percent > 30) {
      barFill.style.background = "goldenrod"; // yellow
    } else {
      barFill.style.background = "crimson"; // red
    }
  }

  if (maxDisplay) maxDisplay.textContent = ` / ${maxHP}`;
}

const basicRow = document.createElement('div');
basicRow.className = 'inline-fields';

basicRow.appendChild(
  labeledInput("Name", target.name || '', (val) => {
    updateField("name", val, dex);
    const tabInfo = openTabs.get(dex);
    if (tabInfo) {
      tabInfo.tabEl.childNodes[0].textContent = val || `#${dex}`; // updates the visible label part
    }
  }, false, true)
);
basicRow.appendChild(
  labeledInput("Level", target.level || 1, (val) => {
    target.level = Number(val);
    updateField("level", target.level, dex);
    updateHPBar();
  }, false, true)
);
basicRow.appendChild(
  labeledInput("Exp", target.exp || 0, (val) => updateField("exp", Number(val), dex), false, true)
);
basicRow.appendChild(
  labeledInput("Nature", target.nature || '', (val) => updateField("nature", val, dex), false, true)
);

const basicRowSection = document.createElement('div');
basicRowSection.className = 'summary-section';
basicRowSection.appendChild(basicRow);
infoBox.appendChild(basicRowSection);

const abilityRow = document.createElement('div');
abilityRow.className = 'ability-row';

abilityRow.appendChild(
  inputWithDesc(
    "Held Item",
    target.heldItem || '',
    target.heldItemDesc || '',
    (val) => updateField("heldItem", val, dex),
    (val) => updateField("heldItemDesc", val, dex),
    'held' // ✨ extra class
)
);

abilityRow.appendChild(
  inputWithDesc(
    "Basic Ability",
    target.basicAbility || '',
    target.basicAbilityDesc || '',
    (val) => updateField("basicAbility", val, dex),
    (val) => updateField("basicAbilityDesc", val, dex),
    'basic' // ✨ extra class
)
);

abilityRow.appendChild(
  inputWithDesc(
    "Advanced Ability",
    target.advancedAbility || '',
    target.advancedAbilityDesc || '',
    (val) => updateField("advancedAbility", val, dex),
    (val) => updateField("advancedAbilityDesc", val, dex),
    'advanced' // ✨ extra class
)
);

abilityRow.appendChild(
  inputWithDesc(
    "Hyper Ability",
    target.hyperAbility || '',
    target.hyperAbilityDesc || '',
    (val) => updateField("hyperAbility", val, dex),
    (val) => updateField("hyperAbilityDesc", val, dex),
    'hyper' // ✨ extra class
)
);

// ✅ This goes after the loop above
const abilityRowSection = document.createElement('div');
abilityRowSection.className = 'summary-section';
abilityRowSection.appendChild(abilityRow);
infoBox.appendChild(abilityRowSection);

// === STATS GRID ===
const statsBox = document.createElement('div');
statsBox.className = 'stats-grid';

const statLabels = ["HP", "ATK", "DEF", "SATK", "SDEF", "SPD"];
const baseStats = target.baseStats || { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 };
const lvStats = target.lvStats || { hp: 0, atk: 0, def: 0, satk: 0, sdef: 0, spd: 0 };

renderHPSection(target);

function createStatRow(statKey, label) {
  const block = document.createElement('div');
block.className = `stat-block stat-${statKey}`;

  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;

  const inputLabelRow = document.createElement('div');
  inputLabelRow.className = 'stat-input-labels';
  inputLabelRow.innerHTML = `<div>Base</div><div>Lv.</div>`;

  const inputRow = document.createElement('div');
  inputRow.className = 'stat-inputs';

  const baseInput = document.createElement('input');
  baseInput.type = 'number';
  baseInput.value = baseStats[statKey];
  baseInput.onchange = async () => {
    baseStats[statKey] = Number(baseInput.value);
    await saveStatBlock();
    updateStatValue();
    updateEvasionDisplay();
    updateHPBar();
  };

  const lvInput = document.createElement('input');
  lvInput.type = 'number';
  lvInput.value = lvStats[statKey];
  lvInput.onchange = async () => {
    lvStats[statKey] = Number(lvInput.value);
    await saveStatBlock();
    updateStatValue();
    updateEvasionDisplay();
    updateHPBar();
  };

  inputRow.appendChild(baseInput);
  inputRow.appendChild(lvInput);

  const result = document.createElement('div');
  result.className = 'stat-result';
  result.textContent = baseStats[statKey] + lvStats[statKey];

  function updateStatValue() {
    result.textContent = baseStats[statKey] + lvStats[statKey];
  }

  block.appendChild(labelEl);
  block.appendChild(inputLabelRow);
  block.appendChild(inputRow);
  block.appendChild(result);
  statsBox.appendChild(block);
}

async function saveStatBlock() {
  if (!currentUser) {
    console.error("❌ Cannot save stats — currentUser is null");
    return;
  }

  const userDocRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(userDocRef);
  const data = snap.data();
  const pc = data?.pcPokemon || [];
  const team = data?.teamPokemon || [];

  let index = pc.findIndex(p => p?.dex === dex);
  let targetList = "pcPokemon";

  if (index === -1) {
    index = team.findIndex(p => p?.dex === dex);
    if (index !== -1) {
      targetList = "teamPokemon";
    } else {
      console.warn(`❌ Pokémon #${dex} not found in PC or Team`);
      return;
    }
  }

  const updatedList = targetList === "pcPokemon" ? [...pc] : [...team];

  updatedList[index] = {
    ...updatedList[index],
    baseStats,
    lvStats
  };

  await updateDoc(userDocRef, {
    [targetList]: updatedList
  });
}

statLabels.forEach(stat => {
  const key = stat.toLowerCase();
  createStatRow(key, stat);
});

const evasionBox = document.createElement('div');
evasionBox.className = 'evasion-box';

const statSection = document.createElement('div');
statSection.className = 'summary-section';

statSection.appendChild(statsBox);
statSection.appendChild(evasionBox);

infoBox.appendChild(statSection);

// === EVASION SECTION ===

function createEvasionBlock(labelText, className) {
  const block = document.createElement('div');
  block.className = `evasion-block ${className}`;

  const label = document.createElement('label');
  label.textContent = labelText;

  const value = document.createElement('div');
  value.className = 'evasion-value';
  value.textContent = '0';

  block.appendChild(label);
  block.appendChild(value);
  return { block, value };
}

const { block: spdBlock, value: spdEva } = createEvasionBlock('SPD EVA', 'spd');
const { block: defBlock, value: defEva } = createEvasionBlock('DEF EVA', 'def');
const { block: sdefBlock, value: sdefEva } = createEvasionBlock('SDEF EVA', 'sdef');

evasionBox.appendChild(spdBlock);
evasionBox.appendChild(defBlock);
evasionBox.appendChild(sdefBlock);

updateEvasionDisplay(); // ✅ Now it's safe to call

// Function to update evasion display
function updateEvasionDisplay() {
  const stat = (base, lv) => base + lv;

  spdEva.textContent = `${Math.floor(stat(baseStats.spd, lvStats.spd) / 10)}`;
  defEva.textContent = `${Math.floor(stat(baseStats.def, lvStats.def) / 5)}`;
  sdefEva.textContent = `${Math.floor(stat(baseStats.sdef, lvStats.sdef) / 5)}`;
}

// === MOVES SECTION ===
const movesBox = document.createElement('div');
movesBox.className = 'moves-box';

const moves = target.moves || Array(6).fill({ name: '', tag: '', desc: '' });

moves.forEach((move, index) => {
  const moveWrapper = document.createElement('div');
  moveWrapper.className = 'move-wrapper';

  // 🆕 Row to hold both title and tag input
  const nameRow = document.createElement('div');
  nameRow.className = 'move-name-row';

  // Move title input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = `Move ${index + 1}`;
  nameInput.value = move.name || '';
  nameInput.className = 'move-title';
  nameInput.onchange = async (e) => {
    moves[index].name = e.target.value;
    await saveMoves();
  };

  // Small tag input
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.placeholder = 'N/A';
  tagInput.value = move.tag || '';
  tagInput.className = 'move-tag';
  tagInput.onchange = async (e) => {
    moves[index].tag = e.target.value;
    await saveMoves();
  };

// New Field (e.g. PP)
const metaInput = document.createElement('input');
metaInput.type = 'text';
metaInput.placeholder = 'Type';
metaInput.value = move.meta || '';
metaInput.className = 'move-meta';
metaInput.onchange = async (e) => {
  const val = e.target.value.trim().toLowerCase();
  moves[index].meta = e.target.value;
  await saveMoves();

  // ✅ Check if it matches a valid type
  if (typeColors[val]) {
    metaInput.style.backgroundColor = typeColors[val];
    metaInput.style.color = 'white';
  } else {
    metaInput.style.backgroundColor = '';
    metaInput.style.color = '';
  }
};

// Immediately apply color if already set
const typeVal = (move.meta || '').trim().toLowerCase();
if (typeColors[typeVal]) {
  metaInput.style.backgroundColor = typeColors[typeVal];
  metaInput.style.color = 'white';
}

  nameRow.appendChild(nameInput);
  nameRow.appendChild(tagInput);
nameRow.appendChild(metaInput);

  // Move description input
  const descInput = document.createElement('textarea');
  descInput.placeholder = 'Move description...';
  descInput.value = move.desc || '';
  descInput.onchange = async (e) => {
    moves[index].desc = e.target.value;
    await saveMoves();
  };

  moveWrapper.appendChild(nameRow);
  moveWrapper.appendChild(descInput);
  movesBox.appendChild(moveWrapper);
});

const movesSection = document.createElement('div');
movesSection.className = 'summary-section';
movesSection.appendChild(movesBox);
infoBox.appendChild(movesSection);
container.appendChild(infoBox);

// Save moves to Firestore
async function saveMoves() {
  if (!currentUser) {
    console.error("❌ Cannot save moves — currentUser is null");
    return;
  }

  const userDocRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(userDocRef);
  const data = snap.data();
  const pc = data?.pcPokemon || [];
  const team = data?.teamPokemon || [];

  let index = pc.findIndex(p => p?.dex === dex);
  let targetList = "pcPokemon";

  if (index === -1) {
    index = team.findIndex(p => p?.dex === dex);
    if (index !== -1) {
      targetList = "teamPokemon";
    } else {
      console.warn(`❌ Pokémon #${dex} not found in PC or Team`);
      return;
    }
  }

  const updatedList = targetList === "pcPokemon" ? [...pc] : [...team];

  updatedList[index] = {
    ...updatedList[index],
    moves
  };

  await updateDoc(userDocRef, {
    [targetList]: updatedList
  });
}

// 🧪 HP Section
function renderHPSection(target) {
  const hpWrapper = document.createElement('div');
  hpWrapper.className = 'hp-wrapper';

  const hpLabel = document.createElement('label');
  hpLabel.textContent = "HP:";
  hpWrapper.appendChild(hpLabel);

  currentHpInput = document.createElement('input');
  currentHpInput.type = 'number';
  currentHpInput.min = 0;
  currentHpInput.value = target.currentHP || 0;
  currentHpInput.style.width = '50px';

  maxDisplay = document.createElement('span');
  maxDisplay.style.marginLeft = '4px';

  const bar = document.createElement('div');
  bar.className = 'hp-bar';
  barFill = document.createElement('div');
  barFill.className = 'hp-fill';
  bar.appendChild(barFill);

  currentHpInput.onchange = async (e) => {
    const val = Number(e.target.value);
    await updateField("currentHP", val, dex);
    updateHPBar();
  };

  hpWrapper.appendChild(currentHpInput);
  hpWrapper.appendChild(maxDisplay);
const hpSection = document.createElement('div');
hpSection.className = 'summary-section';
hpSection.appendChild(hpWrapper);
hpSection.appendChild(bar);
infoBox.appendChild(hpSection);

  updateHPBar(); // Initial render
}

} catch (error) {
  console.error("❌ Error populating summary:", error);
  const err = document.createElement('p');
  err.textContent = `An error occurred while loading the summary for Pokémon #${dex}.`;
  container.appendChild(err);
}
}

function closeTab(dex) {
  const tabData = openTabs.get(dex);
  if (!tabData) return;

  tabBar.removeChild(tabData.tabEl);
  tabContent.removeChild(tabData.contentEl);
  openTabs.delete(dex);

  // Activate another tab if any remain
  const remaining = Array.from(openTabs.keys());
  if (remaining.length > 0) {
    setActiveTab(remaining[0]);
  }
}
