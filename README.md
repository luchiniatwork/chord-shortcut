# Chord Shortcut

Chrome extension (Manifest V3) that provides Emacs-style chord keyboard shortcuts for navigating to URL templates with dynamic placeholders.

Two keystrokes + one typed value = instant navigation. No clicks.

## The Problem

Developers and support teams repeatedly navigate to URLs that follow a pattern with one dynamic segment -- a PR number, ticket ID, order number, etc. This means bookmarking dozens of similar URLs, manually editing the address bar, or copy-pasting IDs into a base URL.

## How It Works

1. Press the **activation shortcut** (`Ctrl+Shift+L` / `Cmd+Shift+L` on Mac).
2. The extension enters **chord mode** and waits for a second keypress.
3. The second key maps to a user-configured URL template (e.g. `p` -> Pull Request).
4. A `prompt()` dialog asks for the template variable (e.g. "Enter pr-number:").
5. The extension navigates to the resolved URL in a new tab or current tab.

### Example

With this shortcut configured:

| Key | Name | Template | New Tab |
|-----|------|----------|---------|
| `p` | Pull Request | `https://github.com/org/repo/pull/<pr-number>` | Yes |

```
Ctrl+Shift+L  ->  p  ->  prompt("Enter pr-number:")  ->  type "482"
-> opens https://github.com/org/repo/pull/482 in a new tab
```

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project root directory.

To update after code changes, click the refresh icon on the extension card at `chrome://extensions/`.

## Configuration

Open the extension's options page (right-click the extension icon -> Options, or find it at `chrome://extensions/` -> Details -> Extension options).

Each shortcut has four fields:

- **Key** -- Single alphanumeric character, the chord's second keypress (a-z, 0-9).
- **Name** -- Human-readable label (e.g. "Pull Request", "Linear Issue").
- **Template** -- URL with one `<placeholder>` segment. The placeholder name becomes the prompt label.
- **Open in new tab** -- Whether to open in a new tab or navigate the current tab.

### Validation Rules

- No duplicate keys.
- Template must contain exactly one `<placeholder>`.
- Key must be a single alphanumeric character.

## Customizing the Activation Shortcut

The default activation shortcut is `Ctrl+Shift+L` (`Cmd+Shift+L` on Mac). To change it:

1. Go to `chrome://extensions/shortcuts`.
2. Find **Chord Shortcut** and update the shortcut for "Activate chord mode".

## Project Structure

```
manifest.json        # Extension manifest (MV3), permissions, commands
background.js        # Service worker: command listener, tab navigation
content.js           # Content script: chord mode overlay, prompt, messaging
options.html         # Options page markup
options.js           # Options page logic
options.css          # Options page styles
icons/               # Extension icons (16, 48, 128px)
docs/
  product.md         # Product spec
  implementation.md  # Architecture and implementation details
```

## Design

- **Zero dependencies** -- vanilla JS/HTML/CSS, no npm packages, no frameworks.
- **No build step** -- all code runs directly in the browser.
- **Privacy first** -- all data stored in `chrome.storage.sync`. No network calls. Data syncs across Chrome devices.
- **Unlimited shortcuts** -- the chord approach bypasses Chrome's 4-shortcut-per-extension limit.

## Limitations

- **`chrome://` pages**: Content scripts cannot be injected into `chrome://` pages or the new tab page. Chord mode will not work on those pages.
- **Activation shortcut conflicts**: The default shortcut may conflict with other extensions or browser shortcuts. Reassign it at `chrome://extensions/shortcuts`.

## License

See [LICENSE](LICENSE) for details.
