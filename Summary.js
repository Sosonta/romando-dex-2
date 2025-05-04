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
const statusEffects = {
  "Burned": "Take a tick of damage at the end of your turn. DEF stat is lowered 2 stages.",
  "Frozen": "Cannot use moves or shift. You may use your action to roll DC16 to unfreeze. If hit by damaging Rock, Steel, Fighting, or Fire, unfreeze.",
  "Paralyzed": "At the start of your turn roll a DC6. On fail, you cannot take actions.",
  "Poisoned": "Take a tick of damage at end of turn. SDEF lowered 2 stages.",
  "Badly Poisoned": "Take 5 damage at end of your turn. This value doubles each turn.",
  "Asleep": "Can't take actions. Roll a DC16 at the start of each turn to wake up. DC lowers by 2 each fail. Wake up on taking damage.",
  "Confused": "Roll 1d20 at the start of each turn: (1–10) = take a tick of damage, (11–16) = act normally, (17+) = cured.",
  "Bad Sleep": "Take damage equal to 1/4 current HP at the start of your turn.",
  "None": ""
};

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
  shadow: '#5A4B7F',
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
  speciesInput.classList.add('species-input');
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

// === CAPABILITIES SECTION ===
const capabilitiesSection = document.createElement('div');
capabilitiesSection.className = 'summary-section';

const capHeader = document.createElement('div');
capHeader.style.display = 'flex';
capHeader.style.alignItems = 'center';
capHeader.style.marginBottom = '8px';
capHeader.style.gap = '8px';

const capTitle = document.createElement('h3');
capTitle.textContent = 'Capabilities';
capTitle.style.margin = '0';

const addCapBtn = document.createElement('button');
addCapBtn.textContent = '+';
addCapBtn.style.width = '20px';
addCapBtn.style.height = '20px';
addCapBtn.style.borderRadius = '2px';
addCapBtn.style.border = 'none';
addCapBtn.style.background = '#4caf50';
addCapBtn.style.color = 'white';
addCapBtn.style.cursor = 'pointer';
addCapBtn.style.fontSize = '15px';
addCapBtn.title = 'Add Capability';

capHeader.appendChild(capTitle);
capHeader.appendChild(addCapBtn);
capabilitiesSection.appendChild(capHeader);

const capabilitiesGrid = document.createElement('div');
capabilitiesGrid.style.display = 'grid';
capabilitiesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
capabilitiesGrid.style.gap = '8px';

capabilitiesSection.appendChild(capabilitiesGrid);
infoBox.appendChild(capabilitiesSection);

// Load existing capabilities
const capabilities = Array.isArray(target.capabilities) ? target.capabilities : [];

function saveCapabilities() {
  updateField("capabilities", capabilities, dex);
}

function createCapabilityInput(initial = '') {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.style.background = 'white';
  wrapper.style.borderRadius = '2px';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.padding = '4px';
  wrapper.style.minHeight = '30px';
  wrapper.style.width = '100%';
  wrapper.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = initial;
  input.placeholder = '';
  input.style.padding = '4px';
  input.style.border = 'none';
  input.style.outline = 'none';
  input.style.width = '100%';
  input.style.background = 'transparent';
  input.style.boxSizing = 'border-box';

  input.onchange = async (e) => {
    const index = Array.from(capabilitiesGrid.children).indexOf(wrapper);
    if (index !== -1) {
      capabilities[index] = e.target.value;
      await saveCapabilities();
    }
  };

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '×';
  deleteBtn.style.position = 'absolute';
  deleteBtn.style.top = '3px';
  deleteBtn.style.right = '3px';
  deleteBtn.style.width = '10px';
  deleteBtn.style.height = '10px';
  deleteBtn.style.borderRadius = '2px';
  deleteBtn.style.border = 'none';
  deleteBtn.style.background = 'transparent'; // red
  deleteBtn.style.color = '#f44336';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.fontSize = '14px';
  deleteBtn.style.display = 'flex';
  deleteBtn.style.alignItems = 'center';
  deleteBtn.style.justifyContent = 'center';
  deleteBtn.title = 'Delete capability';

  deleteBtn.onclick = async () => {
    const index = Array.from(capabilitiesGrid.children).indexOf(wrapper);
    if (index !== -1) {
      capabilities.splice(index, 1);
      wrapper.remove();
      await saveCapabilities();
    }
  };

  wrapper.appendChild(input);
  wrapper.appendChild(deleteBtn);
  capabilitiesGrid.appendChild(wrapper);
}

// Load existing ones
capabilities.forEach(cap => createCapabilityInput(cap));

// Add new on "+" click
addCapBtn.addEventListener('click', () => {
  capabilities.push('');
  createCapabilityInput('');
  saveCapabilities();
});

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

// Add this above createStatRow
const stages = {
  hp: 0,
  atk: 0,
  def: 0,
  satk: 0,
  sdef: 0,
  spd: 0
};

const stageValueElements = {};
const resultElements = {};

// Stage multipliers
function getStageMultiplier(stage) {
  switch (stage) {
    case -6: return 0.4;
    case -5: return 0.5;
    case -4: return 0.6;
    case -3: return 0.7;
    case -2: return 0.8;
    case -1: return 0.9;
    case 0: return 1.0;
    case 1: return 1.2;
    case 2: return 1.4;
    case 3: return 1.6;
    case 4: return 1.8;
    case 5: return 2.0;
    case 6: return 2.2;
    default: return 1.0;
  }
}

function recolorStage(stageValueEl, stage) {
  if (stage > 0) {
    stageValueEl.style.color = 'white';
  } else if (stage < 0) {
    stageValueEl.style.color = 'white';
  } else {
    stageValueEl.style.color = 'white';
  }
}

function recalcStat(statKey) {
  const base = baseStats[statKey] || 0;
  const lv = lvStats[statKey] || 0;
  const stage = stages[statKey] || 0;

  const statSum = base + lv;
  const multiplier = getStageMultiplier(stage);
  const finalStat = Math.floor(statSum * multiplier);

  resultElements[statKey].textContent = finalStat;
  stageValueElements[statKey].textContent = stage > 0 ? "+" + stage : stage.toString();
  recolorStage(stageValueElements[statKey], stage);
  updateEvasionDisplay();
}

function createStatRow(statKey, label) {
  const block = document.createElement('div');
  block.className = `stat-block stat-${statKey}`;

  const stageWrapper = document.createElement('div');
  stageWrapper.className = 'stage-wrapper';
  stageWrapper.style.display = 'flex';
  stageWrapper.style.flexDirection = 'row';
  stageWrapper.style.alignItems = 'center';
  stageWrapper.style.justifyContent = 'space-between';
  stageWrapper.style.gap = '4px';
  stageWrapper.style.marginBottom = '4px';

  const stageValue = document.createElement('div');
  stageValue.textContent = '0';
  stageValue.style.fontWeight = 'bold';
  stageValue.style.marginBottom = '2px';

  const upButton = document.createElement('button');
  upButton.textContent = '▲';
  upButton.style.fontSize = '10px';
  upButton.style.lineHeight = '10px';
  upButton.style.marginBottom = '2px';
  upButton.style.padding = '2px';
  upButton.style.cursor = 'pointer';
  upButton.onclick = () => {
    if (stages[statKey] < 6) {
      stages[statKey]++;
      recalcStat(statKey);
    }
  };

  const downButton = document.createElement('button');
  downButton.textContent = '▼';
  downButton.style.fontSize = '10px';
  downButton.style.lineHeight = '10px';
  downButton.style.padding = '2px';
  downButton.style.cursor = 'pointer';
  downButton.onclick = () => {
    if (stages[statKey] > -6) {
      stages[statKey]--;
      recalcStat(statKey);
    }
  };

  stageWrapper.appendChild(downButton);
  stageWrapper.appendChild(stageValue);
  stageWrapper.appendChild(upButton);
  block.appendChild(stageWrapper);
  stageValueElements[statKey] = stageValue;

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
    recalcStat(statKey);
  };

  const lvInput = document.createElement('input');
  lvInput.type = 'number';
  lvInput.value = lvStats[statKey];
  lvInput.onchange = async () => {
    lvStats[statKey] = Number(lvInput.value);
    await saveStatBlock();
    recalcStat(statKey);
  };

  inputRow.appendChild(baseInput);
  inputRow.appendChild(lvInput);

  const result = document.createElement('div');
  result.className = 'stat-result';
  result.textContent = baseStats[statKey] + lvStats[statKey];
  resultElements[statKey] = result;

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
  const stat = (base, lv, stage) => Math.floor((base + lv) * getStageMultiplier(stage));

  spdEva.textContent = `${Math.floor(stat(baseStats.spd, lvStats.spd, stages.spd) / 10)}`;
  defEva.textContent = `${Math.floor(stat(baseStats.def, lvStats.def, stages.def) / 5)}`;
  sdefEva.textContent = `${Math.floor(stat(baseStats.sdef, lvStats.sdef, stages.sdef) / 5)}`;
}

// === MOVES SECTION ===
const movesBox = document.createElement('div');
movesBox.className = 'moves-box';

const moves = Array.isArray(target.moves) && target.moves.length === 6
  ? target.moves
  : Array.from({ length: 6 }, () => ({ name: '', tag: '', meta: '', ac: '', frequency: '', range: '', desc: '' }));

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
  tagInput.placeholder = 'xdx + x';
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

const extraRow = document.createElement('div');
extraRow.className = 'move-extra-row';

// AC Input
const acInput = document.createElement('input');
acInput.type = 'text';
acInput.placeholder = 'AC';
acInput.value = move.ac || '';
acInput.className = 'move-ac';
acInput.onchange = async (e) => {
  moves[index].ac = e.target.value;
  await saveMoves();
};

// Frequency Input
const freqInput = document.createElement('input');
freqInput.type = 'text';
freqInput.placeholder = 'Frequency';
freqInput.value = move.frequency || '';
freqInput.className = 'move-frequency';
freqInput.onchange = async (e) => {
  moves[index].frequency = e.target.value;
  await saveMoves();
};

// Range Input
const rangeInput = document.createElement('input');
rangeInput.type = 'text';
rangeInput.placeholder = 'Range';
rangeInput.value = move.range || '';
rangeInput.className = 'move-range';
rangeInput.onchange = async (e) => {
  moves[index].range = e.target.value;
  await saveMoves();
};

extraRow.appendChild(acInput);
extraRow.appendChild(freqInput);
extraRow.appendChild(rangeInput);

  // Move description input
  const descInput = document.createElement('textarea');
  descInput.placeholder = 'Move description...';
  descInput.value = move.desc || '';
  descInput.onchange = async (e) => {
    moves[index].desc = e.target.value;
    await saveMoves();
  };

  moveWrapper.appendChild(nameRow);
  moveWrapper.appendChild(extraRow);
  moveWrapper.appendChild(descInput);
  movesBox.appendChild(moveWrapper);
});

const movesSection = document.createElement('div');
movesSection.className = 'summary-section';
movesSection.appendChild(movesBox);
infoBox.appendChild(movesSection);
container.appendChild(infoBox);

// === 📝 Notes Button and Modal ===
const notesButton = document.createElement('button');
notesButton.textContent = 'Notes';
notesButton.style.position = 'absolute';
notesButton.style.top = '8px';
notesButton.style.right = '8px';
notesButton.style.zIndex = '20';
notesButton.style.padding = '6px 10px';
notesButton.style.border = 'none';
notesButton.style.borderRadius = '2px';
notesButton.style.background = '#444';
notesButton.style.color = 'white';
notesButton.style.fontSize = '14px';
notesButton.style.cursor = 'pointer';
notesButton.title = 'Open Notes';

container.style.position = 'relative';
container.appendChild(notesButton);

const modalBackdrop = document.createElement('div');
modalBackdrop.style.position = 'fixed';
modalBackdrop.style.top = '0';
modalBackdrop.style.left = '0';
modalBackdrop.style.width = '100vw';
modalBackdrop.style.height = '100vh';
modalBackdrop.style.background = 'rgba(0,0,0,0.5)';
modalBackdrop.style.display = 'none';
modalBackdrop.style.alignItems = 'center';
modalBackdrop.style.justifyContent = 'center';
modalBackdrop.style.zIndex = '100';

const modalBox = document.createElement('div');
modalBox.style.background = 'white';
modalBox.style.padding = '16px';
modalBox.style.borderRadius = '4px';
modalBox.style.maxWidth = '400px';
modalBox.style.width = '80%';
modalBox.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
modalBox.style.display = 'flex';
modalBox.style.flexDirection = 'column';
modalBox.style.gap = '8px';

const modalTitle = document.createElement('h3');
modalTitle.textContent = ``;
modalTitle.style.marginTop = '0';

const notesArea = document.createElement('textarea');
notesArea.style.width = '100%';
notesArea.style.height = '150px';
notesArea.placeholder = '';

const saveNoteBtn = document.createElement('button');
saveNoteBtn.textContent = 'Save';
saveNoteBtn.style.alignSelf = 'flex-end';
saveNoteBtn.style.padding = '6px 12px';
saveNoteBtn.style.background = '#444';
saveNoteBtn.style.color = 'white';
saveNoteBtn.style.border = 'none';
saveNoteBtn.style.borderRadius = '4px';
saveNoteBtn.style.cursor = 'pointer';

modalBox.appendChild(modalTitle);
modalBox.appendChild(notesArea);
modalBox.appendChild(saveNoteBtn);
modalBackdrop.appendChild(modalBox);
document.body.appendChild(modalBackdrop);

notesButton.onclick = () => {
  notesArea.value = target.notes || '';
  modalBackdrop.style.display = 'flex';
};

modalBackdrop.onclick = (e) => {
  if (e.target === modalBackdrop) {
    modalBackdrop.style.display = 'none';
  }
};

saveNoteBtn.onclick = async () => {
  target.notes = notesArea.value;
  await updateField("notes", target.notes, dex);
  modalBackdrop.style.display = 'none';
};

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
  currentHpInput.style.marginRight = '8px';

  currentHpInput.onchange = async (e) => {
    const val = Number(e.target.value);
    await updateField("currentHP", val, target.dex);
    updateHPBar();
  };

  hpWrapper.appendChild(currentHpInput);

  maxDisplay = document.createElement('span');
  maxDisplay.style.marginLeft = '4px';
  maxDisplay.style.marginRight = '8px'; // Add small spacing before Status
  hpWrapper.appendChild(maxDisplay);

  // 🎯 Status Dropdown
  const statusSelect = document.createElement('select');
  statusSelect.className = 'status-select';

const statusTooltip = document.createElement('div');
statusTooltip.className = 'status-tooltip';
statusTooltip.style.position = 'absolute';
statusTooltip.style.top = '100%';
statusTooltip.style.left = '0';
statusTooltip.style.marginTop = '4px';
statusTooltip.style.padding = '6px 8px';
statusTooltip.style.backgroundColor = 'white';
statusTooltip.style.color = 'black';
statusTooltip.style.fontSize = '12px';
statusTooltip.style.borderRadius = '2px';
statusTooltip.style.whiteSpace = 'normal';
statusTooltip.style.width = '300px';
statusTooltip.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
statusTooltip.style.opacity = '0';
statusTooltip.style.pointerEvents = 'none';
statusTooltip.style.transition = 'opacity 0.2s ease';
statusTooltip.style.zIndex = '10';
statusTooltip.textContent = ''; // start empty

const tooltipWrapper = document.createElement('div');
tooltipWrapper.style.position = 'relative';
tooltipWrapper.style.display = 'inline-block';

tooltipWrapper.appendChild(statusSelect);
tooltipWrapper.appendChild(statusTooltip);
hpWrapper.appendChild(tooltipWrapper);

  const statuses = ["Status", "Burned", "Frozen", "Paralyzed", "Poisoned", "Badly Poisoned", "Asleep", "Confused", "Bad Sleep"];

  statuses.forEach(status => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  });

  statusSelect.value = target.status || "None";
  applyStatusColor(statusSelect); // Initial coloring

  statusSelect.onchange = async (e) => {
    await updateField("status", e.target.value, target.dex);
    applyStatusColor(statusSelect);
  };

// Update tooltip text and show on hover
statusSelect.addEventListener('mouseenter', () => {
  const selected = statusSelect.value;
  statusTooltip.textContent = statusEffects[selected] || '';
  if (statusTooltip.textContent.trim() !== '') {
    statusTooltip.style.opacity = '1';
  }
});

statusSelect.addEventListener('mouseleave', () => {
  statusTooltip.style.opacity = '0';
});

  hpWrapper.appendChild(statusSelect);

  const bar = document.createElement('div');
  bar.className = 'hp-bar';
  barFill = document.createElement('div');
  barFill.className = 'hp-fill';
  bar.appendChild(barFill);

  const hpSection = document.createElement('div');
  hpSection.className = 'summary-section';
  hpSection.appendChild(hpWrapper);
  hpSection.appendChild(bar);

  infoBox.appendChild(hpSection);

  updateHPBar(); // Initial render
}

// 🎨 Function to apply color based on status
function applyStatusColor(select) {
  const statusColors = {
    "Status": "#dcdcdc",
    "Burned": "#f44336",
    "Frozen": "#00bcd4",
    "Paralyzed": "#ffeb3b",
    "Poisoned": "#9c27b0",
    "Badly Poisoned": "#6a1b9a",
    "Asleep": "#3f51b5",
    "Confused": "#ff9800",
    "Bad Sleep": "#5c6bc0"
  };

  const selected = select.value;
  select.style.backgroundColor = statusColors[selected] || "#dcdcdc";
  select.style.color = (selected === "Paralyzed") ? "black" : "white";
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
