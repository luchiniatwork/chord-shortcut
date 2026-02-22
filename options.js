// options.js -- Settings page logic for Chord Shortcut extension

const $ = (sel) => document.querySelector(sel);

const els = {
  table: $("#shortcut-table"),
  tbody: $("#shortcut-list"),
  empty: $("#empty-state"),
  form: $("#shortcut-form"),
  formTitle: $("#form-title"),
  inputKey: $("#input-key"),
  inputName: $("#input-name"),
  inputTemplate: $("#input-template"),
  inputNewTab: $("#input-newtab"),
  btnSave: $("#btn-save"),
  btnCancel: $("#btn-cancel"),
  formError: $("#form-error"),
};

let shortcuts = [];
let editingIndex = -1; // -1 means "adding", >= 0 means "editing that index"

// ---- Persistence ----

async function loadShortcuts() {
  const data = await chrome.storage.sync.get("shortcuts");
  shortcuts = data.shortcuts || [];
  render();
}

async function saveShortcuts() {
  await chrome.storage.sync.set({ shortcuts });
}

// ---- Rendering ----

function render() {
  els.tbody.innerHTML = "";

  if (shortcuts.length === 0) {
    els.table.hidden = true;
    els.empty.hidden = false;
    return;
  }

  els.table.hidden = false;
  els.empty.hidden = true;

  shortcuts.forEach((s, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="key-cell">${esc(s.key)}</td>
      <td>${esc(s.name)}</td>
      <td class="template-cell">${esc(s.template)}</td>
      <td class="tab-cell">${s.openInNewTab ? "Yes" : "No"}</td>
      <td class="actions-cell">
        <button class="btn-edit" data-index="${i}">Edit</button>
        <button class="btn-delete" data-index="${i}">Delete</button>
      </td>
    `;
    els.tbody.appendChild(tr);
  });
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ---- Form handling ----

function resetForm() {
  els.form.reset();
  els.inputNewTab.checked = true;
  editingIndex = -1;
  els.formTitle.textContent = "Add Shortcut";
  els.btnSave.textContent = "Add Shortcut";
  els.btnCancel.hidden = true;
  els.formError.hidden = true;
}

function populateForm(shortcut) {
  els.inputKey.value = shortcut.key;
  els.inputName.value = shortcut.name;
  els.inputTemplate.value = shortcut.template;
  els.inputNewTab.checked = shortcut.openInNewTab;
}

function showError(msg) {
  els.formError.textContent = msg;
  els.formError.hidden = false;
}

function validate(key, template) {
  // Key must be a single alphanumeric character
  if (!/^[a-z0-9]$/i.test(key)) {
    showError("Chord key must be a single letter (a-z) or digit (0-9).");
    return false;
  }

  // Check for duplicate keys (skip current index when editing)
  const duplicate = shortcuts.findIndex(
    (s, i) => s.key.toLowerCase() === key.toLowerCase() && i !== editingIndex
  );
  if (duplicate !== -1) {
    showError(`Key "${key}" is already used by "${shortcuts[duplicate].name}".`);
    return false;
  }

  // Template must be a plausible URL
  if (!template.startsWith("http://") && !template.startsWith("https://")) {
    showError("Template must start with http:// or https://.");
    return false;
  }

  return true;
}

// ---- Event listeners ----

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  els.formError.hidden = true;

  const key = els.inputKey.value.trim().toLowerCase();
  const name = els.inputName.value.trim();
  const template = els.inputTemplate.value.trim();
  const openInNewTab = els.inputNewTab.checked;

  if (!validate(key, template)) return;

  const entry = { key, name, template, openInNewTab };

  if (editingIndex >= 0) {
    shortcuts[editingIndex] = entry;
  } else {
    shortcuts.push(entry);
  }

  await saveShortcuts();
  render();
  resetForm();
});

els.btnCancel.addEventListener("click", () => {
  resetForm();
});

// Delegate edit/delete clicks on the table
els.tbody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const index = parseInt(btn.dataset.index, 10);

  if (btn.classList.contains("btn-delete")) {
    shortcuts.splice(index, 1);
    await saveShortcuts();
    render();
    // If we were editing this row, reset the form
    if (editingIndex === index) resetForm();
    return;
  }

  if (btn.classList.contains("btn-edit")) {
    editingIndex = index;
    populateForm(shortcuts[index]);
    els.formTitle.textContent = "Edit Shortcut";
    els.btnSave.textContent = "Save Changes";
    els.btnCancel.hidden = false;
    els.inputKey.focus();
  }
});

// Force key input to lowercase single char
els.inputKey.addEventListener("input", () => {
  els.inputKey.value = els.inputKey.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 1).toLowerCase();
});

// ---- Activation shortcut link ----

// chrome:// URLs can't be opened via <a href>, so we use the tabs API
const shortcutsLink = document.getElementById("open-shortcuts");
if (shortcutsLink) {
  shortcutsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
}

// ---- Init ----

loadShortcuts();
