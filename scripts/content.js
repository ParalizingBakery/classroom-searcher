//May change when Google Classroom updates UI
const roomListSelector = ".JwPp0e"
const roomNodeSelector = "li.gHz6xd.Aopndd"
const roomNodeHeaderSelector = "div.Tc9hUd"
const roomNameSelector = "div.YVvGBb.z3vRcc-ZoZQ1"
const roomTeacherSelector = "div.Vx8Sxd.YVvGBb.jJIbcc"

//Classes and Id for elements in html that is queried in code
const searchAppClass = "searchapp"
const AliasButtonId = "alias-button"
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
        display: flex;
        justify-content: space-between;
        margin-left: 1.5rem;
        margin-right: 1.5rem;
        margin-top: 1.5rem;
        line-height: normal;
    }

    legend {
        font-size: 1rem;
    }

    .modal {
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 1; /* Sit on top */
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        background-color: rgb(0,0,0); /* Fallback color */
        background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    }
    
    .modal-content {
        overflow: auto; /* Enable scroll if needed */;
        background-color: #fefefe;
        margin: 15% auto; /* 15% from the top and centered */
        border: 1px solid #888;
        width: min(80%, 500px);
    }
    
    .modal-content-header {
        display: flex;
        justify-content: space-between;
        font-size: 1.5rem;
        color: white;
        background-color: #336600; /* Dark Green*/
        padding: 16px 20px;
    }

    .modal-content-header button {
        font-size: 1rem;
    }
    
    .modal-content-body {
        padding: 20px;
    }

    .modal-content-body input[type=text] {
        display: block;
        width: min(100%, 300px);
    }

    .modal-content-body ul {
        list-style: circle;
        padding-left: 15px;
    }

    .mb-1 {
        margin-bottom: 1em;
    }

    </style>
    <div class="modal" id="alias-modal">
        <div class="modal-content">
            <div class="modal-content-header">
                <p>Rename Class Aliases<p>
                <button id="modal-return">Return</button>
            </div>
            <div class="modal-content-body">
                <p class="mb-1">
                    Rename classes for yourself. Affects search
                </p>
                <div class="mb-1">
                    <label for"alias-search-class">
                        Enter the room you want to rename: 
                    </label>
                    <input type="text" id="alias-class-search">
                </div>
                <ul class="alias-class-results mb-1">
                </ul>
                <div class="mb-1">
                    <p>Rename (Selected Class) to</p>
                    <input type="text" id="alias-class-rename" placeholder="Leave blank to reset">
                    <button id="alias-save-button">Save</button>
                </div>
            </div>
        </div>
    </div>
    <div>
        <legend> Search using 
        <input type="checkbox" id="${classCheckboxId}" checked></input>
        <strong>Class name </strong> or
        <input type="checkbox" id="${teacherCheckboxId}" checked></input>
        <strong>Teacher name</strong></legend>
        <legend>/ to focus, Tab + Enter for first result</legend>
        <input id="${inputBarId}" type="search" autofocus>
        <button type="submit" disabled style="display: none" aria-hidden="true"></button>
    </div>
    <div>
        <button id="alias-button">Rename Class Aliases</button>
    </div>
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
 * @property {string} originalName
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
        if (roomList.parentElement.querySelector("." + searchAppClass)) {
            return
        }
        
        roomList.insertAdjacentHTML("beforebegin", html)

        let searchBar = roomList.parentElement.querySelector("#" + inputBarId)
        let cwizElement = roomList.closest("c-wiz")
        let userOptions = new UserOptions(cwizElement)
        let classAlias = new AliasInject(cwizElement)

        classAlias.getStoredAliases().then((aliases) => {
            //Initialzes the modal
            classAlias.initHTML()

            
            const AliasInjector = new MutationObserver(()=>{
                //Get original room names in this.aliases
                try {
                    classAlias.setOriginalNames()
                } catch {}
                //Rename classes when roomList changes
                classAlias.injectAliases()
            })

            //Inject when changes to <c-wiz> attributes
            //When page is fully loaded, jsdata = "deferred-c3"
            //When page is returned to, aria-hidden is switched from false to true
            AliasInjector.observe(classAlias.cwizElement,{attributes:true})
        
        }).catch((reason) => {
            console.error(reason)
        })

        document.addEventListener("keyup", (event) => {
            if (event.key == "/") {
                //This checks whether home page is hidden. Useful for when pages have multiple
                //<c-wiz> elements and you only want to focus when <c-wiz> is visible
                if (cwizElement?.getAttribute("aria-hidden") === "true") {
                    return //Do not focus searchbar
                }

                //If user is focused on a typeable element, do not focus search
                if (document.activeElement.matches(`input, div[role="textbox"], textarea`)) {
                    return
                }

                searchBar.focus()
            }

            let input = searchBar.value.toLowerCase()
            let roomNodes = roomList.querySelectorAll(roomNodeSelector)
            roomNodes.forEach((element) => {
                if (matchRoom(element, input, userOptions.read())) {
                    element.style.display = 'flex'
                } else {
                    element.style.display = 'none'
                }
            })
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
        this.renamer = {
            hasInjectedAlias: false,
            selectedRoom: {
                id: null,
                originalName: null
            }
        }
        /** @type {Object.<string, classAlias>}*/
        this.aliases = {}
    }

    /**
     * Gets aliases from storage and sets AliasInject.aliases to the result
     * 
     * Also returns the updated AliasInject.aliases
     * @returns {Promise<object.<string, classAlias>>}
     */
    getStoredAliases() {
        return new Promise((resolve, reject) => {
            browser.storage.local.get({[storageAliasKey]: {}})
            .then((result) => {
                /** @type {Object.<string, classAlias>}*/
                this.aliases = result[storageAliasKey]
                resolve(this.aliases)
            })
            .catch((rejection) => {
                reject(new Error(`initAliases : storage.local.get(${storageAliasKey} failed) ${rejection}`))
            })
        })
    }

    initHTML() {
        const MAX_ROOM_SEARCH_LI = 3

        /** @type {HTMLDivElement} */
        let modal = this.cwizElement.querySelector("div#alias-modal")

        /** @type {HTMLInputElement} */
        let searchInput = this.cwizElement.querySelector("input#alias-class-search")

        /** @type {HTMLInputElement}*/
        let renameInput = this.cwizElement.querySelector("input#alias-class-rename")

        /** @type {HTMLButtonElement} */
        let saveButton = this.cwizElement.querySelector("button#alias-save-button")

        //Modal Enable 
        this.cwizElement.querySelector("#alias-button").addEventListener('click', () => {
            modal.style.display = "block"
        })

        //Modal Disable
        this.cwizElement.querySelector("#modal-return").addEventListener('click', () => {
            modal.style.display = "none"
        })

        //Room Search Input Listener
        searchInput.addEventListener('keyup', (event) => {
            let roomNodeAll = this.cwizElement.querySelectorAll(roomNodeSelector)
            let ulResults = this.cwizElement.querySelector("ul.alias-class-results")

            //Empties the results list
            ulResults.replaceChildren()

            //Remove memory
            this.renamer.selectedRoom.id = null

            //Populate the list
            for (let i = 0, matches = 0; matches < MAX_ROOM_SEARCH_LI && i < roomNodeAll.length; i++) {
                let roomNode = roomNodeAll[i]

                //Doesn't match search
                if (!matchRoom(roomNode, searchInput.value, {matchTeacher: false})) {
                    continue
                }

                //Information
                let roomName = roomNode.querySelector(roomNameSelector)?.textContent ?? "Room Name Error"
                let roomTeacher = roomNode.querySelector(roomTeacherSelector)?.textContent ?? "Room Teacher Error"
                let roomAnchor = roomNode.querySelector(`${roomNodeHeaderSelector} > div > a`)
                let roomUrl = roomAnchor.getAttribute("href")
                let pathLevels = roomUrl.split("/") //example url /u/2/c/Nr35MrMxODEwrTc0
                let roomId = pathLevels[pathLevels.length - 1] //room id is hopefully at the end
                
                //DOM inits
                let li = ulResults.appendChild(document.createElement("li"))
                let a = li.appendChild(document.createElement("a"))
                let text = li.appendChild(document.createTextNode(` - ${roomTeacher} `))
                let button = li.appendChild(document.createElement("button"))
                
                //Anchor show room name with class url href
                a.appendChild(document.createTextNode(roomName))
                a.setAttribute("href", roomUrl)
                a.setAttribute("target", "_blank") // Open link in new tab

                //li button setup
                button.appendChild(document.createTextNode("Select"))

                // On select <li>
                button.addEventListener("click", (event) => {
                    // Make other <li> a circle (unselect)
                    ulResults.querySelectorAll("li").forEach((childList) => {
                        childList.style.listStyle = "circle"
                    })
                    li.style.listStyle = "disc"

                    //Save roomId and originalName
                    this.renamer.selectedRoom.id = roomId

                    //If this room has never been alias'd before, get original name
                    if (!this.aliases[roomId]) {
                        this.renamer.selectedRoom.originalName = this.setOriginalNames([roomId])[0]
                    } else {
                        this.renamer.selectedRoom.originalName = this.aliases[roomId].originalName
                    }
                })

                //Alias results append successful
                matches++
            }
        })

        //Alias Save Button
        saveButton.addEventListener("click", (event) => {
            //Write alias in storage
            if (typeof this.renamer.selectedRoom.id !== "string") {
                saveButton.textContent = "Room Not Selected"
                return
            }

            this.write(this.renamer.selectedRoom.id, renameInput.value)
            .then((status) => {
                //Reinject Aliases
                this.injectAliases()

                //Success Message
                if (renameInput.value === "") {
                    saveButton.textContent = `Reset ${this.renamer.selectedRoom.id} to its orignal name`
                } else {
                    saveButton.textContent = `Renamed ${this.renamer.selectedRoom.id} to ${renameInput.value}`
                }
            }).catch((error) => {
                console.error(error)
            })
        })
    }

    /**
     * - Edits the classNodes in the c-wiz of AliasInject to the aliases in this.aliases.
     * - Does not update this.aliases to match the storage before editing
     */
    injectAliases() {
        // setOrigianlNames() for all aliases is no longer safe to call
        this.renamer.hasInjectedAlias = true

        for (const classId in this.aliases) {
            // Get the associated <a> by querySelector with href attribute
            // There are many <a> that have the same href, so we will use one that is least nested
            let roomAnchor = this.cwizElement.querySelector(`${roomNodeHeaderSelector} > div > a[href*=${classId}]`)
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

            // Use textContent because roomNode may be hidden. innerText returns only what the user seesx   
            roomNameDiv.textContent = this.aliases[classId].className ?? this.aliases[classId].originalName
        }
    }

    /**
     * Updates this.aliases and writes it to storage.
     * 
     * Use blank strings in newAlias to indicate resetting the name
     * 
     * @param {string} classId 
     * @param {string} newAlias 
     * @returns {Promise<boolean>}
     */
    write(classId, newAlias) {
        return new Promise((resolve, reject) => {
            if ((typeof classId !== "string") || (typeof newAlias !== "string")) {
                return
            }

            /** @type {classAlias}} */
            let storeValue = {
                //Blank strings are falsy
                className: newAlias ? newAlias : null,
                originalName: this.renamer.selectedRoom.originalName
            }

            this.aliases[classId] = storeValue
            
            //Update alias in storage
            //Join this.aliases with storage because using aliases in archive page is a different object
            browser.storage.local.get({[storageAliasKey]: {}})
            .then((result) => {
                let storageAlias = result[storageAliasKey]

                /** @type {Object.<string, classAlias>}*/
                let joinedAliases = {
                    ...storageAlias,
                    ...this.aliases
                }

                //Remove the null alias
                for (const id in joinedAliases) {
                    if (joinedAliases[id].className === null) {
                        delete joinedAliases[id]
                    }
                }

                //Write to storage
                //This fufills with nothing when successful
                browser.storage.local.set({
                    [storageAliasKey]: joinedAliases
                }).then(() => {
                    resolve(true)
                })
                .catch((reason) => {
                    reject(new Error(`AliasInject.write : setting key ${storageAliasKey} as ${JSON.stringify(storeValue)} because ${reason}`))
                })
            })
        })
    }

    /**
     * - Returns an array of the name that is present in roomNameNode for each id
     *   in updateArray (default this.aliases keys)
     * 
     * - Updates this.aliases[classId].originalName if it exists.
     * 
     * ! Call this when there are no changes to the room name at all (before injectAliases)
     * 
     * @param {string[]} updateArray array of id to update
     * 
     * @returns {string[] | null[]} Array of the original names, null at each index where element not found
     */
    setOriginalNames(updateArray = Object.keys(this.aliases)) {
        // If attempting all aliases, aliasInject must not have ran
        if (updateArray === Object.keys(this.aliases)) {
            throw new Error(`AliasInject.setOriginalNames() : attempted to get all original names when injectAlias already ran`)
        }

        return updateArray.map((classId, index, array) => {
            let roomNode = getRoomNodeFromId(this.cwizElement, classId)
            if (!roomNode) {
                console.error(`AliasInject.setOriginalNames() : roomNode not found from id ${classId}`)
                return null
            }
            
            let roomName = roomNode.querySelector(roomNameSelector)?.textContent
            if (!roomName) {
                console.error(`AliasInject.setOriginalNames() : roomName not found from roomNode with id ${classId}`)
                return null
            }

            if (this.aliases[classId]) {
                this.aliases[classId].originalName = roomName
            }
            return roomName
        })
    }
}

/**
 * Matches a string input with the room name and/or teacher name of a Google Classroom li element that contains each room.
 * 
 * @param {HTMLLIElement} roomNode 
 * @param {string} input
 * @param {matchOptions} options
 * 
 * @returns {boolean}
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
        return true
    } else {
        return false
    }
}

/**
 * Given a scope and id of a roomNode, returns the roomNode that contains the id
 * in its (header) anchor element's href.
 * 
 * @param {HTMLElement} scope 
 * @param {string} id 
 * 
 * @returns {HTMLElement | null}
 */
function getRoomNodeFromId(scope, id) {
    // Ensure scope is an instance of HTMLElement and id is a string
    if (!(scope instanceof HTMLElement)) {
        throw new Error(`getRoomNodeFromId : scope is not instance of HTMLElement`)
    }

    if (!(typeof id === "string")) {
        throw new Error(`getRoomNodeFromId : id is not typeof string`)
    }

    let roomAnchor = scope.querySelector(`${roomNodeHeaderSelector} > div > a[href*=${id}]`)

    // Anchor not found
    if (!roomAnchor) {
        return null
    }

    // Get roomNode which is the ancestor of the anchor
    // closest() returns null when not found
    return roomAnchor.closest(roomNodeSelector)
}

main()