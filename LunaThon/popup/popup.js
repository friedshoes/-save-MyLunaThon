async function dark(){
    const tabs = await chrome.tabs.query({active:true,currentWindow:true});
    const myTab = tabs[0];

    chrome.scripting.executeScript({target:{tabId:myTab.id},files:['scripts/content.js']});
    //alert("poup is active");
}

document.getElementById('trigger').addEventListener('click',dark);
