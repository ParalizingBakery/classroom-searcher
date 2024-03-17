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
    <input type="checkbox" id="${classCheckboxId}" checked></input>
    <strong>Class name </strong> or
    <input type="checkbox" id="${teacherCheckboxId}" checked></input>
    <strong>Teacher name</strong></legend>
    <legend>/ to focus, Tab + Enter for first result</legend>
    <input id="${inputBarId}" type="search" autofocus>
    <button type="submit" disabled style="display: none" aria-hidden="true"></button>
    </form>
</div>
`
/**
 * @typedef {Object} matchOptions
 * @property {boolean} matchRoomName
 * @property {boolean} matchTeacher
 */

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
        let cwizElement = roomList.closest("c-wiz")
        let userOptions = new UserOptions(cwizElement)

        document.addEventListener("keyup", (event) => {
            if (event.key == "/") {
                //This checks whether home page is hidden. When creating a new class as teacher,
                //user stays on the same <c-wiz>, but the creation pop-up makes c-wiz have class aria-hidden.
                //pressing / in creation popup will focus the darkened searchbar.
                if (cwizElement?.getAttribute("aria-hidden") === "true") {
                    return //Do not focus searchbar
                }
                searchBar.focus()
            }

            let input = searchBar.value.toLowerCase()
            let roomNodes = roomList.querySelectorAll(roomNodeSelector)
            roomNodes.forEach((element) => matchRoom(element, input, userOptions.read()))
        })
    })  
}

class UserOptions {
    constructor(cwizElement) {
        if (!(cwizElement instanceof HTMLElement) || (cwizElement.tagName.toLowerCase() !== "c-wiz")) {
            throw new Error("CheckboxOptions: constructor argument not c-wiz element")
        }

        this.cwiz = cwizElement
        this.checkboxClassName = cwizElement.querySelector(`#${classCheckboxId}`)
        this.checkboxTeacherName = cwizElement.querySelector(`#${teacherCheckboxId}`)

        if (!(this.checkboxClassName instanceof HTMLInputElement) || !(this.checkboxTeacherName instanceof HTMLInputElement)) {
            throw new Error("CheckboxOptions: checkbox input elements not found")
        }

        this.init()
    }

    async init() {
        //Read storage
        let storedSettings = await browser.storage.local.get({
            matchRoomName: true,
            matchTeacher: true
        })

        //Set checkbox to storage value
        this.checkboxClassName.checked = storedSettings.matchRoomName
        this.checkboxTeacherName.checked = storedSettings.matchTeacher

        //Set event listeners to write changes
        async function handleCheckboxChange (checkbox) {
            if (!(checkbox instanceof Element) || (checkbox.tagName.toLowerCase() !== "input") || (checkbox.getAttribute("type") !== "checkbox")) {
                throw new Error("handleCheckboxChange() : argument not input element with type checkbox")
            }
            
            const idToKey = {
                [classCheckboxId]: "matchRoomName",
                [teacherCheckboxId]: "matchTeacher"
            }

            browser.storage.local.set({
                [idToKey[checkbox.id]]: checkbox.checked
            }).catch((reason) => {throw new Error(`handleCheckboxChange : storageArea.set failed ${reason}`)} )
        }

        this.checkboxClassName.addEventListener("change", () => handleCheckboxChange(this.checkboxClassName))
        this.checkboxTeacherName.addEventListener("change", () => handleCheckboxChange(this.checkboxTeacherName))
    }

    /**
     * Reads the option checkboxes and returns object containing boolean read value.
     * @returns {matchOptions}
     */
    read() {
        return {
            matchRoomName: this.checkboxClassName?.checked ?? true,
            matchTeacher: this.checkboxTeacherName?.checked ?? true
        }
    }
}

/**
 * Matches a string input with the room name and teacher name of a Google Classroom li element that contains each room.
 * 
 * @param {HTMLLIElement} roomNode 
 * @param {string} input
 * @param {matchOptions} options
 * 
 * @param {boolean} options.matchRoomName
 * @param {boolean} options.matchTeacher
 * 
 */

function matchRoom(roomNode, input, options={}) {
    let roomNameNode = roomNode.querySelector(roomNameSelector)
    let roomTeacherNode = roomNode.querySelector(roomTeacherSelector)

    //roomTeacher does not exist when using as teacher, default is empty srting
    let roomTeacher = roomTeacherNode?.textContent?.toLowerCase() ?? ""
    let roomName = roomNameNode?.textContent?.toLowerCase() ?? ""

    //If options are not set, will default to true
    options.matchRoomName = options.matchRoomName ?? true;
    options.matchTeacher = options.matchTeacher ?? true;

    if ((roomName.includes(input) && options.matchRoomName) || (roomTeacher.includes(input) && options.matchTeacher)) {
        roomNode.style.display = 'flex' 
    } else {
        roomNode.style.display = 'none'
    }
}

main()