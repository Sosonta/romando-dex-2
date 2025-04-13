import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

window.addEventListener('DOMContentLoaded', () => {
const teamGrid = document.getElementById('team-grid');
const pcGrid = document.getElementById('pc-grid');
const modal = document.getElementById('poke-modal');
const contextMenu = document.getElementById('context-menu');
const releaseBtn = document.getElementById('release-btn');
const modalGrid = document.getElementById('poke-image-grid');
const closeModalBtn = document.getElementById('close-modal');
const sheetContainer = document.getElementById('character-sheet-container');

let currentUser = null;
let selectedPokemonForSummary = null;
let rightClickedPokemonIndex = null;
let draggedSource = null; // { location: 'team' | 'pc', index: number }
let summaryWindow = null;
let scrollInterval = null;

onAuthStateChanged(auth, async (user) => {
  const loginBlock = document.getElementById("login-block");
  const pcContainer = document.getElementById("pc-container");
  const modal = document.getElementById("poke-modal");

  if (user) {
    loginBlock.classList.add("hidden");
    pcContainer.classList.remove("hidden");
    currentUser = user;
    await renderModalOptions();
    await renderPCGrid();
  } else {
    loginBlock.classList.remove("hidden");
    pcContainer.classList.add("hidden");
    modal?.classList.add("hidden");
  }
});

async function renderPCGrid() {
  pcGrid.innerHTML = '';
  teamGrid.innerHTML = '';

  const docRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(docRef);
  const data = snap.data();

  const team = data?.teamPokemon || [];
  const pcPokemon = data?.pcPokemon || [];

  // Render fixed 8 slots for the team
for (let i = 0; i < 8; i++) {
  const poke = team[i] || null;
  const slot = createSlot(poke, 'team', i);

  if (poke) {
    slot.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      rightClickedPokemonIndex = i;
      selectedPokemonForSummary = poke;
      contextMenu.style.top = `${e.clientY}px`;
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.classList.remove('hidden');
      console.log(`📌 Right-clicked on TEAM index: ${i}`);
    });
  }

  teamGrid.appendChild(slot);
}

  // Render PC Pokémon
pcPokemon.forEach((poke, index) => {
  const slot = createSlot(poke, 'pc', index);

  // Right-click context menu
if (poke) {
  slot.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    rightClickedPokemonIndex = index;
    selectedPokemonForSummary = poke; // 💡 Track which Pokémon this is
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.classList.remove('hidden');
    console.log(`📌 Right-clicked on PC index: ${index}`);
  });
}

  pcGrid.appendChild(slot);
});

  // Add tile to add more Pokémon
  const addTile = document.createElement('div');
  addTile.className = 'pc-slot add-pokemon';
  addTile.textContent = '+';
  addTile.onclick = () => modal.classList.remove('hidden');
  pcGrid.appendChild(addTile);
}

function createSlot(poke, location, index) {
  const slot = document.createElement('div');
  slot.className = 'pc-slot';

  if (poke) {
    const img = document.createElement('img');
    img.src = `pokemon-images/${poke.dex.toString().padStart(3, '0')}.png`;
    img.alt = `Dex ${poke.dex}`;
    slot.appendChild(img);
  }

  slot.draggable = true;
  slot.addEventListener('dragstart', () => {
    draggedSource = { location, index };
  startAutoScroll(); // ⬅️ Add this
  });

  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });

  slot.addEventListener('dragleave', () => {
    slot.classList.remove('drag-over');
  });

  slot.addEventListener('drop', async () => {
    slot.classList.remove('drag-over');
    if (!draggedSource || (draggedSource.location === location && draggedSource.index === index)) return;

    const docRef = doc(db, "pokeIDs", currentUser.uid);
    const snap = await getDoc(docRef);
    const data = snap.data();

    let team = data?.teamPokemon || Array(8).fill(null);
    let pcPokemon = data?.pcPokemon || [];

    if (location === 'pc' && index >= pcPokemon.length) {
      while (pcPokemon.length <= index) pcPokemon.push(null);
    }
    if (draggedSource.location === 'pc' && draggedSource.index >= pcPokemon.length) {
      while (pcPokemon.length <= draggedSource.index) pcPokemon.push(null);
    }

    const sourceList = draggedSource.location === 'team' ? team : pcPokemon;
    const targetList = location === 'team' ? team : pcPokemon;

    const from = sourceList[draggedSource.index] || null;
    const to = targetList[index] || null;

    sourceList[draggedSource.index] = to;
    targetList[index] = from;

    while (pcPokemon.length > 0 && pcPokemon[pcPokemon.length - 1] === null) {
      pcPokemon.pop();
    }

await updateDoc(docRef, {
  teamPokemon: team,
  pcPokemon: pcPokemon
});

    draggedSource = null;
slot.addEventListener('dragend', () => {
  stopAutoScroll();
});
    await renderPCGrid();
  });

  return slot;
}

releaseBtn.addEventListener('click', async () => {
  console.log("➡️ Release button clicked");
  console.log("Right-clicked index:", rightClickedPokemonIndex);

  if (rightClickedPokemonIndex === null || !currentUser) {
    console.warn("❌ No valid Pokémon selected or user not logged in");
    return;
  }

  const confirmed = confirm("Are you sure you want to release this Pokémon? This action cannot be undone.");
  if (!confirmed) {
    console.log("🛑 Release canceled");
    return;
  }

  const docRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(docRef);
  const data = snap.data();

  const pcPokemon = data?.pcPokemon || [];
  console.log("Before release:", [...pcPokemon]);

  // Use splice to remove the exact index
  pcPokemon.splice(rightClickedPokemonIndex, 1);
  console.log("After release:", [...pcPokemon]);

  await updateDoc(docRef, { pcPokemon });

  contextMenu.classList.add('hidden');
  rightClickedPokemonIndex = null;
  await renderPCGrid();
});

function openSummary(dex) {
  // Focus the window if already open
  if (summaryWindow && !summaryWindow.closed) {
    summaryWindow.focus();
    summaryWindow.postMessage({ type: "OPEN_SUMMARY", dex }, "*");
    return;
  }

  // Otherwise, we must open the window directly from a user-initiated event
  summaryWindow = window.open("Summary.html", "summaryWindow", "width=1050,height=700");

  const checkReady = setInterval(() => {
    if (summaryWindow && summaryWindow.postMessage) {
      summaryWindow.postMessage({ type: "OPEN_SUMMARY", dex }, "*");
      clearInterval(checkReady);
    }
  }, 100);
}

// Summary button click handler
const summaryBtn = document.getElementById('summary-btn');
summaryBtn.addEventListener('click', () => {
  if (!selectedPokemonForSummary) return;
  openSummary(selectedPokemonForSummary.dex);
  contextMenu.classList.add('hidden');
});

function startAutoScroll() {
  if (scrollInterval) return;

  scrollInterval = setInterval(() => {
    const scrollMargin = 60; // px from top/bottom
    const scrollSpeed = 10;  // px per interval

    const y = window.event?.clientY;
    if (!y) return;

    const windowHeight = window.innerHeight;

    if (y < scrollMargin) {
      window.scrollBy(0, -scrollSpeed);
    } else if (y > windowHeight - scrollMargin) {
      window.scrollBy(0, scrollSpeed);
    }
  }, 20); // Check every 20ms
}

function stopAutoScroll() {
  clearInterval(scrollInterval);
  scrollInterval = null;
}

async function renderModalOptions() {
  modalGrid.innerHTML = ''; // Clear first

  const blankImg = document.createElement('img');
  blankImg.src = 'pokemon-images/blank_pokemon.png';
  blankImg.className = 'modal-pokemon';
  blankImg.alt = 'Blank Slot';
  blankImg.onclick = () => addPokemonToPC('blank');
  modalGrid.appendChild(blankImg);

  const pokemonRef = collection(db, "pokemon");
  const querySnapshot = await getDocs(pokemonRef);

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const dexNum = data["Dex Number"];
    const revealed = String(data?.Revealed?.Image).toLowerCase() === "true";
    if (revealed && dexNum) {
      const paddedDex = dexNum.toString().padStart(3, '0');
      const img = document.createElement('img');
      img.src = `pokemon-images/${paddedDex}.png`;
      img.className = 'modal-pokemon';
      img.alt = `Dex ${paddedDex}`;
      img.onclick = () => addPokemonToPC(dexNum);
      modalGrid.appendChild(img);
    }
  });
}

async function addPokemonToPC(dexNum) {
  if (!currentUser) return;

  const docRef = doc(db, "pokeIDs", currentUser.uid);
  const snap = await getDoc(docRef);
  const data = snap.data();

  const currentPC = data?.pcPokemon || [];

  if (dexNum === 'blank') {
    currentPC.push(null);
  } else {
    currentPC.push({ dex: dexNum, nickname: '', notes: '' });
  }

  await updateDoc(docRef, { pcPokemon: currentPC });
  modal.classList.add('hidden');
  await renderPCGrid();
}

closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target)) {
    contextMenu.classList.add('hidden');
    // Don't reset index unless clicking outside the menu
    rightClickedPokemonIndex = null;
  }
});
});
