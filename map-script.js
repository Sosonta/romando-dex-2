import { db } from './firebase-config.js';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const mapContainer = document.getElementById('map-container');


async function loadMarkers() {
  const snapshot = await getDocs(collection(db, "mapMarkers"));

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const markerId = docSnap.id;

    const markerWrapper = document.createElement("div");
    markerWrapper.className = "marker";
    markerWrapper.style.left = data.x + "%";
    markerWrapper.style.top = data.y + "%";
    markerWrapper.dataset.id = markerId;

    const markerImg = document.createElement("img");
    markerImg.src = `map-assets/markers/marker-${data.type || "note"}.png`;
    markerImg.style.width = "48px";
    markerImg.style.height = "48px";

    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `
      <img src="map-assets/${data.image}" />
      <p contenteditable="false">${data.description}</p>
    `;

    markerWrapper.appendChild(markerImg);
    markerWrapper.appendChild(popup);
    mapContainer.appendChild(markerWrapper);

    // 🔽 Right-click menu
    markerWrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, markerWrapper, data, markerId, markerImg);
    });
  });
}

function showContextMenu(x, y, markerWrapper, data, markerId, markerImg) {
  // Remove existing menu
  const oldMenu = document.getElementById("marker-context-menu");
  if (oldMenu) oldMenu.remove();

const menu = document.createElement("div");
menu.id = "marker-context-menu";
menu.style.position = "absolute";
menu.style.left = x + "px";
menu.style.top = y + "px";
menu.style.background = "#ffffff";
menu.style.border = "1px solid #ccc";
menu.style.boxShadow = "0 4px 10px rgba(0, 0, 0, 0.2)";
menu.style.zIndex = 999999;
menu.style.padding = "10px";
menu.style.borderRadius = "2px";
menu.style.display = "flex";
menu.style.flexDirection = "column";
menu.style.minWidth = "160px";

const options = ["Notes", "Move", "Icon", "Description", "Duplicate", "Delete"];
  options.forEach(option => {
    const btn = document.createElement("button");
    btn.textContent = option;
btn.style.backgroundColor = "#333";
btn.style.color = "#fff";
btn.style.border = "none";
btn.style.borderRadius = "2px";
btn.style.padding = "8px 12px";
btn.style.marginBottom = "6px";
btn.style.cursor = "pointer";
btn.style.fontSize = "14px";
btn.style.transition = "background 0.2s";
btn.style.width = "100%";
btn.style.textAlign = "left";

btn.onmouseenter = () => {
  btn.style.backgroundColor = "#555";
};
btn.onmouseleave = () => {
  btn.style.backgroundColor = "#333";
};
    btn.onclick = () => {
      handleContextAction(option.toLowerCase(), markerWrapper, data, markerId, markerImg);
      menu.remove();
    };
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  // Remove on click outside
  document.addEventListener("click", () => menu.remove(), { once: true });
}

async function handleContextAction(action, wrapper, data, markerId, markerImg) {
  const docRef = doc(db, "mapMarkers", markerId);

if (action === "duplicate") {
  const creator = document.getElementById("active-user")?.textContent || "Unknown";

  const newDoc = {
    ...data,
    x: Math.min(data.x + 2, 95),
    y: Math.min(data.y + 2, 95),
    createdBy: creator
  };
  await addDoc(collection(db, "mapMarkers"), newDoc);
  location.reload();
}

if (action === "notes") {
  const docRef = doc(db, "mapMarkers", markerId);
const latestSnap = await getDoc(docRef);
const latestData = latestSnap.exists() ? latestSnap.data() : {};
const existingNotes = Array.isArray(latestData.notes) ? latestData.notes : [];

  const popup = document.createElement("div");
const markerRect = wrapper.getBoundingClientRect();
const popupWidth = 300; // width of the notes popup
const popupHeight = 200; // estimated height

popup.style.position = "absolute";
popup.style.left = `${markerRect.left + window.scrollX + (markerRect.width - popupWidth) / 2}px`;
popup.style.top = `${markerRect.top + window.scrollY - popupHeight - 12}px`; // above the marker

  popup.style.width = "300px";
  popup.style.maxHeight = "400px";
  popup.style.overflowY = "auto";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #aaa";
  popup.style.borderRadius = "2px";
  popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  popup.style.padding = "16px";
  popup.style.zIndex = 99999;

  const title = document.createElement("h3");
  title.textContent = "Notes";
  popup.appendChild(title);

  const noteList = document.createElement("ul");
  noteList.style.padding = "0";
  noteList.style.listStyle = "none";
  popup.appendChild(noteList);

function renderNotes() {
  noteList.innerHTML = ""; // Clear old list

  existingNotes.forEach(note => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${note.text}</strong><br><small>— ${note.author}</small>`;
    li.style.padding = "6px 0";
    li.style.borderBottom = "1px solid #eee";
    li.style.cursor = "default";

    li.addEventListener("contextmenu", (e) => {
console.log("Right-clicked note:", note.text);
      e.preventDefault();

      // Remove any old menu
      const old = document.getElementById("note-context-menu");
      if (old) old.remove();

      const menu = document.createElement("div");
      menu.id = "note-context-menu";
menu.style.position = "absolute";
const markerRect = wrapper.getBoundingClientRect();
const menuWidth = 440; // approximate width of the menu

menu.style.top = `${markerRect.bottom + window.scrollY + -200}px`; // below marker
menu.style.left = `${markerRect.left + window.scrollX + (markerRect.width - menuWidth) / 2}px`; // centered on marker
      menu.style.background = "#fff";
      menu.style.border = "1px solid #ccc";
      menu.style.padding = "6px";
      menu.style.borderRadius = "2px";
      menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      menu.style.zIndex = 999999;

      const edit = document.createElement("button");
      edit.textContent = "Edit";
      edit.style.display = "block";
      edit.style.width = "100%";
      edit.style.marginBottom = "4px";
      edit.style.padding = "6px";
      edit.style.background = "#333";
      edit.style.color = "#fff";
      edit.style.border = "none";
      edit.style.borderRadius = "2px";
      edit.onclick = async () => {
        const newText = prompt("Edit note:", note.text);
        if (newText !== null) {
          note.text = newText;
          await updateDoc(doc(db, "mapMarkers", markerId), { notes: existingNotes });
          renderNotes(); // Refresh UI
        }
        document.body.removeChild(menu);
      };

      const del = document.createElement("button");
      del.textContent = "Delete";
      del.style.display = "block";
      del.style.width = "100%";
      del.style.padding = "6px";
      del.style.background = "#b00020";
      del.style.color = "#fff";
      del.style.border = "none";
      del.style.borderRadius = "2px";
      del.onclick = async () => {
        const updated = existingNotes.filter(n => n.id !== note.id);
        await updateDoc(doc(db, "mapMarkers", markerId), { notes: updated });

        // Update local arrays
        data.notes = updated;
        existingNotes.length = 0;
        updated.forEach(n => existingNotes.push(n));

        renderNotes(); // Refresh UI
        document.body.removeChild(menu);
      };

      menu.appendChild(edit);
      menu.appendChild(del);
      document.body.appendChild(menu);

      // Remove on click elsewhere
      document.addEventListener("click", () => menu.remove(), { once: true });
    });

    noteList.appendChild(li);
  });
}


  renderNotes(); // Initial render

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Note";
  addBtn.style.marginTop = "10px";
addBtn.onclick = async () => {
  const text = prompt("New note:");
  if (text) {
    const author = document.getElementById("active-user")?.textContent || "Unknown";
    const newNote = { id: crypto.randomUUID(), text, author };
    const updatedNotes = [...existingNotes, newNote];
    await updateDoc(docRef, { notes: updatedNotes });

    // Update local arrays and re-render
    existingNotes.push(newNote);
    renderNotes();
  }
};
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.marginLeft = "10px";
  closeBtn.onclick = () => document.body.removeChild(popup);

  popup.appendChild(addBtn);
  popup.appendChild(closeBtn);

  document.body.appendChild(popup);
}

if (action === "delete") {
  const confirmDelete = confirm("Are you sure you want to delete this marker?");
  if (!confirmDelete) return;

  // Add shrinking animation
  wrapper.classList.add("shrinking");

  // Wait for animation before removing
  setTimeout(async () => {
    await deleteDoc(docRef);
    wrapper.remove();
  }, 300); // Match the 0.3s animation duration
}

  if (action === "move") {
    let isDragging = true;

    const onMove = (e) => {
      const rect = mapContainer.getBoundingClientRect();
const markerWidth = wrapper.offsetWidth;
const markerHeight = wrapper.offsetHeight;

const percentX = ((e.clientX - rect.left - markerWidth / 2) / rect.width) * 100;
const percentY = ((e.clientY - rect.top - markerHeight / 2) / rect.height) * 100;
      wrapper.style.left = percentX + "%";
      wrapper.style.top = percentY + "%";
    };

    const onUp = async () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      const left = parseFloat(wrapper.style.left);
      const top = parseFloat(wrapper.style.top);
      await updateDoc(docRef, { x: left, y: top });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

if (action === "icon") {
  const picker = document.createElement("div");
  picker.style.position = "absolute";
// 📍 Position icon picker above the marker
const rect = wrapper.getBoundingClientRect();
picker.style.position = "absolute";
picker.style.left = `${rect.left + window.scrollX}px`;
picker.style.top = `${rect.top + window.scrollY - 240}px`; // 240px to place above the marker
picker.style.transform = "none"; // disable centering transform
  picker.style.background = "#ffffff";
  picker.style.border = "1px solid #ccc";
  picker.style.padding = "20px";
  picker.style.borderRadius = "2px";
  picker.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  picker.style.zIndex = "10000";
  picker.style.display = "grid";
  picker.style.gridTemplateColumns = "repeat(4, 64px)";
  picker.style.gap = "16px";
  picker.style.alignItems = "center";
  picker.style.justifyContent = "center";

  const markerTypes = [
    "town", "location", "clue", "note", "quest", "npc1", "npc2", "npc3"
  ];

  markerTypes.forEach(type => {
    const icon = document.createElement("img");
    icon.src = `map-assets/markers/marker-${type}.png`;
    icon.style.width = "64px";
    icon.style.height = "64px";
    icon.style.cursor = "pointer";
    icon.style.border = "2px solid transparent";
    icon.style.borderRadius = "2px";
    icon.title = type;

    icon.addEventListener("mouseover", () => {
      icon.style.border = "2px solid #555";
    });
    icon.addEventListener("mouseout", () => {
      icon.style.border = "2px solid transparent";
    });

    icon.addEventListener("click", async () => {
      data.type = type;
      markerImg.src = `map-assets/markers/marker-${type}.png`;
      await updateDoc(docRef, { type });
      document.body.removeChild(picker);
    });

    picker.appendChild(icon);
  });

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.style.gridColumn = "span 4";
  cancel.style.padding = "10px";
  cancel.style.backgroundColor = "#333";
  cancel.style.color = "#fff";
  cancel.style.border = "none";
  cancel.style.borderRadius = "2px";
  cancel.style.cursor = "pointer";
  cancel.style.marginTop = "10px";

  cancel.onmouseenter = () => {
    cancel.style.backgroundColor = "#555";
  };
  cancel.onmouseleave = () => {
    cancel.style.backgroundColor = "#333";
  };

  cancel.onclick = () => document.body.removeChild(picker);

  picker.appendChild(cancel);
  document.body.appendChild(picker);
}

if (action === "description") {
  const popup = wrapper.querySelector(".popup");
  const p = popup.querySelector("p");

  // Show popup while editing
  wrapper.classList.add("editing");
  popup.style.display = "block"; // ensure it's shown

  p.contentEditable = true;
  p.focus();

  // Optional styling for edit mode
  p.style.outline = "2px dashed #888";
  p.style.background = "#f0f0f0";
  p.style.padding = "4px";

  const save = async () => {
    p.contentEditable = false;
    wrapper.classList.remove("editing");
    p.style.outline = "";
    p.style.background = "";
    p.style.padding = "";
    popup.style.display = ""; // back to hover mode
    await updateDoc(doc(db, "mapMarkers", markerId), { description: p.textContent });
  };

  const handleClickOutside = (e) => {
    if (!popup.contains(e.target)) {
      document.removeEventListener("click", handleClickOutside);
      save();
    }
  };

  // Delay listener slightly to avoid immediately catching the click that triggered editing
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
  }, 10);
}
}
loadMarkers();

document.getElementById("add-marker-btn").addEventListener("click", () => {
  const mapRect = mapContainer.getBoundingClientRect();

  // Default marker data
const creator = document.getElementById("active-user")?.textContent || "Unknown";

const newMarkerData = {
  type: "note",
  image: "default-image.png",
  description: "New marker",
  x: 50,
  y: 50,
  createdBy: creator // 👈 Add this line
};

  // Create wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "marker";
  wrapper.style.left = newMarkerData.x + "%";
  wrapper.style.top = newMarkerData.y + "%";

  // Create image
  const markerImg = document.createElement("img");
  markerImg.src = `map-assets/markers/marker-note.png`;
  markerImg.style.width = "64px";
  markerImg.style.height = "64px";

  // Create popup
  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <img src="map-assets/${newMarkerData.image}" />
    <p>${newMarkerData.description}</p>
  `;
if (newMarkerData.createdBy) {
  const credit = document.createElement("small");
  credit.textContent = `— ${newMarkerData.createdBy}`;
  credit.style.display = "block";
  credit.style.marginTop = "5px";
  credit.style.fontSize = "0.8rem";
  credit.style.color = "#555";
  popup.appendChild(credit);
}
  wrapper.appendChild(markerImg);
  wrapper.appendChild(popup);
  mapContainer.appendChild(wrapper);

  // Enable move immediately
  let isDragging = true;
  const onMove = (e) => {
    const percentX = ((e.clientX - mapRect.left - wrapper.offsetWidth / 2) / mapRect.width) * 100;
    const percentY = ((e.clientY - mapRect.top - wrapper.offsetHeight / 2) / mapRect.height) * 100;
    wrapper.style.left = percentX + "%";
    wrapper.style.top = percentY + "%";
  };

  const onUp = async () => {
    isDragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);

    const finalX = parseFloat(wrapper.style.left);
    const finalY = parseFloat(wrapper.style.top);
    const finalData = { ...newMarkerData, x: finalX, y: finalY };

    const docRef = await addDoc(collection(db, "mapMarkers"), finalData);
    wrapper.dataset.id = docRef.id;

    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, wrapper, finalData, docRef.id, markerImg);
    });
  };

  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

const userOptions = ["DM", "Claude", "Jiro", "Buddy", "James"];
const userDisplay = document.getElementById("active-user");

// Load saved user from localStorage
const savedUser = localStorage.getItem("activeUser");
if (savedUser && userOptions.includes(savedUser)) {
  userDisplay.textContent = savedUser;
}

userDisplay.addEventListener("contextmenu", (e) => {
  e.preventDefault();

  // Remove old menu if exists
  const old = document.getElementById("user-switch-menu");
  if (old) old.remove();

  const menu = document.createElement("div");
  menu.id = "user-switch-menu";
menu.style.position = "absolute";
menu.style.background = "#fff";
menu.style.border = "1px solid #aaa";
menu.style.padding = "10px";
menu.style.borderRadius = "2px";
menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
menu.style.zIndex = 99999;

document.body.appendChild(menu); // must append before measuring

const rect = userDisplay.getBoundingClientRect();
const estimatedHeight = userOptions.length * 36 + 20;
menu.style.left = `${rect.left + window.scrollX}px`;
menu.style.top = `${rect.top + window.scrollY - estimatedHeight - 10}px`;
  menu.style.background = "#fff";
  menu.style.border = "1px solid #aaa";
  menu.style.padding = "10px";
  menu.style.borderRadius = "2px";
  menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  menu.style.zIndex = 99999;

  userOptions.forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.style.display = "block";
    btn.style.width = "100%";
    btn.style.marginBottom = "6px";
    btn.style.padding = "6px";
    btn.style.cursor = "pointer";
    btn.style.background = "#333";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "2px";
    btn.onclick = () => {
      userDisplay.textContent = name;
      localStorage.setItem("activeUser", name);
      document.body.removeChild(menu);
    };
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
setTimeout(() => {
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) menu.remove();
  }, { once: true });
}, 10);
});

