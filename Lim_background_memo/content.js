(() => {
  "use strict";

  const MESSAGE_GET_CONTEXT = "RIGHTSAVE_GET_CONTEXT";
  const MESSAGE_SHOW_TOAST = "RIGHTSAVE_SHOW_TOAST";

  let lastRightClickedElement = null;

  document.addEventListener(
    "contextmenu",
    (event) => {
      lastRightClickedElement = event.target;
    },
    true,
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || typeof message.type !== "string") {
      return false;
    }

    if (message.type === MESSAGE_GET_CONTEXT) {
      sendResponse({
        ok: true,
        data: createContextData(message.preferredType),
      });
      return false;
    }

    if (message.type === MESSAGE_SHOW_TOAST) {
      showToast(message.text || "RightSave Notes에 저장했습니다.");
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  function createContextData(preferredType) {
    const target = lastRightClickedElement || document.activeElement;
    const selectionText = getSelectionText();
    const linkUrl = getClosestLinkUrl(target);
    const imageUrl = getImageUrl(target);
    const pageUrl = window.location.href;
    const pageTitle = document.title || pageUrl;

    const type = decideType({
      preferredType,
      selectionText,
      linkUrl,
      imageUrl,
    });

    return {
      type,
      content: getContentByType(type, {
        selectionText,
        linkUrl,
        imageUrl,
        pageUrl,
      }),
      selectionText,
      linkUrl,
      imageUrl,
      pageUrl,
      pageTitle,
      pageDescription: getMetaDescription(),
      createdAt: new Date().toISOString(),
    };
  }

  function decideType({ preferredType, selectionText, linkUrl, imageUrl }) {
    if (preferredType === "selection" && selectionText) return "selection";
    if (preferredType === "image" && imageUrl) return "image";
    if (preferredType === "link" && linkUrl) return "link";
    if (preferredType === "page") return "page";

    if (selectionText) return "selection";
    if (imageUrl) return "image";
    if (linkUrl) return "link";

    return "page";
  }

  function getContentByType(type, data) {
    switch (type) {
      case "selection":
        return data.selectionText;
      case "image":
        return data.imageUrl;
      case "link":
        return data.linkUrl;
      case "page":
      default:
        return data.pageUrl;
    }
  }

  function getSelectionText() {
    const selection = window.getSelection();

    if (!selection) {
      return "";
    }

    return selection.toString().trim();
  }

  function getClosestLinkUrl(element) {
    const link = element?.closest?.("a[href]");

    if (!link) {
      return "";
    }

    return link.href || "";
  }

  function getImageUrl(element) {
    if (!element) {
      return "";
    }

    if (element.tagName === "IMG") {
      return element.currentSrc || element.src || "";
    }

    const image = element.closest?.("img");

    if (image) {
      return image.currentSrc || image.src || "";
    }

    return "";
  }

  function getMetaDescription() {
    const meta =
      document.querySelector('meta[name="description"]') ||
      document.querySelector('meta[property="og:description"]');

    return meta?.content?.trim() || "";
  }

  function showToast(text) {
    const oldToast = document.getElementById("rightsave-notes-toast");
    oldToast?.remove();

    const toast = document.createElement("div");
    toast.id = "rightsave-notes-toast";
    toast.textContent = text;

    Object.assign(toast.style, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "2147483647",
      padding: "10px 14px",
      borderRadius: "8px",
      background: "#222",
      color: "#fff",
      fontSize: "13px",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.22)",
    });

    document.documentElement.appendChild(toast);

    window.setTimeout(() => {
      toast.remove();
    }, 1800);
  }
})();
