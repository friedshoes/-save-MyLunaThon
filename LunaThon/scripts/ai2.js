// 페이지 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  setupButtonListener();
});

// 페이지가 이미 로드된 경우를 대비
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupButtonListener();
}

// 카테고리 버튼과 주문 버튼에 z-index 설정하는 함수
function setElementsAboveOverlay() {
  // 포장 주문 버튼 처리
  document.querySelectorAll('.grid-button.primary').forEach(button => {
    if (button.textContent.includes('포장 주문') || button.textContent.includes('매장 식사')) {
      button.style.position = 'relative';
      button.style.zIndex = '1000000';
    }
  });

  // 카테고리 버튼 처리
  document.querySelectorAll('.category-button').forEach(button => {
    button.style.position = 'relative';
    button.style.zIndex = '1000000';
  });

  // 메뉴 아이템 버튼 처리 (추가된 부분)
  document.querySelectorAll('.menu-item').forEach(item => {
    item.style.position = 'relative';
    item.style.zIndex = '1000000';
    
  });

  document.querySelectorAll('.cart-item').forEach(item => {
    item.style.position = 'relative';
    item.style.zIndex = '9000000';
    item.style.backgroundColor = 'white'; // 배경색 추가
    item.style.padding = '5px'; // 여백 추가
    item.style.borderRadius = '8px'; // 모서리 둥글게
  });
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.style.position = 'relative';
    btn.style.zIndex = '1000000';
  });

}

function setupButtonListener() {
  // 특정 AI 주문 도우미 버튼 찾기 (클래스와 텍스트 내용으로 식별)
  const targetSelector = '.grid-button.secondary.ai-toggle-container';
  
  // 버튼을 찾아 이벤트 리스너 등록하는 함수
  function findAndAttachListener() {
    const buttons = document.querySelectorAll(targetSelector);
    
    buttons.forEach(button => {
      // 이미 리스너가 등록되었는지 확인
      if (!button.hasAttribute('data-extension-listener')) {
        console.log('AI 주문 도우미 버튼을 찾았습니다!');
        
        // 클릭 이벤트 리스너 추가
        button.addEventListener('click', toggleOverlay);
        
        // 리스너가 등록되었음을 표시
        button.setAttribute('data-extension-listener', 'true');
      }
    });
    
    // 페이지 전환/변경 감지될 때마다 항상 버튼들 z-index 설정
    if (document.getElementById('black') && 
        document.getElementById('black').style.display === 'block') {
      setElementsAboveOverlay();
    }
  }
  
  // 초기 실행
  findAndAttachListener();
  
  // 동적으로 로드되는 요소를 위해 MutationObserver 사용
  const observer = new MutationObserver(findAndAttachListener);
  observer.observe(document.body, { childList: true, subtree: true });
}

// 오버레이 토글 함수
async function toggleOverlay() {
  let overlay = document.getElementById('black');
  
  if (!overlay) {
    // 오버레이가 없으면 생성
    overlay = document.createElement('div');
    overlay.id = 'black';
    document.body.appendChild(overlay);
    overlay.style.pointerEvents = 'none';
  }
  
  // 표시 상태 토글
  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
  
  // 오버레이가 보이는 상태이면 요소들 위에 표시
  if (overlay.style.display === 'block') {
    setElementsAboveOverlay();
  }
}
