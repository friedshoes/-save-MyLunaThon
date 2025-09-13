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
        const isOverlayVisible = (myDiv.style.display === 'block');
        myDiv.style.display = isOverlayVisible ? 'none' : 'block';
        console.log(isOverlayVisible ? "overlay off" : "overlay on");
        

        setTimeout(() => {
            excludeMic();
        },1000);
        

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


function generalBtn(event){
    const isGeneralButton = event.target.closest('.category-button');
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
    }, 1000);
    
}

function highlightCart(event){
    const isMenuItem = event.target.closest('.menu-item');
    if(isMenuItem){
        //모든 메뉴 아이템에서 하이라이트 제거
        const menuItems = document.querySelectorAll('.cart-item');
        menuItems.forEach(item => item.classList.add('anti_btn'));
        menuItems.forEach(item => item.style.backgroundColor = 'white');
        menuItems.forEach(item => item.style.borderRadius = '8px');
        
    }
}

function highlightAction(event){
    const isMenuItem = event.target.closest('.cart-item');
    const isBtn = event.target.closest('.quantity.btn');
    if(isMenuItem || isBtn){
        //모든 메뉴 아이템에서 하이라이트 제거
        const menuItems = document.querySelectorAll('.action-btn');
        menuItems.forEach(item => item.classList.add('anti_btn'));
        flag1 = 0;
        
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
    }, 1000);
}

function shutdownOverlay(event){
    const isCloseButton = event.target.closest('.action-btn');
    if(isCloseButton && flag1 === 1){
        myDiv.style.display = 'none';
        console.log("overlay off");
        
    }
}

function refirst(event){
    
    setTimeout(() => {
        if ( (window.location.pathname === '') && event.target.closest('.action-btn') ) {
        console.log("URL 변경 감지됨: re first code");
        excludeMyBtn();
        
    }
    }, 1000);

}


/**
 * 특정 버튼을 찾아 그 안에 이미지를 삽입하는 함수
 * @param {string} buttonSelector - 이미지를 삽입할 버튼의 CSS 선택자
 * @param {string} imageName - 'images' 폴더에 있는 이미지 파일 이름
 */
function inImgBtn(buttonSelector, imageName,size=80) {
    const targetButton = document.querySelector(buttonSelector);

    if (targetButton) {
         if (targetButton.querySelector('.MyMyImg')) {
            targetButton.querySelector('.MyMyImg').remove();
            console.log("이미 아이콘이 존재하여 추가하지 않습니다.");
            return; // 이미지가 있으면 함수를 즉시 종료
        }
        // 1. 확장 프로그램 내부 이미지의 웹 접근 가능 URL을 가져옵니다.
        const imageUrl = chrome.runtime.getURL(imageName);

        // 2. <img> 요소를 생성합니다.
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.classList.add('MyMyImg');

        // --- 스타일 수정 부분 ---

        // 부모(버튼)를 위치 지정의 기준점으로 만듭니다.
        targetButton.style.position = 'relative';
        // 버튼의 overflow가 hidden일 경우 이미지가 잘릴 수 있어 visible로 설정합니다.
        targetButton.style.overflow = 'visible';

        // 3. 이미지에 절대 위치 스타일을 적용합니다.
        imgElement.style.position = 'absolute';
        imgElement.style.width = `${size*2}px`; // 이미지 크기 조절
        imgElement.style.height = `${size}px`;
        
        // 우측 하단 밖으로 튀어나오게 위치를 지정합니다.
        imgElement.style.right = '-8px';  // 오른쪽으로 8px 튀어나오게
        imgElement.style.bottom = '-8px'; // 아래쪽으로 8px 튀어나오게
        imgElement.style.borderRadius = '8px';
        // 4. 버튼의 맨 앞에 이미지를 삽입합니다.
        //    (버튼의 기존 텍스트는 유지됩니다.)
        targetButton.prepend(imgElement);

        console.log(`'${buttonSelector}' 버튼에 '${imageName}' 이미지를 삽입했습니다.`);
    } else {
        console.warn(`'${buttonSelector}' 버튼을 찾을 수 없습니다.`);
    }
}

function excludeMic(){
    const spBtn = document.querySelectorAll('.voice-floating');
    if(spBtn){
        spBtn.forEach(btn => btn.style.zIndex = '9999');
        spBtn.forEach(btn => btn.style.backgroundColor = 'white');
    }
}





//
//실제 작동 코드
//

//전역변수 선언
let myDiv;
addMyDiv();
let flag1 = 0;

console.log("my div ok");

//css적용을 위한 div삽입

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
window.addEventListener('click', handleUrlChange); 


document.body.addEventListener('click',highlightCart);

document.body.addEventListener('click',highlightAction);


window.addEventListener('click', handleUrlPay);

document.body.addEventListener('click',shutdownOverlay);









