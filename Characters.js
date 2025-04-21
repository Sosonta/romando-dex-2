// Characters.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

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
const db = getFirestore(app);
const charactersCol = collection(db, "characters");
const storage = getStorage(app);

const sections = [
  { id: "players", label: "Players" },
  { id: "allies", label: "Allies" },
  { id: "neutral", label: "Neutral" },
  { id: "antagonists", label: "Antagonists" }
];

function createCharBlock(data, id) {
  const block = document.createElement("div");
  block.className = "char-block";

  const fields = ["Image", "Name", "Location", "Pokemon", "Notes"];
  const inputs = {};

  const topRow = document.createElement("div");
  topRow.style.display = "flex";
  topRow.style.alignItems = "flex-start";
  topRow.style.justifyContent = "center";
  topRow.style.gap = "12px";
  topRow.style.marginBottom = "8px";

  fields.forEach(field => {
if (field === "Image") {
  const imageBox = document.createElement("div");
  imageBox.className = "image-box";
  imageBox.style.width = "128px";
  imageBox.style.height = "128px";
  imageBox.style.backgroundColor = "#fff";
  imageBox.style.backgroundImage = `url(${data.Image})`;
  imageBox.style.backgroundSize = "cover";
  imageBox.style.backgroundPosition = "center";
  imageBox.style.cursor = "pointer";
  imageBox.style.borderRadius = "4px";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (e) {
        const imageData = e.target.result;
        imageBox.style.backgroundImage = `url(${imageData})`;
        await updateChar(id, "Image", imageData);
      };
      reader.readAsDataURL(file);
    }
  });

  imageBox.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    fileInput.click();
  });

  topRow.appendChild(imageBox);
  block.appendChild(fileInput);
}

    if (field === "Name" || field === "Location") {
      if (!inputs["textCol"]) {
        inputs["textCol"] = document.createElement("div");
        inputs["textCol"].style.display = "flex";
        inputs["textCol"].style.flexDirection = "column";
        inputs["textCol"].style.gap = "4px";
        topRow.appendChild(inputs["textCol"]);
      }

      const input = document.createElement("input");
      input.placeholder = field;
      input.value = data[field] || "";
      input.onchange = () => updateChar(id, field, input.value);
      inputs["textCol"].appendChild(input);
      inputs[field] = input;
    }
  });

  block.appendChild(topRow);

  // Pokemon input
  const pokemonInput = document.createElement("input");
  pokemonInput.placeholder = "Pokemon";
  pokemonInput.value = data.Pokemon || "";
  pokemonInput.onchange = () => updateChar(id, "Pokemon", pokemonInput.value);
  block.appendChild(pokemonInput);

  // Notes textarea
  const notesInput = document.createElement("textarea");
  notesInput.placeholder = "Notes";
  notesInput.value = data.Notes || "";
  notesInput.onchange = () => updateChar(id, "Notes", notesInput.value);
  block.appendChild(notesInput);

  // Controls
  const controls = document.createElement("div");
  controls.className = "char-controls";
  controls.innerHTML = `
    <button class="btn-move-up">⬆</button>
    <button class="btn-move-down">⬇</button>
    <button class="btn-move-left">⬅</button>
    <button class="btn-move-right">➡</button>
    <button class="btn-delete">✖</button>
  `;

  controls.querySelector(".btn-move-up").onclick = () => changeSection(id, data.section, -1);
  controls.querySelector(".btn-move-down").onclick = () => changeSection(id, data.section, 1);
  controls.querySelector(".btn-move-left").onclick = () => reorderChar(id, data.section, -1);
  controls.querySelector(".btn-move-right").onclick = () => reorderChar(id, data.section, 1);
  controls.querySelector(".btn-delete").onclick = () => deleteChar(id);

  block.appendChild(controls);
  return block;
}

async function updateChar(id, field, value) {
  const charRef = doc(db, "characters", id);
  await updateDoc(charRef, { [field]: value });
}

async function deleteChar(id) {
  const charRef = doc(db, "characters", id);
  await deleteDoc(charRef);
}

async function changeSection(id, current, offset) {
  const index = sections.findIndex(s => s.id === current);
  const newIndex = index + offset;
  if (newIndex < 0 || newIndex >= sections.length) return;

  const newSection = sections[newIndex].id;
  const charRef = doc(db, "characters", id);
  await updateDoc(charRef, { section: newSection });
}

async function reorderChar(id, section, direction) {
  const q = query(charactersCol);
  const snapshot = await getDocs(q);
  const sectionChars = snapshot.docs
    .filter(doc => doc.data().section === section)
    .map(doc => ({ id: doc.id, ...doc.data() }));

  sectionChars.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // Ensure order

  const index = sectionChars.findIndex(c => c.id === id);
  const swapIndex = index + direction;
  if (swapIndex < 0 || swapIndex >= sectionChars.length) return;

  const a = sectionChars[index];
  const b = sectionChars[swapIndex];

  const aRef = doc(db, "characters", a.id);
  const bRef = doc(db, "characters", b.id);

  await updateDoc(aRef, { order: swapIndex });
  await updateDoc(bRef, { order: index });
}

async function addCharacter(section) {
  const q = query(charactersCol);
  const snapshot = await getDocs(q);
  const sectionCount = snapshot.docs.filter(doc => doc.data().section === section).length;

  await addDoc(charactersCol, {
    section: section.toLowerCase(),
    Image: "",
    Name: "",
    Location: "",
    Pokemon: "",
    Notes: "",
    order: sectionCount
  });
}

function renderCharacter(docSnap) {
  const data = docSnap.data();
  const id = docSnap.id;
  const sectionId = `${data.section}-list`;
  const container = document.getElementById(sectionId);

  console.log(`🧩 Rendering character [${id}] in section:`, data.section);
  console.log(`🔍 Looking for container with id: ${sectionId}`, container);

  if (!container) {
    console.warn(`❌ No container found for section: ${data.section}`);
    return;
  }

  const block = createCharBlock(data, id);
  container.appendChild(block);
}

function setupRealtimeListeners() {
  onSnapshot(charactersCol, (snapshot) => {
    const grouped = {};
    document.querySelectorAll(".character-list").forEach(container => container.innerHTML = "");

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const section = data.section;
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(docSnap);
    });

    Object.entries(grouped).forEach(([sectionId, docs]) => {
      const container = document.getElementById(`${sectionId}-list`);
      if (!container) return;
      docs.sort((a, b) => (a.data().order ?? 0) - (b.data().order ?? 0));
      docs.forEach(docSnap => renderCharacter(docSnap));
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Attach add button listeners only after DOM is ready
  sections.forEach(({ id }) => {
    const addBtn = document.querySelector(`#${id} .add-btn`);
    if (addBtn) {
      addBtn.onclick = () => addCharacter(id);
    }
  });

  setupRealtimeListeners(); // ✅ Now listener is active before any new character is added
});