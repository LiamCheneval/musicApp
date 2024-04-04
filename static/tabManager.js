let pages = {
    home: document.getElementById("page-home"),
    search: document.getElementById("page-search"),
    liked: document.getElementById("page-liked"),
}
let tabButtons = {
    home: document.getElementById("button-home"),
    search: document.getElementById("button-search"),
    liked: document.getElementById("button-liked"),
}

function switchTab(tab){
    document.querySelector(".tab.selected")?.classList.remove("selected");
    tabButtons[tab].classList.add("selected");
    document.querySelector(".page.opened")?.classList.remove("opened");
    pages[tab].classList.add("opened");
}
