# Implementation Plan

## Architecture

Chrome Manifest V3 extension with four components:

```
chrome-shortcut/
├── manifest.json        # Extension metadata, permissions, commands
├── background.js        # Service worker: command listener, tab navigation
├── content.js           # Content script: chord mode, prompt, message passing
├── options.html         # Settings page markup
├── options.js           # Settings page logic
├── options.css          # Settings page styles
└── docs/
    ├── product.md       # Product spec (this repo)
    └── implementation.md
```

## Component Responsibilities

### manifest.json

- Manifest V3
- Declares one `chrome.commands` entry: `"activate-chord"` with suggested key `Ctrl+Shift+X`
- Permissions: `activeTab`, `storage`, `scripting`
- Registers `background.js` as the service worker
- Registers `content.js` as a content script injected into all URLs (`<all_urls>`)
- Declares `options.html` as the options page

### background.js (Service Worker)

Responsibilities:
1. Listen for `chrome.commands.onCommand` with command `"activate-chord"`
2. On activation, send a message `{ action: "activate-chord" }` to the content script in the active tab
3. Listen for messages from content scripts:
   - `{ action: "navigate", url, openInNewTab }` -- create a new tab or update the current tab

Why navigation is done from background:
- `chrome.tabs.create()` and `chrome.tabs.update()` require the `tabs` API which lives in the service worker context.
- Content scripts send a message back to background with the resolved URL.

### content.js (Content Script)

Responsibilities:
1. Listen for messages from background (`"activate-chord"`)
2. Enter chord mode:
   - Register a one-time `keydown` listener on `document`
   - On `Escape`, cancel chord mode
   - On any other key, look up the shortcut in `chrome.storage.sync`
3. If shortcut found:
   - Extract the placeholder name from the template (regex: `<([^>]+)>`)
   - Call `prompt("Enter <placeholder-name>:")`
   - If user provides a value, replace the placeholder in the template
   - Send `{ action: "navigate", url, openInNewTab }` to background
4. If shortcut not found:
   - Silently ignore (or optional: brief console log)

### options.html + options.js + options.css (Options Page)

A simple settings page with:
- A table/list of configured shortcuts showing: key, name, template, new-tab toggle
- "Add shortcut" form with fields: key (single char input), name, template, new-tab checkbox
- Edit and delete actions per row
- Validation:
  - No duplicate keys
  - Template must contain exactly one `<placeholder>`
  - Key must be a single alphanumeric character
- Persists to `chrome.storage.sync`

## Data Flow

```
User presses Ctrl+Shift+X
        |
        v
background.js receives "activate-chord" command
        |
        v
background.js sends message to active tab's content script
        |
        v
content.js enters chord mode (one-time keydown listener)
        |
        v
User presses "p"
        |
        v
content.js reads shortcuts from chrome.storage.sync
        |
        v
Finds { key: "p", template: "https://.../<pr-number>", openInNewTab: true }
        |
        v
content.js calls prompt("Enter pr-number:")
        |
        v
User types "482" and hits Enter
        |
        v
content.js replaces <pr-number> with "482" in template
        |
        v
content.js sends { action: "navigate", url: "https://.../pull/482", openInNewTab: true } to background
        |
        v
background.js calls chrome.tabs.create({ url: "https://.../pull/482" })
```

## Storage Schema

Key: `"shortcuts"` in `chrome.storage.sync`

```json
{
  "shortcuts": [
    {
      "key": "p",
      "name": "Pull Request",
      "template": "https://github.com/get-theo-ai/monorepo/pull/<pr-number>",
      "openInNewTab": true
    },
    {
      "key": "i",
      "name": "Linear Issue",
      "template": "https://linear.app/theo/issue/<issue-id>",
      "openInNewTab": false
    }
  ]
}
```

## Edge Cases

| Case | Behavior |
|---|---|
| No matching chord key | Silently exit chord mode |
| User presses Escape during chord mode | Cancel chord mode |
| User cancels prompt (clicks Cancel or presses Escape) | Cancel navigation |
| Prompt returns empty string | Cancel navigation |
| Active tab is a `chrome://` page | Content script not injected; chord mode unavailable |
| No shortcuts configured | Chord key won't match anything; no-op |
| Duplicate key in config | Prevented by options page validation |
| Template has no `<placeholder>` | Prevented by options page validation; navigate directly if somehow stored |

## Implementation Order

1. `manifest.json` -- get the extension loadable
2. `background.js` -- command listener + navigation handler
3. `content.js` -- chord mode + prompt + message passing
4. `options.html` + `options.js` + `options.css` -- settings UI
5. Manual testing: load unpacked, configure a shortcut, verify end-to-end flow
