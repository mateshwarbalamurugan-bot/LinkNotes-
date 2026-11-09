
// Get HTML elements
const capture = document.getElementById("capture");
const save = document.getElementById("save");
const title = document.getElementById("title");
const content = document.getElementById("content");
const tag = document.getElementById("tag");
const notesBox = document.getElementById("notes");
const search = document.getElementById("search");

// Capture selected webpage text
capture.onclick = async function () {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  const result = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => window.getSelection().toString()
  });

  const selected = result[0].result;

  if (selected) {
    content.value = selected;
    title.value = selected.slice(0, 30);
  } else {
    alert("Select some text first!");
  }
};

// Save note
save.onclick = async function () {
  const text = content.value.trim();

  if (!text) {
    alert("Write or capture some text!");
    return;
  }

  const data = await chrome.storage.local.get("notes");
  const notes = data.notes || [];

  const newNote = {
    id: Date.now(),
    title: title.value || "Untitled",
    text: text,
    tag: tag.value.toLowerCase().trim()
  };

  notes.push(newNote);

  await chrome.storage.local.set({ notes });

  title.value = "";
  content.value = "";
  tag.value = "";

  showNotes();
};

// Display notes
async function showNotes() {
  const data = await chrome.storage.local.get("notes");
  const notes = data.notes || [];

  notesBox.innerHTML = "";

  notes
    .filter(note =>
      (note.title + note.text + note.tag)
        .toLowerCase()
        .includes(search.value.toLowerCase())
    )
    .forEach(note => {
      const related = notes.filter(other =>
        other.id !== note.id &&
        note.tag &&
        other.tag === note.tag
      );

      const card = document.createElement("div");
      card.className = "note";

      const heading = document.createElement("h3");
      heading.textContent = note.title;

      const paragraph = document.createElement("p");
      paragraph.textContent = note.text;

      const label = document.createElement("small");
      label.textContent = "Topic: " + (note.tag || "None");

      const links = document.createElement("small");
      links.textContent = "Connected notes: " + related.length;

      const remove = document.createElement("button");
      remove.textContent = "Delete";

      remove.onclick = async function () {
        const updated = notes.filter(n => n.id !== note.id);
        await chrome.storage.local.set({ notes: updated });
        showNotes();
      };

      card.append(heading, paragraph, label, document.createElement("br"), links, remove);
      notesBox.appendChild(card);
    });
}

// Search notes
search.oninput = showNotes;

// Load saved notes when extension opens
showNotes();
