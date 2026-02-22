// content.js -- Content script for Chord Shortcut extension
//
// Injected into every page. Listens for "activate-chord" messages from the
// background service worker, enters chord mode, prompts for a value, and
// sends a navigation request back.

(() => {
  let chordActive = false;
  let overlayEl = null;
  let chordTimeout = null;

  const MODIFIER_KEYS = new Set([
    "Shift", "Control", "Alt", "Meta",
    "CapsLock", "NumLock", "ScrollLock",
  ]);

  const CHORD_TIMEOUT_MS = 5000;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "activate-chord") {
      enterChordMode();
    }
  });

  // ---- Overlay (visual feedback) ----

  function showOverlay() {
    removeOverlay();
    overlayEl = document.createElement("div");
    overlayEl.id = "__chord-shortcut-overlay";
    overlayEl.textContent = "Chord mode — press a key…";
    overlayEl.setAttribute("style", [
      "position: fixed",
      "top: 12px",
      "left: 50%",
      "transform: translateX(-50%)",
      "background: #1a1a1a",
      "color: #fff",
      "font: 13px/1.4 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "padding: 6px 16px",
      "border-radius: 6px",
      "z-index: 2147483647",
      "box-shadow: 0 2px 8px rgba(0,0,0,.3)",
      "pointer-events: none",
      "opacity: 0.92",
    ].join(";"));
    document.documentElement.appendChild(overlayEl);
  }

  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }

  // ---- Chord mode ----

  function enterChordMode() {
    if (chordActive) return;
    chordActive = true;
    showOverlay();

    // Auto-cancel after timeout
    chordTimeout = setTimeout(() => exitChordMode(), CHORD_TIMEOUT_MS);

    document.addEventListener("keydown", chordHandler, true);
  }

  function exitChordMode() {
    document.removeEventListener("keydown", chordHandler, true);
    chordActive = false;
    removeOverlay();
    clearTimeout(chordTimeout);
    chordTimeout = null;
  }

  function chordHandler(event) {
    // Ignore modifier-only presses — wait for a real key
    if (MODIFIER_KEYS.has(event.key)) return;

    // Cancel on Escape
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      exitChordMode();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const pressedKey = event.key.toLowerCase();
    exitChordMode();
    resolveShortcut(pressedKey);
  }

  // ---- Shortcut resolution ----

  async function resolveShortcut(pressedKey) {
    const data = await chrome.storage.sync.get("shortcuts");
    const shortcuts = data.shortcuts || [];

    const shortcut = shortcuts.find((s) => s.key.toLowerCase() === pressedKey);
    if (!shortcut) return;

    // Extract placeholder name from template: <some-name>
    const placeholderMatch = shortcut.template.match(/<([^>]+)>/);
    if (!placeholderMatch) {
      // No placeholder — navigate directly
      chrome.runtime.sendMessage({
        action: "navigate",
        url: shortcut.template,
        openInNewTab: shortcut.openInNewTab,
      });
      return;
    }

    const placeholderName = placeholderMatch[1];
    const value = prompt(`Enter ${placeholderName}:`);

    // User cancelled or entered empty string
    if (!value) return;

    const url = shortcut.template.replace(
      `<${placeholderName}>`,
      encodeURIComponent(value),
    );

    chrome.runtime.sendMessage({
      action: "navigate",
      url,
      openInNewTab: shortcut.openInNewTab,
    });
  }
})();
