# Publishing to the Chrome Web Store

## Prerequisites

1. A Google account
2. A [Chrome Web Store Developer](https://chrome.google.com/webstore/devconsole) account (one-time $5 registration fee)
3. Store listing assets (see below)

## Store Listing Assets

| Asset | Spec | Notes |
|---|---|---|
| Extension icons | 16x16, 48x48, 128x128 PNG | Already in `icons/` |
| Screenshot(s) | 1280x800 or 640x400 PNG, min 1 | Show chord mode overlay + options page |
| Promotional tile | 440x280 PNG | Optional but recommended |
| Short description | Up to 132 characters | Already in `manifest.json` |
| Detailed description | Free-form text | Expand on features, usage, and examples |

### Screenshots to capture

1. **Chord mode active** -- the overlay showing "Chord mode: press a shortcut key..." on a real page
2. **Prompt dialog** -- the native prompt asking for a placeholder value
3. **Options page** -- the settings UI with a few example shortcuts configured

## Packaging

Run the deploy script from the project root:

```bash
./scripts/deploy.sh
```

This creates a `chord-shortcut-<version>.zip` in the `dist/` directory containing only the files the extension needs at runtime. See the script for details on what is included and excluded.

The version number is read from `manifest.json` automatically.

## Uploading

1. Go to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **New Item**
3. Upload the `.zip` from `dist/`
4. Fill in the store listing:
   - **Category**: Productivity
   - **Language**: English
   - **Description**: expand on the short description with usage examples
   - **Screenshots**: upload the screenshots captured above
5. Set **visibility**: Public, Unlisted, or Private
6. Set **distribution**: all regions (unless you have a reason to restrict)

## Privacy Practices

The Chrome Web Store requires a privacy disclosure. Chord Shortcut:

- Stores shortcut configuration in `chrome.storage.sync` (synced across user's devices, never sent to third parties)
- Does **not** collect, transmit, or store any user data beyond the shortcut configuration
- Does **not** make any network requests
- Requires `<all_urls>` content script access so the chord overlay works on any page

You will need to provide a **privacy policy URL** because the extension requests host permissions (`<all_urls>`). A simple page hosted on GitHub Pages or in the repository stating the above is sufficient.

## Permission Justifications

Google may ask why each permission is needed during review:

| Permission | Justification |
|---|---|
| `activeTab` | Access the active tab to inject the chord mode overlay |
| `scripting` | Dynamically inject the content script when messaging fails (e.g., tab loaded before extension was installed) |
| `storage` | Persist shortcut configuration via `chrome.storage.sync` |
| `tabs` | Navigate the active tab or open new tabs with resolved URLs |
| `<all_urls>` (content script) | The chord overlay must work on any webpage the user is viewing |

## Review Process

- Google typically reviews new submissions within **1--3 business days**
- Extensions with broad host permissions (`<all_urls>`) may receive additional scrutiny
- If rejected, the dashboard shows the reason and you can resubmit after fixing

## Publishing Updates

1. Increment `version` in `manifest.json` (e.g., `1.0.0` -> `1.0.1`)
2. Run `./scripts/deploy.sh` to create a new zip
3. Go to the Developer Dashboard, select the extension, click **Package** > **Upload new package**
4. Upload the new zip and submit for review

## Checklist

- [ ] Developer account registered and fee paid
- [ ] Screenshots captured (chord overlay, prompt, options page)
- [ ] Privacy policy URL available
- [ ] `manifest.json` version number is correct
- [ ] `./scripts/deploy.sh` runs without errors
- [ ] Zip uploaded to Developer Dashboard
- [ ] Store listing fields filled in (description, category, screenshots)
- [ ] Privacy practices section completed
- [ ] Submitted for review
