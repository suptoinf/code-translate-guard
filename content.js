(() => {
  const INLINE_CODE_CLASS = "ctg-inline-code";
  const INLINE_CODE_SELECTOR = `span.${INLINE_CODE_CLASS}[data-ctg-original-text]`;
  const INLINE_CODE_CANDIDATE_SELECTOR = "code,kbd,samp,var";
  const BLOCK_CODE_SELECTOR = [
    "pre",
    "pre code",
    ".hljs",
    ".highlight",
    ".blob-code",
    ".blob-code-inner",
    "table.highlight"
  ].join(",");

  const STYLE_ID = "code-translate-guard-style";
  let repairTimer = 0;

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      span.${INLINE_CODE_CLASS} {
        box-sizing: border-box;
        display: inline;
        margin: 0;
        padding: 0.2em 0.4em;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
        font-size: 85%;
        white-space: break-spaces;
        unicode-bidi: isolate;
        direction: ltr;
        background-color: rgba(127, 127, 127, 0.14);
      }

      .markdown-body span.${INLINE_CODE_CLASS} {
        background-color: var(--bgColor-neutral-muted, var(--color-neutral-muted, rgba(175, 184, 193, 0.2)));
      }

      code.notranslate,
      pre.notranslate,
      kbd.notranslate,
      samp.notranslate,
      var.notranslate {
        unicode-bidi: isolate;
      }

      code.notranslate,
      kbd.notranslate,
      samp.notranslate,
      var.notranslate {
        direction: ltr;
      }
    `;

    const target = document.head || document.documentElement;
    target.appendChild(style);
  }

  function protectBlockElement(element) {
    if (!(element instanceof Element)) return;

    element.setAttribute("translate", "no");
    element.classList.add("notranslate");

    if (!element.hasAttribute("dir")) {
      element.setAttribute("dir", "ltr");
    }
  }

  function isInlineCodeElement(element) {
    if (!(element instanceof Element)) return false;
    if (!element.matches(INLINE_CODE_CANDIDATE_SELECTOR)) return false;

    if (element.closest("pre,.highlight,.hljs,.blob-code,.blob-code-inner,table.highlight,script,style,textarea")) {
      return false;
    }

    return Boolean(element.textContent && element.textContent.trim());
  }

  function copyAttributes(source, target) {
    for (const attribute of source.attributes) {
      if (attribute.name === "translate" || attribute.name.startsWith("data-ctg-")) {
        continue;
      }

      target.setAttribute(attribute.name, attribute.value);
    }
  }

  function convertInlineCode(element) {
    if (!isInlineCodeElement(element)) return;

    const originalText = element.textContent || "";
    const replacement = document.createElement("span");

    copyAttributes(element, replacement);
    replacement.classList.add(INLINE_CODE_CLASS);
    replacement.setAttribute("data-ctg-original-text", originalText);
    replacement.setAttribute("data-ctg-original-tag", element.localName);
    replacement.setAttribute("translate", "yes");
    replacement.setAttribute("dir", "ltr");
    replacement.setAttribute("spellcheck", "false");
    replacement.textContent = originalText;

    element.replaceWith(replacement);
  }

  function restoreInlineCode(element) {
    if (!(element instanceof Element)) return;

    const originalText = element.getAttribute("data-ctg-original-text");
    if (originalText === null) return;

    element.classList.add(INLINE_CODE_CLASS);
    element.setAttribute("translate", "yes");
    element.setAttribute("dir", "ltr");
    element.setAttribute("spellcheck", "false");

    if (element.textContent !== originalText) {
      element.textContent = originalText;
    }
  }

  function restoreInlineCodes(root) {
    if (!(root instanceof Element) && !(root instanceof Document)) return;

    if (root instanceof Element && root.matches(INLINE_CODE_SELECTOR)) {
      restoreInlineCode(root);
    }

    root.querySelectorAll(INLINE_CODE_SELECTOR).forEach(restoreInlineCode);
  }

  function protectTree(root) {
    if (!(root instanceof Element) && !(root instanceof Document)) return;

    if (root instanceof Element && root.matches(BLOCK_CODE_SELECTOR)) {
      protectBlockElement(root);
    }

    root.querySelectorAll(BLOCK_CODE_SELECTOR).forEach(protectBlockElement);

    if (root instanceof Element && isInlineCodeElement(root)) {
      convertInlineCode(root);
    }

    root.querySelectorAll(INLINE_CODE_CANDIDATE_SELECTOR).forEach(convertInlineCode);
    restoreInlineCodes(root);
  }

  function scheduleRepair() {
    if (repairTimer) return;

    repairTimer = window.setTimeout(() => {
      repairTimer = 0;
      protectTree(document);
      restoreInlineCodes(document);
    }, 50);

    window.setTimeout(() => restoreInlineCodes(document), 500);
    window.setTimeout(() => restoreInlineCodes(document), 1500);
  }

  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const parent = mutation.target.parentElement;

          if (parent && parent.matches(INLINE_CODE_SELECTOR)) {
            restoreInlineCode(parent);
          }
        }

        if (mutation.target instanceof Element && mutation.target.matches(INLINE_CODE_SELECTOR)) {
          restoreInlineCode(mutation.target);
        }

        for (const node of mutation.addedNodes) {
          protectTree(node);
        }
      }

      scheduleRepair();
    });

    observer.observe(document.documentElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  installStyle();
  protectTree(document);
  startObserver();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installStyle();
      protectTree(document);
      restoreInlineCodes(document);
    }, { once: true });
  }
})();
