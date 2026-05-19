const MENU_ID = "save-to-rightsave";
const STORAGE_KEY = "savedItems";

const rightSaveMenu = {
  id: MENU_ID,
  title: "RightSave에 저장하기",
  contexts: ["selection", "link", "image", "page"],
  enabled: true,
  type: "normal",
  visible: true,
};

chrome.runtime.onInstalled.addListener(() => {
  console.log("RightSave Notes 설치/업데이트 완료");

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(rightSaveMenu, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "우클릭 메뉴 등록 실패:",
          chrome.runtime.lastError.message,
        );
        return;
      }

      console.log("우클릭 메뉴 등록 완료:", rightSaveMenu.title);
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;

  const item = createSaveItem(info, tab);

  if (!item.content) {
    console.warn("RightSave 저장 취소: 저장할 내용이 없습니다.", { info, tab });
    return;
  }

  try {
    const savedItems = await getSavedItems();

    savedItems.unshift(item);

    await chrome.storage.local.set({
      [STORAGE_KEY]: savedItems,
    });

    console.log("RightSave 저장 완료:", item);
  } catch (error) {
    console.error("RightSave 저장 실패:", error);
  }
});

async function getSavedItems() {
  const result = await chrome.storage.local.get({
    [STORAGE_KEY]: [],
  });

  return Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];
}

function createSaveItem(info, tab) {
  const type = getSaveType(info);
  const content = getSaveContent(type, info, tab).trim();
  const pageUrl = info.pageUrl || tab?.url || "";
  const pageTitle = tab?.title || "제목 없음";

  return {
    id: createItemId(),
    type,
    content,
    pageUrl,
    pageTitle,
    createdAt: new Date().toISOString(),
  };
}

function getSaveType(info) {
  if (info.selectionText && info.selectionText.trim()) {
    return "selection";
  }

  if (info.srcUrl) {
    return "image";
  }

  if (info.linkUrl) {
    return "link";
  }

  return "page";
}

function getSaveContent(type, info, tab) {
  switch (type) {
    case "selection":
      return info.selectionText || "";

    case "image":
      return info.srcUrl || "";

    case "link":
      return info.linkUrl || "";

    case "page":
    default:
      return info.pageUrl || tab?.url || "";
  }
}

function createItemId() {
  const timestamp = Date.now();
  const randomText = Math.random().toString(36).slice(2, 8);

  return `item_${timestamp}_${randomText}`;
}

console.log("background.js가 실행되었습니다.");
