# Code Translate Guard

This Edge/Chrome extension keeps inline code in place during browser translation.

## Install in Microsoft Edge

1. Open `edge://extensions/`.
2. Turn on `Developer mode`.
3. Choose `Load unpacked`.
4. Select this folder: `code-translate-guard`.
5. Refresh the affected page before using Edge translation.

## What It Does

For inline code, the extension changes code-like tags into visually equivalent inline spans before translation, then restores their original text if the browser translator changes it.

For code blocks, the extension still adds these protections:

```html
translate="no"
class="notranslate"
dir="ltr"
```

It also watches for dynamically loaded content, which helps on GitHub issues, documentation sites, SPAs, and chat-style pages.

## Updating

After replacing an older version, open `edge://extensions/`, click `Reload` on this extension, then refresh the affected page before translating again.
