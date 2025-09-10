// 페이지 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
  setupButtonListener();
});

// 페이지가 이미 로드된 경우를 대비
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setupButtonListener();
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
        button.addEventListener('click', function(e) {
          console.log('AI 주문 도우미 버튼이 클릭되었습니다!');
          toggleOverlay();
        });
        
        // 리스너가 등록되었음을 표시
        button.setAttribute('data-extension-listener', 'true');
      }
    });
  }
  
  // 초기 실행
  findAndAttachListener();
  
  // 동적으로 로드되는 요소를 위해 MutationObserver 사용
  const observer = new MutationObserver(function(mutations) {
    findAndAttachListener();
  });
  
  // 문서 전체 관찰 설정
  observer.observe(document.body, { childList: true, subtree: true });
}

// 오버레이 토글 함수
function toggleOverlay() {
  let overlay = document.getElementById('black');
  
  if (!overlay) {
    // 오버레이가 없으면 생성
    overlay = document.createElement('div');
    overlay.id = 'black';
    document.body.appendChild(overlay);

    overlay.style.pointerEvents = 'none';
    
    // 오버레이 클릭 시 닫기
    overlay.addEventListener('click', function() {
      //overlay.style.display = 'none';

    
    });

    document.querySelectorAll('.grid-button.primary').forEach(button => {
      // 포장 주문 버튼인지 확인 (텍스트 내용으로)
      if (button.textContent.includes('포장 주문') || button.textContent.includes('매장 식사')) {
        // z-index를 오버레이보다 높게 설정
        button.style.position = 'relative';
        button.style.zIndex = '1000000';
      }
    });

     // 카테고리 버튼도 오버레이 제외 (한식 버튼 포함)
    document.querySelectorAll('.category-button.svelte').forEach(button => {
        if(button.textContent.includes('한식') || button.textContent.includes('일식') || button.textContent.includes('중식')||
           button.textContent.includes('양식')){
        button.style.position = 'relative';
        button.style.zIndex = '1000000';
        };
    });


    
  }
  
  // 현재 표시 상태 토글
  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
}