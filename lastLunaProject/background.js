chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startOverlay") {
    console.log("🔔 오버레이 실행 신호 받음");

    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: () => {
        // content script에서 오버레이 시작 이벤트 발생시키기
        document.dispatchEvent(new CustomEvent("overlay-start"));
      }
    });
  }
  //
});

// 툴바 아이콘 클릭 시 현재 탭에 토글 메시지 전송
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (!tab || !tab.id) return;
    await chrome.tabs.sendMessage(tab.id, { action: "toggleOverlay" });
  } catch (err) {
    console.error("Failed to send toggleOverlay message:", err);
  }
});
