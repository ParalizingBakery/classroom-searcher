const roomListSelector = ".JwPp0e"
const roomNodeSelector = "li.gHz6xd.Aopndd.rZXyy"
const roomNameSelector = "div.YVvGBb.z3vRcc-ZoZQ1"
const roomTeacherSelector = "div.Vx8Sxd.YVvGBb.jJIbcc"

//if class of element is changed, also change selector in code
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
<legend>/ to focus, Tab + Enter for first result</legend>
<input id="searchRoom" type="search" autofocus>
<button type="submit" disabled style="display: none" aria-hidden="true"></button>
</form>
</div>
</div>
`

function main(){
    //the parameter for callback is iterable, if you want to do smth for each mutaition please use for .. of ..
    //doing this for every mutation in record is redundant for now
    const observer = new MutationObserver(injectSearch)
    //GC adds a new <c-wiz> element when you navigate to a new page (part?) of the website.
    //there may or may not be a new <c-wiz> with roomList everytime observer is triggered
    observer.observe(document.querySelector("body"), {childList: true})
}

function injectSearch() {
    //home and archived page will have "roomList"
    let roomListAll = document.querySelectorAll(roomListSelector)
    roomListAll.forEach((roomList) => {
        //see if already have search
        if (roomList.parentElement.querySelector(".searchapp") !== null) {
            return
        }
        roomList.insertAdjacentHTML("beforebegin", html)  
        let searchBar = roomList.parentElement.querySelector("#searchRoom")

        document.addEventListener("keyup", (event) => {
            if (event.key == "/") {
                //This checks whether home page is hidden. When creating a new class as teacher,
                //user stays on the same <c-wiz>, but the creation pop-up makes page aria-hidden.
                //pressing / in creation popup will focus the darkened searchbar.
                for (let element = roomList; element !== null; element = element.parentElement) {
                    if (element.getAttribute("aria-hidden") === "true") {
                        return
                    }
                }
                searchBar.focus()
            }

            let input = searchBar.value.toLowerCase()
            let roomNodes = roomList.querySelectorAll(roomNodeSelector)
            roomNodes.forEach((element) => matchRoom(element, input))
        })
    })  
}

function matchRoom(roomNode, input) {
    let roomName = roomNode.querySelector(roomNameSelector).textContent.toLowerCase()
    let roomTeacherNode = roomNode.querySelector(roomTeacherSelector)
    let roomTeacher = ""
    //roomTeacher does not exist when using as teacher 
    if (roomTeacherNode) {
        roomTeacher = roomTeacherNode.textContent.toLowerCase()
    }

    if (roomName.includes(input) || roomTeacher.includes(input)) {
        roomNode.style.display = 'flex'       
    } else {
        roomNode.style.display = 'none'
    }
}

main()
