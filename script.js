import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const PASSWORD = "Beaf123";
const pokeList = ["001 - Beaf", "002 - Cuball", "003 - Auzzly", "004 - Pyram", "005 - Snapyak", "006 - Rafernal", "007 - Cadimare", "008 - Melmug", "009 - Maremaca", "010 - Shiaci", "011 - Lumacci", "012 - Fenicotto", "013 - Rosanza", "014 - Sombear", "015 - Ursaless", "016 - Batini", "017 - Valdini", "018 - Vicovo", "019 - Voltollo", "020 - Valello", "021 - Lierme", "022 - Valigrazza", "023 - Dotta", "024 - Fiosa", "025 - Damenta", "026 - Conispez", "027 - Pepeglio", "028 - Rospoca", "029 - Tambospo", "030 - Wruzbrrt", "031 - Gruzzumtumble", "032 - Spolder", "033 - Cavachned", "034 - Berger", "035 - Pompaflour", "036 - Fooli", "037 - Wooli", "038 - Sprilan", "039 - Machphan", "040 - Alphanlan", "041 - Slowzy", "042 - Aptosloth", "043 - Uetal", "044 - Ciplacti", "045 - Centino", "046 - Traterror", "047 - Uwuvu", "048 - Struovu", "049 - Pesmerda", "050 - Kyurin", "051 - Casma", "052 - Asmors", "053 - Phantaborsa", "054 - Catito", "055 - Don'Cack", "056 - Nosepass", "057 - Nosepunch", "058 - Corntots", "059 - Kerndles", "060 - Kabobs", "061 - Meiscorned", "062 - Philis", "063 - Espadra", "064 - Faedra", "065 - Verdlet", "066 - Verdolce", "067 - Unamed Pokemon", "068 - Unamed Pokemon 2", "069 - Sesmaile", "070 - Mortire", "071 - Spatto", "072 - Spatzione", "073 - Clador", "074 - Bruccu", "075 - Inkle", "076 - Blottly", "077 - Rorshaka", "078 - Bada", "079 - Bing", "080 - Funbray", "081 - Fiestrian", "082 - Burmy", "083 - Papellaude", "084 - Peisand", "085 - Aquilone", "086 - Crawful", "087 - Fiopo", "088 - Bullflower", "089 - Bleak", "090 - Bleadore", "091 - Scoota", "092 - Krabma", "093 - Gorandorite", "094 - Vandoop", "095 - Vandolor", "096 - Dolpha", "097 - Cetteoko", "098 - Bathygigas", "099 - Totlck", "100 - Craggem", "101 - Suspidgeon", "102 - Parrophet", "103 - Klak", "104 - Klakkimax", "105 - Zebush", "106 - Zebloom", "107 - Brastle", "108 - Brastlemoth", "109 - Mlemmlem", "110 - Tupetit", "111 - Fridgeon", "112 - Eaglacier", "113 - Baron", "114 - Frezami", "115 - Skimp", "116 - Skampie", "117 - AraAra", "118 - MudaMuda", "119 - OraOra", "120 - Kaspuki", "121 - Tatsuniki", "122 - Polepup", "123 - Arctisith", "124 - Dewpie", "125 - Spitick", "126 - Gnomblotter", "127 - Ropinop", "128 - Ropongu", "129 - Gummery", "130 - Kurask", "131 - Kurambwam", "132 - Demelia", "133 - Doradorade", "134 - Zapay", "135 - Zingray", "136 - Shassan", "137 - Overland", "138 - Gaaraghoul", "139 - Roadrat", "140 - Hazrat", "141 - Sparpig", "142 - Boarrior", "143 - Scammelrock", "144 - Eeple", "145 - Revenance", "146 - Chikan", "147 - Cocksaur", "148 - Doodlerdoo", "149 - Fistchikan", "150 - Terreon", "151 - Alphaeon", "152 - Growlithe", "153 - Arcanine", "154 - Kazewynder", "155 - Pottlie", "156 - Amphorad", "157 - Pupna", "158 - Sclunera", "159 - Lugia", "160 - Primal Lugia", "161 - Ho-oh", "162 - Primal Ho-oh", "163 - Mercuriont", "164 - Vendire", "165 - Terleone", "166 - Guerrather", "167 - Nebbiove", "168 - Satetta", "169 - Urmensione", "170 - Nettoro", "171 - Permicuto", "172 - Known"]; // Make sure this matches your document ID exactly

// 🔍 Pokedex Filter System
const activeFilters = {
  search: '',
  type: 'All',
  onlySeen: false,
};

async function loadPokemon(pokeId) {
  const docRef = doc(db, "pokemon", pokeId);
  const docSnap = await getDoc(docRef);

  const data = docSnap.data();
  const revealed = data.Revealed;
const captured = data.Captured === true; // Defaults to false if not set
const entry = document.getElementById(`entry-${pokeId.split(' ')[0]}`); // "001" from "001 - Beaf"

function section(label, key, content, isArray = false, level = null) {
  const isRevealed = revealed[key] === "true";
  const div = document.createElement("div");
  div.className = "entry-section";

  const title = document.createElement("h3");
  title.textContent = label;

  const contentDiv = document.createElement("div");
  contentDiv.dataset.key = key;

  // Log for debug
  if (key === "Types") {
    console.log("Rendering Types section:", content);
  }

  // Defensive fallback
  if (!Array.isArray(content) && isArray) {
    console.warn(`Expected array for ${label}, but got`, content);
    content = [];
  }

  if (isRevealed) {
    contentDiv.className = "unlocked";

    if (isArray) {
      div.appendChild(title); // Always show title

      const isBubble = ["Basic Ability", "Advanced Ability", "High Ability", "Capabilities", "Types"].includes(key);
      if (isBubble) {
        const bubbleContainer = document.createElement("div");
        bubbleContainer.className = "bubble-list";
        content.forEach(item => {
          if (item && item.trim()) {
            const bubble = document.createElement("div");
            const typeClass = item.toLowerCase().replace(/[^a-z]/g, '');
bubble.className = `bubble type type-${typeClass || 'dash'}`;
            bubble.textContent = item;
            bubbleContainer.appendChild(bubble);
          }
        });
        contentDiv.appendChild(bubbleContainer);
      } else {
        contentDiv.textContent = content.join(", ");
      }

    } else if (typeof content === "string" && content.startsWith("<pre")) {
      contentDiv.innerHTML = content;
      div.appendChild(title);

    } else {
if (label.startsWith("Move")) {
  const moveWrapper = document.createElement("div");
  moveWrapper.style.display = "flex";
  moveWrapper.style.alignItems = "center";
  moveWrapper.style.gap = "8px";

  const levelBox = document.createElement("div");
  levelBox.className = "level-box";
levelBox.textContent = captured && level !== null && level !== "" ? level : "?";
  moveWrapper.appendChild(levelBox);

  const moveText = document.createElement("div");
  moveText.textContent = content || "?";
  moveText.style.flexGrow = "1";
  moveText.style.textAlign = "left";
  moveWrapper.appendChild(moveText);

  contentDiv.appendChild(moveWrapper);
}

 else {
        contentDiv.textContent = content;
        div.appendChild(title);
      }
    }

  } else {
    contentDiv.className = "locked";

if (label.startsWith("Move")) {
  const moveWrapper = document.createElement("div");
  moveWrapper.style.display = "flex";
  moveWrapper.style.alignItems = "center";
  moveWrapper.style.gap = "8px";

const levelBox = document.createElement("div");
levelBox.className = "level-box";
levelBox.textContent = captured && level !== null && level !== "" ? level : "?";
moveWrapper.appendChild(levelBox);

  const lockedMark = document.createElement("div");
  lockedMark.textContent = "?";
  lockedMark.style.flexGrow = "1";
  lockedMark.style.textAlign = "left";
  moveWrapper.appendChild(lockedMark);

  contentDiv.appendChild(moveWrapper);
}

 else {
      contentDiv.textContent = "?";
      div.appendChild(title);
    }

    contentDiv.addEventListener("contextmenu", async (e) => {
      e.preventDefault();
      const input = prompt("Enter password to unlock:");
      if (input === PASSWORD) {
        revealed[key] = "true";
        await updateDoc(docRef, { Revealed: revealed });
        loadPokemon(pokeId); // Refresh UI
      } else {
        alert("Incorrect password.");
      }
    });
  }

  div.appendChild(contentDiv);
  return div;
}

  // Clear and rebuild layout
  entry.innerHTML = "";

  // Create two column wrappers
  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");
  leftCol.className = "left-column";
  rightCol.className = "right-column";

const isNameRevealed = revealed["Name"] === "true";

// Container for icon + title
const titleWrapper = document.createElement("div");
titleWrapper.style.display = "grid";
titleWrapper.style.gridTemplateColumns = "auto 1fr";
titleWrapper.style.alignItems = "center";
titleWrapper.style.columnGap = "8px"; // 👈 Tighter spacing
titleWrapper.style.marginBottom = "10px";
titleWrapper.style.width = "100%";

// Capture icon
const captureIcon = document.createElement("img");
captureIcon.src = captured ? "ui-images/captured.png" : "ui-images/uncaptured.png";
captureIcon.style.width = "40px";
captureIcon.style.height = "40px";
captureIcon.style.cursor = "pointer";
captureIcon.style.justifySelf = "start"; // 👈 Forces alignment left

// Toggle capture on click
captureIcon.addEventListener("contextmenu", async (e) => {
  e.preventDefault();
  const input = prompt("Enter admin password to toggle capture status:");
  if (input === PASSWORD) {
    const newState = !captured;
    await updateDoc(docRef, { Captured: newState });
    loadPokemon(pokeId); // Refresh just this Pokémon
  } else {
    alert("Incorrect password.");
  }
});

// Dex Number + Name
const title = document.createElement("h1");
title.className = "dex-title";
title.textContent = `#${data["Dex Number"]}: ${isNameRevealed ? data.Name : "?"}`;
title.style.margin = "0"; // remove default margin from <h1>

// Right-click to reveal name
title.oncontextmenu = async (e) => {
  e.preventDefault();
  if (!isNameRevealed) {
    const input = prompt("Enter password to unlock:");
    if (input === PASSWORD) {
      revealed["Name"] = "true";
      await updateDoc(docRef, { Revealed: revealed });
      loadPokemon(pokeId);
    } else {
      alert("Incorrect password.");
    }
  }
};

titleWrapper.appendChild(captureIcon);
titleWrapper.appendChild(title);
leftCol.appendChild(titleWrapper);

title.oncontextmenu = async (e) => {
  e.preventDefault();
  if (!isNameRevealed) {
    const input = prompt("Enter password to unlock:");
    if (input === PASSWORD) {
      revealed["Name"] = "true";
      await updateDoc(docRef, { Revealed: revealed });
      loadPokemon(pokeId); // Refresh with revealed name
    } else {
      alert("Incorrect password.");
    }
  }
};

const imageWrapper = document.createElement("div");

if (revealed["Image"] === "true") {
const img = document.createElement("img");
img.src = data.Image;

img.onclick = () => {
  const animations = ["pokemon-bounce", "pokemon-hop", "pokemon-dash", "pokemon-triplehop"];
  const chosen = animations[Math.floor(Math.random() * animations.length)];

  img.classList.remove("pokemon-bounce", "pokemon-hop");
  void img.offsetWidth; // Reset animation
  img.classList.add(chosen);
};

imageWrapper.appendChild(img);
} else {
  const placeholder = document.createElement("div");
  placeholder.className = "locked";
  placeholder.style.borderRadius = "2px";
  placeholder.style.height = "200px";
  placeholder.style.display = "flex";
  placeholder.style.alignItems = "center";
  placeholder.style.justifyContent = "center";
  placeholder.textContent = "?";
  imageWrapper.appendChild(placeholder);
}

imageWrapper.oncontextmenu = async (e) => {
  e.preventDefault();
  if (revealed["Image"] !== "true") {
    const input = prompt("Enter password to unlock:");
    if (input === PASSWORD) {
      revealed["Image"] = "true";
await updateDoc(docRef, { Revealed: revealed });
loadPokemon(pokeId); // Refresh only this Pokémon
    } else {
      alert("Incorrect password.");
    }
  }
};

leftCol.appendChild(imageWrapper);

leftCol.appendChild(section("Type", "Types", data["Types"], true));

  // Left side sections
  const statOrder = ["HP", "ATK", "DEF", "SATK", "SDEF", "SPD"];
  const formattedStats = statOrder.map(stat => {
    const value = data["Base Stats"][stat];
    const padded = stat.padEnd(5, " ");
    return `${padded}: ${value}`;
  });
  const statBlock = document.createElement("pre");
  statBlock.textContent = formattedStats.join("\n");
  leftCol.appendChild(section("Base Stats", "Base Stats", statBlock.outerHTML));

  leftCol.appendChild(section("Basic Ability", "Basic Ability", data["Basic Ability"], true));
  leftCol.appendChild(section("Advanced Ability", "Advanced Ability", data["Advanced Ability"], true));
  leftCol.appendChild(section("High Ability", "High Ability", data["High Ability"], true));
  leftCol.appendChild(section("Capabilities", "Capabilities", data["Capabilities"], true));
  leftCol.appendChild(section("Evolution", "Evolution", data["Evolution"]));

  // Right side: move list
for (let i = 0; i < 15; i++) {
  const move = data["Level Up Moves"][i] || "";
  const level = data["Levels"] ? data["Levels"][i] || "" : "";
  rightCol.appendChild(section(`Move ${i}`, `Move ${i}`, move, false, level));
}

  entry.appendChild(leftCol);
  entry.appendChild(rightCol);
const datalist = document.getElementById("pokedex-names");

if (revealed.Name === "true") {
  const option = document.createElement("option");
  option.value = data.Name;
  datalist.appendChild(option);
}

  // Store data globally for filters
  window.revealedStates = window.revealedStates || {};
  window.fullData = window.fullData || {};
  window.revealedStates[pokeId] = revealed;
  window.fullData[pokeId] = data;

  // Re-apply filters
  filterEntries();
}

function filterEntries() {
  for (const pokeId of pokeList) {
    const num = pokeId.split(" ")[0];
    const entryEl = document.getElementById(`entry-${num}`);
    const revealed = window.revealedStates?.[pokeId];
    const data = window.fullData?.[pokeId];

    if (!revealed || !data) continue;

    const nameVisible = revealed.Name === "true" ? data.Name.toLowerCase() : "";
    const imageVisible = revealed.Image === "true";
    const typesVisible = revealed.Types === "true" ? data.Types : [];

    const matchesSearch = nameVisible.includes(activeFilters.search);
    const matchesType = activeFilters.type === "All" || typesVisible.includes(activeFilters.type);
    const matchesSeen = !activeFilters.onlySeen || imageVisible;

    const show = matchesSearch && matchesType && matchesSeen;
    entryEl.style.display = show ? "grid" : "none";
  }
}

function getFilteredPokeList() {
  return pokeList.filter(pokeId => {
    const revealed = window.revealedStates?.[pokeId];
    const data = window.fullData?.[pokeId];

    if (!revealed || !data) return false;

    // Always exclude if unseen and wouldn't be shown due to type
    const isSeen = revealed.Image === "true";
    const typeMatches = activeFilters.type === "All" || (revealed.Types === "true" && data.Types.includes(activeFilters.type));

    if (!isSeen && activeFilters.onlySeen) return false;
    if (!isSeen && activeFilters.type !== "All") return false; // 👈 this is key!
    if (!typeMatches) return false;

    return true;
  });
}

pokeList.forEach(id => loadPokemon(id));

const searchInput = document.getElementById("search-input");
const typeSelect = document.getElementById("type-select");
const seenToggle = document.getElementById("seen-toggle");
const searchButton = document.getElementById("search-button");

// 🔇 Audio Toggle State
let isAudioEnabled = false;
document.getElementById("audio-toggle").addEventListener("change", (e) => {
  isAudioEnabled = e.target.checked;
});

searchButton.addEventListener("click", () => {
  const query = searchInput.value.toLowerCase();

  for (const pokeId of pokeList) {
    const revealed = window.revealedStates?.[pokeId];
    const data = window.fullData?.[pokeId];
    if (!revealed || !data) continue;

    const name = revealed.Name === "true" ? data.Name.toLowerCase() : "";
    if (name.includes(query)) {
      const num = pokeId.split(" ")[0];
      const entry = document.getElementById(`entry-${num}`);

      if (entry) {
        currentScrollIndex = pokeList.indexOf(pokeId);
        const topOffset = entry.getBoundingClientRect().top + window.pageYOffset - 25;
        window.scrollTo({ top: topOffset, behavior: "smooth" });

        // 🎉 Add animation with delay
        if (revealed.Image === "true") {
          setTimeout(() => {
            const img = entry.querySelector(".left-column img:not([src*='ui-images'])");
            if (img) {
              const animations = ["pokemon-bounce", "pokemon-hop", "pokemon-dash", "pokemon-triplehop"];
              const chosen = animations[Math.floor(Math.random() * animations.length)];

              img.classList.remove("pokemon-bounce", "pokemon-hop");
              void img.offsetWidth;
              img.classList.add(chosen);

              img.addEventListener("animationend", () => {
                img.classList.remove(chosen);
              }, { once: true });

              // 🔊 Audio playback if enabled
              if (isAudioEnabled && data?.["Dex Number"]) {
  const fileName = `${data["Dex Number"].padStart(3, '0')}.wav`;
  const audio = new Audio(`pokemon-cries/${fileName}`);
audio.onloadeddata = () => console.log("Audio loaded:", fileName);
audio.onerror = () => console.warn("Failed to load audio:", fileName);
  audio.play().catch(err => console.warn("Audio failed to play:", err));
}
            }
          }, 400); // Adjust delay here
        }
      }

      break; // Stop after the first match
    }
  }
});

typeSelect.addEventListener("change", () => {
  activeFilters.type = typeSelect.value;
  filterEntries();
  currentScrollIndex = null; // 🔄 Reset nav memory
});

seenToggle.addEventListener("change", () => {
  activeFilters.onlySeen = seenToggle.checked;
  filterEntries();
  currentScrollIndex = null; // 🔄 Reset nav memory
});

import { setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.getElementById("dev-toggle").addEventListener("click", () => {
  const input = prompt("Enter dev password:");
  if (input === PASSWORD) {
    document.getElementById("dev-panel").style.display = "flex";
  } else {
    alert("Incorrect password.");
  }
});

document.getElementById("clone-btn").addEventListener("click", async () => {
  const fromId = document.getElementById("from-id").value.trim();
  const toId = document.getElementById("to-id").value.trim();
  const newName = document.getElementById("new-name").value.trim();
  const newDex = document.getElementById("new-dex").value.trim();

  if (!fromId || !toId || !newName || !newDex) {
    return alert("Please fill out all fields.");
  }

  const sourceDoc = doc(db, "pokemon", fromId);
  const targetDoc = doc(db, "pokemon", toId);
  const snapshot = await getDoc(sourceDoc);

  if (!snapshot.exists()) {
    return alert(`Pokémon '${fromId}' not found.`);
  }

const data = snapshot.data();
data.Captured = false; // Always reset to uncaptured on clone
  data["Name"] = newName;
  data["Dex Number"] = newDex;

  for (const key in data.Revealed) {
    data.Revealed[key] = key === "Dex Number" ? "true" : "false";
  }

  await setDoc(targetDoc, data);
  alert(`✅ Cloned ${fromId} ➜ ${toId}`);
});

document.getElementById("scroll-top-btn").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentScrollIndex = null; // 🔄 Reset navigation memory
});

let currentScrollIndex = null;

function scrollToPokemon(index, direction = 1, filteredList = getFilteredPokeList()) {
  if (index < 0 || index >= filteredList.length) return;

  const pokeId = filteredList[index];

const data = window.fullData?.[pokeId];
  const revealed = window.revealedStates?.[pokeId];

  // If this Pokémon shouldn't be shown due to filters, skip to the next
if (!revealed || !data) {
  scrollToPokemon(index + direction, direction, filteredList);
  return;
}

  const num = pokeId.split(" ")[0];
  const entry = document.getElementById(`entry-${num}`);
  if (entry) {
    const offset = entry.getBoundingClientRect().top + window.pageYOffset - 25;
    window.scrollTo({ top: offset, behavior: "smooth" });

    // Save scroll index
currentScrollIndex = pokeList.indexOf(pokeId); // Store actual index in original list

    // Optional animation trigger
    if (revealed?.Image === "true") {
      const img = entry.querySelector(".left-column img:not([src*='ui-images'])");
      if (img) {
        const animations = ["pokemon-bounce", "pokemon-hop", "pokemon-dash", "pokemon-triplehop"];
        const chosen = animations[Math.floor(Math.random() * animations.length)];
        img.classList.remove("pokemon-bounce", "pokemon-hop");
        void img.offsetWidth;
        img.classList.add(chosen);
        img.addEventListener("animationend", () => img.classList.remove(chosen), { once: true });
if (isAudioEnabled && data?.["Dex Number"]) {
  const fileName = `${data["Dex Number"].padStart(3, '0')}.wav`;
  const audio = new Audio(`pokemon-cries/${fileName}`);
audio.onloadeddata = () => console.log("Audio loaded:", fileName);
audio.onerror = () => console.warn("Failed to load audio:", fileName);
  audio.play().catch(err => console.warn("Audio failed to play:", err));
}
      }
    }
  }
}

// 🔄 Navigation Buttons
document.getElementById("prev-button").addEventListener("click", () => {
  const filteredList = getFilteredPokeList();
  const currentId = pokeList[currentScrollIndex];
  const currentFilteredIndex = filteredList.indexOf(currentId);

  const newIndex = currentFilteredIndex > 0
    ? currentFilteredIndex - 1
    : filteredList.length - 1; // 👈 wrap to end

  scrollToPokemon(newIndex, -1, filteredList);
});

document.getElementById("next-button").addEventListener("click", () => {
  const filteredList = getFilteredPokeList();
  const currentId = pokeList[currentScrollIndex];
  const currentFilteredIndex = filteredList.indexOf(currentId);

  const newIndex = currentFilteredIndex < filteredList.length - 1
    ? currentFilteredIndex + 1
    : 0; // 👈 wrap to start

  scrollToPokemon(newIndex, 1, filteredList);
});