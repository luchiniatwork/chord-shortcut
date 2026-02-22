# Chrome Shortcut: Chord-based URL Template Navigator

## Problem

Developers and support teams frequently navigate to URLs that follow a predictable pattern with one dynamic segment -- a PR number, ticket ID, order number, etc. Today this means:

- Bookmarking dozens of similar URLs
- Manually editing the address bar each time
- Copy-pasting IDs into a base URL

Existing Chrome extensions (ClipKey, Easy URL Opener, Quick URL Shortcuts) each solve part of this but none combine: multiple user-defined keyboard shortcuts, URL templates with dynamic placeholders, and a prompt for the variable at invocation time.

## Solution

A Chrome extension that uses an **Emacs-style key chord** to trigger URL template navigation:

1. User presses a single **activation shortcut** (e.g. `Ctrl+Shift+X`).
2. The extension enters **chord mode** and waits for a second keypress.
3. The second key maps to a user-configured URL template (e.g. `p` -> Pull Request).
4. A native `prompt()` dialog asks for the template variable (e.g. "Enter pr-number:").
5. The extension navigates to the resolved URL in a new tab or current tab (configurable per shortcut).

### Example

Configuration:
- Key: `p`, Template: `https://github.com/get-theo-ai/monorepo/pull/<pr-number>`, New tab: yes

Usage:
```
Ctrl+Shift+X  ->  p  ->  prompt("Enter pr-number:")  ->  user types "482"
-> opens https://github.com/get-theo-ai/monorepo/pull/482 in a new tab
```

## Target Users

- **Developers** -- PRs, issues, CI builds, log dashboards
- **Support teams** -- ticket systems, customer profiles, order lookups
- **Anyone** who repeatedly navigates to URL patterns with a single variable segment

## Design Principles

- **Zero friction**: Two keystrokes + one typed value to navigate. No clicks.
- **Unlimited shortcuts**: The chord approach avoids Chrome's 4-shortcut-per-extension limit.
- **Simple configuration**: An options page to add/edit/remove shortcut mappings.
- **Privacy first**: All data stored locally in `chrome.storage.sync`. No network calls.
- **Native UI for prompt**: Uses the browser's built-in `prompt()` dialog -- ugly but instant and reliable.

## Shortcut Configuration Model

Each shortcut is stored as:

```json
{
  "key": "p",
  "name": "Pull Request",
  "template": "https://github.com/get-theo-ai/monorepo/pull/<pr-number>",
  "openInNewTab": true
}
```

- `key` -- single character, the chord's second keypress (a-z, 0-9).
- `name` -- human-readable label shown in the options page.
- `template` -- URL with one `<placeholder>` segment. The placeholder name is extracted and used as the prompt label.
- `openInNewTab` -- whether to open in a new tab or navigate the current tab.

## Scope

### v1 (this implementation)

- One activation shortcut via `chrome.commands`
- Chord mode with single-character second key
- One placeholder per template
- Native `prompt()` for input
- Options page for CRUD on shortcuts
- `chrome.storage.sync` for persistence (syncs across devices)

### Future (out of scope)

- Multiple placeholders per template
- Custom overlay/spotlight-style input instead of `prompt()`
- Template categories/groups
- Import/export of shortcut configurations
- Fuzzy search across shortcuts when chord key is unknown

## Limitations

- **`chrome://` pages**: Content scripts cannot be injected into `chrome://` pages or the new tab page. Chord mode will not work there.
- **Activation shortcut conflicts**: The user may need to adjust the default shortcut at `chrome://extensions/shortcuts` if it conflicts with another extension or browser shortcut.
