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

//Storage keys
const storageAliasKey = "class_aliases"

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

/**
 * @typedef {object} classAlias
 * @property {string | null} className
 * @property {string | null} teacherName
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

class AliasInject {
    constructor (cwizElement) {
        if (!(cwizElement instanceof HTMLElement) || (cwizElement.tagName.toLowerCase() !== "c-wiz")) {
            throw new Error(`initAliases : argument not c-wiz element`)
        }

        this.cwizElement = cwizElement
        browser.storage.local.get({[storageAliasKey]: {}})
            .then((result) => {
                /** @type {Object.<string, classAlias>}*/
                this.aliases = result[storageAliasKey]
            })
            .catch((rejection) => {
                throw new Error(`initAliases : storage.local.get(${storageAliasKey} failed) ${rejection}`)
            })
    }
    
    /**
     * - Edits the classNodes in the c-wiz of AliasInject to the aliases in this.aliases.
     * - Does not update this.aliases to match the storage before editing
     */
    inject() {
        for (const classId in this.aliases) {
            // Get the associated <a> by querySelector with href attribute
            // There are many <a> that have the same href, so we will use one that is least nested
            let roomAnchor = this.cwizElement.querySelector(`${roomNodeSelector} > div > div > a[href~=${classId}]`)
            if (!roomAnchor) {
                console.error(`AliasInject.inject() : roomAnchor of stored classId ${classId} not found}`, this)
                continue
            }

            // Get roomNode which is parent
            let roomNode = roomAnchor.closest(roomNodeSelector)
            if (!roomNode) {
                console.error(`AliasInject.inject() : Ancestor of roomAnchor with selector ${roomNodeSelector} not found`)
                continue
            }

            // This is where the class name is stored
            let roomNameDiv = roomNode.querySelector(roomNameSelector)

            // Use textContent because roomNode may be hidden. innerText returns only what the user sees
            roomNameDiv.textContent = this.aliases[classId].className ?? roomNameDiv.textContent
        }
    }

    write(classId, newAlias) {
        if ((typeof classId !== "string") || (typeof newAlias !== "string")) {
            return
        }

        /** @type {classAlias}} */
        let storeValue = {
            className: newAlias,
            teacherName: null
        }

        browser.storage.local.set({
            [classId]: storeValue
        }).catch((reason) => {
            console.error(`AliasInject.write : setting key ${classId} as ${JSON.stringify(storeValue)} because ${reason}`)
        })
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