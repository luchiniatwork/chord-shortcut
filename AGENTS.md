# AGENTS.md - Coding Agent Guidelines for Chord Shortcut

## Project Overview

Chrome Extension (Manifest V3) providing Emacs-style chord keyboard shortcuts
for navigating to URL templates. Vanilla JS/HTML/CSS with zero dependencies and
no build step.

## Build / Run / Test Commands

There is **no build system**, no `package.json`, no bundler, and no test framework.

### Loading the extension

Load as an unpacked extension in Chrome:
1. Navigate to `chrome://extensions/`
2. Enable Developer Mode
3. Click "Load unpacked" and select the project root directory
4. After code changes, click the refresh icon on the extension card

### Testing

There are no automated tests. All testing is manual:
- Load the unpacked extension, configure a shortcut in the options page, and
  verify the end-to-end flow (activation key -> chord key -> prompt -> navigation).

### Linting / Formatting

No ESLint, Prettier, or other tooling is configured. Follow the code style
conventions below to maintain consistency.

## Architecture

```
manifest.json        # Extension manifest (MV3), permissions, commands
background.js        # Service worker: listens for commands, handles navigation
content.js           # Content script: chord mode overlay, prompt, messaging
options.html/js/css  # Options page: CRUD UI for shortcut configuration
docs/                # Product spec (product.md) and architecture (implementation.md)
```

### Data flow

1. User presses activation combo (default `Ctrl+Shift+L`)
2. `background.js` receives command via `chrome.commands.onCommand`
3. Background sends `{ action: "activate-chord" }` to content script
4. `content.js` enters chord mode, shows overlay, waits for a key press
5. On match, prompts for placeholder value, builds URL
6. Content sends `{ action: "navigate", url, openInNewTab }` back to background
7. `background.js` navigates via `chrome.tabs` API

### Storage

`chrome.storage.sync` with key `"shortcuts"` containing an array of
`{ key, name, template, openInNewTab }` objects.

## Code Style Guidelines

### Language and runtime

- **Plain JavaScript** (ES2020+). No TypeScript, no JSX, no transpilation.
- Use `async`/`await` for Chrome extension APIs that return promises.
- Use modern features: optional chaining (`?.`), template literals,
  destructuring, `const`/`let`, arrow functions.

### Variable declarations

- **`const` by default** for all bindings.
- **`let`** only for values that are reassigned (mutable state).
- **Never use `var`**.

### Naming conventions

| Context              | Convention         | Example                          |
|----------------------|--------------------|----------------------------------|
| Variables/functions  | `camelCase`        | `chordActive`, `loadShortcuts`   |
| Constants            | `UPPER_SNAKE_CASE` | `CHORD_TIMEOUT_MS`, `MODIFIER_KEYS` |
| DOM element IDs      | `kebab-case`       | `shortcut-table`, `btn-save`     |
| CSS classes          | `kebab-case`       | `key-cell`, `form-section`       |
| Message actions      | `kebab-case`       | `"activate-chord"`, `"navigate"` |
| Storage keys         | `camelCase`        | `"shortcuts"`, `"openInNewTab"`  |

### Strings and semicolons

- **Double quotes** for regular strings: `"activate-chord"`.
- **Template literals** for interpolation: `` `Key "${key}" is already used` ``.
- **Semicolons required** at end of statements.
- **Trailing commas** in multi-line objects, arrays, and argument lists.

### Functions

- Use **named function declarations** for top-level functions:
  `function enterChordMode() { ... }`
- Use **arrow functions** for callbacks and short utilities:
  `const $ = (sel) => document.querySelector(sel);`
- Use **`async` functions** where Chrome APIs return promises.
- Prefer **guard clauses** with early returns over deep nesting:
  `if (!tab?.id) return;`

### Imports and modules

There is **no module system**. Each file is a standalone script:
- `background.js` is a service worker registered in `manifest.json`
- `content.js` is a content script declared in `manifest.json`
- `options.js` is loaded via `<script>` tag in `options.html`

Do not add `import`/`export` statements. If content script isolation is needed,
wrap the entire file in an IIFE: `(() => { ... })();`

### File organization

- Begin each JS file with a **file-level comment**:
  `// background.js -- Service worker for Chord Shortcut extension`
- Use **section separators** to group related code:
  `// ---- Overlay (visual feedback) ----`
- CSS files use the same pattern: `/* ---- Section Name ---- */`
- Place inline comments above or to the right of the relevant code.

### Error handling

- Use **try/catch** around Chrome extension API calls that may fail
  (e.g., messaging to tabs that don't support content scripts).
- Log debug info with a **`[chord]` prefix**: `console.log("[chord] ...", data)`.
- Use **guard clauses** to exit early on invalid state.
- Show **user-facing validation errors** in the options form UI, not via alerts.
- Do not use `throw` -- handle errors locally with fallback behavior.

### HTML and CSS

- Semantic HTML5 elements.
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...`
- `box-sizing: border-box` reset on `*`.
- Plain hex colors (e.g., `#0066cc`, `#1a1a1a`); no CSS custom properties.
- No external CSS frameworks or libraries.

### Chrome Extension specifics

- All Chrome API usage must be compatible with **Manifest V3**.
- Navigation must happen in `background.js` (service worker) because
  `chrome.tabs` API is not available in content scripts.
- Content scripts cannot run on `chrome://` or `edge://` pages -- guard
  against this.
- If messaging to a content script fails, use `chrome.scripting.executeScript`
  to inject it dynamically, then retry.
- Use `chrome.storage.sync` (not `local`) so data syncs across devices.

### General principles

- **Zero dependencies** -- do not add npm packages or external libraries.
- **No build step** -- all code must run directly in the browser without
  compilation or bundling.
- Keep the extension minimal and fast. Prefer native browser APIs over
  third-party solutions.
- Consult `docs/product.md` for product requirements and scope.
- Consult `docs/implementation.md` for architecture decisions and edge cases.
