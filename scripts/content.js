//May change when Google Classroom updates UI
const roomListSelector = ".JwPp0e"
const roomNodeSelector = "li.gHz6xd.Aopndd.rZXyy"
const roomNameSelector = "div.YVvGBb.z3vRcc-ZoZQ1"
const roomTeacherSelector = "div.Vx8Sxd.YVvGBb.jJIbcc"

//Classes and Id for elements in html that is queried in code
const searchAppClass = "searchapp"
const inputBarId = "searchbar"
const classCheckboxId = "classCheckbox"
const teacherCheckboxId = "teacherCheckbox"

//if class or id of element is changed, also change selector in injectsearch()
//disabled button in form to prevent submitting form when pressing enter
const html = `
<div class="${searchAppClass}">
    <style>
    .${searchAppClass} {
        margin-left: 1.5rem;
        margin-top: 1.5rem;
    }

    legend {
        font-size: 1rem;
    }
    </style>
    <form>
    <legend> Search using 
    <input type="checkbox" id="${classCheckboxId} checked"></input>
    <strong>Class name </strong> or
    <input type="checkbox" id="${teacherCheckboxId}" checked></input>
    <strong>Teacher name</strong></legend>
    <legend>/ to focus, Tab + Enter for first result</legend>
    <input id="${inputBarId}" type="search" autofocus>
    <button type="submit" disabled style="display: none" aria-hidden="true"></button>
    </form>
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
        if (roomList.parentElement.querySelector("." + searchAppClass) !== null) {
            return
        }
        
        roomList.insertAdjacentHTML("beforebegin", html)  
        let searchBar = roomList.parentElement.querySelector("#" + inputBarId)

        document.addEventListener("keyup", (event) => {
            if (event.key == "/") {
                //This checks whether home page is hidden. When creating a new class as teacher,
                //user stays on the same <c-wiz>, but the creation pop-up makes c-wiz have class aria-hidden.
                //pressing / in creation popup will focus the darkened searchbar.
                let cwizElement = getParentByTag(roomList, "c-wiz")

                if (cwizElement?.getAttribute("aria-hidden") === "true") {
                    return //Do not focus searchbar
                }
                searchBar.focus()
            }

            //Match rooms with input
            let input = searchBar.value.toLowerCase()
            let roomNodes = roomList.querySelectorAll(roomNodeSelector)
            roomNodes.forEach((element) => matchRoom(element, input))
        })
    })  
}

/**
 * Matches a string input with the room name and teacher name of a Google Classroom li element that contains each room.
 * 
 * @param {HTMLLIElement} roomNode 
 * @param {string} input
 * 
 */

function matchRoom(roomNode, input) {
    let roomNameNode = roomNode.querySelector(roomNameSelector)
    let roomTeacherNode = roomNode.querySelector(roomTeacherSelector)
    let roomTeacher = ""
    let roomName = ""

    //roomTeacher does not exist when using as teacher
    if (roomTeacherNode) {
        roomTeacher = roomTeacherNode.textContent.toLowerCase()
    }
    if (roomNameNode) {
        roomName = roomNameNode.textContent.toLowerCase()
    }

    if (roomName.includes(input) || roomTeacher.includes(input)) {
        roomNode.style.display = 'flex'       
    } else {
        roomNode.style.display = 'none'
    }
}

/**
 * Given an element, the function will loop through the element's parents 
 * until it finds the first parent element with the provided tag.
 * 
 * This function checks the tag of the starting element.
 * 
 * This function converts the parent element's tag name to lowercase.
 * 
 * @param {HTMLElement} firstElement - Element to start the loop from
 * @param {string} tag - Tag of the desired parent element in lowercase
 * 
 * @returns {HTMLElement|null} 
 */
function getParentByTag(firstElement, tag) {
    for (let element = firstElement; element !== null; element = element.parentElement) {
        if (element.tagName.toLowerCase() === tag) {
            return element
        }
    }
    return null
}

main()