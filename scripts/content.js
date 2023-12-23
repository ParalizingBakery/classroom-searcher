const roomListSelector = ".JwPp0e"
const roomNodeSelector = "li.gHz6xd.Aopndd.rZXyy"
const roomNameSelector = "div.YVvGBb.z3vRcc-ZoZQ1"
const roomTeacherSelector = "div.Vx8Sxd.YVvGBb.jJIbcc"

const html = `
<div class="searchapp">
<style>
.searchapp {
    margin-left: 1.5rem;
    margin-top: 1.5rem;
}

legend {
    font-size: 1rem;
}
</style>
<div class="searchbar">
<form>
<legend> Search using <strong>class name </strong> or <strong>teacher name</strong></legend>
<legend>/ to focus</legend>
<input id="searchRoom" type="search" autofocus>
<button type="submit" disabled style="display: none" aria-hidden="true"></button>
</form>
</div>
</div>
`

function main(){
    const observer = new MutationObserver((record) => {
        //record is iterable, if you want to do smth for each mutaition please use for .. of ..
        injectSearch()
    })
    //this is to find when new child is added/removed to body
    observer.observe(document.querySelector("body"), {childList: true})
}

function injectSearch() {
    let roomListAll = document.querySelectorAll(roomListSelector)
    roomListAll.forEach((roomList) => {
        //see if already have search
        if (roomList.parentElement.querySelector(".searchapp") !== null) {
            return
        }

        roomList.insertAdjacentHTML("beforebegin", html)
        let searchBar = document.querySelector("#searchRoom")
        document.addEventListener("keyup", function(event){
            if (event.key == "/") {
                searchBar.focus()
            }
            let input = searchBar.value.toLowerCase()
            let roomNodes = roomList.querySelectorAll(roomNodeSelector)
            roomNodes.forEach((element) => matchRoom(element, input))
        })
    })  
}

function matchRoom(element, input) {
    let roomName = element.querySelector(roomNameSelector).textContent.toLowerCase()
    let roomTeacher = element.querySelector(roomTeacherSelector).textContent.toLowerCase()
    if (roomName.includes(input) || roomTeacher.includes(input)) {
        element.style.display = 'flex'       
    } else {
        element.style.display = 'none'
    }
}

main()