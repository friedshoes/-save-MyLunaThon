//alert("content js is active");

// 오버레이가 없으면 생성
var sibal = document.getElementById('black');
if (!sibal) {
    sibal = document.createElement('div');
    sibal.id = 'black';
    document.body.appendChild(sibal);
}

function on() {
    sibal.style.display = "block";
}

function off() {
    sibal.style.display = "none";
}

// 오버레이를 바로 보여줌
if(sibal.style.display==="block"){
    off();
}else{
    on();
}

// 오버레이 클릭 시 닫기 (원하면 추가)
//sibal.onclick = off;

