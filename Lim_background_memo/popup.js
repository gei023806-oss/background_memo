const STORAGE_KEY = "savedItems";

const itemList = document.getElementById("itemList");
const summary = document.getElementById("summary");
const clearAllBtn = document.getElementById("clearAllBtn");
const filterButtons = document.querySelectorAll(".filter");

let savedItems = [];
let currentFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
  loadItems();
});

async function loadItems() {
  try {
    const result = await chrome.storage.local.get({
      [STORAGE_KEY]: [],
    });

    savedItems = Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : [];

    renderItems();
  } catch (error) {
    console.error("저장 목록 불러오기 실패:", error);
    renderError("저장 목록을 불러오지 못했습니다.");
  }
}

function renderItems() {
  const filteredItems = getFilteredItems();

  summary.textContent = `저장된 항목 ${savedItems.length}개`;
  itemList.innerHTML = "";

  if (filteredItems.length === 0) {
    renderEmptyState();
    return;
  }

  filteredItems.forEach((item) => {
    const card = createItemCard(item);
    itemList.appendChild(card);
  });
}

function getFilteredItems() {
  if (currentFilter === "all") {
    return savedItems;
  }

  return savedItems.filter((item) => item.type === currentFilter);
}

function createItemCard(item) {
  const card = document.createElement("section");
  card.className = "item-card";

  const cardTop = document.createElement("div");
  cardTop.className = "card-top";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = getTypeLabel(item.type);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.type = "button";
  deleteBtn.textContent = "삭제";
  deleteBtn.addEventListener("click", () => deleteItem(item.id));

  cardTop.appendChild(badge);
  cardTop.appendChild(deleteBtn);

  const content = document.createElement("p");
  content.className = "content";
  content.textContent = item.content || "내용 없음";

  const source = document.createElement("p");
  source.className = "source";
  source.textContent = `출처: ${item.pageTitle || "제목 없음"}`;

  const url = document.createElement("a");
  url.className = "url";
  url.href = item.pageUrl || item.content || "#";
  url.target = "_blank";
  url.rel = "noopener noreferrer";
  url.textContent = item.pageUrl || "URL 없음";

  const time = document.createElement("time");
  time.dateTime = item.createdAt || "";
  time.textContent = formatDate(item.createdAt);

  card.appendChild(cardTop);
  card.appendChild(content);
  card.appendChild(source);
  card.appendChild(url);
  card.appendChild(time);

  return card;
}

async function deleteItem(id) {
  try {
    savedItems = savedItems.filter((item) => item.id !== id);

    await chrome.storage.local.set({
      [STORAGE_KEY]: savedItems,
    });

    renderItems();
  } catch (error) {
    console.error("개별 삭제 실패:", error);
    alert("항목을 삭제하지 못했습니다.");
  }
}

clearAllBtn.addEventListener("click", async () => {
  if (savedItems.length === 0) {
    alert("삭제할 항목이 없습니다.");
    return;
  }

  const ok = confirm("저장된 항목을 모두 삭제할까요?");
  if (!ok) return;

  try {
    savedItems = [];

    await chrome.storage.local.set({
      [STORAGE_KEY]: savedItems,
    });

    renderItems();
  } catch (error) {
    console.error("전체 삭제 실패:", error);
    alert("전체 삭제에 실패했습니다.");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    currentFilter = button.dataset.type;
    renderItems();
  });
});

function renderEmptyState() {
  const empty = document.createElement("p");
  empty.className = "empty";

  if (savedItems.length === 0) {
    empty.textContent = "저장된 항목이 없습니다.";
  } else {
    empty.textContent = "이 필터에 해당하는 항목이 없습니다.";
  }

  itemList.appendChild(empty);
}

function renderError(message) {
  itemList.innerHTML = "";

  const error = document.createElement("p");
  error.className = "error";
  error.textContent = message;

  itemList.appendChild(error);
}

function getTypeLabel(type) {
  const labels = {
    selection: "텍스트",
    link: "링크",
    image: "이미지",
    page: "페이지",
  };

  return labels[type] || "기타";
}

function formatDate(isoString) {
  if (!isoString) {
    return "저장 시간 없음";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "저장 시간 오류";
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
