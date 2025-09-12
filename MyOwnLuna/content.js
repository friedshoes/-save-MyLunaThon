//css적용을 위한 div삽입 함수
function addMyDiv(){
    myDiv = document.createElement('div');
    
    myDiv.id = 'black_overlay';

    document.body.appendChild(myDiv);

    
}

//클릭 이벤트가 클래스 속성과 일치하하는지 검사 
//검사 후 특정 기능 수행
function touchScreen(event){
    // 클릭된 요소나 그 부모 중에 토글 버튼이 있는지 확인
    const isToggleButton = event.target.closest('.grid-button.secondary.ai-toggle-container') || 
                                                event.target.closest('.toggle-switch');

    // 토글 버튼을 클릭했을 때만 동작
    if (isToggleButton) {
        // 현재 오버레이의 display 상태에 따라 토글
        const isOverlayVisible = myDiv.style.display === 'block';
        myDiv.style.display = isOverlayVisible ? 'none' : 'block';
        console.log(isOverlayVisible ? "overlay off" : "overlay on");
    }
}

function excludeMyBtn(){
    const spBtn = document.querySelectorAll('.grid-button.primary');
    if(spBtn){
        spBtn.forEach(btn => btn.classList.add('anti_btn'));
        
    }
    
}

function excludeMyMenu(){
    const spBtn = document.querySelectorAll('.menu-item');
    if(spBtn){
        spBtn.forEach(btn => btn.classList.add('anti_btn'));
    }
}

function excludeMyCategory(){
    const spBtn = document.querySelectorAll('.category-button');
    if(spBtn){
        spBtn.forEach(btn => btn.classList.add('anti_btn'));
    }
}



async function generalBtn(event){
    const isGeneralButton = await event.target.closest('.category-button');
    if(isGeneralButton){
        excludeMyMenu();
        console.log("menu item ok");
    }

}

function handleUrlChange(event) {
    setTimeout(() => {
        if ( (window.location.pathname === '/order') && event.target.closest('.grid-button.primary') ) {
        console.log("URL 변경 감지됨: temporary code");
        excludeMyCategory();
    }
    }, 100);
    
}

function highlightCart(event){
    const isMenuItem = event.target.closest('.menu-item');
    if(isMenuItem){
        //모든 메뉴 아이템에서 하이라이트 제거
        const menuItems = document.querySelectorAll('.cart-item');
        menuItems.forEach(item => item.classList.add('anti_btn'));
    }
}

function highlightAction(event){
    const isMenuItem = event.target.closest('.cart-item');
    const isBtn = event.target.closest('.quantity.btn');
    if(isMenuItem || isBtn){
        //모든 메뉴 아이템에서 하이라이트 제거
        const menuItems = document.querySelectorAll('.action-btn');
        menuItems.forEach(item => item.classList.add('anti_btn'));
    }
}

function excludeMyAction(){
    const spBtn = document.querySelectorAll('.action-btn');
    if(spBtn){
        spBtn.forEach(btn => btn.classList.add('anti_btn'));
    }
}

function handleUrlPay(event) {
    setTimeout(() => {
        if ( (window.location.pathname === '/payment') && event.target.closest('.action-btn') ) {
        console.log("URL 변경 감지됨: payment code");
        excludeMyAction();
        flag1 = 1;
    }
    }, 100);
}

function shutdownOverlay(event){
    const isCloseButton = event.target.closest('.action-btn');
    if(isCloseButton && flag1 === 1){
        myDiv.style.display = 'none';
        console.log("overlay off");
        flag1 = 0;
    }
}

function refirst(event){
    
    setTimeout(() => {
        if ( (window.location.pathname === '') && event.target.closest('.action-btn') ) {
        console.log("URL 변경 감지됨: re first code");
        excludeMyBtn();
        
    }
    }, 100);

}
//
//실제 작동 코드
//

//전역변수 선언
let myDiv;
console.log("my div ok");

//css적용을 위한 div삽입
addMyDiv();
console.log("addMydiv ok");

//제외할 버튼
document.body.addEventListener('click',excludeMyBtn);
//excludeMyBtn();

//클릭 이벤트 리스너 - 이벤트 위임
document.body.addEventListener('click',touchScreen);
console.log("click ok");

//카테고리 버튼 클릭 -> 메뉴 아이템 하이라이트
document.body.addEventListener('click',generalBtn);


// 기본 URL -> URL/order 이동 감지
window.addEventListener('click', handleUrlChange); // SPA 내 페이지 이동 감지


document.body.addEventListener('click',highlightCart);

document.body.addEventListener('click',highlightAction);
let flag1 = 0;
window.addEventListener('click', handleUrlPay);

document.body.addEventListener('click',shutdownOverlay);





