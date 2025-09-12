let overlay = null;
const images = [
  chrome.runtime.getURL("images/img1.png"),
  chrome.runtime.getURL("images/img2.png"),
  chrome.runtime.getURL("images/img3.png"),
  chrome.runtime.getURL("images/img4.png"),
  chrome.runtime.getURL("images/img5.png"),
  chrome.runtime.getURL("images/img6.png")
];
let currentIndex = 0;
let overlayActive = false; // 오버레이 토글 상태
let listenersAttached = false; // 전역 위임 리스너 중복 방지
let inactivityTimer = null; // 메뉴 무활동 타이머
let domObserver = null; // MutationObserver 참조
let isCompleted = false; // 결제 완료 고정 상태
let lastUrl = location.href; // URL 변경 감지
let hasLeftHome = false; // 홈 화면을 떠난 적이 있는지
let phase = "idle"; // idle | home | menu | payment | method | complete
let aiToggleButtonEl = null; // AI 토글 버튼 루트 엘리먼트
let voiceObserver = null; // .voice-floating.pos-topright 감시자
let wasVoicePresent = false; // 직전 감지 상태

// 이미지별 기본 좌표(저장값이 없을 때만 적용). 필요 시 여기 숫자를 바꿔주세요.
// 예) img1(인덱스 0)을 top: 160px, left: 200px으로 시작하려면 아래 값을 수정
const DEFAULT_IMAGE_POS = {
  "0": { top: 120, left: 300 }
};
//
const boundOrderingButtons = new WeakSet();
const SPECIAL_MENU_URLS = [
  "https://hackk-eight.vercel.app/order",
  "https://hkt-rho.vercel.app/order"
]; // 특수 페이지: img2 고정 후 10초 무활동 시 img3
function isSpecialMenuUrl(href) {
  try {
    return SPECIAL_MENU_URLS.some((u) => href.startsWith(u));
  } catch {
    return false;
  }
}
let specialFixedMenuMode = false; // 특수 페이지 모드
const PAYMENT_URLS = [
  "https://hkt-rho.vercel.app/payment"
];
function isPaymentUrl(href) {
  try {
    return PAYMENT_URLS.some((u) => href.startsWith(u));
  } catch {
    return false;
  }
}
const HOMEPAGE_URLS = [
  "https://hkt-rho.vercel.app/"
];
function isHomeUrl(href) {
  try {
    return HOMEPAGE_URLS.some((u) => href === u);
  } catch {
    return false;
  }
}
const NAV_STATE_KEY = "aiOverlayNavState"; // 결제 전환 상태 저장 키

function clearNavState() {
  try {
    localStorage.removeItem(NAV_STATE_KEY);
  } catch {}
}

// 이미지별 위치 저장/복원 유틸
const POS_MAP_KEY = "aiOverlayPosMap"; // { [host]: { [imageIndex]: {top,left} } }
function readPosMap() {
  try {
    const raw = localStorage.getItem(POS_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writePosMap(map) {
  try {
    localStorage.setItem(POS_MAP_KEY, JSON.stringify(map));
  } catch {}
}
function getImageKey() {
  return String(currentIndex);
}
function loadPositionForCurrentImage() {
  if (!overlay) return;
  const host = location.host || "*";
  const map = readPosMap();
  const hostMap = map[host] || {};
  const pos = hostMap[getImageKey()];
  if (pos && typeof pos.top === "number" && typeof pos.left === "number") {
    overlay.style.top = pos.top + "px";
    overlay.style.left = pos.left + "px";
  } else {
    // 저장값이 없으면 기본 좌표 적용(이미지 인덱스 기준)
    const def = DEFAULT_IMAGE_POS[getImageKey()];
    if (def && typeof def.top === "number" && typeof def.left === "number") {
      overlay.style.top = def.top + "px";
      overlay.style.left = def.left + "px";
    }
  }
}
function savePositionForCurrentImage() {
  if (!overlay) return;
  const host = location.host || "*";
  const map = readPosMap();
  if (!map[host]) map[host] = {};
  const top = parseInt(overlay.style.top || "0", 10) || 0;
  const left = parseInt(overlay.style.left || "0", 10) || 0;
  map[host][getImageKey()] = { top, left };
  writePosMap(map);
  console.log("💾 이미지별 위치 저장:", { host, index: currentIndex, top, left });
}

// Alt+드래그로 마우스 이동
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
document.addEventListener("mousedown", (e) => {
  if (!overlayActive || !overlay) return;
  if (!e.altKey) return;
  const target = e.target;
  if (target === overlay) {
    isDragging = true;
    const rect = overlay.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  }
}, true);
document.addEventListener("mousemove", (e) => {
  if (!isDragging || !overlay) return;
  const newLeft = e.clientX - dragOffsetX;
  const newTop = e.clientY - dragOffsetY;
  overlay.style.left = Math.max(0, newLeft) + "px";
  overlay.style.top = Math.max(0, newTop) + "px";
}, true);
document.addEventListener("mouseup", (e) => {
  if (!isDragging) return;
  isDragging = false;
  savePositionForCurrentImage();
}, true);

// 오버레이 생성
function createOverlay() {
  if (!overlay) {
    overlay = document.createElement("img");
    overlay.style.position = "fixed";
    overlay.style.top = "120px";
    overlay.style.left = "300px";
    overlay.style.zIndex = "9999";
    overlay.style.pointerEvents = "none";
    overlay.style.maxWidth = "300px";
    overlay.style.height = "auto";
    document.body.appendChild(overlay);
    // 저장된 위치 복원
    try {
      const saved = JSON.parse(localStorage.getItem("aiOverlayPos") || "null");
      if (saved && typeof saved.top === "number" && typeof saved.left === "number") {
        overlay.style.top = saved.top + "px";
        overlay.style.left = saved.left + "px";
      }
    } catch {}
  }
  // 초기 이미지는 img1
  currentIndex = 0;
  overlay.src = images[currentIndex];
  overlay.style.display = "block";
  overlayActive = true;
  // UI 토글 상태 반영
  setAiButtonStatus(true);
  isCompleted = false;
  phase = "home";
  // 이미지별 저장 위치 복원
  loadPositionForCurrentImage();
  //
  // 특수 페이지 모드 설정 (오버레이가 이미 켜져 있을 때만)
  specialFixedMenuMode = isSpecialMenuUrl(location.href);
  if (specialFixedMenuMode && overlayActive) {
    // 해당 페이지에서는 시작 시 바로 img2 표시, 클릭 무활동 10초 후 img3 전환
    console.log("✅ 특수 페이지 감지: img2 시작 (무클릭 10초 후 img3)");
    showImageAt(1);
    phase = "menu";
    resetInactivityTimer();
  }
  // 홈 페이지 직접 진입 시 IMG1 고정 보장 (오버레이가 이미 켜져 있을 때만)
  if (isHomeUrl(location.href) && overlayActive) {
    showImageAt(0);
    phase = "home";
  }
  // 결제 페이지 직접 진입 시 img4 표시 (오버레이가 이미 켜져 있을 때만)
  if (isPaymentUrl(location.href) && overlayActive) {
    if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
    showImageAt(3);
    phase = "payment";
  }
  // 이전 페이지에서 결제 전환 중이었다면 복구
  try {
    const nav = JSON.parse(localStorage.getItem(NAV_STATE_KEY) || "null");
    // 결제 복구는 결제/확인 관련 페이지에서만 허용 (보수적으로 URL 키워드 검사)
    const url = location.href;
    const isLikelyPaymentPage = /(pay|payment|checkout|결제|영수증|주문완료)/i.test(url);
    if (nav && nav.phase === "payment" && isLikelyPaymentPage) {
      console.log("↩ 결제 단계 복구: img4 유지");
      showImageAt(3);
      phase = "payment";
    } else {
      // 결제 페이지가 아니면 복구 상태 제거
      clearNavState();
    }
  } catch {}
  console.log("✅ 오버레이 시작 / 첫 이미지 표시");
  // 매장/포장 버튼 즉시 바인딩 시도
  bindOrderingButtons();
}

// 콘솔에서 손쉽게 좌표 지정할 수 있는 헬퍼(저장 포함)
// 사용법: window.aiOverlaySetPos(0, 160, 200)  // img1을 top:160, left:200으로 설정 후 저장
window.aiOverlaySetPos = function(index, top, left) {
  try {
    if (!overlay) return;
    const bounded = Math.max(0, Math.min(parseInt(index, 10) || 0, images.length - 1));
    currentIndex = bounded;
    overlay.src = images[bounded];
    overlay.style.display = "block";
    overlay.style.top = (parseInt(top, 10) || 0) + "px";
    overlay.style.left = (parseInt(left, 10) || 0) + "px";
    savePositionForCurrentImage();
    console.log("✅ 위치 적용 및 저장 완료", { index: bounded, top, left });
  } catch (e) {}
};

// 다음 이미지
function nextImage() {
  if (!overlayActive) return;
  currentIndex = Math.min(currentIndex + 1, images.length - 1);
  overlay.src = images[currentIndex];
  overlay.style.display = "block";
  console.log("➡ 다음 이미지:", overlay.src);
}

// 특정 인덱스로 이미지 설정
function showImageAt(index) {
  if (!overlayActive || !overlay) return;
  const bounded = Math.max(0, Math.min(index, images.length - 1));
  currentIndex = bounded;
  overlay.src = images[bounded];
  overlay.style.display = "block";
  // 이미지별 확대한도: img3 +20%, img4/img5/img6 +30%
  if (bounded === 2) {
    overlay.style.maxWidth = "360px"; // 300px * 1.2
  } else if (bounded === 3 || bounded === 4 || bounded === 5) {
    overlay.style.maxWidth = "390px"; // 300px * 1.3
  } else {
    overlay.style.maxWidth = "300px";
  }
  // 전환 시 해당 이미지 위치 복원
  loadPositionForCurrentImage();
  console.log("🖼 이미지 전환:", bounded, overlay.src);
}

function hideOverlayOnly() {
  if (overlay) overlay.style.display = "none";
}

function stopOverlay() {
  // 토글 OFF 또는 결론적 종료 시 정리
  overlayActive = false;
  isCompleted = false;
  specialFixedMenuMode = false;
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (domObserver) {
    domObserver.disconnect();
    domObserver = null;
  }
  hideOverlayOnly();
  console.log("🧹 오버레이 비활성화 및 정리 완료");
  //
  // UI 토글 상태 반영
  setAiButtonStatus(false);
}

function setAiButtonStatus(isOn) {
  try {
    if (!aiToggleButtonEl) return;
    const toggleSwitch = aiToggleButtonEl.querySelector && aiToggleButtonEl.querySelector('.toggle-switch');
    if (toggleSwitch && toggleSwitch.classList) {
      toggleSwitch.classList.toggle('active', !!isOn);
    }
    const sub = aiToggleButtonEl.querySelector && aiToggleButtonEl.querySelector('.sub-text');
    if (sub) {
      sub.textContent = isOn ? "현재 활성화됨" : "";
    }
  } catch {}
}

// AI 버튼 기능 제거 - 음성 UI 감지에만 의존

// 주문 버튼 클릭 → img2
function goToOrdering() {
  // img2로 이동하고 무활동 타이머 시작
  clearNavState(); // 결제 복구 상태 초기화
  showImageAt(1);
  resetInactivityTimer();
  hasLeftHome = true;
  phase = "menu";
}

// 결제 버튼 → img3
function goToPaymentPageOverlay() {
  // 페이지가 넘어감과 동시에 img4 표시
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  showImageAt(3);
  phase = "payment";
  try {
    // 다음 페이지에서도 img4가 유지되도록 네비 상태 저장
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify({ phase: "payment", ts: Date.now() }));
  } catch {}
}

// 카드 결제 버튼 → 오버레이 숨김
function goToPaymentMethod() {
  // 신용/체크/QR/바코드 선택 시 img5
  showImageAt(4);
  phase = "method";
}

// 첫 화면 자동 감지 → MutationObserver
function observeDom() {
  if (domObserver) domObserver.disconnect();
  domObserver = new MutationObserver(() => {
    if (!overlayActive) return;
    // 매장/포장 버튼 재바인딩 시도(동적 생성 대응)
    bindOrderingButtons();
    // AI 버튼 기능 제거됨
    // URL 변경 시 초기화 및 상태 전환
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      // 결제 흐름 완료 후 홈으로 돌아온 경우에만 자동 종료
      if (isCompleted) {
        stopOverlay();
        return;
      }
      // 자동 초기화 축소: 사용자의 클릭에 의해서만 이미지 단계 변경
      // 특수 페이지 모드만 유지/갱신
      isCompleted = false;
      specialFixedMenuMode = isSpecialMenuUrl(location.href);
      if (specialFixedMenuMode && overlayActive) {
        console.log("🔄 특수 페이지 이동 감지: img2 표시 및 무클릭 10초 감시");
        showImageAt(1);
        phase = "menu";
        resetInactivityTimer();
      }
      // 홈 페이지로 전환 시 IMG1 고정 재적용 (오버레이가 켜져 있을 때만)
      if (isHomeUrl(location.href) && overlayActive) {
        showImageAt(0);
        phase = "home";
      }
      // 결제 페이지로의 직접/SPA 전환 감지 → img4 (오버레이가 켜져 있을 때만)
      if (isPaymentUrl(location.href) && overlayActive) {
        console.log("💳 결제 페이지 URL 감지 → img4");
        if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
        showImageAt(3);
        phase = "payment";
      }
      // 결제 단계 복구는 결제/확인 페이지에서만 허용
      try {
        const nav = JSON.parse(localStorage.getItem(NAV_STATE_KEY) || "null");
        const url = location.href;
        const isLikelyPaymentPage = /(pay|payment|checkout|결제|영수증|주문완료)/i.test(url);
        if (nav && nav.phase === "payment" && isLikelyPaymentPage) {
          console.log("🔄 URL 변경 후 결제 단계 복구: img4 유지");
          showImageAt(3);
          phase = "payment";
        } else {
          clearNavState();
        }
      } catch {}
      return;
    }
    // 동일 URL 내 DOM 변화로는 더 이상 자동 종료하지 않음(오동작 방지)
    // 결제 완료 문구 감지
    const bodyText = (document.body.innerText || "").replace(/\s/g, "");
    if (bodyText.includes("결제가완료되었습니다!")) {
      // img6 (존재하지 않을 경우 무시)
      isCompleted = true;
      showImageAt(5);
      phase = "complete";
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// 특정 음성 UI(.voice-floating.pos-topright 또는 .voice-floating.pos-bottomcenter)의 존재 여부 확인
function isVoiceFloatingVisible() {
  try {
    const topRight = document.querySelector('.voice-floating.pos-topright');
    const bottomCenter = document.querySelector('.voice-floating.pos-bottomcenter');
    const isVisible = !!(topRight || bottomCenter);
    console.log("🎤 음성 UI 감지:", { topRight: !!topRight, bottomCenter: !!bottomCenter, isVisible });
    return isVisible;
  } catch {
    return false;
  }
}

// 음성 UI 등장/제거에 따라 자동 시작/중지
function startVoiceFloatingWatcher() {
  // 초기 상태 점검
  wasVoicePresent = isVoiceFloatingVisible();
  if (wasVoicePresent && !overlayActive) {
    createOverlay();
    attachGlobalDelegates();
    observeDom();
  }
  
  // 결제 페이지에서는 항상 켜진 상태 유지
  if (isPaymentUrl(location.href) && !overlayActive) {
    console.log("💳 결제 페이지 감지 → 확장프로그램 항상 켜짐");
    createOverlay();
    attachGlobalDelegates();
    observeDom();
  }

  if (voiceObserver) voiceObserver.disconnect();
  voiceObserver = new MutationObserver(() => {
    const isPresent = isVoiceFloatingVisible();
    console.log("🔄 음성 UI 상태 변화:", { wasPresent: wasVoicePresent, isPresent, overlayActive });
    
    if (isPresent && !wasVoicePresent) {
      // 나타남 → 시작
      console.log("✅ 음성 UI 나타남 → 확장프로그램 시작");
      if (!overlayActive) {
        createOverlay();
        attachGlobalDelegates();
        observeDom();
      }
    } else if (!isPresent && wasVoicePresent) {
      // 사라짐 → 정지 (단, 결제 페이지에서는 항상 켜진 상태 유지)
      if (!isPaymentUrl(location.href)) {
        console.log("❌ 음성 UI 사라짐 → 확장프로그램 정지");
        if (overlayActive) {
          stopOverlay();
        }
      } else {
        console.log("💳 결제 페이지에서는 음성 UI가 사라져도 확장프로그램 유지");
      }
    }
    wasVoicePresent = isPresent;
  });
  voiceObserver.observe(document.documentElement || document.body, { childList: true, subtree: true, characterData: true });
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  // 메뉴 단계(currentIndex===1)에서만 동작, 단 주문 페이지에서만 타이머 작동
  if (overlayActive && currentIndex === 1 && isSpecialMenuUrl(location.href)) {
    inactivityTimer = setTimeout(() => {
      // 10초 무활동 시 img3
      showImageAt(2);
    }, 10000);
  }
}

function attachGlobalDelegates() {
  if (listenersAttached) return;
  // 문서 단위 클릭 위임으로 단계 전환 처리
  document.addEventListener("click", globalClickDelegate, true);
  // 메뉴 단계의 활동(클릭/입력) 타이머 리셋
  document.addEventListener("click", activityDelegate, true);
  document.addEventListener("input", activityDelegate, true);
  listenersAttached = true;
  bindOrderingButtons();
}

function globalClickDelegate(e) {
  if (!overlayActive) return;
  if (isCompleted) return; // 완료 후에는 단계 전환 방지
  const target = e.target;
  const rawText = (target && (target.innerText || target.textContent || target.value || "")) || "";
  const normalized = rawText.replace(/\s/g, "");
  // AI 주문 도우미 버튼 기능 제거됨

  const normalize = (s) => (s || "").replace(/\s/g, "");
  const getAttr = (el) => normalize([el?.getAttribute?.("aria-label"), el?.getAttribute?.("title")].filter(Boolean).join(" "));
  const getDeepText = (el) => normalize((el && (el.innerText || el.textContent || el.value || "")) + "");
  const collectUp = (el, depth = 4) => {
    let cur = el, parts = [];
    for (let i = 0; i < depth && cur; i++) {
      parts.push(getDeepText(cur));
      parts.push(getAttr(cur));
      cur = cur.parentElement;
    }
    return parts.join("");
  };

  const buttonEl = target.closest ? target.closest("button, [role=button], .grid-button") : null;
  const text = getDeepText(target);
  const buttonText = (getDeepText(buttonEl) || text) + getAttr(buttonEl) + collectUp(buttonEl || target);
  const meta = normalize([
    buttonEl?.id,
    buttonEl?.className,
    buttonEl?.getAttribute?.('name'),
    buttonEl?.getAttribute?.('data-action'),
    buttonEl?.getAttribute?.('data-test'),
    target?.id,
    target?.className
  ].filter(Boolean).join(' '));

  const hasAll = (t, keys) => keys.every(k => t.includes(k));

  // 1) 매장 식사 / 포장 주문 -> img2 (오탐 방지: 버튼 자체 텍스트만 사용, 홈 단계에서만)
  if (phase === "home") {
    let isDineIn = false, isTakeOut = false;
    const gridBtn = target.closest && target.closest('button.grid-button.primary');
    if (gridBtn) {
      const mainSpan = gridBtn.querySelector('.main-text');
      const mainText = normalize(mainSpan ? mainSpan.textContent : '');
      if (mainText.includes('매장식사')) isDineIn = true;
      if (mainText.includes('포장주문')) isTakeOut = true;
    }
    // 버튼 자체 텍스트/라벨만 검사
    const btnOwnOnly = (getDeepText(buttonEl) + getAttr(buttonEl));
    const dineInRegex = /(매장.{0,3}식사|내.{0,2}식사|dine.{0,3}in)$/i;
    const takeOutRegex = /(포장.{0,3}주문|테이크.{0,3}아웃|to.{0,3}go|take.{0,3}out)$/i;
    if (!isDineIn) isDineIn = dineInRegex.test(btnOwnOnly);
    if (!isTakeOut) isTakeOut = takeOutRegex.test(btnOwnOnly);
    if ((isDineIn || isTakeOut) && !isHomeUrl(location.href)) {
      console.log("🍽 주문 유형 클릭 감지 → img2", { isDineIn, isTakeOut, btn: btnOwnOnly });
      goToOrdering();
      return;
    }
  }

  // 2) 결제하기 -> 페이지 전환 직후 img4 (버튼 자체 텍스트/aria/title만 허용)
  const btnOwnText = getDeepText(buttonEl) + getAttr(buttonEl);
  const isPay = (
    btnOwnText.includes("결제하기") ||
    hasAll(btnOwnText, ["결제", "하기"]) ||
    /pay|payment|checkout/i.test(btnOwnText)
  );
  if (isPay) {
    console.log("💳 결제하기 클릭 감지 → img4");
    goToPaymentPageOverlay();
    return;
  }

  // 3) 결제 방식 선택 -> img5 (결제 단계에서 특정 버튼만 허용)
  if (phase === "payment") {
    const isCardBtn = buttonEl && buttonEl.matches && buttonEl.matches('button.action-btn.primary-btn');
    const isQrBtn = buttonEl && buttonEl.matches && buttonEl.matches('button.action-btn.qr-btn');
    const ownBtnText = (getDeepText(buttonEl) + getAttr(buttonEl));
    const ownNorm = ownBtnText.replace(/\s/g, "");
    const isCardClick = !!(isCardBtn && (ownNorm.includes("신용/체크카드결제") || ((ownNorm.includes("신용") || ownNorm.includes("체크카드")) && ownNorm.includes("결제"))));
    const isQrClick = !!(isQrBtn && (ownNorm.includes("QR/바코드결제") || ((ownNorm.includes("QR") || ownNorm.includes("바코드")) && ownNorm.includes("결제"))));
    if (isCardClick || isQrClick) {
      console.log("💳 결제 방식 클릭 감지 → img5");
      goToPaymentMethod();
      return;
    }
  }
}

// 매장/포장 버튼을 직접 바인딩
function bindOrderingButtons() {
  try {
    // 다양한 마크업 케이스 지원: button.grid-button.primary 우선, 그 외는 홈 단계에서만 허용
    const buttons = document.querySelectorAll("button.grid-button.primary, button, [role=button], .grid-button");
    buttons.forEach((btn) => {
      if (boundOrderingButtons.has(btn)) return;
      const mainSpan = btn.querySelector('.main-text');
      const mainText = ((mainSpan ? mainSpan.textContent : btn.innerText) || "").replace(/\s/g, "");
      const raw = (btn.innerText || btn.textContent || "");
      const normalized = raw.replace(/\s/g, "");
      const dineInRegex = /(매장.{0,5}식사|내.{0,3}식사|dine.{0,5}in)/i;
      const takeOutRegex = /(포장.{0,5}주문|테이크.{0,5}아웃|to.{0,5}go|take.{0,5}out)/i;
      const isPrimary = btn.matches && btn.matches('button.grid-button.primary');
      const looksLikeType = mainText.includes("매장식사") || mainText.includes("포장주문") || dineInRegex.test(normalized) || takeOutRegex.test(normalized);
      // 오탐 방지: primary는 언제나 허용, 그 외는 홈 단계에서만 바인딩
      if (isPrimary ? looksLikeType : (phase === "home" && looksLikeType)) {
        btn.addEventListener("click", () => {
          console.log("🍽 직접 바인딩된 주문 버튼 클릭 → img2");
          goToOrdering();
        }, true);
        boundOrderingButtons.add(btn);
      }
    });
  } catch {}
}

function activityDelegate() {
  if (!overlayActive) return;
  if (currentIndex === 1 && isSpecialMenuUrl(location.href)) {
    resetInactivityTimer();
  }
}

// 위치 조정 단축키: Alt + 화살표 / Alt + S 저장
document.addEventListener("keydown", (e) => {
  if (!overlayActive || !overlay) return;
  if (!e.altKey) return;
  const step = e.shiftKey ? 10 : 2;
  let top = parseInt(overlay.style.top || "0", 10) || 0;
  let left = parseInt(overlay.style.left || "0", 10) || 0;
  if (e.key === "ArrowUp") { overlay.style.top = (top - step) + "px"; e.preventDefault(); }
  if (e.key === "ArrowDown") { overlay.style.top = (top + step) + "px"; e.preventDefault(); }
  if (e.key === "ArrowLeft") { overlay.style.left = (left - step) + "px"; e.preventDefault(); }
  if (e.key === "ArrowRight") { overlay.style.left = (left + step) + "px"; e.preventDefault(); }
  if (e.key.toLowerCase() === "s") {
    // 현재 이미지 위치 저장
    savePositionForCurrentImage();
  }
  // 테스트용 단축키: Alt+2 → 강제로 img2(메뉴 단계) 전환
  if (e.key === "2") {
    e.preventDefault();
    goToOrdering();
  }
  // Alt+R: 현재 이미지 위치 초기화
  if (e.key.toLowerCase() === "r") {
    const host = location.host || "*";
    const map = readPosMap();
    if (map[host]) {
      delete map[host][getImageKey()];
      writePosMap(map);
      console.log("♻ 현재 이미지 위치 초기화");
    }
  }
});

// 시작
startVoiceFloatingWatcher();
// URL 기반 자동 시작 제거 (음성 UI가 있을 때만 시작)

// 백그라운드 토글 메시지 처리 제거 - 음성 UI 감지에만 의존

// background 강제 시작 훅 제거 - 음성 UI 감지에만 의존
